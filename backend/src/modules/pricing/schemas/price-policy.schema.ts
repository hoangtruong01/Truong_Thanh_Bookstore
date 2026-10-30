import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PricePolicyDocument = PricePolicy & Document;

export enum PricePolicyScope {
  GLOBAL = 'GLOBAL',
  CATEGORY = 'CATEGORY',
  PRODUCT = 'PRODUCT',
  CHANNEL = 'CHANNEL',
  TIER = 'TIER',
}

export enum PricePolicyStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

@Schema({ timestamps: true })
export class PricePolicy {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({
    required: true,
    enum: Object.values(PricePolicyScope),
    default: PricePolicyScope.GLOBAL,
    index: true,
  })
  scope: PricePolicyScope;

  @Prop({ type: Types.ObjectId, ref: 'Category', index: true })
  category?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Product', index: true })
  product?: Types.ObjectId;

  @Prop({ type: String, trim: true, index: true })
  channel?: string; // RETAIL_POS, WEB, MOBILE, WHOLESALE

  @Prop({ type: String, trim: true, index: true })
  customerTier?: string; // REGULAR, SILVER, GOLD, VIP, WHOLESALE_1, WHOLESALE_2

  @Prop({ type: Number, required: true, min: 0, max: 99.99 })
  targetMarginPercent: number; // e.g. 20% -> Margin = (Price - Cost) / Price * 100

  @Prop({ type: Number, min: 0 })
  markupPercent?: number; // e.g. 25% -> Markup = (Price - Cost) / Cost * 100

  @Prop({ type: Number, default: 10, min: 0, max: 99.99 })
  minMarginFloor: number; // Minimum acceptable margin floor. Under this requires manager approval

  @Prop({ type: Number, default: 20, min: 0, max: 100 })
  maxDiscountPercent: number; // Max line discount allowed without approval

  @Prop({ type: Date, required: true, default: Date.now, index: true })
  effectiveFrom: Date;

  @Prop({ type: Date, index: true })
  effectiveTo?: Date;

  @Prop({ type: Number, default: 10, index: true })
  priority: number; // Higher number = higher precedence (PRODUCT 50 > CATEGORY 40 > CHANNEL 30 > TIER 20 > GLOBAL 10)

  @Prop({
    type: String,
    enum: Object.values(PricePolicyStatus),
    default: PricePolicyStatus.ACTIVE,
    index: true,
  })
  status: PricePolicyStatus;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: String, trim: true })
  reason?: string;

  @Prop({ default: false, index: true })
  isDeleted: boolean;
}

export const PricePolicySchema = SchemaFactory.createForClass(PricePolicy);

PricePolicySchema.index({ scope: 1, status: 1, isDeleted: 1 });
PricePolicySchema.index({ priority: -1, effectiveFrom: -1 });
