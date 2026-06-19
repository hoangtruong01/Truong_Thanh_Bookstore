import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
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

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ default: 100 })
  usageLimit: number;

  @Prop({ default: 0 })
  usedCount: number;

  @Prop({ default: true })
  status: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const PromotionSchema = SchemaFactory.createForClass(Promotion);
