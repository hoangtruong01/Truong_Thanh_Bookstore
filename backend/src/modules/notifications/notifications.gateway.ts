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

const configuredOrigins = (
  process.env.FRONTEND_URL || 'http://localhost:5173'
)
  .split(',')
  .map((origin) => origin.trim());

@WebSocketGateway({
  cors: {
    origin: configuredOrigins,
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
      const payload = await this.jwtService.verifyAsync<{ sub: string }>(token);
      const user = await this.usersService.findById(payload.sub);
      if (!user?.status) throw new Error('Inactive user');

      const userId = user._id.toString();
      client.data.userId = userId;
      await client.join(`user:${userId}`);
      this.logger.log(`Authenticated notification client ${client.id}`);
    } catch {
      this.logger.warn(`Rejected unauthenticated notification client ${client.id}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Notification client disconnected: ${client.id}`);
  }

  sendNotificationToUser(userId: string, notification: unknown) {
    this.server.to(`user:${userId}`).emit('notification_received', notification);
  }

  broadcastNotification(notification: unknown) {
    this.server.emit('notification_received', notification);
  }
}
