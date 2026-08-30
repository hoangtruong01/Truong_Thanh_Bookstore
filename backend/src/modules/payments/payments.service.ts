import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Payment, PaymentDocument } from './schemas/payment.schema';
import { CreatePaymentDto, PaymentCallbackDto, PaymentQueryDto } from './dto/payment.dto';
import {
  PaymentStatus,
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
  ) {}

  private normalizeActor(actor?: string | PaymentActor): PaymentActor | undefined {
    return typeof actor === 'string' ? { _id: actor } : actor;
  }

  private canManage(actor?: PaymentActor): boolean {
    return !!actor && (
      actor.role === UserRole.SUPER_ADMIN ||
      actor.role === UserRole.ADMIN ||
      (actor.role === UserRole.STAFF &&
        !!actor.permissions?.includes(StaffPermission.MANAGE_ORDERS))
    );
  }

  private assertOrderAccess(order: OrderDocument, actor?: PaymentActor): void {
    if (this.canManage(actor)) return;
    const customerId = order.customer
      ? ((order.customer as any)._id || order.customer).toString()
      : undefined;
    if (!actor || !customerId || customerId !== actor._id.toString()) {
      throw new ForbiddenException('Bạn không có quyền truy cập thanh toán của đơn hàng này');
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
      throw new BadRequestException('Số tiền thanh toán không khớp với đơn hàng');
    }
    if (dto.provider !== order.paymentMethod) {
      throw new BadRequestException('Phương thức thanh toán không khớp với đơn hàng');
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
    this.logger.log(`Payment callback ${dto.provider}: ${dto.transactionId}`);
    const payment = await this.paymentModel.findOne({
      provider: dto.provider,
      $or: [
        ...(dto.providerReference ? [{ providerReference: dto.providerReference }] : []),
        ...(dto.orderCode ? [{ orderCode: dto.orderCode }] : []),
        { transactionId: dto.transactionId },
      ],
    }).exec();
    if (!payment) throw new NotFoundException('Không tìm thấy giao dịch thanh toán');

    if (dto.amount !== undefined && dto.amount !== payment.amount) {
      throw new BadRequestException('Số tiền callback không khớp');
    }
    if (payment.expiresAt && payment.expiresAt < new Date()) {
      payment.status = PaymentStatus.FAILED;
      payment.failureReason = 'Callback đến sau khi phiên thanh toán hết hạn';
      await payment.save();
      throw new BadRequestException('Phiên thanh toán đã hết hạn');
    }
    if (payment.callbackProcessedAt || payment.status === PaymentStatus.PAID) {
      if (payment.transactionId === dto.transactionId) return payment;
      throw new ConflictException('Thanh toán đã nhận một callback khác trước đó');
    }

    const result = await this.providers.get(dto.provider).verifyCallback(dto);
    const updated = await this.paymentModel.findOneAndUpdate(
      { _id: payment._id, callbackProcessedAt: { $exists: false } },
      {
        $set: {
          status: result.status,
          transactionId: dto.transactionId,
          callbackProcessedAt: new Date(),
          paidAt: result.success ? new Date() : undefined,
          failureReason: result.failureReason,
          gatewayResponse: dto.gatewayResponse || {},
        },
      },
      { returnDocument: 'after' },
    ).exec();
    if (!updated) {
      const processed = await this.paymentModel.findById(payment._id).exec();
      if (processed?.transactionId === dto.transactionId) return processed;
      throw new ConflictException('Callback thanh toán trùng lặp');
    }

    await this.orderModel.updateOne(
      { _id: payment.order },
      { $set: { paymentStatus: result.status } },
    ).exec();
    return updated;
  }

  async findAll(query: PaymentQueryDto): Promise<PaymentDocument[]> {
    const filter: any = {};
    if (query.orderId) filter.order = new Types.ObjectId(query.orderId);
    if (query.status) filter.status = query.status;
    if (query.provider) filter.provider = query.provider;
    return this.paymentModel.find(filter).sort({ createdAt: -1 }).exec();
  }
}
