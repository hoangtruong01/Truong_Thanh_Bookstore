import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  ServiceUnavailableException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { Order, OrderDocument } from '../schemas/order.schema';
import { UpdateOrderStatusDto, CancelOrderDto } from '../dto/order.dto';
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  RefundStatus,
  StaffPermission,
  UserRole,
} from '../../../common/enums';
import { ProductsService } from '../../products/products.service';
import { PromotionsService } from '../../promotions/promotions.service';
import { OrderInventoryService } from './order-inventory.service';
import { OrderLoyaltyService } from './order-loyalty.service';
import { OrderNotificationService } from './order-notification.service';

type OrderStatusChange = UpdateOrderStatusDto & { returnReason?: string };

@Injectable()
export class OrderLifecycleService {
  private readonly logger = new Logger(OrderLifecycleService.name);

  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    private readonly productsService: ProductsService,
    private readonly promotionsService: PromotionsService,
    private readonly orderInventoryService: OrderInventoryService,
    private readonly orderLoyaltyService: OrderLoyaltyService,
    private readonly orderNotificationService: OrderNotificationService,
  ) {}

  private isTransactionUnsupported(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error);
    return /Transaction numbers are only allowed|replica set|mongos|retryable writes|retryWrites|standalone/i.test(
      message,
    );
  }

  private isTransientTransactionError(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error);
    const hasLabel =
      typeof (error as { hasErrorLabel?: unknown })?.hasErrorLabel ===
        'function' &&
      Boolean(
        (error as { hasErrorLabel: (label: string) => boolean }).hasErrorLabel(
          'TransientTransactionError',
        ),
      );
    const code = (error as { code?: unknown })?.code;
    const codeName = (error as { codeName?: unknown })?.codeName;
    return (
      hasLabel ||
      /Unable to acquire|WriteConflict/i.test(message) ||
      code === 112 ||
      codeName === 'WriteConflict'
    );
  }

  async updateStatus(
    id: string,
    dto: OrderStatusChange,
    actor?: { _id: string; role?: string; permissions?: string[] },
  ): Promise<OrderDocument> {
    if (
      actor &&
      (dto.orderStatus === OrderStatus.CANCELLED ||
        dto.orderStatus === OrderStatus.RETURNED)
    ) {
      const actorRole = (actor.role || 'CUSTOMER').toUpperCase();
      const isAdmin =
        actorRole === (UserRole.SUPER_ADMIN as string) ||
        actorRole === (UserRole.ADMIN as string);
      const isStaff = actorRole === (UserRole.STAFF as string);
      const hasOrderPerm =
        actor.permissions &&
        actor.permissions.includes(StaffPermission.MANAGE_ORDERS);

      if (isStaff && !hasOrderPerm) {
        throw new ForbiddenException(
          'Bạn không có quyền cập nhật trạng thái đơn hàng này',
        );
      }

      if (!isAdmin && !isStaff) {
        const existingOrder = await this.orderModel.findById(id).exec();
        if (!existingOrder)
          throw new NotFoundException('Không tìm thấy đơn hàng');

        const isOwner =
          !!existingOrder.customer &&
          existingOrder.customer.toString() === actor._id.toString();
        if (!isOwner) {
          throw new ForbiddenException(
            'Bạn không có quyền thao tác trên đơn hàng này',
          );
        }

        if (existingOrder.orderStatus !== OrderStatus.PENDING) {
          throw new BadRequestException(
            'Chỉ có thể hủy đơn hàng khi đơn đang ở trạng thái Chờ xử lý',
          );
        }
      }
    }

    const database = (this.orderModel as any).db;
    const afterCommit: Array<() => Promise<void>> = [];

    if (!database?.startSession) {
      const updatedOrder = await this.updateStatusInternal(
        id,
        dto,
        undefined,
        afterCommit,
      );
      for (const fn of afterCommit) {
        await fn().catch((err) =>
          this.logger.error(
            `Failed to execute post-commit order action: ${err.message}`,
            err.stack,
          ),
        );
      }
      return updatedOrder;
    }

    const session: ClientSession = await database.startSession();
    try {
      if (typeof session.startTransaction === 'function') {
        session.startTransaction();
      }
      const updatedOrder = await this.updateStatusInternal(
        id,
        dto,
        session,
        afterCommit,
      );
      if (typeof session.commitTransaction === 'function') {
        await session.commitTransaction();
      }
      for (const fn of afterCommit) {
        await fn().catch((err) =>
          this.logger.error(
            `Failed to execute post-commit order action: ${err.message}`,
            err.stack,
          ),
        );
      }
      return updatedOrder;
    } catch (error) {
      if (
        typeof (session as any).inTransaction === 'function' &&
        (session as any).inTransaction()
      ) {
        await (session as any).abortTransaction?.();
      } else if (typeof session.abortTransaction === 'function') {
        await session.abortTransaction();
      }
      if (this.isTransactionUnsupported(error)) {
        throw new ServiceUnavailableException(
          'Cập nhật trạng thái đơn hàng yêu cầu MongoDB replica set để bảo đảm toàn vẹn dữ liệu',
        );
      }
      throw error;
    } finally {
      if (typeof session.endSession === 'function') {
        await session.endSession();
      }
    }
  }

  async updateStatusInternal(
    id: string,
    dto: OrderStatusChange,
    session?: ClientSession,
    afterCommit?: Array<() => Promise<void>>,
  ): Promise<OrderDocument> {
    const orderQuery = this.orderModel.findById(id);
    if (session) orderQuery.session(session);
    const order = await orderQuery.exec();
    if (!order) throw new NotFoundException('Order not found');

    const oldStatus = order.orderStatus;
    const allowedTransitions: Record<string, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
      [OrderStatus.PROCESSING]: [OrderStatus.SHIPPING, OrderStatus.CANCELLED],
      [OrderStatus.SHIPPING]: [OrderStatus.DELIVERED, OrderStatus.RETURNED],
      [OrderStatus.DELIVERED]: [
        OrderStatus.COMPLETED,
        OrderStatus.RETURN_REQUESTED,
        OrderStatus.RETURNED,
      ],
      [OrderStatus.RETURN_REQUESTED]: [
        OrderStatus.RETURNED,
        OrderStatus.DELIVERED,
      ],
      [OrderStatus.COMPLETED]: [
        OrderStatus.RETURN_REQUESTED,
        OrderStatus.RETURNED,
      ],
      [OrderStatus.RETURNED]: [],
      [OrderStatus.CANCELLED]: [],
    };

    if (!allowedTransitions[oldStatus]?.includes(dto.orderStatus)) {
      throw new BadRequestException(
        `Không thể chuyển trạng thái từ ${oldStatus} sang ${dto.orderStatus}`,
      );
    }

    if (
      (dto.orderStatus === OrderStatus.DELIVERED ||
        dto.orderStatus === OrderStatus.COMPLETED) &&
      (order.paymentMethod || PaymentMethod.COD) !== PaymentMethod.COD &&
      order.paymentStatus !== PaymentStatus.PAID
    ) {
      throw new BadRequestException(
        'Đơn hàng thanh toán trực tuyến/chuyển khoản phải được xác nhận đã thanh toán trước khi giao thành công',
      );
    }

    if (
      (dto.orderStatus === OrderStatus.DELIVERED ||
        dto.orderStatus === OrderStatus.COMPLETED) &&
      (order.paymentMethod || PaymentMethod.COD) === PaymentMethod.COD
    ) {
      order.paymentStatus = PaymentStatus.PAID;
    }

    order.orderStatus = dto.orderStatus;
    if (dto.orderStatus === OrderStatus.RETURN_REQUESTED) {
      order.returnReason = dto.returnReason || dto.note;
      order.returnRequestedAt = new Date();
    }
    if (dto.orderStatus === OrderStatus.DELIVERED) {
      order.deliveredAt ||= new Date();
    }

    if (!order.timeline) {
      order.timeline = [];
    }

    let timelineNote = dto.note || `Trạng thái đơn hàng: ${dto.orderStatus}`;
    if (!dto.note) {
      switch (dto.orderStatus) {
        case OrderStatus.PENDING:
          timelineNote = 'Đơn hàng đang chờ xử lý.';
          break;
        case OrderStatus.CONFIRMED:
          timelineNote = 'Cửa hàng đã xác nhận đơn hàng của bạn.';
          break;
        case OrderStatus.PROCESSING:
          timelineNote = 'Đơn hàng đang được đóng gói và chuẩn bị bàn giao.';
          break;
        case OrderStatus.SHIPPING:
          timelineNote = 'Đơn hàng đang được vận chuyển đến địa chỉ nhận.';
          break;
        case OrderStatus.DELIVERED:
        case OrderStatus.COMPLETED:
          timelineNote = 'Giao hàng thành công. Đơn hàng hoàn tất.';
          break;
        case OrderStatus.RETURN_REQUESTED:
          timelineNote =
            'Khách hàng đã gửi yêu cầu trả hàng, đang chờ cửa hàng xem xét phê duyệt.';
          break;
        case OrderStatus.RETURNED:
          timelineNote = 'Đơn hàng đã được tiếp nhận hoàn trả và hoàn kho.';
          break;
        case OrderStatus.CANCELLED:
          timelineNote = 'Đơn hàng đã bị hủy bỏ.';
          break;
      }
    }

    order.timeline.push({
      status: dto.orderStatus,
      note: timelineNote,
      createdAt: new Date(),
    });

    // BE-01 Invariance Rule: When cancelled or returned, if payment was PAID, automatically set refundStatus
    if (
      (dto.orderStatus === OrderStatus.CANCELLED ||
        dto.orderStatus === OrderStatus.RETURNED) &&
      order.paymentStatus === PaymentStatus.PAID &&
      (order.refundStatus === RefundStatus.NONE || !order.refundStatus)
    ) {
      order.refundStatus = RefundStatus.REQUESTED;
      order.refundAmount = order.total;
      order.refundReason ||=
        dto.note ||
        `Tự động khởi tạo yêu cầu hoàn tiền cho đơn hàng ${dto.orderStatus === OrderStatus.CANCELLED ? 'đã hủy' : 'hoàn trả'}`;
    }

    // Restore stock if cancelled or returned
    if (
      (dto.orderStatus === OrderStatus.CANCELLED ||
        dto.orderStatus === OrderStatus.RETURNED) &&
      !order.inventoryRestoredAt
    ) {
      await this.orderInventoryService.restoreOrderStock(
        order.items,
        order.orderCode || `${dto.orderStatus}:${order._id.toString()}`,
        order._id.toString(),
        session,
      );
      order.inventoryRestoredAt = new Date();
    }

    // Refund loyalty points if used
    if (
      (dto.orderStatus === OrderStatus.CANCELLED ||
        dto.orderStatus === OrderStatus.RETURNED) &&
      order.loyaltyPointsUsed > 0 &&
      order.customer &&
      !order.loyaltyPointsRefunded
    ) {
      await this.orderLoyaltyService.refundLoyaltyPoints(
        order.customer.toString(),
        order.loyaltyPointsUsed,
        session,
      );
      order.loyaltyPointsRefunded = true;
    }

    // Deduct loyalty points if order previously awarded points and is now RETURNED
    if (
      dto.orderStatus === OrderStatus.RETURNED &&
      order.customer &&
      order.loyaltyAwarded
    ) {
      const points =
        order.loyaltyPointsAwarded ||
        Math.floor((order.subtotal ?? order.total) / 1000);
      if (points > 0) {
        try {
          await this.orderLoyaltyService.deductAwardedPoints(
            order.customer.toString(),
            points,
            session,
          );
          order.loyaltyAwarded = false;
        } catch (error) {
          if (session) throw error;
          this.logger.error(
            `Failed to deduct loyalty points for user ${String(order.customer)}`,
            error,
          );
        }
      }
    }

    // Award loyalty points upon completion
    if (
      (dto.orderStatus === OrderStatus.DELIVERED ||
        dto.orderStatus === OrderStatus.COMPLETED) &&
      order.customer &&
      !order.loyaltyAwarded
    ) {
      await this.orderLoyaltyService.awardOrderLoyalty(
        order,
        session,
        afterCommit,
      );
    }

    // Release promo code usage on cancel
    if (
      dto.orderStatus === OrderStatus.CANCELLED &&
      order.promotionCode &&
      !order.promotionUsageReleasedAt
    ) {
      await this.promotionsService.releaseUsage(
        order.promotionCode,
        order.customer?.toString(),
        order.customerEmail,
        order.phone,
        session,
      );
      order.promotionUsageReleasedAt = new Date();
    }

    if (
      dto.orderStatus === OrderStatus.DELIVERED ||
      dto.orderStatus === OrderStatus.COMPLETED
    ) {
      order.revenueRecognizedAt ||= new Date();
    }

    const savedOrder = await order.save(session ? { session } : undefined);

    const notifyStatus = async () => {
      savedOrder.$session?.(null);
      this.orderNotificationService
        .syncToGoogleSheet(savedOrder)
        .catch((err) => this.logger.error('Sheet sync failed', err));
      await this.orderNotificationService.notifyStatusChanged(
        savedOrder,
        oldStatus,
        dto.orderStatus,
      );
    };

    if (afterCommit) afterCommit.push(notifyStatus);
    else await notifyStatus();

    return savedOrder;
  }

  async cancel(
    id: string,
    reasonOrDto?: string | CancelOrderDto,
  ): Promise<OrderDocument> {
    const reason =
      typeof reasonOrDto === 'string'
        ? reasonOrDto
        : reasonOrDto?.reason || 'Đơn hàng bị hủy bởi hệ thống';
    return this.updateStatus(id, {
      orderStatus: OrderStatus.CANCELLED,
      note: reason,
    });
  }

  async cancelForActor(
    id: string,
    actor: { _id: string; role?: string; permissions?: string[] },
    reasonOrDto?: string | CancelOrderDto,
  ): Promise<OrderDocument> {
    const reason =
      typeof reasonOrDto === 'string'
        ? reasonOrDto
        : reasonOrDto?.reason || 'Khách hàng yêu cầu hủy đơn';
    return this.updateStatus(
      id,
      {
        orderStatus: OrderStatus.CANCELLED,
        note: reason,
      },
      actor,
    );
  }

  async cancelGuest(
    id: string,
    guestAccessToken?: string,
    reasonOrDto?: string | CancelOrderDto,
  ): Promise<OrderDocument> {
    const reason =
      typeof reasonOrDto === 'string'
        ? reasonOrDto
        : reasonOrDto?.reason || 'Khách vãng lai hủy đơn hàng';

    const order = await this.orderModel.findById(id).exec();
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');

    if (order.customer) {
      throw new ForbiddenException(
        'Đơn hàng thuộc về tài khoản người dùng, vui lòng đăng nhập để thao tác',
      );
    }

    if (order.orderStatus !== OrderStatus.PENDING) {
      throw new BadRequestException(
        'Chỉ có thể hủy đơn hàng khi đơn đang ở trạng thái Chờ xử lý',
      );
    }

    return this.updateStatus(id, {
      orderStatus: OrderStatus.CANCELLED,
      note: reason,
    });
  }

  async requestReturn(
    id: string,
    actor: { _id: string; role?: string },
    dto: { reason: string },
  ): Promise<OrderDocument> {
    const order = await this.orderModel.findById(id).exec();
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');

    const actorRole = (actor.role || 'CUSTOMER').toUpperCase();
    const isAdmin = actorRole === 'SUPER_ADMIN' || actorRole === 'ADMIN';
    const isOwner =
      !!order.customer && order.customer.toString() === actor._id.toString();
    if (!isAdmin && !isOwner) {
      throw new ForbiddenException(
        'Bạn không có quyền yêu cầu trả đơn hàng này',
      );
    }

    if (
      order.orderStatus !== OrderStatus.DELIVERED &&
      order.orderStatus !== OrderStatus.COMPLETED
    ) {
      throw new BadRequestException(
        'Chỉ có thể yêu cầu trả hàng đối với đơn đã giao thành công',
      );
    }

    const deliveredTime = order.deliveredAt
      ? order.deliveredAt.getTime()
      : order.updatedAt
        ? order.updatedAt.getTime()
        : Date.now();
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - deliveredTime > sevenDaysInMs) {
      throw new BadRequestException(
        'Đã quá thời hạn 7 ngày kể từ khi nhận hàng. Không thể yêu cầu đổi trả.',
      );
    }

    return this.updateStatus(id, {
      orderStatus: OrderStatus.RETURN_REQUESTED,
      returnReason: dto.reason,
      note: `Khách yêu cầu trả hàng: ${dto.reason}`,
    });
  }

  async approveReturn(
    id: string,
    _actor: { _id: string; role?: string; permissions?: string[] },
    note?: string,
  ): Promise<OrderDocument> {
    const order = await this.orderModel.findById(id).exec();
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');

    if (
      order.orderStatus !== OrderStatus.RETURN_REQUESTED &&
      order.orderStatus !== OrderStatus.DELIVERED
    ) {
      throw new BadRequestException(
        'Chỉ có thể duyệt hoàn trả đơn hàng ở trạng thái Yêu cầu trả hàng hoặc Đã giao',
      );
    }

    const approveNote =
      note ||
      'Cửa hàng đã duyệt yêu cầu hoàn trả sách và tiếp nhận nhập lại kho';
    return this.updateStatus(id, {
      orderStatus: OrderStatus.RETURNED,
      note: approveNote,
    });
  }

  async rejectReturn(
    id: string,
    _actor: { _id: string; role?: string; permissions?: string[] },
    dto: { reason: string },
  ): Promise<OrderDocument> {
    const order = await this.orderModel.findById(id).exec();
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');

    if (order.orderStatus !== OrderStatus.RETURN_REQUESTED) {
      throw new BadRequestException(
        'Chỉ có thể từ chối yêu cầu trả hàng khi đơn đang ở trạng thái Chờ duyệt trả hàng',
      );
    }

    return this.updateStatus(id, {
      orderStatus: OrderStatus.DELIVERED,
      note: `Từ chối trả hàng: ${dto.reason}`,
    });
  }

  async processRefund(
    id: string,
    actor: { _id: string; role?: string; permissions?: string[] },
    dto?: { reason?: string; amount?: number },
  ): Promise<OrderDocument> {
    if (
      actor.role !== UserRole.ADMIN &&
      actor.role !== UserRole.SUPER_ADMIN &&
      !(
        actor.role === UserRole.STAFF &&
        actor.permissions?.includes(StaffPermission.MANAGE_ORDERS)
      )
    ) {
      throw new ForbiddenException('Bạn không có quyền xử lý hoàn tiền');
    }
    const order = await this.orderModel.findById(id).exec();
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');

    if (
      order.orderStatus !== OrderStatus.CANCELLED &&
      order.orderStatus !== OrderStatus.RETURNED
    ) {
      throw new BadRequestException(
        'Chỉ có thể hoàn tiền cho đơn hàng đã hủy hoặc đã hoàn trả',
      );
    }

    if (order.refundStatus === RefundStatus.REFUNDED) {
      throw new ConflictException('Đơn hàng này đã được hoàn tiền trước đó');
    }

    if (order.paymentStatus !== PaymentStatus.PAID) {
      throw new BadRequestException(
        'Chỉ có thể hoàn tiền cho đơn đã thanh toán',
      );
    }
    const refundAmount = dto?.amount ?? order.refundAmount ?? order.total;
    if (
      !Number.isFinite(refundAmount) ||
      refundAmount <= 0 ||
      refundAmount > order.total
    ) {
      throw new BadRequestException(
        'Số tiền hoàn phải lớn hơn 0 và không vượt quá số tiền đã thanh toán',
      );
    }
    if (order.refundStatus === RefundStatus.MANUAL_REQUIRED) {
      if (refundAmount !== order.refundAmount) {
        throw new ConflictException(
          'Yêu cầu hoàn tiền đang chờ đối soát thủ công',
        );
      }
      return order;
    }

    // No provider refund API or verified manual settlement exists yet. Record
    // the request atomically without claiming money has been transferred.
    const lockedOrder = await this.orderModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(id),
          orderStatus: order.orderStatus,
          paymentStatus: PaymentStatus.PAID,
          total: order.total,
          refundStatus: {
            $in: [
              RefundStatus.NONE,
              RefundStatus.REQUESTED,
              RefundStatus.FAILED,
            ],
          },
        },
        {
          $set: {
            refundStatus: RefundStatus.MANUAL_REQUIRED,
            refundAmount,
            refundReason:
              dto?.reason ||
              order.refundReason ||
              'Chờ đối soát và hoàn tiền thủ công',
            refundActor: new Types.ObjectId(actor._id),
          },
          $push: {
            timeline: {
              status: order.orderStatus,
              note: `Yêu cầu hoàn tiền ${refundAmount.toLocaleString('vi-VN')}đ đang chờ xử lý thủ công; chưa xác nhận chuyển tiền.`,
              createdAt: new Date(),
            },
          },
        },
        { returnDocument: 'after' },
      )
      .exec();

    if (!lockedOrder) {
      throw new ConflictException(
        'Giao dịch hoàn tiền đang được xử lý bởi tiến trình khác hoặc đã hoàn tất',
      );
    }

    return lockedOrder;
  }

  /**
   * BE-06: Tối ưu truy vấn & đánh index tự động hủy đơn hàng quá hạn (Auto-Cancel Query)
   * Lọc trực tiếp tại tầng Database qua $or và timestamps (IXSCAN).
   * Xử lý theo cơ chế Batch Processing để tránh nghẽn luồng.
   * Hỗ trợ callback updateStatusFn để tương thích với facade & test spies.
   */
  async handleAutoCancelOrders(
    updateStatusFn?: (id: string, dto: UpdateOrderStatusDto) => Promise<any>,
  ): Promise<number> {
    const nowMs = Date.now();
    const codTimeoutMs = 48 * 60 * 60 * 1000;
    const onlineTimeoutMs = 24 * 60 * 60 * 1000;

    const codThreshold = new Date(nowMs - codTimeoutMs);
    const onlineThreshold = new Date(nowMs - onlineTimeoutMs);

    const filter = {
      orderStatus: OrderStatus.PENDING,
      $or: [
        { paymentMethod: PaymentMethod.COD, createdAt: { $lte: codThreshold } },
        {
          paymentMethod: { $ne: PaymentMethod.COD },
          createdAt: { $lte: onlineThreshold },
        },
      ],
    };

    const BATCH_SIZE = 50;
    let cancelledCount = 0;
    let hasMore = true;

    while (hasMore) {
      let query = this.orderModel.find(filter);
      if (typeof (query as any)?.limit === 'function') {
        query = (query as any).limit(BATCH_SIZE);
      }
      const pendingBatch = await query.exec();

      if (!pendingBatch || pendingBatch.length === 0) {
        hasMore = false;
        break;
      }

      for (const order of pendingBatch) {
        const createdAtMs = new Date(order.createdAt).getTime();
        const isCod = order.paymentMethod === PaymentMethod.COD;
        const timeoutMs = isCod ? codTimeoutMs : onlineTimeoutMs;

        // Double check in case of mock data or boundary
        if (nowMs - createdAtMs >= timeoutMs) {
          try {
            const cancelDto: UpdateOrderStatusDto = {
              orderStatus: OrderStatus.CANCELLED,
              note: 'Đơn hàng tự động hủy do quá hạn thanh toán/xác nhận',
            };
            if (updateStatusFn) {
              await updateStatusFn(order._id.toString(), cancelDto);
            } else {
              await this.updateStatus(order._id.toString(), cancelDto);
            }
            cancelledCount++;
            this.logger.log(
              `Đã tự động hủy đơn hàng #${order.orderCode} do quá hạn (${isCod ? '48h COD' : '24h Online'})`,
            );
          } catch (error: any) {
            this.logger.error(
              `Lỗi khi tự động hủy đơn hàng #${order.orderCode}: ${error.message || error}`,
            );
          }
        }
      }

      if (pendingBatch.length < BATCH_SIZE) {
        hasMore = false;
      }
    }

    return cancelledCount;
  }

  /**
   * BE-06: Gửi thông báo cảnh báo 2 giờ trước khi tự động hủy đơn
   * Truy vấn DB-level với compound index và batch processing.
   */
  async handleAutoCancelWarnings(): Promise<number> {
    const nowMs = Date.now();
    const codTimeoutMs = 48 * 60 * 60 * 1000;
    const onlineTimeoutMs = 24 * 60 * 60 * 1000;
    const warningWindowMs = 2 * 60 * 60 * 1000;

    const codThreshold = new Date(nowMs - codTimeoutMs);
    const codWarningStart = new Date(codThreshold.getTime());
    const codWarningEnd = new Date(nowMs - (codTimeoutMs - warningWindowMs));

    const onlineThreshold = new Date(nowMs - onlineTimeoutMs);
    const onlineWarningStart = new Date(onlineThreshold.getTime());
    const onlineWarningEnd = new Date(
      nowMs - (onlineTimeoutMs - warningWindowMs),
    );

    const filter = {
      orderStatus: OrderStatus.PENDING,
      autoCancelWarningSentAt: { $exists: false },
      $or: [
        {
          paymentMethod: PaymentMethod.COD,
          createdAt: { $gte: codWarningStart, $lte: codWarningEnd },
        },
        {
          paymentMethod: { $ne: PaymentMethod.COD },
          createdAt: { $gte: onlineWarningStart, $lte: onlineWarningEnd },
        },
      ],
    };

    const BATCH_SIZE = 50;
    let warningsCount = 0;
    let hasMore = true;

    while (hasMore) {
      let query = this.orderModel.find(filter);
      if (typeof (query as any)?.limit === 'function') {
        query = (query as any).limit(BATCH_SIZE);
      }
      const warningBatch = await query.exec();

      if (!warningBatch || warningBatch.length === 0) {
        hasMore = false;
        break;
      }

      for (const order of warningBatch) {
        const createdAtMs = new Date(order.createdAt).getTime();
        const isCod = order.paymentMethod === PaymentMethod.COD;
        const timeoutMs = isCod ? codTimeoutMs : onlineTimeoutMs;
        const warningThresholdMs = timeoutMs - warningWindowMs;
        const elapsedMs = nowMs - createdAtMs;

        if (elapsedMs >= warningThresholdMs && elapsedMs < timeoutMs) {
          try {
            await this.orderNotificationService.notifyAutoCancelWarning(order);
            order.autoCancelWarningSentAt = new Date();
            if (typeof order.save === 'function') {
              await order.save();
            }
            warningsCount++;
            this.logger.log(
              `Đã gửi cảnh báo tự động hủy 2h cho đơn hàng #${order.orderCode}`,
            );
          } catch (error: any) {
            this.logger.error(
              `Lỗi gửi cảnh báo 2h cho đơn hàng #${order.orderCode}: ${error.message || error}`,
            );
          }
        }
      }

      if (warningBatch.length < BATCH_SIZE) {
        hasMore = false;
      }
    }

    return warningsCount;
  }
}
