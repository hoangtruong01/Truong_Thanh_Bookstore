import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, SchemaTypes } from 'mongoose';

export type StockAuditDocument = StockAudit & Document;

export enum StockAuditStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

@Schema({ _id: false })
export class StockAuditItem {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Product', required: true })
  product: Types.ObjectId;

  @Prop({ required: true })
  productName: string;

  @Prop({ required: true })
  sku: string;

  @Prop({ required: true, default: 'cái' })
  unit: string;

  @Prop({ required: true, min: 0 })
  systemStock: number;

  @Prop({ required: true, min: 0 })
  actualStock: number;

  @Prop({ required: true })
  discrepancy: number; // actualStock - systemStock

  @Prop({ default: 0, min: 0 })
  costPrice: number;

  @Prop({ default: 0 })
  discrepancyValue: number; // discrepancy * costPrice

  @Prop({ trim: true })
  reason?: string;
}

export const StockAuditItemSchema =
  SchemaFactory.createForClass(StockAuditItem);

@Schema({ timestamps: true })
export class StockAudit {
  @Prop({ required: true, unique: true, uppercase: true, trim: true })
  auditCode: string;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ type: [StockAuditItemSchema], required: true, default: [] })
  items: StockAuditItem[];

  @Prop({ default: 0 })
  totalDiscrepancyQty: number;

  @Prop({ default: 0 })
  totalDiscrepancyValue: number;

  @Prop({ default: false })
  requiresApproval: boolean;

  @Prop({
    type: String,
    enum: StockAuditStatus,
    default: StockAuditStatus.DRAFT,
  })
  status: StockAuditStatus;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User' })
  submittedBy?: Types.ObjectId;

  @Prop()
  submittedAt?: Date;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User' })
  approvedBy?: Types.ObjectId;

  @Prop()
  approvedAt?: Date;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User' })
  rejectedBy?: Types.ObjectId;

  @Prop()
  rejectedAt?: Date;

  @Prop({ trim: true })
  rejectionReason?: string;

  @Prop()
  appliedAt?: Date;

  @Prop({ trim: true })
  note?: string;

  @Prop({ default: false, index: true })
  isDeleted: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const StockAuditSchema = SchemaFactory.createForClass(StockAudit);

StockAuditSchema.index({ auditCode: 1, isDeleted: 1 });
StockAuditSchema.index({ status: 1, createdAt: -1 });
StockAuditSchema.index({ 'items.product': 1 });
StockAuditSchema.index({ createdAt: -1 });
