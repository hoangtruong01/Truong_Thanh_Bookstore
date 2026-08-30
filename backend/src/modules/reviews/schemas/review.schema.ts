import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, SchemaTypes } from 'mongoose';

export type ReviewDocument = Review & Document;

@Schema({ timestamps: true })
export class Review {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Product', required: true })
  product: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  @Prop({ required: true })
  content: string;

  @Prop({ default: [] })
  images: string[];

  @Prop({ default: true })
  isVisible: boolean;

  @Prop({ default: false })
  isVerifiedPurchase: boolean;

  @Prop({ default: null })
  adminReply?: string;

  @Prop({ default: null })
  adminReplyAt?: Date;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);

ReviewSchema.index({ product: 1, isVisible: 1 });
ReviewSchema.index({ product: 1, user: 1 }, { unique: true });
ReviewSchema.index({ isVisible: 1, createdAt: -1 });
ReviewSchema.index({ createdAt: -1 });
