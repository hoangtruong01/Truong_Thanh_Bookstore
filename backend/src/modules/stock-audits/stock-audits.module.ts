import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StockAudit, StockAuditSchema } from './schemas/stock-audit.schema';
import { StockAuditsService } from './stock-audits.service';
import { StockAuditsController } from './stock-audits.controller';
import { ProductsModule } from '../products/products.module';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StockAudit.name, schema: StockAuditSchema },
    ]),
    ProductsModule,
    InventoryModule,
  ],
  controllers: [StockAuditsController],
  providers: [StockAuditsService],
  exports: [StockAuditsService, MongooseModule],
})
export class StockAuditsModule {}
