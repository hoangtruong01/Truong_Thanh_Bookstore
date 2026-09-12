import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Types } from 'mongoose';
import { NotificationsService } from '../../notifications/notifications.service';
import { EmailService, EmailOrderDetails } from '../../email/email.service';
import { OrderStatus } from '../../../common/enums';
import { OrderDocument, OrderItem } from '../schemas/order.schema';

export interface OrderNotificationItem {
  name: string;
  quantity: number;
  price?: number;
}

export type OrderNotificationData =
  | OrderDocument
  | {
      _id?: Types.ObjectId | string;
      orderCode: string;
      customer?: Types.ObjectId | string;
      customerName?: string;
      customerEmail?: string;
      phone?: string;
      shippingAddress?: string;
      items?: Array<OrderItem | OrderNotificationItem>;
      total?: number;
      paymentMethod?: string;
      paymentStatus?: string;
      orderStatus?: string;
      note?: string;
      createdAt?: Date | string;
    };

@Injectable()
export class OrderNotificationService {
  private readonly logger = new Logger(OrderNotificationService.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Đồng bộ đơn hàng lên Google Sheets nếu có cấu hình webhook.
   */
  async syncToGoogleSheet(order: OrderNotificationData): Promise<void> {
    try {
      const webappUrl = this.configService.get<string>(
        'GOOGLE_SHEET_WEBAPP_URL',
      );
      if (!webappUrl) {
        return;
      }

      // Format items to readable string
      const itemsText = order.items
        ? order.items
            .map((item) => `${item.name} (x${item.quantity})`)
            .join(', ')
        : '';

      // Format Date in GMT+7
      const dateText = order.createdAt
        ? new Date(order.createdAt).toLocaleString('vi-VN', {
            timeZone: 'Asia/Ho_Chi_Minh',
          })
        : new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

      // Translate Status
      let statusLabel = order.orderStatus || '';
      switch (order.orderStatus) {
        case 'PENDING':
          statusLabel = 'Chờ xử lý';
          break;
        case 'CONFIRMED':
          statusLabel = 'Đã xác nhận';
          break;
        case 'PROCESSING':
          statusLabel = 'Đang xử lý';
          break;
        case 'SHIPPING':
          statusLabel = 'Đang giao hàng';
          break;
        case 'DELIVERED':
          statusLabel = 'Đã giao hàng';
          break;
        case 'COMPLETED':
          statusLabel = 'Hoàn tất';
          break;
        case 'CANCELLED':
          statusLabel = 'Đã hủy';
          break;
        case 'RETURNED':
          statusLabel = 'Đã trả hàng';
          break;
      }

      const payload = {
        orderCode: order.orderCode,
        createdAt: dateText,
        customerName: order.customerName || 'Khách vãng lai',
        phone: order.phone,
        shippingAddress: order.shippingAddress,
        itemsText,
        total: order.total,
        paymentMethod: order.paymentMethod,
        paymentStatus:
          order.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán',
        orderStatus: statusLabel,
        note: order.note || '',
      };

      await fetch(webappUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      this.logger.log(
        `Đã đồng bộ đơn hàng #${order.orderCode} lên Google Sheet.`,
      );
    } catch (sheetError) {
      this.logger.error(
        `Lỗi khi đồng bộ Google Sheet cho đơn #${order.orderCode}:`,
        sheetError,
      );
    }
  }

  /**
   * Gửi thông báo và email xác nhận khi đơn hàng được tạo thành công.
   */
  notifyOrderCreated(
    order: OrderNotificationData,
    customerEmail?: string,
  ): Promise<void> {
    // Notify customer in-app if registered
    if (order.customer) {
      const orderIdStr = order._id ? String(order._id) : '';
      const totalStr =
        typeof order.total === 'number'
          ? order.total.toLocaleString('vi-VN')
          : '0';
      this.notificationsService
        .create({
          userId: String(order.customer),
          title: `Đơn hàng #${order.orderCode} đã được tạo`,
          message: `Cảm ơn bạn! Đơn hàng #${order.orderCode} trị giá ${totalStr}đ đã được tiếp nhận.`,
          type: 'order',
          meta: {
            orderId: orderIdStr,
            orderCode: order.orderCode,
          },
        })
        .catch((err) =>
          this.logger.error('Failed to send order created notification', err),
        );
    }

    // Send confirmation email
    const recipientEmail = customerEmail || order.customerEmail;
    if (recipientEmail) {
      this.emailService
        .sendOrderConfirmationEmail(
          recipientEmail,
          order as unknown as EmailOrderDetails,
        )
        .catch((err) =>
          this.logger.error('Failed to send order confirmation email', err),
        );
    }

    return Promise.resolve();
  }

  /**
   * Gửi thông báo cập nhật khi trạng thái đơn hàng thay đổi.
   */
  notifyStatusChanged(
    order: OrderNotificationData,
    oldStatus: string,
    newStatus: string,
  ): Promise<void> {
    if (!order.customer || oldStatus === newStatus) return Promise.resolve();

    const customerId = String(order.customer);
    const orderIdStr = order._id ? String(order._id) : '';
    let statusText = '';
    const targetStatus = newStatus as unknown as OrderStatus;
    switch (targetStatus) {
      case OrderStatus.CONFIRMED:
        statusText = 'đã được xác nhận và đang được chuẩn bị';
        break;
      case OrderStatus.PROCESSING:
        statusText = 'đang được đóng gói và chuẩn bị bàn giao';
        break;
      case OrderStatus.SHIPPING:
        statusText = 'đang được giao đến bạn';
        break;
      case OrderStatus.DELIVERED:
      case OrderStatus.COMPLETED:
        statusText = 'đã giao thành công. Cảm ơn bạn đã mua sắm!';
        break;
      case OrderStatus.RETURNED:
        statusText = 'đã được hoàn trả';
        break;
      case OrderStatus.CANCELLED:
        statusText = 'đã bị hủy';
        break;
    }

    if (statusText) {
      this.notificationsService
        .create({
          userId: customerId,
          title: `Cập nhật đơn hàng #${order.orderCode}`,
          message: `Đơn hàng #${order.orderCode} của bạn ${statusText}.`,
          type: 'order',
          meta: {
            orderId: orderIdStr,
            orderCode: order.orderCode,
          },
        })
        .catch((err) =>
          this.logger.error(
            'Failed to create customer notification for status change',
            err,
          ),
        );

      if (
        targetStatus === OrderStatus.DELIVERED ||
        targetStatus === OrderStatus.COMPLETED
      ) {
        this.notificationsService
          .create({
            userId: customerId,
            title: `⭐ Đánh giá sản phẩm đơn hàng #${order.orderCode}`,
            message: `Đơn hàng #${order.orderCode} đã hoàn tất! Hãy để lại đánh giá để chia sẻ cảm nhận và nhận thêm ưu đãi nhé.`,
            type: 'review',
            meta: {
              orderId: orderIdStr,
              orderCode: order.orderCode,
            },
          })
          .catch((err) =>
            this.logger.error('Failed to create review invitation', err),
          );
      }
    }

    return Promise.resolve();
  }

  /**
   * Gửi cảnh báo sắp hết hạn 2h cho đơn hàng chưa thanh toán.
   */
  notifyAutoCancelWarning(order: OrderNotificationData): Promise<void> {
    if (order.customer) {
      const orderIdStr = order._id ? String(order._id) : '';
      this.notificationsService
        .create({
          userId: String(order.customer),
          title: `⚠️ Đơn hàng #${order.orderCode} sắp hết hạn`,
          message: `Đơn hàng #${order.orderCode} của bạn sẽ tự động bị hủy sau 2 giờ nữa nếu chưa được thanh toán/xác nhận. Vui lòng hoàn tất đơn hàng.`,
          type: 'order',
          meta: {
            orderId: orderIdStr,
            orderCode: order.orderCode,
          },
        })
        .catch((err) =>
          this.logger.error('Failed to send auto-cancel warning', err),
        );
    }

    return Promise.resolve();
  }
}
