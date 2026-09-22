import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import {
  OutboxEvent,
  OutboxEventDocument,
  OutboxEventType,
  OutboxStatus,
} from './schemas/outbox-event.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService, EmailOrderDetails } from '../email/email.service';

export interface OrderOutboxPayload {
  orderId?: string;
  orderCode: string;
  customer?: string | null;
  customerName?: string;
  customerEmail?: string;
  phone?: string;
  shippingAddress?: string;
  itemsText?: string;
  total?: number;
  paymentMethod?: string;
  paymentStatus?: string;
  orderStatus?: string;
  oldStatus?: string;
  newStatus?: string;
  note?: string;
  createdAt?: string | Date;
}

@Injectable()
export class OutboxService {
  private readonly logger = new Logger(OutboxService.name);
  private isProcessing = false;

  constructor(
    @InjectModel(OutboxEvent.name)
    private readonly outboxModel: Model<OutboxEventDocument>,
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Ghi nhận một sự kiện Outbox vào CSDL.
   * Nếu truyền vào `session`, sự kiện sẽ được lưu cùng Transaction với nghiệp vụ chính.
   */
  async recordEvent(
    eventType: OutboxEventType,
    payload: Record<string, unknown>,
    session?: ClientSession,
    targetUserId?: string | Types.ObjectId | null,
  ): Promise<OutboxEventDocument> {
    const data: Partial<OutboxEvent> = {
      eventType,
      payload,
      status: OutboxStatus.PENDING,
      retryCount: 0,
      maxRetries: 5,
      nextRetryAt: null,
      processedAt: null,
      targetUserId:
        targetUserId && Types.ObjectId.isValid(String(targetUserId))
          ? new Types.ObjectId(String(targetUserId))
          : null,
    };

    if (session) {
      const [created] = await this.outboxModel.create([data], { session });
      return created;
    }

    const doc = new this.outboxModel(data);
    return doc.save();
  }

  /**
   * Kích hoạt xử lý tức thì một sự kiện vừa được commit (độ trễ < 100ms).
   */
  dispatchImmediately(eventId: string | Types.ObjectId): void {
    setImmediate(() => {
      this.processSingleEvent(String(eventId)).catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.warn(
          `dispatchImmediately thất bại cho event ${String(eventId)}: ${message}`,
        );
      });
    });
  }

  /**
   * Xử lý 1 event cụ thể một cách an toàn và nguyên tử.
   */
  async processSingleEvent(eventId: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(eventId)) return false;

    // Atomic lock event: chỉ chuyển sang PROCESSING nếu đang là PENDING hoặc FAILED và đến hạn retry
    const now = new Date();
    const lockedEvent = await this.outboxModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(eventId),
        status: { $in: [OutboxStatus.PENDING, OutboxStatus.FAILED] },
        $or: [{ nextRetryAt: null }, { nextRetryAt: { $lte: now } }],
      },
      {
        $set: { status: OutboxStatus.PROCESSING },
      },
      { new: true },
    );

    if (!lockedEvent) {
      return false; // Đã có worker khác xử lý hoặc chưa tới hạn retry
    }

    return this.executeAndHandleResult(lockedEvent);
  }

  /**
   * Cron worker quét các sự kiện PENDING/FAILED định kỳ mỗi 10 giây.
   */
  @Cron('*/10 * * * * *')
  async processOutbox(): Promise<number> {
    if (this.isProcessing) return 0;
    this.isProcessing = true;

    let processedCount = 0;
    try {
      const now = new Date();
      // Quét tối đa 20 sự kiện mỗi chu kỳ
      const pendingEvents = await this.outboxModel
        .find({
          status: { $in: [OutboxStatus.PENDING, OutboxStatus.FAILED] },
          retryCount: { $lt: 5 },
          $or: [{ nextRetryAt: null }, { nextRetryAt: { $lte: now } }],
        })
        .sort({ createdAt: 1 })
        .limit(20)
        .exec();

      for (const event of pendingEvents) {
        const success = await this.processSingleEvent(event._id.toString());
        if (success) processedCount++;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Lỗi trong tiến trình quét Outbox: ${msg}`);
    } finally {
      this.isProcessing = false;
    }

    return processedCount;
  }

  /**
   * Thực thi dispatch nghiệp vụ và cập nhật trạng thái kết quả.
   */
  private async executeAndHandleResult(
    event: OutboxEventDocument,
  ): Promise<boolean> {
    try {
      await this.dispatchPayload(event.eventType, event.payload);

      // Đánh dấu thành công
      await this.outboxModel.updateOne(
        { _id: event._id },
        {
          $set: {
            status: OutboxStatus.SENT,
            processedAt: new Date(),
            errorMessage: null,
          },
        },
      );
      return true;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      const nextRetryCount = (event.retryCount || 0) + 1;
      const isExceeded = nextRetryCount >= (event.maxRetries || 5);

      // Exponential backoff: 5s, 10s, 20s, 40s...
      const delayMs = Math.min(
        Math.pow(2, nextRetryCount - 1) * 5000,
        60 * 60 * 1000,
      );
      const nextRetryAt = new Date(Date.now() + delayMs);

      await this.outboxModel.updateOne(
        { _id: event._id },
        {
          $set: {
            status: isExceeded ? OutboxStatus.FAILED : OutboxStatus.FAILED,
            retryCount: nextRetryCount,
            nextRetryAt: isExceeded ? null : nextRetryAt,
            errorMessage: errorMsg,
          },
        },
      );

      this.logger.warn(
        `OutboxEvent ${event._id.toString()} (${event.eventType}) thất bại lần ${nextRetryCount}/${event.maxRetries || 5}: ${errorMsg}`,
      );
      return false;
    }
  }

  /**
   * Phân luồng sự kiện tới đúng service hạ tầng.
   */
  private async dispatchPayload(
    eventType: OutboxEventType,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const orderPayload = payload as unknown as OrderOutboxPayload;

    switch (eventType) {
      case OutboxEventType.ORDER_CREATED: {
        // Gửi in-app notification & alert
        await this.notificationsService.sendOrderNotification(
          {
            _id: orderPayload.orderId,
            orderCode: orderPayload.orderCode,
            customer: orderPayload.customer,
            total: orderPayload.total,
            customerName: orderPayload.customerName,
            paymentMethod: orderPayload.paymentMethod,
            orderStatus: orderPayload.orderStatus || 'PENDING',
          },
          'CREATED',
        );

        // Gửi email xác nhận nếu có email người nhận
        if (orderPayload.customerEmail) {
          await this.emailService.sendOrderConfirmationEmail(
            orderPayload.customerEmail,
            payload as unknown as EmailOrderDetails,
          );
        }
        break;
      }

      case OutboxEventType.ORDER_STATUS_CHANGED: {
        await this.notificationsService.sendOrderNotification(
          {
            _id: orderPayload.orderId,
            orderCode: orderPayload.orderCode,
            customer: orderPayload.customer,
            total: orderPayload.total,
            customerName: orderPayload.customerName,
            paymentMethod: orderPayload.paymentMethod,
            orderStatus: orderPayload.newStatus || orderPayload.orderStatus,
          },
          'STATUS_UPDATED',
        );
        break;
      }

      case OutboxEventType.GOOGLE_SHEET_SYNC: {
        const webappUrl = this.configService.get<string>(
          'GOOGLE_SHEET_WEBAPP_URL',
        );
        if (webappUrl) {
          const res = await fetch(webappUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          if (!res.ok) {
            throw new Error(`Google Sheet sync HTTP ${res.status}`);
          }
        }
        break;
      }

      case OutboxEventType.STOCK_ALERT: {
        const productId =
          typeof payload.productId === 'string' ? payload.productId : '';
        const currentStock =
          typeof payload.currentStock === 'number' ? payload.currentStock : 0;
        const name =
          typeof payload.name === 'string' ? payload.name : 'Sản phẩm';
        const sku = typeof payload.sku === 'string' ? payload.sku : '';

        await this.notificationsService.sendLowStockAlert(
          { _id: productId, name, sku },
          currentStock,
        );
        break;
      }
    }
  }

  /**
   * Cron dọn dẹp hàng ngày lúc 03:00 sáng: xóa các sự kiện đã SENT quá 7 ngày.
   */
  @Cron('0 3 * * *')
  async cleanupOldEvents(): Promise<number> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const result = await this.outboxModel.deleteMany({
      status: OutboxStatus.SENT,
      processedAt: { $lte: sevenDaysAgo },
    });
    this.logger.log(`Đã dọn dẹp ${result.deletedCount} outbox events cũ.`);
    return result.deletedCount;
  }
}
