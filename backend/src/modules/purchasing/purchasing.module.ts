import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  PurchaseOrder,
  PurchaseOrderSchema,
} from './schemas/purchase-order.schema';
import {
  GoodsReceipt,
  GoodsReceiptSchema,
} from './schemas/goods-receipt.schema';
import {
  PurchaseReturn,
  PurchaseReturnSchema,
} from './schemas/purchase-return.schema';
import { PurchaseOrdersService } from './purchase-orders.service';
import { PurchaseOrdersController } from './purchase-orders.controller';
import { GoodsReceiptsService } from './goods-receipts.service';
import { GoodsReceiptsController } from './goods-receipts.controller';
import { PurchaseReturnsService } from './purchase-returns.service';
import { PurchaseReturnsController } from './purchase-returns.controller';
import { SuppliersModule } from '../suppliers/suppliers.module';
import { ProductsModule } from '../products/products.module';
import { InventoryModule } from '../inventory/inventory.module';
import { FinanceModule } from '../finance/finance.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PurchaseOrder.name, schema: PurchaseOrderSchema },
      { name: GoodsReceipt.name, schema: GoodsReceiptSchema },
      { name: PurchaseReturn.name, schema: PurchaseReturnSchema },
    ]),
    SuppliersModule,
    ProductsModule,
    InventoryModule,
    FinanceModule,
  ],
  controllers: [
    PurchaseOrdersController,
    GoodsReceiptsController,
    PurchaseReturnsController,
  ],
  providers: [
    PurchaseOrdersService,
    GoodsReceiptsService,
    PurchaseReturnsService,
  ],
  exports: [
    PurchaseOrdersService,
    GoodsReceiptsService,
    PurchaseReturnsService,
    MongooseModule,
  ],
})
export class PurchasingModule {}
