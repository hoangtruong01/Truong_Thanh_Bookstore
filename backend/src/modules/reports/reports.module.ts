import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { OrdersModule } from '../orders/orders.module';
import { ProductsModule } from '../products/products.module';
import { InventoryModule } from '../inventory/inventory.module';
import { CustomersModule } from '../customers/customers.module';

@Module({
  imports: [OrdersModule, ProductsModule, InventoryModule, CustomersModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
