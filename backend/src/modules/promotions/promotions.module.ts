import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Promotion,
  PromotionSchema,
  PromotionUsage,
  PromotionUsageSchema,
} from './schemas/promotion.schema';
import { PromotionsService } from './promotions.service';
import { PromotionsController } from './promotions.controller';
import { OrdersModule } from '../orders/orders.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Promotion.name, schema: PromotionSchema },
      { name: PromotionUsage.name, schema: PromotionUsageSchema },
    ]),
    forwardRef(() => OrdersModule),
    NotificationsModule,
  ],
  controllers: [PromotionsController],
  providers: [PromotionsService],
  exports: [PromotionsService],
})
export class PromotionsModule {}
