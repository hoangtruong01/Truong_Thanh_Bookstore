import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, SchemaTypes } from 'mongoose';

export type NotificationDocument = Notification & Document;

@Schema({ timestamps: true })
export class Notification {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', default: null })
  userId: Types.ObjectId | null; // Null means global notification for all customers

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({
    required: true,
    enum: ['order', 'promotion', 'loyalty', 'tier', 'review', 'system'],
    default: 'order',
  })
  type: string;

  @Prop({ type: Object, default: {} })
  meta: Record<string, any>; // Extra info like orderId, promoCode, etc.

  @Prop({ default: false })
  isRead: boolean;

  @Prop({ type: [{ type: SchemaTypes.ObjectId, ref: 'User' }], default: [] })
  readBy: Types.ObjectId[];

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', default: null })
  sender?: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, isRead: 1 });
NotificationSchema.index({ createdAt: -1 });
