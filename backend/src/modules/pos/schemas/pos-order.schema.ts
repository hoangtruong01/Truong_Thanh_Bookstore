import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, SchemaTypes } from 'mongoose';
import {
  OrderSource,
  PaymentMethod,
  PaymentStatus,
} from '../../../common/enums';

export enum POSOrderStatus {
  COMPLETED = 'COMPLETED',
  PARTIALLY_RETURNED = 'PARTIALLY_RETURNED',
  RETURNED = 'RETURNED',
  CANCELLED = 'CANCELLED',
}

export enum POSCustomerType {
  RETAIL = 'RETAIL',
  WHOLESALE = 'WHOLESALE',
}

export enum POSItemCondition {
  GOOD = 'GOOD',
  DAMAGED = 'DAMAGED',
}

@Schema({ _id: false })
export class POSOrderItem {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Product', required: true })
  product: Types.ObjectId;

  @Prop({ required: true })
  sku: string;

  @Prop({ required: true })
  name: string;

  @Prop({ default: 'cái' })
  unit: string;

  @Prop({ default: 1, min: 1 })
  conversionRatio: number;

  @Prop({ required: true, min: 1 })
  quantity: number;

  @Prop({ required: true, min: 1 })
  baseQuantity: number;

  @Prop({ required: true, min: 0 })
  unitPrice: number;

  @Prop({ default: 0, min: 0 })
  costPrice: number;

  @Prop({ default: 0, min: 0 })
  discount: number;

  @Prop({ required: true, min: 0 })
  lineTotal: number;

  @Prop({ default: 0, min: 0 })
  allocatedOrderDiscount: number;

  @Prop({ required: true, min: 0 })
  effectiveLineTotal: number;

  @Prop({ required: true, min: 0 })
  netUnitPrice: number;

  @Prop({ default: 0, min: 0 })
  returnedQuantity: number;
}
export const POSOrderItemSchema = SchemaFactory.createForClass(POSOrderItem);

@Schema({ _id: false })
export class POSRefundItem {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Product', required: true })
  product: Types.ObjectId;

  @Prop({ required: true })
  sku: string;

  @Prop({ required: true })
  name: string;

  @Prop({ default: 'cái' })
  unit: string;

  @Prop({ required: true, min: 1 })
  quantity: number;

  @Prop({ required: true, min: 1 })
  baseQuantity: number;

  @Prop({
    type: String,
    enum: Object.values(POSItemCondition),
    default: POSItemCondition.GOOD,
  })
  condition: POSItemCondition;

  @Prop({ required: true, min: 0 })
  refundAmount: number;
}
export const POSRefundItemSchema = SchemaFactory.createForClass(POSRefundItem);

@Schema({ _id: false })
export class POSRefundRecord {
  @Prop({ required: true })
  refundId: string;

  @Prop({ default: Date.now })
  refundedAt: Date;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User' })
  actor: Types.ObjectId;

  @Prop({ required: true })
  actorName: string;

  @Prop({ type: [POSRefundItemSchema], default: [] })
  items: POSRefundItem[];

  @Prop({ required: true, min: 0 })
  totalRefundAmount: number;

  @Prop({ required: true })
  reason: string;

  @Prop()
  idempotencyKey?: string;

  @Prop()
  payloadHash?: string;
}
export const POSRefundRecordSchema =
  SchemaFactory.createForClass(POSRefundRecord);

export type POSOrderDocument = POSOrder & Document;

@Schema({ timestamps: true })
export class POSOrder {
  @Prop({ required: true, unique: true, index: true })
  invoiceCode: string;

  @Prop({
    type: String,
    enum: Object.values(OrderSource),
    default: OrderSource.POS,
    index: true,
  })
  orderSource: OrderSource;

  @Prop({
    type: SchemaTypes.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  cashier: Types.ObjectId;

  @Prop({ required: true })
  cashierName: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', index: true })
  customer?: Types.ObjectId;

  @Prop({ default: 'Khách lẻ tại quầy' })
  customerName: string;

  @Prop({ default: '' })
  customerPhone: string;

  @Prop({
    type: String,
    enum: Object.values(POSCustomerType),
    default: POSCustomerType.RETAIL,
  })
  customerType: POSCustomerType;

  @Prop({ type: [POSOrderItemSchema], required: true })
  items: POSOrderItem[];

  @Prop({ required: true, min: 0 })
  subtotal: number;

  @Prop({ default: 0, min: 0 })
  discountAmount: number;

  @Prop({ type: String, enum: ['FIXED', 'PERCENT'], default: 'FIXED' })
  discountType: string;

  @Prop()
  discountReason?: string;

  @Prop({ default: 0, min: 0 })
  totalDiscountAmount: number;

  @Prop({ default: 0, min: 0, max: 100 })
  totalDiscountPercent: number;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User' })
  approvedBy?: Types.ObjectId;

  @Prop()
  approvedByName?: string;

  @Prop()
  payloadHash?: string;

  @Prop({ required: true, min: 0 })
  finalAmount: number;

  @Prop({ default: 0, min: 0 })
  cashGiven: number;

  @Prop({ default: 0, min: 0 })
  changeGiven: number;

  @Prop({
    type: String,
    enum: [PaymentMethod.CASH, PaymentMethod.BANK_TRANSFER],
    default: PaymentMethod.CASH,
  })
  paymentMethod: PaymentMethod;

  @Prop({
    type: String,
    enum: Object.values(PaymentStatus),
    default: PaymentStatus.PAID,
  })
  paymentStatus: PaymentStatus;

  @Prop({
    type: String,
    enum: Object.values(POSOrderStatus),
    default: POSOrderStatus.COMPLETED,
    index: true,
  })
  status: POSOrderStatus;

  @Prop({ type: [POSRefundRecordSchema], default: [] })
  refundHistory: POSRefundRecord[];

  @Prop({ default: 0, min: 0 })
  totalRefundedAmount: number;

  @Prop()
  note?: string;

  @Prop({ unique: true, sparse: true, index: true })
  idempotencyKey?: string;

  createdAt: Date;
  updatedAt: Date;
}

export const POSOrderSchema = SchemaFactory.createForClass(POSOrder);

POSOrderSchema.index({ createdAt: -1 });
POSOrderSchema.index({ cashier: 1, createdAt: -1 });
POSOrderSchema.index({ customerPhone: 1 });
