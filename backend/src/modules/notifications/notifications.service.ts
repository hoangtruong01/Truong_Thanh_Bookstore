import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument } from './schemas/notification.schema';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    private gateway: NotificationsGateway,
  ) {}

  async create(dto: CreateNotificationDto): Promise<NotificationDocument> {
    const data: any = {
      title: dto.title,
      message: dto.message,
      type: dto.type || 'order',
      meta: dto.meta || {},
    };

    if (dto.userId) {
      data.userId = new Types.ObjectId(dto.userId);
    } else {
      data.userId = null;
    }

    const notification = new this.notificationModel(data);
    const savedNotification = await notification.save();

    try {
      if (dto.userId) {
        this.gateway.sendNotificationToUser(dto.userId, savedNotification);
      } else {
        this.gateway.broadcastNotification(savedNotification);
      }
    } catch (e) {
      // ignore
    }

    return savedNotification;
  }

  async findByUser(userId: string): Promise<NotificationDocument[]> {
    return this.notificationModel
      .find({
        $or: [
          { userId: new Types.ObjectId(userId) },
          { userId: null },
        ],
      })
      .sort({ createdAt: -1 })
      .limit(50)
      .exec();
  }

  async createGlobalPromo(code: string, name: string, description: string): Promise<NotificationDocument> {
    return this.create({
      title: `Ưu đãi mới: ${code}`,
      message: `${name}. ${description || 'Nhanh tay mua sắm để nhận ưu đãi ngay hôm nay!'}`,
      type: 'promotion',
      meta: { promoCode: code },
    });
  }
}
