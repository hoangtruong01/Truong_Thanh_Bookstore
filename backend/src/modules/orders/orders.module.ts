import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from './schemas/order.schema';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { OrderScheduleService } from './order-schedule.service';
import { ProductsModule } from '../products/products.module';
import { PromotionsModule } from '../promotions/promotions.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';
import { CartModule } from '../cart/cart.module';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
    ProductsModule,
    PromotionsModule,
    NotificationsModule,
    UsersModule,
    CartModule,
    InventoryModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService, OrderScheduleService],
  exports: [OrdersService, OrderScheduleService, MongooseModule],
})
export class OrdersModule {}
