import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PricePolicy, PricePolicySchema } from './schemas/price-policy.schema';
import { Product, ProductSchema } from '../products/schemas/product.schema';
import {
  Inventory,
  InventorySchema,
} from '../inventory/schemas/inventory.schema';
import { PricingService } from './pricing.service';
import { PricingController } from './pricing.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PricePolicy.name, schema: PricePolicySchema },
      { name: Product.name, schema: ProductSchema },
      { name: Inventory.name, schema: InventorySchema },
    ]),
  ],
  controllers: [PricingController],
  providers: [PricingService],
  exports: [PricingService, MongooseModule],
})
export class PricingModule {}
