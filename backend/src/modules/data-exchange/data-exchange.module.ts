import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from '../products/schemas/product.schema';
import {
  Category,
  CategorySchema,
} from '../categories/schemas/category.schema';
import { Supplier, SupplierSchema } from '../suppliers/schemas/supplier.schema';
import { DataExchangeService } from './data-exchange.service';
import { DataExchangeController } from './data-exchange.controller';
import { InventoryModule } from '../inventory/inventory.module';
import { ProductsModule } from '../products/products.module';
import { SuppliersModule } from '../suppliers/suppliers.module';
import { CategoriesModule } from '../categories/categories.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: Category.name, schema: CategorySchema },
      { name: Supplier.name, schema: SupplierSchema },
    ]),
    InventoryModule,
    ProductsModule,
    SuppliersModule,
    CategoriesModule,
  ],
  controllers: [DataExchangeController],
  providers: [DataExchangeService],
  exports: [DataExchangeService],
})
export class DataExchangeModule {}
