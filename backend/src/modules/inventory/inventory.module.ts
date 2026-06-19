import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Inventory, InventorySchema,
  InventoryTransaction, InventoryTransactionSchema,
} from './schemas/inventory.schema';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Inventory.name, schema: InventorySchema },
      { name: InventoryTransaction.name, schema: InventoryTransactionSchema },
    ]),
    ProductsModule,
  ],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
