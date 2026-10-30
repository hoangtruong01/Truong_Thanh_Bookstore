import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SupplierPayableDocument = SupplierPayable & Document;

export enum SupplierPayableStatus {
  UNPAID = 'UNPAID', // Chưa thanh toán
  PARTIALLY_PAID = 'PARTIALLY_PAID', // Thanh toán một phần
  PAID = 'PAID', // Đã thanh toán đủ
  CANCELLED = 'CANCELLED',
}

@Schema({ _id: false })
export class PayablePaymentRecord {
  @Prop({ type: Types.ObjectId, ref: 'CashEntry', required: true })
  cashEntry: Types.ObjectId;

  @Prop({ type: String, required: true })
  entryCode: string;

  @Prop({ type: Number, required: true, min: 1 })
  amount: number;

  @Prop({ type: Date, default: Date.now })
  paidAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  paidBy: Types.ObjectId;

  @Prop({ type: String, trim: true })
  note?: string;
}

export const PayablePaymentRecordSchema =
  SchemaFactory.createForClass(PayablePaymentRecord);

@Schema({ timestamps: true })
export class SupplierPayable {
  @Prop({ type: Types.ObjectId, ref: 'Supplier', required: true, index: true })
  supplier: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'GoodsReceipt', index: true })
  goodsReceipt?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'PurchaseOrder', index: true })
  purchaseOrder?: Types.ObjectId;

  @Prop({ required: true, trim: true, index: true })
  invoiceCode: string; // Mã chứng từ phát sinh nghĩa vụ nợ (vd mã GRN)

  @Prop({ type: Number, required: true, min: 0 })
  totalAmount: number;

  @Prop({ type: Number, default: 0, min: 0 })
  paidAmount: number;

  @Prop({ type: Number, required: true, min: 0 })
  remainingAmount: number;

  @Prop({ type: Date, required: true, index: true })
  dueDate: Date;

  @Prop({
    type: String,
    enum: Object.values(SupplierPayableStatus),
    default: SupplierPayableStatus.UNPAID,
    index: true,
  })
  status: SupplierPayableStatus;

  @Prop({ type: [PayablePaymentRecordSchema], default: [] })
  paymentHistory: PayablePaymentRecord[];

  @Prop({ type: String, trim: true })
  note?: string;

  @Prop({ default: false, index: true })
  isDeleted: boolean;
}

export const SupplierPayableSchema =
  SchemaFactory.createForClass(SupplierPayable);

SupplierPayableSchema.index({ supplier: 1, status: 1 });
SupplierPayableSchema.index({ dueDate: 1, status: 1 });
