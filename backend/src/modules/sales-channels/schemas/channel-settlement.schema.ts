import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ChannelProvider } from './channel-account.schema';

export type ChannelSettlementDocument = ChannelSettlement & Document;

export enum SettlementStatus {
  PENDING = 'PENDING',
  RECONCILED = 'RECONCILED',
  DISCREPANCY = 'DISCREPANCY',
}

@Schema({ timestamps: true })
export class ChannelSettlement {
  @Prop({ required: true, trim: true, unique: true, index: true })
  settlementId: string; // e.g. TikTok Shop settlement/statement ID

  @Prop({
    type: String,
    enum: Object.values(ChannelProvider),
    default: ChannelProvider.TIKTOK_SHOP,
    required: true,
    index: true,
  })
  provider: ChannelProvider;

  @Prop({ required: true, trim: true, index: true })
  shopId: string;

  @Prop({ type: Date, required: true })
  periodStart: Date;

  @Prop({ type: Date, required: true })
  periodEnd: Date;

  @Prop({ type: Number, required: true, min: 0 })
  grossSalesVnd: number; // Tổng giá trị đơn sàn báo

  @Prop({ type: Number, default: 0, min: 0 })
  platformFeesVnd: number; // Phí sàn khấu trừ

  @Prop({ type: Number, default: 0, min: 0 })
  commissionFeesVnd: number; // Hoa hồng liên kết / affiliate

  @Prop({ type: Number, default: 0, min: 0 })
  shippingFeesVnd: number; // Phí vận chuyển trợ giá sàn

  @Prop({ type: Number, required: true })
  netSettlementVnd: number; // Thực nhận chuyển khoản

  @Prop({ type: Number, default: 0 })
  internalAttributedSalesVnd: number; // Doanh thu đối soát từ các đơn nội bộ

  @Prop({
    type: String,
    enum: Object.values(SettlementStatus),
    default: SettlementStatus.PENDING,
    index: true,
  })
  status: SettlementStatus;

  @Prop({ type: Number, default: 0 })
  discrepancyVnd: number; // Độ lệch giữa netSettlement và internalAttributedSales

  @Prop({ type: Date })
  reconciledAt?: Date;

  @Prop({ trim: true })
  notes?: string;
}

export const ChannelSettlementSchema =
  SchemaFactory.createForClass(ChannelSettlement);
