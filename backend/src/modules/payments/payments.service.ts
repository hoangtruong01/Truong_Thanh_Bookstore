import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { ClientSession, Connection, Model, Types } from 'mongoose';
import { Cron } from '@nestjs/schedule';
import { Payment, PaymentDocument } from './schemas/payment.schema';
import {
  CreatePaymentDto,
  PaymentCallbackDto,
  PaymentQueryDto,
} from './dto/payment.dto';
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  RefundStatus,
  StaffPermission,
  UserRole,
} from '../../common/enums';
import { Order, OrderDocument } from '../orders/schemas/order.schema';
import { PaymentProviderRegistry } from './providers/payment.providers';
import { PaymentInitiationResult } from './providers/payment-provider.interface';

type PaymentActor = { _id: string; role?: string; permissions?: string[] };

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    private readonly providers: PaymentProviderRegistry,
    @Optional() @InjectConnection() private readonly connection?: Connection,
  ) {}

  private async syncOrderPaymentStatus(
    orderId: Types.ObjectId,
    status: PaymentStatus,
    paidAt?: Date,
    session?: ClientSession,
  ): Promise<void> {
    const update: Record<string, unknown> = { paymentStatus: status };
    if (status === PaymentStatus.PAID) {
      update.revenueRecognizedAt = paidAt || new Date();
    }
    if (session) {
      await this.orderModel
        .updateOne({ _id: orderId }, { $set: update }, { session })
        .exec();
    } else {
      await this.orderModel
        .updateOne({ _id: orderId }, { $set: update })
        .exec();
    }

    if (status === PaymentStatus.PAID) {
      const confirmedUpdate = {
        $set: { orderStatus: OrderStatus.CONFIRMED },
        $push: {
          timeline: {
            status: OrderStatus.CONFIRMED,
            note: 'Đơn hàng tự động xác nhận sau khi thanh toán thành công.',
            createdAt: new Date(),
          },
        },
      };
      if (session) {
        await this.orderModel
          .updateOne(
            { _id: orderId, orderStatus: OrderStatus.PENDING },
            confirmedUpdate,
            { session },
          )
          .exec();
      } else {
        await this.orderModel
          .updateOne(
            { _id: orderId, orderStatus: OrderStatus.PENDING },
            confirmedUpdate,
          )
          .exec();
      }
    }
  }

  private normalizeActor(
    actor?: string | PaymentActor,
  ): PaymentActor | undefined {
    return typeof actor === 'string' ? { _id: actor } : actor;
  }

  private canManage(actor?: PaymentActor): boolean {
    return (
      !!actor &&
      (actor.role === UserRole.SUPER_ADMIN ||
        actor.role === UserRole.ADMIN ||
        (actor.role === UserRole.STAFF &&
          !!actor.permissions?.includes(StaffPermission.MANAGE_ORDERS)))
    );
  }

  private assertOrderAccess(order: OrderDocument, actor?: PaymentActor): void {
    if (this.canManage(actor)) return;
    const customer = order.customer as unknown;
    let customerId: string | undefined;
    if (customer instanceof Types.ObjectId || typeof customer === 'string') {
      customerId = customer.toString();
    } else if (customer && typeof customer === 'object' && '_id' in customer) {
      const id = (customer as { _id?: unknown })._id;
      if (id instanceof Types.ObjectId || typeof id === 'string') {
        customerId = id.toString();
      }
    }
    if (!actor || !customerId || customerId !== actor._id.toString()) {
      throw new ForbiddenException(
        'Bạn không có quyền truy cập thanh toán của đơn hàng này',
      );
    }
  }

  async createPayment(
    dto: CreatePaymentDto,
    actorInput?: string | PaymentActor,
  ): Promise<{ payment: PaymentDocument; action: PaymentInitiationResult }> {
    const actor = this.normalizeActor(actorInput);
    const order = await this.orderModel.findById(dto.orderId).exec();
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
    this.assertOrderAccess(order, actor);

    if (order.paymentStatus === PaymentStatus.PAID) {
      throw new ConflictException('Đơn hàng đã được thanh toán');
    }
    if (dto.orderCode && dto.orderCode !== order.orderCode) {
      throw new BadRequestException('Mã đơn hàng không khớp');
    }
    if (dto.amount !== undefined && dto.amount !== order.total) {
      throw new BadRequestException(
        'Số tiền thanh toán không khớp với đơn hàng',
      );
    }
    if (dto.provider !== order.paymentMethod) {
      throw new BadRequestException(
        'Phương thức thanh toán không khớp với đơn hàng',
      );
    }

    const provider = this.providers.get(dto.provider);
    const existing = await this.paymentModel
      .findOne({
        order: order._id,
        provider: dto.provider,
        status: { $in: [PaymentStatus.PENDING, PaymentStatus.UNPAID] },
      })
      .sort({ createdAt: -1 })
      .exec();

    if (existing && (!existing.expiresAt || existing.expiresAt > new Date())) {
      const action = await provider.initiate({
        paymentId: existing._id.toString(),
        orderId: order._id.toString(),
        orderCode: order.orderCode,
        amount: order.total,
        returnUrl: dto.returnUrl,
        providerReference: existing.providerReference,
      });
      existing.providerReference = action.providerReference;
      existing.expiresAt = action.expiresAt;
      existing.gatewayResponse = { initiation: action };
      await existing.save();
      return { payment: existing, action };
    }
    if (existing) {
      existing.status = PaymentStatus.FAILED;
      existing.failureReason = 'Phiên thanh toán đã hết hạn';
      await existing.save();
    }

    const payment = new this.paymentModel({
      order: order._id,
      orderCode: order.orderCode,
      amount: order.total,
      provider: dto.provider,
      status: PaymentStatus.PENDING,
      user: actor?._id ? new Types.ObjectId(actor._id) : undefined,
      providerReference: `INIT-${order.orderCode}-${Date.now()}`,
    });
    const action = await provider.initiate({
      paymentId: payment._id.toString(),
      orderId: order._id.toString(),
      orderCode: order.orderCode,
      amount: order.total,
      returnUrl: dto.returnUrl,
    });
    payment.status = action.status;
    payment.providerReference = action.providerReference;
    payment.expiresAt = action.expiresAt;
    payment.gatewayResponse = { initiation: action };
    await payment.save();
    return { payment, action };
  }

  async findByOrderId(
    orderId: string,
    actorInput?: string | PaymentActor,
  ): Promise<PaymentDocument | null> {
    const order = await this.orderModel.findById(orderId).exec();
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
    this.assertOrderAccess(order, this.normalizeActor(actorInput));
    return this.paymentModel
      .findOne({ order: new Types.ObjectId(orderId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async handleCallback(dto: PaymentCallbackDto): Promise<PaymentDocument> {
    const correlationId = `cid_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
    this.logger.log(
      `[CID: ${correlationId}] Nhận callback ${dto.provider}: txn=${dto.transactionId || 'none'}, ref=${dto.providerReference || 'none'}, amount=${dto.amount}`,
    );

    const payment = await this.paymentModel
      .findOne({
        provider: dto.provider,
        $or: [
          ...(dto.providerReference
            ? [{ providerReference: dto.providerReference }]
            : []),
          ...(dto.orderCode ? [{ orderCode: dto.orderCode }] : []),
          { transactionId: dto.transactionId },
        ],
      })
      .exec();
    if (!payment) {
      this.logger.warn(
        `[CID: ${correlationId}] Không tìm thấy giao dịch thanh toán cho callback ${dto.provider}`,
      );
      throw new NotFoundException('Không tìm thấy giao dịch thanh toán');
    }

    // BE-03: Amount Tampering Detection
    if (
      dto.amount !== undefined &&
      Math.round(Number(dto.amount)) !== Math.round(payment.amount)
    ) {
      this.logger.error(
        `[CID: ${correlationId}] [CẢNH BÁO BẢO MẬT] Phát hiện sai lệch số tiền (Amount Tampering)! Payment ID: ${payment._id.toString()}, Dự kiến: ${payment.amount}, Nhận được: ${dto.amount}`,
      );
      payment.status = PaymentStatus.FAILED;
      payment.failureReason = `Sai lệch số tiền thanh toán (Amount Tampering): Nhận ${dto.amount} nhưng yêu cầu ${payment.amount}`;
      await payment.save();

      await this.orderModel
        .updateOne(
          { _id: payment.order },
          {
            $set: {
              refundStatus: RefundStatus.MANUAL_REQUIRED,
              refundReason: `Phát hiện sai lệch số tiền từ cổng thanh toán (${dto.amount} vs ${payment.amount})`,
            },
            $push: {
              timeline: {
                status: OrderStatus.PENDING,
                note: `[CẢNH BÁO BẢO MẬT] Sai lệch số tiền callback thanh toán (${dto.amount} vs ${payment.amount}). Cần đối soát thủ công.`,
                createdAt: new Date(),
              },
            },
          },
        )
        .exec();

      throw new BadRequestException(
        'Số tiền callback không khớp (Amount Tampering)',
      );
    }

    // Expiration check
    if (payment.expiresAt && payment.expiresAt < new Date()) {
      payment.status = PaymentStatus.FAILED;
      payment.failureReason = 'Callback đến sau khi phiên thanh toán hết hạn';
      await payment.save();
      this.logger.warn(
        `[CID: ${correlationId}] Callback đến sau khi phiên thanh toán ${payment._id.toString()} đã hết hạn`,
      );
      throw new BadRequestException('Phiên thanh toán đã hết hạn');
    }

    // BE-03: Strict Idempotency Replay
    if (payment.callbackProcessedAt || payment.status === PaymentStatus.PAID) {
      if (payment.transactionId === dto.transactionId) {
        this.logger.log(
          `[CID: ${correlationId}] Callback thanh toán lặp lại hợp lệ (Idempotent replay) cho giao dịch ${payment._id.toString()}`,
        );
        await this.syncOrderPaymentStatus(
          payment.order,
          payment.status,
          payment.paidAt,
        );
        return payment;
      }
      this.logger.warn(
        `[CID: ${correlationId}] Phát hiện callback xung đột hoặc trùng lặp không hợp lệ cho giao dịch ${payment._id.toString()}`,
      );
      throw new ConflictException(
        'Thanh toán đã nhận một callback khác trước đó',
      );
    }

    const result = await this.providers.get(dto.provider).verifyCallback(dto);
    if (
      !result.success &&
      result.failureReason?.toLowerCase().includes('chữ ký')
    ) {
      this.logger.error(
        `[CID: ${correlationId}] [CẢNH BÁO BẢO MẬT] Xác thực chữ ký số thất bại cho ${dto.provider} payment ${payment._id.toString()}`,
      );
    }

    // BE-02: Atomic Multi-Document Transaction with Standalone Fallback
    let session: ClientSession | null = null;
    let useTransaction = false;

    if (this.connection && typeof this.connection.startSession === 'function') {
      try {
        session = await this.connection.startSession();
        session.startTransaction();
        useTransaction = true;
      } catch (sessErr: any) {
        this.logger.debug?.(
          `Replica set transaction not available, falling back to atomic sequential execution: ${sessErr.message}`,
        );
        if (session) {
          try {
            await session.endSession();
          } catch {
            /* ignore */
          }
          session = null;
        }
        useTransaction = false;
      }
    }

    try {
      const updateFilter: Record<string, unknown> = {
        _id: payment._id,
        callbackProcessedAt: { $exists: false },
      };
      const updateDoc = {
        $set: {
          status: result.status,
          transactionId: dto.transactionId,
          callbackProcessedAt: new Date(),
          paidAt: result.success ? new Date() : undefined,
          failureReason: result.failureReason,
          gatewayResponse: dto.gatewayResponse || {},
        },
      };

      const updated = await this.paymentModel
        .findOneAndUpdate(
          updateFilter,
          updateDoc,
          useTransaction && session
            ? { returnDocument: 'after', session }
            : { returnDocument: 'after' },
        )
        .exec();

      if (!updated) {
        if (useTransaction && session) {
          await session.abortTransaction();
        }
        const processed = await this.paymentModel.findById(payment._id).exec();
        if (processed?.transactionId === dto.transactionId) {
          await this.syncOrderPaymentStatus(
            processed.order,
            processed.status,
            processed.paidAt,
          );
          return processed;
        }
        throw new ConflictException('Callback thanh toán trùng lặp');
      }

      await this.syncOrderPaymentStatus(
        payment.order,
        result.status,
        updated.paidAt,
        useTransaction && session ? session : undefined,
      );

      if (useTransaction && session) {
        await session.commitTransaction();
      }

      this.logger.log(
        `[CID: ${correlationId}] Xử lý callback ${dto.provider} thành công: Order ${payment.order.toString()}, Status: ${result.status}`,
      );
      return updated;
    } catch (error) {
      if (useTransaction && session) {
        try {
          await session.abortTransaction();
        } catch {
          /* ignore abort error */
        }
      }
      throw error;
    } finally {
      if (session) {
        try {
          await session.endSession();
        } catch {
          /* ignore end error */
        }
      }
    }
  }

  async handleVnPayIpn(query: Record<string, unknown>) {
    const raw = Object.fromEntries(
      Object.entries(query).map(([key, value]) => [
        key,
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean'
          ? String(value)
          : '',
      ]),
    );
    try {
      await this.handleCallback({
        provider: PaymentMethod.VNPAY,
        providerReference: raw.vnp_TxnRef,
        transactionId: raw.vnp_TransactionNo || raw.vnp_TxnRef,
        amount: Number(raw.vnp_Amount) / 100,
        status: raw.vnp_TransactionStatus,
        signature: raw.vnp_SecureHash,
        gatewayResponse: raw,
      });
      return { RspCode: '00', Message: 'Confirm Success' };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (/không tìm thấy/i.test(message)) {
        return { RspCode: '01', Message: 'Order not found' };
      }
      if (/Số tiền/i.test(message)) {
        return { RspCode: '04', Message: 'Invalid amount' };
      }
      return { RspCode: '97', Message: 'Invalid signature' };
    }
  }

  async handleMomoIpn(body: Record<string, unknown>) {
    const raw = { ...body } as Record<string, any>;
    return this.handleCallback({
      provider: PaymentMethod.MOMO,
      providerReference: String(raw.orderId || ''),
      transactionId: String(raw.transId || raw.requestId || ''),
      amount: Number(raw.amount),
      status: String(raw.resultCode),
      signature: String(raw.signature || ''),
      gatewayResponse: raw,
    });
  }

  async findAll(query: PaymentQueryDto): Promise<PaymentDocument[]> {
    const filter: {
      order?: Types.ObjectId;
      status?: PaymentStatus;
      provider?: PaymentMethod;
    } = {};
    if (query.orderId) filter.order = new Types.ObjectId(query.orderId);
    if (query.status) filter.status = query.status;
    if (query.provider) filter.provider = query.provider;
    return this.paymentModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  /**
   * BE-02: Auto-reconciliation of pending online payments.
   * Runs every 15 minutes to mark expired or stranded online payments as FAILED.
   */
  @Cron('*/15 * * * *')
  async reconcilePendingPayments(): Promise<number> {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    try {
      const expiredPending = await this.paymentModel
        .find({
          status: PaymentStatus.PENDING,
          provider: { $in: [PaymentMethod.VNPAY, PaymentMethod.MOMO] },
          $or: [
            { expiresAt: { $lt: new Date() } },
            {
              expiresAt: { $exists: false },
              createdAt: { $lt: fifteenMinutesAgo },
            },
          ],
        })
        .exec();

      if (!expiredPending || expiredPending.length === 0) {
        return 0;
      }

      let count = 0;
      for (const p of expiredPending) {
        p.status = PaymentStatus.FAILED;
        p.failureReason =
          'Phiên thanh toán hết hạn chờ phản hồi từ cổng thanh toán (Auto-reconciled)';
        await p.save();
        count++;
      }

      this.logger.log(
        `[Reconcile] Đã tự động đánh dấu thất bại ${count} giao dịch trực tuyến quá hạn.`,
      );
      return count;
    } catch (error: any) {
      this.logger.error(
        'Lỗi khi thực hiện đối soát giao dịch thanh toán quá hạn:',
        error,
      );
      return 0;
    }
  }
}
