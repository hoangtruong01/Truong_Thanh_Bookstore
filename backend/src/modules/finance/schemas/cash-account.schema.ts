import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CashAccountDocument = CashAccount & Document;

export enum CashAccountType {
  CASH_DRAWER = 'CASH_DRAWER', // Quỹ tiền mặt quầy
  BANK_ACCOUNT = 'BANK_ACCOUNT', // Tài khoản ngân hàng
  PETTY_CASH = 'PETTY_CASH', // Quỹ chi tiêu vặt
  PURCHASING_BUDGET = 'PURCHASING_BUDGET', // Quỹ ngân sách nhập hàng
}

export enum CashAccountStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

@Schema({ timestamps: true })
export class CashAccount {
  @Prop({ required: true, unique: true, uppercase: true, trim: true })
  code: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({
    required: true,
    enum: Object.values(CashAccountType),
    default: CashAccountType.CASH_DRAWER,
    index: true,
  })
  type: CashAccountType;

  @Prop({ type: Number, default: 0 })
  openingBalance: number;

  @Prop({ type: Number, default: 0 })
  currentBalance: number;

  @Prop({
    type: String,
    enum: Object.values(CashAccountStatus),
    default: CashAccountStatus.ACTIVE,
    index: true,
  })
  status: CashAccountStatus;

  @Prop({ type: String, trim: true })
  note?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId;

  @Prop({ default: false, index: true })
  isDeleted: boolean;
}

export const CashAccountSchema = SchemaFactory.createForClass(CashAccount);
CashAccountSchema.index({ code: 1, isDeleted: 1 });
