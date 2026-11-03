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
import {
  CodReconciliationBatch,
  CodReconciliationBatchSchema,
} from './schemas/cod-reconciliation-batch.schema';
import { Order, OrderSchema } from '../orders/schemas/order.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { FinanceService } from './finance.service';
import { CustomerCreditService } from './services/customer-credit.service';
import { CodReconciliationService } from './services/cod-reconciliation.service';
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
      {
        name: CodReconciliationBatch.name,
        schema: CodReconciliationBatchSchema,
      },
      { name: Order.name, schema: OrderSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [FinanceController],
  providers: [FinanceService, CustomerCreditService, CodReconciliationService],
  exports: [
    FinanceService,
    CustomerCreditService,
    CodReconciliationService,
    MongooseModule,
  ],
})
export class FinanceModule {}
