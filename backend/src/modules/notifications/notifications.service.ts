import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument } from './schemas/notification.schema';
import { CreateNotificationDto, BroadcastNotificationDto, NotificationQueryDto } from './dto/create-notification.dto';
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
      isRead: false,
      readBy: [],
    };

    if (dto.userId && Types.ObjectId.isValid(dto.userId)) {
      data.userId = new Types.ObjectId(dto.userId);
    } else {
      data.userId = null;
    }

    const notification = new this.notificationModel(data);
    const savedNotification = await notification.save();

    try {
      if (data.userId) {
        this.gateway.sendNotificationToUser(dto.userId!, savedNotification);
      } else {
        this.gateway.broadcastNotification(savedNotification);
      }
    } catch (e) {
      // Ignore socket emit failures gracefully
    }

    return savedNotification;
  }

  async findByUser(userId: string, query: NotificationQueryDto = {}) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('ID người dùng không hợp lệ');
    }

    const userObjectId = new Types.ObjectId(userId);
    const filter: any = {
      $or: [
        { userId: userObjectId },
        { userId: null },
      ],
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
      this.getUnreadCount(userId),
    ]);

    const formattedItems = items.map((item: any) => {
      let isRead = false;
      if (item.userId) {
        isRead = !!item.isRead;
      } else if (item.readBy && Array.isArray(item.readBy)) {
        isRead = item.readBy.some((id: any) => id.toString() === userId);
      }

      return {
        ...item,
        isRead,
      };
    });

    return {
      items: formattedItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      unreadCount,
    };
  }

  async getUnreadCount(userId: string): Promise<number> {
    if (!Types.ObjectId.isValid(userId)) return 0;
    const userObjectId = new Types.ObjectId(userId);

    const count = await this.notificationModel
      .countDocuments({
        $or: [
          { userId: userObjectId, isRead: false },
          { userId: null, readBy: { $ne: userObjectId } },
        ],
      })
      .exec();

    return count;
  }

  async markAsRead(id: string, userId: string) {
    if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('ID không hợp lệ');
    }

    const notif = await this.notificationModel.findById(id).exec();
    if (!notif) {
      throw new NotFoundException('Không tìm thấy thông báo');
    }

    const userObjectId = new Types.ObjectId(userId);

    if (notif.userId) {
      if (notif.userId.toString() !== userId) {
        throw new BadRequestException('Bạn không phải người nhận của thông báo này');
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

  async markAllAsRead(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('ID người dùng không hợp lệ');
    }

    const userObjectId = new Types.ObjectId(userId);

    await Promise.all([
      // Mark direct notifications
      this.notificationModel.updateMany(
        { userId: userObjectId, isRead: false },
        { $set: { isRead: true } },
      ),
      // Mark global broadcast notifications
      this.notificationModel.updateMany(
        { userId: null, readBy: { $ne: userObjectId } },
        { $addToSet: { readBy: userObjectId } },
      ),
    ]);

    return { success: true, message: 'Đã đánh dấu đọc tất cả thông báo' };
  }

  async sendOrderNotification(
    order: any,
    eventType: 'CREATED' | 'STATUS_UPDATED' | 'PAID' | 'CANCELLED',
  ) {
    const orderCode = order.orderCode || (order._id ? order._id.toString().slice(-6) : '');
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
      this.gateway.sendAlertToAdmins({
        id: `order-event-${order._id}-${Date.now()}`,
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

  async sendLowStockAlert(product: any, currentStock: number) {
    const isOutOfStock = currentStock <= 0;
    const title = isOutOfStock ? 'Cảnh báo hết sạch hàng' : 'Cảnh báo sắp hết hàng';
    const message = isOutOfStock
      ? `Sản phẩm "${product.name}" (SKU: ${product.sku || 'N/A'}) đã hết sạch hàng trong kho!`
      : `Sản phẩm "${product.name}" chỉ còn ${currentStock} cái trong kho (dưới mức an toàn).`;

    const notification = await this.create({
      title,
      message,
      type: 'stock',
      meta: { productId: product._id, currentStock, sku: product.sku },
    });

    try {
      this.gateway.sendAlertToAdmins(notification);
    } catch {
      // Ignore
    }

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

  async createGlobalPromo(code: string, name: string, description: string): Promise<NotificationDocument> {
    return this.broadcastPromotion(code, name, description);
  }
}
