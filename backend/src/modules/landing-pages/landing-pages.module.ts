import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LandingPage, LandingPageSchema } from './schemas/landing-page.schema';
import { LandingPageService } from './landing-page.service';
import { LandingPageController } from './landing-page.controller';
import { Order, OrderSchema } from '../orders/schemas/order.schema';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LandingPage.name, schema: LandingPageSchema },
      { name: Order.name, schema: OrderSchema },
    ]),
    OrdersModule,
  ],
  controllers: [LandingPageController],
  providers: [LandingPageService],
  exports: [LandingPageService],
})
export class LandingPagesModule {}
