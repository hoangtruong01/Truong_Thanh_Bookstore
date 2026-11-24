import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes } from 'mongoose';
import { ChannelProvider } from './channel-account.schema';

export type ChannelWebhookInboxDocument = ChannelWebhookInbox & Document;

export enum WebhookProcessingStatus {
  PENDING = 'PENDING',
  PROCESSED = 'PROCESSED',
  DUPLICATE = 'DUPLICATE',
  FAILED = 'FAILED',
}

@Schema({ timestamps: true })
export class ChannelWebhookInbox {
  @Prop({ required: true, trim: true, index: true })
  eventId: string; // Deduplication ID from TikTok Shop

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

  @Prop({ required: true, trim: true })
  eventType: string; // e.g. ORDER_CREATED, ORDER_STATUS_CHANGE

  @Prop({ type: SchemaTypes.Mixed, required: true })
  payload: any;

  @Prop({ required: true, trim: true })
  signature: string;

  @Prop({
    type: String,
    enum: Object.values(WebhookProcessingStatus),
    default: WebhookProcessingStatus.PENDING,
    index: true,
  })
  status: WebhookProcessingStatus;

  @Prop({ trim: true })
  errorMessage?: string;

  @Prop({ type: Date })
  processedAt?: Date;
}

export const ChannelWebhookInboxSchema =
  SchemaFactory.createForClass(ChannelWebhookInbox);

// Compound unique index for strict idempotent deduplication before ack
ChannelWebhookInboxSchema.index({ provider: 1, eventId: 1 }, { unique: true });
