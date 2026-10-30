import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, SchemaTypes } from 'mongoose';
import { ItemCondition } from './goods-receipt.schema';

export type PurchaseReturnDocument = PurchaseReturn & Document;

export enum PurchaseReturnStatus {
  DRAFT = 'DRAFT',
  APPROVED = 'APPROVED',
  POSTED = 'POSTED',
  CANCELLED = 'CANCELLED',
}

export enum CreditAdjustmentStatus {
  PENDING = 'PENDING', // Đang chờ NCC xác nhận giảm trừ nợ / hoàn tiền
  APPLIED = 'APPLIED', // Đã bù trừ vào công nợ (AP) của NCC
  REJECTED = 'REJECTED', // NCC từ chối chấp nhận hàng trả
}

@Schema({ _id: false })
export class PurchaseReturnItem {
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
  returnedQuantity: number;

  @Prop({ required: true, min: 1 })
  baseQuantity: number;

  @Prop({ required: true, min: 0 })
  unitCost: number;

  @Prop({ required: true, min: 0 })
  lineTotal: number;

  @Prop({
    type: String,
    enum: ItemCondition,
    default: ItemCondition.DAMAGED,
  })
  condition: ItemCondition;

  @Prop({ required: true, trim: true })
  reason: string;
}

export const PurchaseReturnItemSchema =
  SchemaFactory.createForClass(PurchaseReturnItem);

@Schema({ timestamps: true })
export class PurchaseReturn {
  @Prop({ required: true, unique: true, uppercase: true, trim: true })
  returnCode: string; // PRYYMMDD-XXXX

  @Prop({ type: SchemaTypes.ObjectId, ref: 'GoodsReceipt', required: true })
  goodsReceipt: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Supplier', required: true })
  supplier: Types.ObjectId;

  @Prop({ type: [PurchaseReturnItemSchema], required: true, default: [] })
  items: PurchaseReturnItem[];

  @Prop({ required: true, min: 0 })
  totalAmount: number;

  @Prop({
    type: String,
    enum: PurchaseReturnStatus,
    default: PurchaseReturnStatus.POSTED,
    index: true,
  })
  status: PurchaseReturnStatus;

  @Prop({
    type: String,
    enum: CreditAdjustmentStatus,
    default: CreditAdjustmentStatus.PENDING,
    index: true,
  })
  creditAdjustmentStatus: CreditAdjustmentStatus;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true })
  returnedBy: Types.ObjectId;

  @Prop({ default: Date.now })
  returnedAt: Date;

  @Prop({ trim: true, sparse: true, index: true })
  idempotencyKey?: string;

  @Prop({ trim: true })
  note?: string;

  @Prop({ default: false, index: true })
  isDeleted: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const PurchaseReturnSchema =
  SchemaFactory.createForClass(PurchaseReturn);

PurchaseReturnSchema.index({ returnCode: 1, isDeleted: 1 });
PurchaseReturnSchema.index({ goodsReceipt: 1 });
PurchaseReturnSchema.index({ supplier: 1, createdAt: -1 });
PurchaseReturnSchema.index({ createdAt: -1 });
PurchaseReturnSchema.index(
  { idempotencyKey: 1 },
  {
    unique: true,
    partialFilterExpression: { idempotencyKey: { $type: 'string' } },
  },
);
