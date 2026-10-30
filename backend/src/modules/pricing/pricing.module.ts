import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PricePolicy, PricePolicySchema } from './schemas/price-policy.schema';
import { PricingService } from './pricing.service';
import { PricingController } from './pricing.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PricePolicy.name, schema: PricePolicySchema },
    ]),
  ],
  controllers: [PricingController],
  providers: [PricingService],
  exports: [PricingService, MongooseModule],
})
export class PricingModule {}
