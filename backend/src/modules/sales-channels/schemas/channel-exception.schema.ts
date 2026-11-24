import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, SchemaTypes } from 'mongoose';
import { ChannelProvider } from './channel-account.schema';

export type ChannelExceptionDocument = ChannelException & Document;

export enum ChannelExceptionType {
  UNKNOWN_SKU = 'UNKNOWN_SKU',
  INSUFFICIENT_STOCK = 'INSUFFICIENT_STOCK',
  SYNC_LAG = 'SYNC_LAG',
  SETTLEMENT_MISMATCH = 'SETTLEMENT_MISMATCH',
  ORDER_CONCURRENCY_ERROR = 'ORDER_CONCURRENCY_ERROR',
}

@Schema({ timestamps: true })
export class ChannelException {
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

  @Prop({ trim: true, index: true })
  externalOrderId?: string;

  @Prop({ trim: true, index: true })
  externalSkuId?: string;

  @Prop({
    type: String,
    enum: Object.values(ChannelExceptionType),
    required: true,
    index: true,
  })
  exceptionType: ChannelExceptionType;

  @Prop({ required: true, trim: true })
  message: string;

  @Prop({ type: SchemaTypes.Mixed })
  payload?: any;

  @Prop({ type: Boolean, default: false, index: true })
  resolved: boolean;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User' })
  resolvedBy?: Types.ObjectId;

  @Prop({ type: Date })
  resolvedAt?: Date;

  @Prop({ trim: true })
  resolutionNotes?: string;
}

export const ChannelExceptionSchema =
  SchemaFactory.createForClass(ChannelException);
