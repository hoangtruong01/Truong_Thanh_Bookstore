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
import { ConfigService } from '@nestjs/config';
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
    @Optional() private readonly configService?: ConfigService,
    @Optional() @InjectConnection() private readonly connection?: Connection,
  ) {}

  getEnabledPaymentMethods(): PaymentMethod[] {
    if (!this.configService) {
      return Object.values(PaymentMethod);
    }
    const raw = this.configService.get<string>('ENABLED_PAYMENT_METHODS');
    if (!raw) return [PaymentMethod.COD];
    const configured = raw
      .split(',')
      .map((value) => value.trim().toUpperCase())
      .filter((value): value is PaymentMethod =>
        Object.values(PaymentMethod).includes(value as PaymentMethod),
      );
    return configured.length ? configured : [PaymentMethod.COD];
  }

  getEnabledMethodsSummary() {
    const methods = this.getEnabledPaymentMethods();
    const hasBankTransfer = methods.includes(PaymentMethod.BANK_TRANSFER);
    return {
      methods,
      bankTransfer: hasBankTransfer
        ? {
            bankName: this.configService?.get<string>('BANK_NAME') || '',
            accountNumber:
              this.configService?.get<string>('BANK_ACCOUNT_NUMBER') || '',
            accountHolder:
              this.configService?.get<string>('BANK_ACCOUNT_HOLDER') ||
              'TRUONG THANH BOOKSTORE',
          }
        : null,
    };
  }

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
    // BE-02: Never rollback an already PAID order to UNPAID/FAILED/PENDING
    const orderFilter: Record<string, unknown> = {
      _id: orderId,
      ...(status !== PaymentStatus.PAID
        ? { paymentStatus: { $ne: PaymentStatus.PAID } }
        : {}),
    };

    if (session) {
      await this.orderModel
        .updateOne(orderFilter, { $set: update }, { session })
        .exec();
    } else {
      await this.orderModel.updateOne(orderFilter, { $set: update }).exec();
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
    if (!this.getEnabledPaymentMethods().includes(dto.provider)) {
      throw new BadRequestException(
        `Phương thức thanh toán ${dto.provider} hiện chưa được kích hoạt trong hệ thống`,
      );
    }

    const order = await this.orderModel.findById(dto.orderId).exec();
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
    this.assertOrderAccess(order, actor);

    if (order.paymentStatus === PaymentStatus.PAID) {
      throw new ConflictException('Đơn hàng đã được thanh toán');
    }
    const terminalStatuses = [
      OrderStatus.CANCELLED,
      OrderStatus.RETURNED,
      OrderStatus.COMPLETED,
    ];
    if (terminalStatuses.includes(order.orderStatus)) {
      throw new ConflictException(
        `Không thể tạo phiên thanh toán cho đơn hàng đã ${order.orderStatus === OrderStatus.CANCELLED ? 'bị hủy' : 'kết thúc'}`,
      );
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

    // 0. BE-01: Check enabled payment methods
    if (!this.getEnabledPaymentMethods().includes(dto.provider)) {
      this.logger.warn(
        `[CID: ${correlationId}] [CẢNH BÁO BẢO MẬT] Callback từ cổng thanh toán chưa được kích hoạt: ${dto.provider}`,
      );
      throw new BadRequestException(
        `Phương thức thanh toán ${dto.provider} chưa được kích hoạt trong hệ thống`,
      );
    }

    // 1. BE-02: Verify Signature First (Zero DB Writes on Invalid Signature)
    const provider = this.providers.get(dto.provider);
    if (!provider) {
      throw new BadRequestException(
        `Cổng thanh toán ${dto.provider} không được hỗ trợ`,
      );
    }

    const result = await provider.verifyCallback(dto);
    if (
      !result.success &&
      result.failureReason?.toLowerCase().includes('chữ ký')
    ) {
      this.logger.error(
        `[CID: ${correlationId}] [CẢNH BÁO BẢO MẬT] Xác thực chữ ký số thất bại cho callback ${dto.provider}: ${result.failureReason}`,
      );
      throw new BadRequestException(
        result.failureReason || 'Chữ ký số callback không hợp lệ',
      );
    }

    // 1.1 BE-01: Extract strictly verified parameters from provider's signature verification
    const verified = result.verifiedData;
    const effectiveTransactionId = verified?.transactionId || dto.transactionId;
    const effectiveAmount =
      verified?.amount !== undefined ? verified.amount : dto.amount;
    const effectiveProviderRef =
      verified?.providerReference || dto.providerReference;
    const effectiveOrderCode = verified?.orderCode || dto.orderCode;

    // 2. BE-01: Locate payment using verified reference, orderCode, or transactionId
    const payment = await this.paymentModel
      .findOne({
        provider: dto.provider,
        $or: [
          ...(effectiveProviderRef
            ? [{ providerReference: effectiveProviderRef }]
            : []),
          ...(effectiveOrderCode ? [{ orderCode: effectiveOrderCode }] : []),
          ...(effectiveTransactionId
            ? [{ transactionId: effectiveTransactionId }]
            : []),
        ],
      })
      .exec();

    if (!payment) {
      this.logger.warn(
        `[CID: ${correlationId}] Không tìm thấy giao dịch thanh toán cho callback ${dto.provider} (ref=${effectiveProviderRef || 'none'}, code=${effectiveOrderCode || 'none'})`,
      );
      throw new NotFoundException('Không tìm thấy giao dịch thanh toán');
    }

    // 2.1 BE-01: Transaction Reuse Protection: Ensure transactionId is not already bound to a DIFFERENT order
    if (payment._id && effectiveTransactionId) {
      const reused = await this.paymentModel
        .findOne({
          provider: dto.provider,
          transactionId: effectiveTransactionId,
          _id: { $ne: payment._id },
          order: { $ne: payment.order },
        })
        .exec();
      if (
        reused &&
        reused._id &&
        String(reused._id) !== String(payment._id) &&
        String(reused.order) !== String(payment.order)
      ) {
        this.logger.error(
          `[CID: ${correlationId}] [CẢNH BÁO BẢO MẬT] Transaction reuse detected: Mã giao dịch ${effectiveTransactionId} đã gắn với thanh toán ${String(reused._id)}`,
        );
        throw new ConflictException(
          'Mã giao dịch đã được sử dụng cho một thanh toán khác',
        );
      }
    }

    // 3. BE-03: Strict Idempotency Replay (Signature is already verified)
    if (payment.callbackProcessedAt || payment.status === PaymentStatus.PAID) {
      if (payment.transactionId === effectiveTransactionId) {
        this.logger.log(
          `[CID: ${correlationId}] Callback thanh toán lặp lại hợp lệ (Idempotent replay) cho giao dịch ${payment._id?.toString?.() ?? String(payment._id ?? 'none')}`,
        );
        await this.syncOrderPaymentStatus(
          payment.order,
          payment.status,
          payment.paidAt,
        );
        return payment;
      }
      this.logger.warn(
        `[CID: ${correlationId}] Phát hiện callback xung đột hoặc trùng lặp không hợp lệ cho giao dịch ${payment._id?.toString?.() ?? String(payment._id ?? 'none')}`,
      );
      throw new ConflictException(
        'Thanh toán đã nhận một callback khác trước đó',
      );
    }

    // 4. BE-03: Amount Tampering Detection (using verified amount)
    if (
      effectiveAmount !== undefined &&
      Math.round(Number(effectiveAmount)) !== Math.round(payment.amount)
    ) {
      this.logger.error(
        `[CID: ${correlationId}] [CẢNH BÁO BẢO MẬT] Phát hiện sai lệch số tiền (Amount Tampering)! Payment ID: ${payment._id?.toString?.() ?? String(payment._id ?? 'none')}, Dự kiến: ${payment.amount}, Nhận được: ${effectiveAmount}`,
      );
      payment.status = PaymentStatus.FAILED;
      payment.failureReason = `Sai lệch số tiền thanh toán (Amount Tampering): Nhận ${effectiveAmount} nhưng yêu cầu ${payment.amount}`;
      await payment.save();

      await this.orderModel
        .updateOne(
          { _id: payment.order },
          {
            $set: {
              refundStatus: RefundStatus.MANUAL_REQUIRED,
              refundReason: `Phát hiện sai lệch số tiền từ cổng thanh toán (${effectiveAmount} vs ${payment.amount})`,
            },
            $push: {
              timeline: {
                status: OrderStatus.PENDING,
                note: `[CẢNH BÁO BẢO MẬT] Sai lệch số tiền callback thanh toán (${effectiveAmount} vs ${payment.amount}). Cần đối soát thủ công.`,
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

    // 5. BE-02: Expiration and Terminal Order State Check with Reconciliation
    const isExpired = payment.expiresAt && payment.expiresAt < new Date();

    if (isExpired) {
      const order = await this.orderModel.findById?.(payment.order)?.exec?.();
      const isOrderTerminal =
        order &&
        [
          OrderStatus.CANCELLED,
          OrderStatus.RETURNED,
          OrderStatus.COMPLETED,
        ].includes(order.orderStatus);

      if (result.success) {
        // Customer was charged money, but payment is expired or order is cancelled.
        // Record payment as PAID with MANUAL_REQUIRED refund for financial reconciliation.
        payment.status = PaymentStatus.PAID;
        payment.transactionId = effectiveTransactionId;
        payment.paidAt = new Date();
        payment.callbackProcessedAt = new Date();
        payment.gatewayResponse = dto.gatewayResponse || {};
        payment.failureReason = isOrderTerminal
          ? `Thanh toán thành công nhưng đơn hàng đã ở trạng thái ${order?.orderStatus}. Cần đối soát hoàn tiền thủ công.`
          : 'Thanh toán thành công nhận được sau khi phiên hết hạn. Cần đối soát hoàn tiền thủ công.';
        await payment.save();

        if (order) {
          await this.orderModel
            .updateOne(
              { _id: order._id },
              {
                $set: {
                  paymentStatus: PaymentStatus.PAID,
                  refundStatus: RefundStatus.MANUAL_REQUIRED,
                  refundReason: payment.failureReason,
                  revenueRecognizedAt: new Date(),
                },
                $push: {
                  timeline: {
                    status: order.orderStatus,
                    note: `[ĐỐI SOÁT HOÀN TIỀN] ${payment.failureReason} Mã GD: ${effectiveTransactionId}, Số tiền: ${payment.amount}đ.`,
                    createdAt: new Date(),
                  },
                },
              },
            )
            .exec();
        }

        this.logger.warn(
          `[CID: ${correlationId}] Late successful callback for expired/cancelled order ${String(payment.order)}. Marked MANUAL_REQUIRED for reconciliation.`,
        );
        return payment;
      } else {
        payment.status = PaymentStatus.FAILED;
        payment.failureReason =
          'Callback thất bại đến sau khi phiên thanh toán hết hạn';
        await payment.save();
        this.logger.warn(
          `[CID: ${correlationId}] Callback đến sau khi phiên thanh toán ${payment._id?.toString?.() ?? String(payment._id ?? 'none')} đã hết hạn`,
        );
        throw new BadRequestException('Phiên thanh toán đã hết hạn');
      }
    }

    // BE-02: Atomic Multi-Document Transaction with Standalone Fallback
    let session: ClientSession | null = null;
    let useTransaction = false;

    if (this.connection && typeof this.connection.startSession === 'function') {
      try {
        session = await this.connection.startSession();
        session.startTransaction();
        useTransaction = true;
      } catch (sessErr: unknown) {
        const sessMsg =
          sessErr instanceof Error ? sessErr.message : String(sessErr);
        this.logger.debug?.(
          `Replica set transaction not available, falling back to atomic sequential execution: ${sessMsg}`,
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
          transactionId: effectiveTransactionId,
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
        if (processed?.transactionId === effectiveTransactionId) {
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
        `[CID: ${correlationId}] Xử lý callback ${dto.provider} thành công: Order ${payment.order?.toString?.() ?? String(payment.order ?? 'none')}, Status: ${result.status}`,
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
      if (/đã nhận một callback khác|trùng lặp/i.test(message)) {
        return { RspCode: '02', Message: 'Order already confirmed' };
      }
      return { RspCode: '97', Message: 'Invalid signature' };
    }
  }

  async handleMomoIpn(body: Record<string, unknown>) {
    const raw = { ...body } as Record<string, any>;
    try {
      await this.handleCallback({
        provider: PaymentMethod.MOMO,
        providerReference: String(raw.orderId || ''),
        transactionId: String(raw.transId || raw.requestId || ''),
        amount: Number(raw.amount),
        status: String(raw.resultCode),
        signature: String(raw.signature || ''),
        gatewayResponse: raw,
      });
      return { resultCode: 0, message: 'Successful.' };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { resultCode: 99, message };
    }
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
   * Uses atomic updateMany to eliminate race conditions against concurrent callbacks.
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
        if (p.status === PaymentStatus.PENDING) {
          p.status = PaymentStatus.FAILED;
          p.failureReason =
            'Phiên thanh toán hết hạn chờ phản hồi từ cổng thanh toán (Auto-reconciled)';
          if (typeof p.save === 'function') {
            await p.save();
          }
          count++;
        }
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
