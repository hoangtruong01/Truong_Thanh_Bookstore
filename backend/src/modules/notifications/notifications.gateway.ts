import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'notifications',
})
@Injectable()
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(NotificationsGateway.name);

  @WebSocketServer()
  server: Server;

  private clients: Map<string, Socket> = new Map();

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    this.logger.log(`Client connecting: ${client.id}, userId: ${userId}`);
    if (userId && userId !== 'undefined' && userId !== 'null') {
      this.clients.set(userId, client);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnecting: ${client.id}`);
    // Remove client from map
    for (const [userId, socket] of this.clients.entries()) {
      if (socket.id === client.id) {
        this.clients.delete(userId);
        break;
      }
    }
  }

  sendNotificationToUser(userId: string, notification: any) {
    const client = this.clients.get(userId);
    if (client) {
      this.logger.log(`Sending real-time notification to user ${userId}`);
      client.emit('notification_received', notification);
    }
  }

  broadcastNotification(notification: any) {
    this.logger.log('Broadcasting real-time notification to all connected clients');
    this.server.emit('notification_received', notification);
  }
}
