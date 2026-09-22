import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Notification,
  NotificationDocument,
} from './schemas/notification.schema';
import {
  CreateNotificationDto,
  NotificationQueryDto,
} from './dto/create-notification.dto';

export interface NotificationOrderPayload {
  _id?: { toString(): string } | string;
  orderCode?: string;
  customer?: { toString(): string } | string | null;
  total?: number;
  customerName?: string;
  paymentMethod?: string;
  orderStatus?: string;
}

export interface NotificationProductPayload {
  _id?: { toString(): string } | string;
  name?: string;
  sku?: string;
}

interface LeanNotificationItem {
  _id: Types.ObjectId | string;
  title: string;
  message: string;
  type: string;
  meta?: Record<string, unknown>;
  userId?: Types.ObjectId | string | null;
  isRead?: boolean;
  readBy?: Array<Types.ObjectId | string>;
  createdAt?: Date;
  updatedAt?: Date;
}
import { NotificationsGateway } from './notifications.gateway';
import { FcmPushService } from './fcm-push.service';

interface NotificationCreateData {
  title: string;
  message: string;
  type: string;
  meta: Record<string, string | number | boolean | null | undefined>;
  isRead: boolean;
  readBy: string[];
  userId: Types.ObjectId | null;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    private gateway: NotificationsGateway,
    private readonly fcmPushService: FcmPushService,
  ) {}

  async create(dto: CreateNotificationDto): Promise<NotificationDocument> {
    const data: NotificationCreateData = {
      title: dto.title,
      message: dto.message,
      type: dto.type || 'order',
      meta:
        (dto.meta as Record<
          string,
          string | number | boolean | null | undefined
        >) || {},
      isRead: false,
      readBy: [],
      userId:
        dto.userId && Types.ObjectId.isValid(dto.userId)
          ? new Types.ObjectId(dto.userId)
          : null,
    };

    const notification = new this.notificationModel(data);
    const savedNotification = await notification.save();

    try {
      if (data.userId) {
        await this.gateway.sendNotificationToUser(
          dto.userId!,
          savedNotification,
        );
        void this.fcmPushService
          .sendToUser(
            dto.userId!,
            { title: data.title, body: data.message },
            { type: data.type, ...data.meta },
          )
          .catch(() => undefined);
      } else if (data.type === 'stock') {
        await this.gateway.sendAlertToAdmins(savedNotification);
      } else {
        await this.gateway.broadcastNotification(savedNotification);
      }
    } catch {
      // Ignore socket emit failures gracefully
    }

    return savedNotification;
  }

  async findByUser(
    userId: string,
    query: NotificationQueryDto = {},
    includeStock = false,
  ) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('ID người dùng không hợp lệ');
    }

    const userObjectId = new Types.ObjectId(userId);
    const filter: Record<string, unknown> = {
      $or: [{ userId: userObjectId }, { userId: null }],
      ...(!includeStock ? { $and: [{ type: { $ne: 'stock' } }] } : {}),
    };

    if (query.type) {
      filter.type = query.type;
    }

    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 20));
    const skip = (page - 1) * limit;

    const [items, total, unreadCount] = await Promise.all([
      this.notificationModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.notificationModel.countDocuments(filter).exec(),
      this.getUnreadCount(userId, includeStock),
    ]);

    const formattedItems = (items as unknown as LeanNotificationItem[]).map(
      (item) => {
        let isRead = false;
        if (item.userId) {
          isRead = !!item.isRead;
        } else if (item.readBy && Array.isArray(item.readBy)) {
          isRead = item.readBy.some((id) => id.toString() === userId);
        }

        return {
          ...item,
          isRead,
        };
      },
    );

    return {
      items: formattedItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      unreadCount,
    };
  }

  async getUnreadCount(userId: string, includeStock = false): Promise<number> {
    if (!Types.ObjectId.isValid(userId)) return 0;
    const userObjectId = new Types.ObjectId(userId);

    const count = await this.notificationModel
      .countDocuments({
        ...(!includeStock ? { type: { $ne: 'stock' } } : {}),
        $or: [
          { userId: userObjectId, isRead: false },
          { userId: null, readBy: { $ne: userObjectId } },
        ],
      })
      .exec();

    return count;
  }

  async markAsRead(id: string, userId: string, includeStock = false) {
    if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('ID không hợp lệ');
    }

    const notif = await this.notificationModel.findById(id).exec();
    if (!notif) {
      throw new NotFoundException('Không tìm thấy thông báo');
    }
    if (notif.type === 'stock' && !includeStock) {
      throw new ForbiddenException('Bạn không có quyền xem thông báo kho');
    }

    const userObjectId = new Types.ObjectId(userId);

    if (notif.userId) {
      if (notif.userId.toString() !== userId) {
        throw new BadRequestException(
          'Bạn không phải người nhận của thông báo này',
        );
      }
      notif.isRead = true;
      await notif.save();
    } else {
      await this.notificationModel.findByIdAndUpdate(id, {
        $addToSet: { readBy: userObjectId },
      });
    }

    return { success: true, message: 'Đã đánh dấu đã đọc' };
  }

  async markAllAsRead(userId: string, includeStock = false) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('ID người dùng không hợp lệ');
    }

    const userObjectId = new Types.ObjectId(userId);

    await Promise.all([
      // Mark direct notifications
      this.notificationModel.updateMany(
        {
          userId: userObjectId,
          isRead: false,
          ...(!includeStock ? { type: { $ne: 'stock' } } : {}),
        },
        { $set: { isRead: true } },
      ),
      // Mark global broadcast notifications
      this.notificationModel.updateMany(
        {
          userId: null,
          readBy: { $ne: userObjectId },
          ...(!includeStock ? { type: { $ne: 'stock' } } : {}),
        },
        { $addToSet: { readBy: userObjectId } },
      ),
    ]);

    return { success: true, message: 'Đã đánh dấu đọc tất cả thông báo' };
  }

  async sendOrderNotification(
    order: NotificationOrderPayload,
    eventType: 'CREATED' | 'STATUS_UPDATED' | 'PAID' | 'CANCELLED',
  ) {
    const orderCode =
      order.orderCode || (order._id ? order._id.toString().slice(-6) : '');
    const userId = order.customer ? order.customer.toString() : null;

    let customerTitle = '';
    let customerMessage = '';
    let adminTitle = '';
    let adminMessage = '';

    switch (eventType) {
      case 'CREATED':
        customerTitle = `Đặt hàng thành công #${orderCode}`;
        customerMessage = `Đơn hàng #${orderCode} trị giá ${(order.total || 0).toLocaleString('vi-VN')}đ đã được tiếp nhận.`;
        adminTitle = `Đơn hàng mới #${orderCode}`;
        adminMessage = `Khách hàng ${order.customerName || 'Khách vãng lai'} vừa đặt đơn hàng #${orderCode} trị giá ${(order.total || 0).toLocaleString('vi-VN')}đ.`;
        break;
      case 'PAID':
        customerTitle = `Thanh toán thành công #${orderCode}`;
        customerMessage = `Đơn hàng #${orderCode} đã thanh toán thành công qua ${order.paymentMethod || 'Online'}.`;
        adminTitle = `Đơn hàng đã thanh toán #${orderCode}`;
        adminMessage = `Đơn hàng #${orderCode} đã được thanh toán thành công ${(order.total || 0).toLocaleString('vi-VN')}đ.`;
        break;
      case 'STATUS_UPDATED':
        customerTitle = `Cập nhật trạng thái đơn #${orderCode}`;
        customerMessage = `Đơn hàng #${orderCode} đã chuyển sang trạng thái "${order.orderStatus}".`;
        adminTitle = `Trạng thái đơn #${orderCode} thay đổi`;
        adminMessage = `Đơn hàng #${orderCode} đã được cập nhật thành "${order.orderStatus}".`;
        break;
      case 'CANCELLED':
        customerTitle = `Đơn hàng #${orderCode} đã bị hủy`;
        customerMessage = `Đơn hàng #${orderCode} đã được hủy thành công.`;
        adminTitle = `Đơn hàng #${orderCode} bị hủy`;
        adminMessage = `Đơn hàng #${orderCode} đã bị hủy bởi khách hàng hoặc nhân viên.`;
        break;
    }

    // Send customer notification if authenticated
    if (userId) {
      await this.create({
        userId,
        title: customerTitle,
        message: customerMessage,
        type: 'order',
        meta: { orderId: order._id, orderCode, orderStatus: order.orderStatus },
      });
    }

    // Broadcast alert to admin room
    try {
      const orderIdStr = order._id ? order._id.toString() : '';
      await this.gateway.sendAlertToAdmins({
        id: `order-event-${orderIdStr}-${Date.now()}`,
        type: 'order',
        title: adminTitle,
        message: adminMessage,
        createdAt: new Date(),
        meta: { orderId: order._id, orderCode, orderStatus: order.orderStatus },
      });
    } catch {
      // Ignore socket errors
    }
  }

  async sendLowStockAlert(
    product: NotificationProductPayload,
    currentStock: number,
  ) {
    const isOutOfStock = currentStock <= 0;
    const title = isOutOfStock
      ? 'Cảnh báo hết sạch hàng'
      : 'Cảnh báo sắp hết hàng';
    const message = isOutOfStock
      ? `Sản phẩm "${product.name}" (SKU: ${product.sku || 'N/A'}) đã hết sạch hàng trong kho!`
      : `Sản phẩm "${product.name}" chỉ còn ${currentStock} cái trong kho (dưới mức an toàn).`;

    const notification = await this.create({
      title,
      message,
      type: 'stock',
      meta: { productId: product._id, currentStock, sku: product.sku },
    });

    return notification;
  }

  async broadcastPromotion(code: string, name: string, description: string) {
    return this.create({
      title: `Ưu đãi mới: ${code}`,
      message: `${name}. ${description || 'Nhanh tay mua sắm để nhận ưu đãi ngay hôm nay!'}`,
      type: 'promotion',
      meta: { promoCode: code },
    });
  }

  async createGlobalPromo(
    code: string,
    name: string,
    description: string,
  ): Promise<NotificationDocument> {
    return this.broadcastPromotion(code, name, description);
  }
}
