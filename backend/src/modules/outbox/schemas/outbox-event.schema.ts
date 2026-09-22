import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum OutboxStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SENT = 'SENT',
  FAILED = 'FAILED',
}

export enum OutboxEventType {
  ORDER_CREATED = 'ORDER_CREATED',
  ORDER_STATUS_CHANGED = 'ORDER_STATUS_CHANGED',
  STOCK_ALERT = 'STOCK_ALERT',
  GOOGLE_SHEET_SYNC = 'GOOGLE_SHEET_SYNC',
}

export type OutboxEventDocument = OutboxEvent & Document;

@Schema({ timestamps: true, collection: 'outbox_events' })
export class OutboxEvent {
  @Prop({ required: true, enum: OutboxEventType })
  eventType: OutboxEventType;

  @Prop({ type: Object, required: true })
  payload: Record<string, unknown>;

  @Prop({
    required: true,
    enum: OutboxStatus,
    default: OutboxStatus.PENDING,
    index: true,
  })
  status: OutboxStatus;

  @Prop({ default: 0 })
  retryCount: number;

  @Prop({ default: 5 })
  maxRetries: number;

  @Prop({ type: String, default: null })
  errorMessage?: string | null;

  @Prop({ type: Date, default: null, index: true })
  nextRetryAt?: Date | null;

  @Prop({ type: Date, default: null })
  processedAt?: Date | null;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  targetUserId?: Types.ObjectId | null;

  createdAt?: Date;
  updatedAt?: Date;
}

export const OutboxEventSchema = SchemaFactory.createForClass(OutboxEvent);

// Compound index for efficient polling by cron worker
OutboxEventSchema.index({ status: 1, nextRetryAt: 1, createdAt: 1 });
