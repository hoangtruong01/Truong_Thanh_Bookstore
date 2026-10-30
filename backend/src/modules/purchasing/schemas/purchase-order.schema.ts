import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, SchemaTypes } from 'mongoose';

export type PurchaseOrderDocument = PurchaseOrder & Document;

export enum PurchaseOrderStatus {
  DRAFT = 'DRAFT',
  APPROVED = 'APPROVED',
  SENT = 'SENT',
  PARTIALLY_RECEIVED = 'PARTIALLY_RECEIVED',
  FULLY_RECEIVED = 'FULLY_RECEIVED',
  CANCELLED = 'CANCELLED',
}

@Schema({ _id: false })
export class PurchaseOrderItem {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Product', required: true })
  product: Types.ObjectId;

  @Prop({ required: true })
  productName: string;

  @Prop({ required: true })
  sku: string;

  @Prop({ required: true, default: 'cái' })
  unit: string;

  @Prop({ required: true, default: 1, min: 1 })
  conversionRatio: number;

  @Prop({ required: true, min: 1 })
  orderedQuantity: number;

  @Prop({ required: true, min: 1 })
  baseQuantity: number;

  @Prop({ default: 0, min: 0 })
  receivedQuantity: number;

  @Prop({ required: true, min: 0 })
  expectedUnitPrice: number;

  @Prop({ required: true, min: 0 })
  lineTotal: number;
}

export const PurchaseOrderItemSchema =
  SchemaFactory.createForClass(PurchaseOrderItem);

@Schema({ _id: false })
export class PurchaseOrderHistory {
  @Prop({ type: String, enum: PurchaseOrderStatus, required: true })
  status: PurchaseOrderStatus;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User' })
  updatedBy: Types.ObjectId;

  @Prop()
  note?: string;

  @Prop({ default: Date.now })
  timestamp: Date;
}

export const PurchaseOrderHistorySchema =
  SchemaFactory.createForClass(PurchaseOrderHistory);

@Schema({ timestamps: true })
export class PurchaseOrder {
  @Prop({ required: true, unique: true, uppercase: true, trim: true })
  poCode: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Supplier', required: true })
  supplier: Types.ObjectId;

  @Prop({ type: [PurchaseOrderItemSchema], required: true, default: [] })
  items: PurchaseOrderItem[];

  @Prop({ required: true, min: 0 })
  subtotal: number;

  @Prop({ default: 0, min: 0 })
  tax: number;

  @Prop({ required: true, min: 0 })
  totalAmount: number;

  @Prop({
    type: String,
    enum: PurchaseOrderStatus,
    default: PurchaseOrderStatus.DRAFT,
  })
  status: PurchaseOrderStatus;

  @Prop()
  expectedDeliveryDate?: Date;

  @Prop({ trim: true })
  note?: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User' })
  approvedBy?: Types.ObjectId;

  @Prop()
  approvedAt?: Date;

  @Prop({ type: [PurchaseOrderHistorySchema], default: [] })
  history: PurchaseOrderHistory[];

  @Prop({ default: false, index: true })
  isDeleted: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const PurchaseOrderSchema = SchemaFactory.createForClass(PurchaseOrder);

PurchaseOrderSchema.index({ poCode: 1, isDeleted: 1 });
PurchaseOrderSchema.index({ supplier: 1, status: 1 });
PurchaseOrderSchema.index({ status: 1, createdAt: -1 });
PurchaseOrderSchema.index({ 'items.product': 1 });
