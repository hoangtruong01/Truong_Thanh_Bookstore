import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, SchemaTypes } from 'mongoose';
import { POSShift } from '../dto/pos.dto';

export type POSShiftClosingDocument = POSShiftClosing & Document;

@Schema({ timestamps: true })
export class POSShiftClosing {
  @Prop({ required: true, unique: true, uppercase: true, trim: true })
  closingCode: string;

  @Prop({ required: true, trim: true })
  date: string; // YYYY-MM-DD

  @Prop({ type: String, enum: POSShift, default: POSShift.ALL })
  shift: POSShift;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true })
  cashier: Types.ObjectId;

  @Prop({ required: true, trim: true })
  cashierName: string;

  @Prop({ required: true })
  startTime: Date;

  @Prop({ required: true })
  endTime: Date;

  @Prop({ required: true, default: () => new Date() })
  closedAt: Date;

  @Prop({ required: true, default: 0, min: 0 })
  openingCash: number;

  @Prop({ required: true, default: 0 })
  cashSales: number;

  @Prop({ required: true, default: 0 })
  transferSales: number;

  @Prop({ required: true, default: 0 })
  creditSales: number;

  @Prop({ required: true, default: 0 })
  grossRevenue: number;

  @Prop({ required: true, default: 0 })
  cashRefunded: number;

  @Prop({ required: true, default: 0 })
  transferRefunded: number;

  @Prop({ required: true, default: 0 })
  totalRefundedAmount: number;

  @Prop({ required: true, default: 0 })
  netRevenue: number;

  @Prop({ required: true, default: 0 })
  expectedCash: number;

  @Prop({ required: true, default: 0 })
  actualCash: number;

  @Prop({ required: true, default: 0 })
  variance: number; // actualCash - expectedCash (dương: thừa, âm: thiếu)

  @Prop({ required: true, default: 0 })
  totalOrders: number;

  @Prop({ required: true, default: 0 })
  itemsSoldCount: number;

  @Prop({ required: true, default: 0 })
  refundedOrdersCount: number;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User' })
  handoverTo?: Types.ObjectId;

  @Prop({ trim: true })
  handoverToName?: string;

  @Prop({ trim: true })
  notes?: string;

  @Prop({ default: 'CONFIRMED' })
  status: string;

  createdAt: Date;
  updatedAt: Date;
}

export const POSShiftClosingSchema =
  SchemaFactory.createForClass(POSShiftClosing);

POSShiftClosingSchema.index({ closingCode: 1 });
POSShiftClosingSchema.index({ cashier: 1, date: 1, shift: 1 });
POSShiftClosingSchema.index({ createdAt: -1 });
