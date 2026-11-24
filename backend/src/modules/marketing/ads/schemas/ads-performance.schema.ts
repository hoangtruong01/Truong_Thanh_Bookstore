import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AdsPerformanceDocument = AdsPerformance & Document;

export enum AdPlatform {
  META = 'META',
  TIKTOK = 'TIKTOK',
  GOOGLE = 'GOOGLE',
  OTHER = 'OTHER',
}

@Schema({ timestamps: true })
export class AdsPerformance {
  @Prop({
    type: String,
    enum: Object.values(AdPlatform),
    required: true,
    index: true,
  })
  platform: AdPlatform;

  @Prop({ required: true, trim: true, index: true })
  adAccountId: string;

  @Prop({ required: true, trim: true, index: true })
  campaignId: string; // External campaign ID from Meta / TikTok

  @Prop({ required: true, trim: true })
  campaignName: string;

  @Prop({ trim: true, index: true })
  internalCampaignCode?: string; // Mapped to MarketingCampaign.code

  @Prop({ type: Date, required: true, index: true })
  date: Date; // Metric report date (YYYY-MM-DD normalized to UTC 00:00:00)

  @Prop({ type: Number, required: true, min: 0 })
  spend: number; // In VND

  @Prop({ type: String, default: 'VND', trim: true })
  currency: string;

  @Prop({ type: Number, default: 0, min: 0 })
  impressions: number;

  @Prop({ type: Number, default: 0, min: 0 })
  clicks: number;

  @Prop({ type: Number, default: 0, min: 0 })
  providerConversions?: number;

  @Prop({ type: Number, default: 0, min: 0 })
  providerConversionValue?: number;

  @Prop({ type: Boolean, default: false })
  isArchived: boolean;
}

export const AdsPerformanceSchema =
  SchemaFactory.createForClass(AdsPerformance);

// Compound unique index to guarantee idempotent sync per campaign, account, and date (ADS-01)
AdsPerformanceSchema.index(
  { platform: 1, adAccountId: 1, campaignId: 1, date: 1 },
  { unique: true },
);
