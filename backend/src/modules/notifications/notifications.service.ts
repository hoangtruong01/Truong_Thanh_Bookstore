import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument } from './schemas/notification.schema';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
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
    return notification.save();
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
