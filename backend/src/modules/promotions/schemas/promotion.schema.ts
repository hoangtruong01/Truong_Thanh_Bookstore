import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';
import { DiscountType } from '../../../common/enums';

export type PromotionDocument = Promotion & Document;

@Schema({ timestamps: true })
export class Promotion {
  @Prop({ required: true, unique: true, uppercase: true })
  code: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ type: String, enum: DiscountType, required: true })
  discountType: DiscountType;

  @Prop({ required: true })
  discountValue: number;

  @Prop({ default: 0 })
  minOrderValue: number;

  @Prop()
  maxDiscount: number;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ default: 100 })
  usageLimit: number;

  @Prop({ default: 1, min: 1 })
  perUserLimit: number;

  @Prop({ default: 0 })
  usedCount: number;

  @Prop({ default: true })
  status: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const PromotionSchema = SchemaFactory.createForClass(Promotion);

PromotionSchema.index({ status: 1, startDate: 1, endDate: 1 });

export type PromotionUsageDocument = PromotionUsage & Document;

@Schema({ timestamps: true })
export class PromotionUsage {
  @Prop({ type: SchemaTypes.ObjectId, ref: Promotion.name, required: true })
  promotion: Types.ObjectId;

  /** SHA-256 of user id or normalized guest contact; never stores PII. */
  @Prop({ required: true })
  identityHash: string;

  @Prop({ required: true, min: 0, default: 0 })
  count: number;

  createdAt: Date;
  updatedAt: Date;
}

export const PromotionUsageSchema =
  SchemaFactory.createForClass(PromotionUsage);
PromotionUsageSchema.index({ promotion: 1, identityHash: 1 }, { unique: true });
