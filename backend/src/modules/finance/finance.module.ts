import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CashAccount, CashAccountSchema } from './schemas/cash-account.schema';
import { CashEntry, CashEntrySchema } from './schemas/cash-entry.schema';
import {
  SupplierPayable,
  SupplierPayableSchema,
} from './schemas/supplier-payable.schema';
import { FinanceService } from './finance.service';
import { FinanceController } from './finance.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CashAccount.name, schema: CashAccountSchema },
      { name: CashEntry.name, schema: CashEntrySchema },
      { name: SupplierPayable.name, schema: SupplierPayableSchema },
    ]),
  ],
  controllers: [FinanceController],
  providers: [FinanceService],
  exports: [FinanceService, MongooseModule],
})
export class FinanceModule {}
