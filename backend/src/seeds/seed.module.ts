import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SeedService } from './seed.service';
import { User, UserSchema } from '../modules/users/schemas/user.schema';
import {
  Category,
  CategorySchema,
} from '../modules/categories/schemas/category.schema';
import {
  Product,
  ProductSchema,
} from '../modules/products/schemas/product.schema';
import {
  Promotion,
  PromotionSchema,
} from '../modules/promotions/schemas/promotion.schema';
import {
  Inventory,
  InventorySchema,
  InventoryTransaction,
  InventoryTransactionSchema,
} from '../modules/inventory/schemas/inventory.schema';
import { Order, OrderSchema } from '../modules/orders/schemas/order.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Category.name, schema: CategorySchema },
      { name: Product.name, schema: ProductSchema },
      { name: Promotion.name, schema: PromotionSchema },
      { name: Inventory.name, schema: InventorySchema },
      { name: InventoryTransaction.name, schema: InventoryTransactionSchema },
      { name: Order.name, schema: OrderSchema },
    ]),
  ],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
