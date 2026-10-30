import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CashEntryDocument = CashEntry & Document;

export enum CashEntryDirection {
  IN = 'IN', // Phiếu thu (PT)
  OUT = 'OUT', // Phiếu chi (PC)
}

export enum CashEntryCategory {
  SUPPLIER_PAYMENT = 'SUPPLIER_PAYMENT', // Chi trả tiền nhà cung cấp
  WHOLESALE_COLLECTION = 'WHOLESALE_COLLECTION', // Thu tiền công nợ khách sỉ
  PURCHASE_RETURN_REFUND = 'PURCHASE_RETURN_REFUND', // Tiền NCC hoàn trả khi trả hàng
  POS_REVENUE = 'POS_REVENUE', // Thu bán hàng tại quầy POS
  ONLINE_REVENUE = 'ONLINE_REVENUE', // Thu bán hàng Online
  UTILITY_EXPENSE = 'UTILITY_EXPENSE', // Chi phí điện, nước, mặt bằng, văn phòng
  SALARY_EXPENSE = 'SALARY_EXPENSE', // Chi lương nhân viên
  OTHER_EXPENSE = 'OTHER_EXPENSE', // Chi phí hoạt động khác
  CAPITAL_INJECTION = 'CAPITAL_INJECTION', // Thu góp vốn / nạp quỹ
  REFUND = 'REFUND', // Chi hoàn trả khách hàng
}

export enum CashEntryStatus {
  DRAFT = 'DRAFT',
  POSTED = 'POSTED', // Đã vào sổ quỹ (bất biến)
  CANCELLED = 'CANCELLED',
  REVERSED = 'REVERSED', // Đã bị đảo bởi phiếu đảo
}

@Schema({ timestamps: true })
export class CashEntry {
  @Prop({
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true,
  })
  entryCode: string; // PT261030-0001 (Phiếu thu) hoặc PC261030-0001 (Phiếu chi)

  @Prop({
    type: Types.ObjectId,
    ref: 'CashAccount',
    required: true,
    index: true,
  })
  account: Types.ObjectId;

  @Prop({
    required: true,
    enum: Object.values(CashEntryDirection),
    index: true,
  })
  direction: CashEntryDirection;

  @Prop({
    required: true,
    enum: Object.values(CashEntryCategory),
    index: true,
  })
  category: CashEntryCategory;

  @Prop({ type: Number, required: true, min: 1 })
  amount: number;

  @Prop({ type: String, trim: true, index: true })
  referenceType?: string; // GOODS_RECEIPT, PURCHASE_ORDER, ORDER, POS_ORDER, SUPPLIER_PAYABLE, OTHER

  @Prop({ type: String, trim: true, index: true })
  referenceId?: string;

  @Prop({ type: String, trim: true })
  partnerName?: string; // Tên NCC, khách hàng, nhân viên

  @Prop({
    type: String,
    enum: Object.values(CashEntryStatus),
    default: CashEntryStatus.POSTED,
    index: true,
  })
  status: CashEntryStatus;

  @Prop({ type: Date, default: Date.now, index: true })
  postedAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  approvedBy?: Types.ObjectId;

  @Prop({ type: String, trim: true })
  note?: string;

  @Prop({ type: Types.ObjectId, ref: 'CashEntry' })
  reversalOf?: Types.ObjectId;

  @Prop({ type: String, trim: true, index: true })
  idempotencyKey?: string;

  @Prop({ default: false, index: true })
  isDeleted: boolean;
}

export const CashEntrySchema = SchemaFactory.createForClass(CashEntry);
CashEntrySchema.index({ account: 1, postedAt: -1 });
CashEntrySchema.index({ category: 1, postedAt: -1 });
CashEntrySchema.index({ direction: 1, postedAt: -1 });
