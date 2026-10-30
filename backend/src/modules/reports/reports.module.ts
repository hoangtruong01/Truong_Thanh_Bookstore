import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { OrdersModule } from '../orders/orders.module';
import { ProductsModule } from '../products/products.module';
import { InventoryModule } from '../inventory/inventory.module';
import { CustomersModule } from '../customers/customers.module';
import { POSOrder, POSOrderSchema } from '../pos/schemas/pos-order.schema';
import {
  Inventory,
  InventorySchema,
  InventoryTransaction,
  InventoryTransactionSchema,
} from '../inventory/schemas/inventory.schema';
import { Product, ProductSchema } from '../products/schemas/product.schema';
import {
  PurchaseOrder,
  PurchaseOrderSchema,
} from '../purchasing/schemas/purchase-order.schema';
import { Supplier, SupplierSchema } from '../suppliers/schemas/supplier.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: POSOrder.name, schema: POSOrderSchema },
      { name: Inventory.name, schema: InventorySchema },
      { name: InventoryTransaction.name, schema: InventoryTransactionSchema },
      { name: Product.name, schema: ProductSchema },
      { name: PurchaseOrder.name, schema: PurchaseOrderSchema },
      { name: Supplier.name, schema: SupplierSchema },
    ]),
    OrdersModule,
    ProductsModule,
    InventoryModule,
    CustomersModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
