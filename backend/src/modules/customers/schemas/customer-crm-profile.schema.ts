import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, SchemaTypes } from 'mongoose';
import {
  CustomerType,
  CustomerCRMTier,
  CarePriority,
} from '../../../common/enums';

export type CustomerCRMProfileDocument = CustomerCRMProfile & Document;

@Schema({ _id: false })
export class TierAuditEntry {
  @Prop({ required: true })
  previousTier: string;

  @Prop({ required: true })
  newTier: string;

  @Prop({ required: true, trim: true })
  reason: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User' })
  actor?: Types.ObjectId;

  @Prop({ default: Date.now })
  timestamp: Date;
}

export const TierAuditEntrySchema =
  SchemaFactory.createForClass(TierAuditEntry);

@Schema({ timestamps: true })
export class CustomerCRMProfile {
  @Prop({
    type: SchemaTypes.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  })
  customer: Types.ObjectId;

  @Prop({
    type: String,
    enum: CustomerType,
    default: CustomerType.RETAIL,
    index: true,
  })
  customerType: CustomerType;

  @Prop({
    type: String,
    enum: CustomerCRMTier,
    default: CustomerCRMTier.BRONZE,
    index: true,
  })
  tier: CustomerCRMTier;

  @Prop({
    type: String,
    enum: CarePriority,
    default: CarePriority.LOW,
    index: true,
  })
  carePriority: CarePriority;

  @Prop({ default: 0, min: 0 })
  spent30d: number;

  @Prop({ default: 0, min: 0 })
  spent90d: number;

  @Prop({ default: 0, min: 0 })
  spent365d: number;

  @Prop({ default: 0, min: 0 })
  totalSpent: number;

  @Prop({ default: 0, min: 0 })
  totalOrders: number;

  @Prop({ default: 0, min: 0 })
  averageOrderValue: number;

  @Prop({ default: 0, min: 0 })
  currentReceivable: number;

  @Prop({ default: 0, min: 0 })
  overdueDays: number;

  @Prop({ default: false, index: true })
  creditBlocked: boolean;

  @Prop({ trim: true })
  notes?: string;

  @Prop({ type: [TierAuditEntrySchema], default: [] })
  tierAuditLog: TierAuditEntry[];

  @Prop({ default: Date.now })
  lastEvaluatedAt: Date;
}

export const CustomerCRMProfileSchema =
  SchemaFactory.createForClass(CustomerCRMProfile);

CustomerCRMProfileSchema.index({ customerType: 1, tier: 1 });
CustomerCRMProfileSchema.index({ carePriority: 1 });
CustomerCRMProfileSchema.index({ spent365d: -1 });
