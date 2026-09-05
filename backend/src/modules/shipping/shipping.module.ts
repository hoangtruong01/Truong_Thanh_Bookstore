import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from '../orders/schemas/order.schema';
import { OrdersModule } from '../orders/orders.module';
import { GhnShippingService } from './ghn-shipping.service';
import { ShippingController } from './shipping.controller';

@Module({
  imports: [
    OrdersModule,
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
  ],
  controllers: [ShippingController],
  providers: [GhnShippingService],
  exports: [GhnShippingService],
})
export class ShippingModule {}
