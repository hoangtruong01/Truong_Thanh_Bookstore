import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, SchemaTypes } from 'mongoose';
import { ChannelProvider } from './channel-account.schema';

export type ChannelSkuMappingDocument = ChannelSkuMapping & Document;

export enum MappingSyncStatus {
  SYNCED = 'SYNCED',
  MISMATCH = 'MISMATCH',
  UNMAPPED = 'UNMAPPED',
  FAILED = 'FAILED',
}

@Schema({ timestamps: true })
export class ChannelSkuMapping {
  @Prop({
    type: String,
    enum: Object.values(ChannelProvider),
    default: ChannelProvider.TIKTOK_SHOP,
    required: true,
    index: true,
  })
  provider: ChannelProvider;

  @Prop({ required: true, trim: true, index: true })
  shopId: string;

  @Prop({ required: true, trim: true, index: true })
  externalSkuId: string; // SKU ID on TikTok Shop

  @Prop({ required: true, trim: true })
  externalProductId: string;

  @Prop({ required: true, trim: true })
  externalSkuName: string;

  @Prop({
    type: SchemaTypes.ObjectId,
    ref: 'Product',
    required: true,
    index: true,
  })
  productId: Types.ObjectId;

  @Prop({ required: true, trim: true, index: true })
  sku: string; // Internal SKU

  @Prop({ type: Number, default: 1, min: 1 })
  packMultiplier: number; // e.g. 1 box = 20 pens, packMultiplier = 20

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Warehouse' })
  allocatedWarehouseId?: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(MappingSyncStatus),
    default: MappingSyncStatus.SYNCED,
    index: true,
  })
  syncStatus: MappingSyncStatus;

  @Prop({ type: Number, default: 0, min: 0 })
  lastStockPushed: number;

  @Prop({ type: Date })
  lastPushedAt?: Date;

  @Prop({ type: Boolean, default: false })
  isArchived: boolean;
}

export const ChannelSkuMappingSchema =
  SchemaFactory.createForClass(ChannelSkuMapping);

// Guarantee: one external SKU maps strictly to one internal SKU mapping record
ChannelSkuMappingSchema.index(
  { provider: 1, shopId: 1, externalSkuId: 1 },
  { unique: true },
);
