import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, SchemaTypes } from 'mongoose';

export type CustomerCreditProfileDocument = CustomerCreditProfile & Document;

export enum CreditStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  BLOCKED = 'BLOCKED',
}

@Schema({ _id: false })
export class CreditLimitAuditEntry {
  @Prop({ type: Number, required: true })
  oldCreditLimit: number;

  @Prop({ type: Number, required: true })
  newCreditLimit: number;

  @Prop({ type: String, required: true })
  oldStatus: string;

  @Prop({ type: String, required: true })
  newStatus: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true })
  changedBy: Types.ObjectId;

  @Prop({ type: String, required: true })
  changedByName: string;

  @Prop({ type: String, required: true })
  reason: string;

  @Prop({ type: Date, default: Date.now })
  changedAt: Date;
}

export const CreditLimitAuditEntrySchema = SchemaFactory.createForClass(
  CreditLimitAuditEntry,
);

@Schema({ timestamps: true })
export class CustomerCreditProfile {
  @Prop({
    type: SchemaTypes.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  })
  customer: Types.ObjectId;

  @Prop({ required: true, trim: true })
  customerName: string;

  @Prop({ type: String, trim: true })
  customerPhone?: string;

  @Prop({ type: Number, default: 0, min: 0 })
  creditLimit: number;

  @Prop({ type: Number, default: 0, min: 0 })
  currentExposure: number; // Dư nợ thực tế hiện tại

  @Prop({
    type: String,
    enum: Object.values(CreditStatus),
    default: CreditStatus.PENDING,
    index: true,
  })
  creditStatus: CreditStatus;

  @Prop({ type: Number, default: 30, min: 0 })
  paymentTermDays: number; // Số ngày thanh toán công nợ

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User' })
  approvedBy?: Types.ObjectId;

  @Prop({ type: Date })
  approvedAt?: Date;

  @Prop({ type: Date })
  reviewAt?: Date;

  @Prop({ type: String, trim: true })
  creditNote?: string;

  @Prop({ type: String, default: 'BLOCK_ON_OVERDUE' })
  overduePolicy: string;

  @Prop({ type: [CreditLimitAuditEntrySchema], default: [] })
  auditHistory: CreditLimitAuditEntry[];
}

export const CustomerCreditProfileSchema = SchemaFactory.createForClass(
  CustomerCreditProfile,
);

CustomerCreditProfileSchema.index({ customer: 1, creditStatus: 1 });
CustomerCreditProfileSchema.index({ currentExposure: 1 });
