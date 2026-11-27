import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';

export type RemarketingLogDocument = RemarketingLog & Document;

export enum RemarketingType {
  RESTOCK = 'RESTOCK',
  PRICE_DROP = 'PRICE_DROP',
  ABANDONED_CART = 'ABANDONED_CART',
}

export enum RemarketingChannel {
  IN_APP_NOTIFICATION = 'IN_APP_NOTIFICATION',
  EMAIL = 'EMAIL',
  PUSH = 'PUSH',
}

@Schema({ timestamps: true })
export class RemarketingLog {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({
    type: String,
    enum: RemarketingType,
    required: true,
    index: true,
  })
  type: RemarketingType;

  @Prop({
    type: String,
    enum: RemarketingChannel,
    default: RemarketingChannel.IN_APP_NOTIFICATION,
  })
  channel: RemarketingChannel;

  @Prop({ type: String, default: null, index: true })
  targetId?: string; // e.g. productId, cartId

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({ default: false })
  converted: boolean;

  @Prop({ type: Date, default: null })
  convertedAt?: Date;

  @Prop({ type: Object, default: {} })
  meta?: Record<string, any>;

  createdAt: Date;
  updatedAt: Date;
}

export const RemarketingLogSchema = SchemaFactory.createForClass(RemarketingLog);
RemarketingLogSchema.index({ userId: 1, type: 1, targetId: 1, createdAt: -1 });
RemarketingLogSchema.index({ userId: 1, createdAt: -1 });
