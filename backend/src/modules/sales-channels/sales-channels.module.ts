import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ChannelAccount,
  ChannelAccountSchema,
} from './schemas/channel-account.schema';
import {
  ChannelSkuMapping,
  ChannelSkuMappingSchema,
} from './schemas/channel-sku-mapping.schema';
import {
  ChannelWebhookInbox,
  ChannelWebhookInboxSchema,
} from './schemas/channel-webhook-inbox.schema';
import {
  ChannelException,
  ChannelExceptionSchema,
} from './schemas/channel-exception.schema';
import {
  ChannelSettlement,
  ChannelSettlementSchema,
} from './schemas/channel-settlement.schema';
import { SalesChannelsService } from './sales-channels.service';
import { SalesChannelsController } from './sales-channels.controller';
import { ProductsModule } from '../products/products.module';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ChannelAccount.name, schema: ChannelAccountSchema },
      { name: ChannelSkuMapping.name, schema: ChannelSkuMappingSchema },
      { name: ChannelWebhookInbox.name, schema: ChannelWebhookInboxSchema },
      { name: ChannelException.name, schema: ChannelExceptionSchema },
      { name: ChannelSettlement.name, schema: ChannelSettlementSchema },
    ]),
    ProductsModule,
    OrdersModule,
  ],
  controllers: [SalesChannelsController],
  providers: [SalesChannelsService],
  exports: [SalesChannelsService],
})
export class SalesChannelsModule {}
