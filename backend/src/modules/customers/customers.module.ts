import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CustomersService } from './customers.service';
import { CustomersController } from './customers.controller';
import { UsersModule } from '../users/users.module';
import { OrdersModule } from '../orders/orders.module';
import {
  CustomerCRMProfile,
  CustomerCRMProfileSchema,
} from './schemas/customer-crm-profile.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CustomerCRMProfile.name, schema: CustomerCRMProfileSchema },
    ]),
    UsersModule,
    OrdersModule,
  ],
  controllers: [CustomersController],
  providers: [CustomersService],
  exports: [CustomersService],
})
export class CustomersModule {}
