import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, SchemaTypes } from 'mongoose';

export type GoodsReceiptDocument = GoodsReceipt & Document;

export enum ItemCondition {
  GOOD = 'GOOD',
  DAMAGED = 'DAMAGED',
  MIXED = 'MIXED',
}

@Schema({ _id: false })
export class GoodsReceiptItem {
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
  receivedQuantity: number;

  @Prop({ required: true, min: 1 })
  baseQuantity: number;

  @Prop({ required: true, min: 0 })
  acceptedQuantity: number;

  @Prop({ default: 0, min: 0 })
  rejectedQuantity: number;

  @Prop({
    type: String,
    enum: ItemCondition,
    default: ItemCondition.GOOD,
  })
  condition: ItemCondition;

  @Prop({ required: true, min: 0 })
  actualUnitPrice: number;

  @Prop({ required: true, min: 0 })
  lineTotal: number;
}

export const GoodsReceiptItemSchema =
  SchemaFactory.createForClass(GoodsReceiptItem);

@Schema({ timestamps: true })
export class GoodsReceipt {
  @Prop({ required: true, unique: true, uppercase: true, trim: true })
  receiptCode: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'PurchaseOrder', required: true })
  purchaseOrder: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Supplier', required: true })
  supplier: Types.ObjectId;

  @Prop({ type: [GoodsReceiptItemSchema], required: true, default: [] })
  items: GoodsReceiptItem[];

  @Prop({ required: true, min: 0 })
  totalAmount: number;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true })
  receivedBy: Types.ObjectId;

  @Prop({ default: Date.now })
  receivedAt: Date;

  @Prop({ trim: true, sparse: true, index: true })
  idempotencyKey?: string;

  @Prop({ trim: true })
  note?: string;

  @Prop({ default: false, index: true })
  isDeleted: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const GoodsReceiptSchema = SchemaFactory.createForClass(GoodsReceipt);

GoodsReceiptSchema.index({ receiptCode: 1, isDeleted: 1 });
GoodsReceiptSchema.index({ purchaseOrder: 1 });
GoodsReceiptSchema.index({ supplier: 1, createdAt: -1 });
GoodsReceiptSchema.index({ createdAt: -1 });
GoodsReceiptSchema.index(
  { idempotencyKey: 1 },
  {
    unique: true,
    partialFilterExpression: { idempotencyKey: { $type: 'string' } },
  },
);
