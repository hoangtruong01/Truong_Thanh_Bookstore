import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CashAccount, CashAccountSchema } from './schemas/cash-account.schema';
import { CashEntry, CashEntrySchema } from './schemas/cash-entry.schema';
import {
  SupplierPayable,
  SupplierPayableSchema,
} from './schemas/supplier-payable.schema';
import {
  CustomerReceivable,
  CustomerReceivableSchema,
} from './schemas/customer-receivable.schema';
import {
  CustomerCreditProfile,
  CustomerCreditProfileSchema,
} from './schemas/customer-credit-profile.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { FinanceService } from './finance.service';
import { CustomerCreditService } from './services/customer-credit.service';
import { FinanceController } from './finance.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CashAccount.name, schema: CashAccountSchema },
      { name: CashEntry.name, schema: CashEntrySchema },
      { name: SupplierPayable.name, schema: SupplierPayableSchema },
      { name: CustomerReceivable.name, schema: CustomerReceivableSchema },
      {
        name: CustomerCreditProfile.name,
        schema: CustomerCreditProfileSchema,
      },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [FinanceController],
  providers: [FinanceService, CustomerCreditService],
  exports: [FinanceService, CustomerCreditService, MongooseModule],
})
export class FinanceModule {}
