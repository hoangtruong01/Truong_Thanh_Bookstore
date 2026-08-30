import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Payment, PaymentSchema } from './schemas/payment.schema';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { Order, OrderSchema } from '../orders/schemas/order.schema';
import {
  BankTransferPaymentProvider,
  CodPaymentProvider,
  MomoPaymentProvider,
  PaymentProviderRegistry,
  VnPayPaymentProvider,
} from './providers/payment.providers';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Payment.name, schema: PaymentSchema },
      { name: Order.name, schema: OrderSchema },
    ]),
  ],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    PaymentProviderRegistry,
    CodPaymentProvider,
    BankTransferPaymentProvider,
    VnPayPaymentProvider,
    MomoPaymentProvider,
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
