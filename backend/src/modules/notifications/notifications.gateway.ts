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

  async handleConnection(client: Socket) {
    try {
      const token = this.extractToken(client);
      if (!token) throw new Error('Missing token');
      const payload = await this.jwtService.verifyAsync<{
        sub: string;
        jti?: string;
        tokenVersion?: number;
      }>(token);
      if (
        (payload.jti &&
          this.tokenBlacklistService.isJtiBlacklisted(payload.jti)) ||
        this.tokenBlacklistService.isTokenBlacklisted(token)
      ) {
        throw new Error('Revoked token');
      }
      const user = await this.usersService.findById(payload.sub);
      if (!user?.status) throw new Error('Inactive user');
      if (
        payload.tokenVersion !== undefined &&
        user.tokenVersion !== undefined &&
        payload.tokenVersion < user.tokenVersion
      ) {
        throw new Error('Stale token version');
      }

      const userId = user._id.toString();
      client.data.userId = userId;
      client.data.role = user.role;
      await client.join(`user:${userId}`);

      if (['ADMIN', 'STAFF', 'SUPER_ADMIN'].includes(user.role)) {
        await client.join('admin');
        this.logger.log(
          `Client ${client.id} (Role: ${user.role}) joined admin notification room`,
        );
      }

      this.logger.log(`Authenticated notification client ${client.id}`);
    } catch {
      this.logger.warn(
        `Rejected unauthenticated notification client ${client.id}`,
      );
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Notification client disconnected: ${client.id}`);
  }

  sendNotificationToUser(userId: string, notification: unknown) {
    if (this.server) {
      this.server
        .to(`user:${userId}`)
        .emit('notification_received', notification);
    }
  }

  sendAlertToAdmins(alert: unknown) {
    if (this.server) {
      this.server.to('admin').emit('admin_alert', alert);
      this.server.to('admin').emit('notification_received', alert);
    }
  }

  broadcastNotification(notification: unknown) {
    if (this.server) {
      this.server.emit('notification_received', notification);
    }
  }
}
