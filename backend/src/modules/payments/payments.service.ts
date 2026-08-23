import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Payment, PaymentDocument } from './schemas/payment.schema';
import { CreatePaymentDto, PaymentCallbackDto, PaymentQueryDto } from './dto/payment.dto';
import { PaymentMethod, PaymentStatus } from '../../common/enums';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
  ) {}

  async createPayment(dto: CreatePaymentDto, userId?: string): Promise<PaymentDocument> {
    const payment = new this.paymentModel({
      order: new Types.ObjectId(dto.orderId),
      orderCode: dto.orderCode,
      amount: dto.amount,
      provider: dto.provider,
      status: PaymentStatus.PENDING,
      user: userId ? new Types.ObjectId(userId) : undefined,
    });

    return payment.save();
  }

  async findByOrderId(orderId: string): Promise<PaymentDocument | null> {
    return this.paymentModel
      .findOne({ order: new Types.ObjectId(orderId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async handleCallback(dto: PaymentCallbackDto): Promise<PaymentDocument> {
    this.logger.log(`Handling payment callback for transaction: ${dto.transactionId}`);
    const payment = await this.paymentModel.findOne({ transactionId: dto.transactionId }).exec();
    if (!payment) {
      throw new NotFoundException('Không tìm thấy giao dịch thanh toán');
    }

    payment.status = PaymentStatus.PAID;
    payment.paidAt = new Date();
    if (dto.gatewayResponse) {
      payment.gatewayResponse = dto.gatewayResponse;
    }

    return payment.save();
  }

  async findAll(query: PaymentQueryDto): Promise<PaymentDocument[]> {
    const filter: any = {};
    if (query.orderId) {
      filter.order = new Types.ObjectId(query.orderId);
    }
    if (query.status) {
      filter.status = query.status;
    }
    if (query.provider) {
      filter.provider = query.provider;
    }
    return this.paymentModel.find(filter).sort({ createdAt: -1 }).exec();
  }
}
