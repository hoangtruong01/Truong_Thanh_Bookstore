import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  AdsPerformance,
  AdsPerformanceSchema,
} from './schemas/ads-performance.schema';
import { AdsService } from './ads.service';
import { AdsController } from './ads.controller';
import { OrdersModule } from '../../orders/orders.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AdsPerformance.name, schema: AdsPerformanceSchema },
    ]),
    OrdersModule,
  ],
  controllers: [AdsController],
  providers: [AdsService],
  exports: [AdsService],
})
export class AdsModule {}
