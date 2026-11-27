import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  RemarketingLog,
  RemarketingLogSchema,
} from './schemas/remarketing-log.schema';
import { Product, ProductSchema } from '../../products/schemas/product.schema';
import { User, UserSchema } from '../../users/schemas/user.schema';
import { Cart, CartSchema } from '../../cart/schemas/cart.schema';
import { NotificationsModule } from '../../notifications/notifications.module';
import { OutboxModule } from '../../outbox/outbox.module';
import { RemarketingService } from './remarketing.service';
import { RemarketingController } from './remarketing.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RemarketingLog.name, schema: RemarketingLogSchema },
      { name: Product.name, schema: ProductSchema },
      { name: User.name, schema: UserSchema },
      { name: Cart.name, schema: CartSchema },
    ]),
    NotificationsModule,
    OutboxModule,
  ],
  controllers: [RemarketingController],
  providers: [RemarketingService],
  exports: [RemarketingService],
})
export class RemarketingModule {}
