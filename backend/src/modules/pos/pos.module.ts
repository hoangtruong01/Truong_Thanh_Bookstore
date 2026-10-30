import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PosController } from './pos.controller';
import { PosService } from './pos.service';
import { POSOrder, POSOrderSchema } from './schemas/pos-order.schema';
import { Product, ProductSchema } from '../products/schemas/product.schema';
import {
  Inventory,
  InventorySchema,
  InventoryTransaction,
  InventoryTransactionSchema,
} from '../inventory/schemas/inventory.schema';
import { ProductsModule } from '../products/products.module';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: POSOrder.name, schema: POSOrderSchema },
      { name: Product.name, schema: ProductSchema },
      { name: Inventory.name, schema: InventorySchema },
      { name: InventoryTransaction.name, schema: InventoryTransactionSchema },
    ]),
    ProductsModule,
    InventoryModule,
  ],
  controllers: [PosController],
  providers: [PosService],
  exports: [PosService],
})
export class PosModule {}
