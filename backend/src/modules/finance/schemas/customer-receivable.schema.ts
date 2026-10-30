import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CustomerReceivableDocument = CustomerReceivable & Document;

export enum CustomerReceivableStatus {
  UNPAID = 'UNPAID', // Chưa thu tiền
  PARTIALLY_PAID = 'PARTIALLY_PAID', // Đã thu một phần
  PAID = 'PAID', // Đã thu đủ 100%
  CANCELLED = 'CANCELLED',
}

@Schema({ _id: false })
export class ReceivablePaymentRecord {
  @Prop({ type: Types.ObjectId, ref: 'CashEntry', required: true })
  cashEntry: Types.ObjectId;

  @Prop({ type: String, required: true })
  entryCode: string;

  @Prop({ type: Number, required: true, min: 1 })
  amount: number;

  @Prop({ type: Date, default: Date.now })
  collectedAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  collectedBy: Types.ObjectId;

  @Prop({ type: String, trim: true })
  note?: string;
}

export const ReceivablePaymentRecordSchema = SchemaFactory.createForClass(
  ReceivablePaymentRecord,
);

@Schema({ timestamps: true })
export class CustomerReceivable {
  @Prop({ type: Types.ObjectId, ref: 'Customer', required: true, index: true })
  customer: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true })
  customerName: string;

  @Prop({ type: String, trim: true })
  customerPhone?: string;

  @Prop({ type: Types.ObjectId, ref: 'Order', index: true })
  order?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'POSOrder', index: true })
  posOrder?: Types.ObjectId;

  @Prop({ required: true, trim: true, index: true })
  invoiceCode: string; // Mã đơn bán sỉ (vd HD261030-0001)

  @Prop({ type: Number, required: true, min: 0 })
  totalAmount: number;

  @Prop({ type: Number, default: 0, min: 0 })
  paidAmount: number;

  @Prop({ type: Number, required: true, min: 0 })
  remainingAmount: number;

  @Prop({ type: Number, default: 0 })
  creditLimit: number; // Hạn mức nợ tối đa được duyệt

  @Prop({ type: Date, required: true, index: true })
  dueDate: Date;

  @Prop({
    type: String,
    enum: Object.values(CustomerReceivableStatus),
    default: CustomerReceivableStatus.UNPAID,
    index: true,
  })
  status: CustomerReceivableStatus;

  @Prop({ type: [ReceivablePaymentRecordSchema], default: [] })
  collectionHistory: ReceivablePaymentRecord[];

  @Prop({ type: String, trim: true })
  note?: string;

  @Prop({ default: false, index: true })
  isDeleted: boolean;
}

export const CustomerReceivableSchema =
  SchemaFactory.createForClass(CustomerReceivable);

CustomerReceivableSchema.index({ customer: 1, status: 1 });
CustomerReceivableSchema.index({ dueDate: 1, status: 1 });
CustomerReceivableSchema.index({ invoiceCode: 1, isDeleted: 1 });
