import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, SchemaTypes } from 'mongoose';

export type MarketingCampaignDocument = MarketingCampaign & Document;

export enum CampaignObjective {
  AWARENESS = 'AWARENESS',
  TRAFFIC = 'TRAFFIC',
  CONVERSION = 'CONVERSION',
  REORDER = 'REORDER',
  SEASONAL = 'SEASONAL',
  CLEARANCE = 'CLEARANCE',
}

export enum CampaignStatus {
  DRAFT = 'DRAFT',
  IN_REVIEW = 'IN_REVIEW',
  APPROVED = 'APPROVED',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  EXPIRED = 'EXPIRED',
  ARCHIVED = 'ARCHIVED',
}

export enum CampaignChannel {
  FACEBOOK = 'FACEBOOK',
  TIKTOK = 'TIKTOK',
  STOREFRONT = 'STOREFRONT',
  LIVESTREAM = 'LIVESTREAM',
  EMAIL = 'EMAIL',
  OFFLINE = 'OFFLINE',
}

@Schema({ timestamps: true })
export class MarketingCampaign {
  @Prop({
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true,
  })
  code: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({
    type: String,
    enum: Object.values(CampaignObjective),
    default: CampaignObjective.CONVERSION,
    index: true,
  })
  objective: CampaignObjective;

  @Prop({
    type: String,
    enum: Object.values(CampaignStatus),
    default: CampaignStatus.DRAFT,
    index: true,
  })
  status: CampaignStatus;

  @Prop({
    type: [String],
    enum: Object.values(CampaignChannel),
    default: [CampaignChannel.STOREFRONT],
  })
  channels: CampaignChannel[];

  @Prop({ type: Date, index: true })
  startAt?: Date;

  @Prop({ type: Date, index: true })
  endAt?: Date;

  @Prop({
    type: {
      totalBudget: { type: Number, min: 0, default: 0 },
      dailyBudget: { type: Number, min: 0, default: 0 },
      currency: { type: String, default: 'VND' },
    },
    _id: false,
    default: { totalBudget: 0, dailyBudget: 0, currency: 'VND' },
  })
  budgetPlan?: {
    totalBudget?: number;
    dailyBudget?: number;
    currency?: string;
  };

  @Prop({ type: Number, min: 0, default: 0 })
  actualSpend: number;

  @Prop({ trim: true })
  targetAudience?: string;

  @Prop({ trim: true })
  landingPageUrl?: string;

  @Prop({
    type: {
      source: { type: String, trim: true },
      medium: { type: String, trim: true },
      campaign: { type: String, trim: true },
      content: { type: String, trim: true },
    },
    _id: false,
  })
  utmDefaults?: {
    source?: string;
    medium?: string;
    campaign?: string;
    content?: string;
  };

  @Prop({
    type: {
      totalOrders: { type: Number, default: 0 },
      grossRevenue: { type: Number, default: 0 },
      netRevenue: { type: Number, default: 0 },
      lastCalculatedAt: { type: Date },
    },
    _id: false,
    default: { totalOrders: 0, grossRevenue: 0, netRevenue: 0 },
  })
  metrics: {
    totalOrders?: number;
    grossRevenue?: number;
    netRevenue?: number;
    lastCalculatedAt?: Date;
  };

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User' })
  ownerId?: Types.ObjectId;

  @Prop({ type: Number, default: 1 })
  revision: number;

  @Prop({ type: Boolean, default: false, index: true })
  isArchived: boolean;
}

export const MarketingCampaignSchema =
  SchemaFactory.createForClass(MarketingCampaign);

MarketingCampaignSchema.index({ code: 1 }, { unique: true });
MarketingCampaignSchema.index({ status: 1, startAt: 1, endAt: 1 });
