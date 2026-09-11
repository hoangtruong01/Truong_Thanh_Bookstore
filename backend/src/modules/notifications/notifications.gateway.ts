import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { TokenBlacklistService } from '../auth/token-blacklist.service';
import { StaffPermission, UserRole } from '../../common/enums';

@WebSocketGateway({
  cors: {
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      const allowedOrigins = (
        process.env.FRONTEND_URL || 'http://localhost:5173'
      )
        .split(',')
        .map((o) => o.trim());
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        (process.env.NODE_ENV !== 'production' &&
          /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin))
      ) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
  },
  namespace: 'notifications',
})
@Injectable()
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(NotificationsGateway.name);
  private readonly connections = new Map<
    Socket,
    { token: string; userId: string }
  >();

  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly tokenBlacklistService: TokenBlacklistService,
  ) {}

  @WebSocketServer()
  server: Server;

  private extractToken(client: Socket): string | undefined {
    const authToken = client.handshake.auth?.token;
    if (typeof authToken === 'string' && authToken) return authToken;

    const authorization = client.handshake.headers.authorization;
    if (authorization?.startsWith('Bearer ')) {
      return authorization.substring('Bearer '.length);
    }

    const cookieHeader = client.handshake.headers.cookie;
    const tokenCookie = cookieHeader
      ?.split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith('access_token='));
    return tokenCookie
      ? decodeURIComponent(tokenCookie.substring('access_token='.length))
      : undefined;
  }

  private async authenticate(token: string) {
    const payload = await this.jwtService.verifyAsync<{
      sub: string;
      type?: string;
      jti?: string;
      tokenVersion?: number;
    }>(token);
    if (
      payload.type !== 'access' ||
      !payload.sub ||
      !payload.jti ||
      typeof payload.tokenVersion !== 'number'
    ) {
      throw new Error('Invalid access token claims');
    }
    if (
      (payload.jti &&
        (await this.tokenBlacklistService.isJtiBlacklisted(payload.jti))) ||
      (await this.tokenBlacklistService.isTokenBlacklisted(token))
    ) {
      throw new Error('Revoked token');
    }
    const user = await this.usersService.findById(payload.sub);
    if (!user?.status) throw new Error('Inactive user');
    if (payload.tokenVersion !== (user.tokenVersion ?? 0)) {
      throw new Error('Stale token version');
    }

    return user;
  }

  async handleConnection(client: Socket) {
    try {
      const token = this.extractToken(client);
      if (!token) throw new Error('Missing token');
      const user = await this.authenticate(token);

      const userId = user._id.toString();
      client.data.userId = userId;
      client.data.role = user.role;
      await client.join(`user:${userId}`);

      const isAdmin =
        user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN;
      if (
        isAdmin ||
        (user.role === UserRole.STAFF &&
          user.permissions?.includes(StaffPermission.MANAGE_ORDERS))
      ) {
        await client.join('admin:orders');
      }
      if (
        isAdmin ||
        (user.role === UserRole.STAFF &&
          user.permissions?.includes(StaffPermission.MANAGE_INVENTORY))
      ) {
        await client.join('admin:inventory');
      }

      this.logger.log(`Authenticated notification client ${client.id}`);
      if (client.connected !== false)
        this.connections.set(client, { token, userId });
    } catch {
      this.logger.warn(
        `Rejected unauthenticated notification client ${client.id}`,
      );
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.connections.delete(client);
    this.logger.log(`Notification client disconnected: ${client.id}`);
  }

  async sendNotificationToUser(userId: string, notification: unknown) {
    await this.deliver(notification, userId);
  }

  async sendAlertToAdmins(alert: unknown) {
    const permission =
      (alert as { type?: string })?.type === 'stock'
        ? StaffPermission.MANAGE_INVENTORY
        : StaffPermission.MANAGE_ORDERS;
    await this.deliver(alert, undefined, permission);
  }

  async broadcastNotification(notification: unknown) {
    await this.deliver(notification);
  }

  private async deliver(
    notification: unknown,
    userId?: string,
    permission?: StaffPermission,
  ) {
    await Promise.all(
      [...this.connections].map(async ([client, session]) => {
        if (userId && session.userId !== userId) return;
        try {
          // Validate again immediately before delivery: room membership can be
          // stale after logout, account suspension or a staff permission change.
          const user = await this.authenticate(session.token);
          if (!this.connections.has(client) || client.connected === false)
            return;
          if (
            permission &&
            user.role !== UserRole.ADMIN &&
            user.role !== UserRole.SUPER_ADMIN &&
            !(
              user.role === UserRole.STAFF &&
              user.permissions?.includes(permission)
            )
          )
            return;
          if (permission) client.emit('admin_alert', notification);
          client.emit('notification_received', notification);
        } catch {
          this.connections.delete(client);
          client.disconnect(true);
        }
      }),
    );
  }
}
