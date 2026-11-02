import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Warehouse, WarehouseSchema } from './schemas/warehouse.schema';
import {
  WarehouseStock,
  WarehouseStockSchema,
} from './schemas/warehouse-stock.schema';
import {
  StockTransfer,
  StockTransferSchema,
} from './schemas/stock-transfer.schema';
import {
  InventoryTransaction,
  InventoryTransactionSchema,
} from '../inventory/schemas/inventory.schema';
import { Product, ProductSchema } from '../products/schemas/product.schema';
import { WarehousesService } from './warehouses.service';
import { WarehousesController } from './warehouses.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Warehouse.name, schema: WarehouseSchema },
      { name: WarehouseStock.name, schema: WarehouseStockSchema },
      { name: StockTransfer.name, schema: StockTransferSchema },
      { name: InventoryTransaction.name, schema: InventoryTransactionSchema },
      { name: Product.name, schema: ProductSchema },
    ]),
  ],
  controllers: [WarehousesController],
  providers: [WarehousesService],
  exports: [WarehousesService],
})
export class WarehousesModule {}
