import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, SchemaTypes } from 'mongoose';

export type ChannelAccountDocument = ChannelAccount & Document;

export enum ChannelProvider {
  TIKTOK_SHOP = 'TIKTOK_SHOP',
  SHOPEE = 'SHOPEE',
  LAZADA = 'LAZADA',
  OTHER = 'OTHER',
}

export enum ChannelStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  DISCONNECTED = 'DISCONNECTED',
  ERROR = 'ERROR',
}

@Schema({ timestamps: true })
export class ChannelAccount {
  @Prop({
    type: String,
    enum: Object.values(ChannelProvider),
    required: true,
    index: true,
  })
  provider: ChannelProvider;

  @Prop({ required: true, trim: true, index: true })
  shopId: string;

  @Prop({ required: true, trim: true })
  shopName: string;

  @Prop({
    type: String,
    enum: Object.values(ChannelStatus),
    default: ChannelStatus.ACTIVE,
    index: true,
  })
  status: ChannelStatus;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Warehouse' })
  authorizedWarehouseId?: Types.ObjectId;

  @Prop({ type: Boolean, default: true })
  syncStockEnabled: boolean;

  @Prop({ type: Boolean, default: true })
  syncOrdersEnabled: boolean;

  @Prop({ trim: true })
  appKey?: string;

  @Prop({ trim: true, select: false })
  encryptedAppSecret?: string;

  @Prop({ trim: true, select: false })
  encryptedAccessToken?: string;

  @Prop({ type: Date })
  tokenExpiresAt?: Date;

  @Prop({ type: Date })
  lastSyncedAt?: Date;

  @Prop({ type: Boolean, default: false })
  isArchived: boolean;
}

export const ChannelAccountSchema =
  SchemaFactory.createForClass(ChannelAccount);

ChannelAccountSchema.index({ provider: 1, shopId: 1 }, { unique: true });
