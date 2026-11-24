import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, SchemaTypes } from 'mongoose';
import { SocialPlatform } from './social-account.schema';

export type SocialPostDocument = SocialPost & Document;

export enum PostStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SCHEDULED = 'SCHEDULED',
  PUBLISHED = 'PUBLISHED',
  MANUAL_RECORDED = 'MANUAL_RECORDED',
  FAILED = 'FAILED',
  ARCHIVED = 'ARCHIVED',
}

export enum PostType {
  PRODUCT_SPOTLIGHT = 'PRODUCT_SPOTLIGHT',
  PROMOTION_ANNOUNCEMENT = 'PROMOTION_ANNOUNCEMENT',
  TIKTOK_VIDEO_SCRIPT = 'TIKTOK_VIDEO_SCRIPT',
  EDUCATIONAL_BOOK_REVIEW = 'EDUCATIONAL_BOOK_REVIEW',
  GENERAL = 'GENERAL',
}

@Schema({ timestamps: true })
export class SocialPost {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({
    type: String,
    enum: Object.values(SocialPlatform),
    default: SocialPlatform.FACEBOOK,
    index: true,
  })
  platform: SocialPlatform;

  @Prop({
    type: String,
    enum: Object.values(PostType),
    default: PostType.PRODUCT_SPOTLIGHT,
  })
  postType: PostType;

  @Prop({ required: true })
  content: string; // Caption or Script body

  @Prop({ type: [String], default: [] })
  hashtags: string[];

  @Prop({ type: [String], default: [] })
  mediaUrls: string[];

  @Prop({ trim: true })
  targetUrl?: string; // Link to storefront with UTM

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Product', index: true })
  productId?: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'MarketingCampaign', index: true })
  campaignId?: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(PostStatus),
    default: PostStatus.DRAFT,
    index: true,
  })
  status: PostStatus;

  // Video Script Checklist for TikTok (SOC-05)
  @Prop({
    type: {
      hook: { type: String, trim: true },
      bodyPoints: { type: [String], default: [] },
      cta: { type: String, trim: true },
      estimatedDurationSeconds: { type: Number, default: 30 },
    },
    _id: false,
  })
  videoScriptDetails?: {
    hook?: string;
    bodyPoints?: string[];
    cta?: string;
    estimatedDurationSeconds?: number;
  };

  @Prop({ type: Date, index: true })
  scheduledAt?: Date;

  @Prop({ type: Date })
  publishedAt?: Date;

  @Prop({ trim: true })
  externalPostId?: string;

  @Prop({ trim: true })
  externalPermalink?: string;

  @Prop({
    type: {
      impressions: { type: Number, default: 0 },
      reach: { type: Number, default: 0 },
      engagement: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
      lastSyncedAt: { type: Date },
    },
    _id: false,
    default: { impressions: 0, reach: 0, engagement: 0, clicks: 0 },
  })
  metrics: {
    impressions?: number;
    reach?: number;
    engagement?: number;
    clicks?: number;
    lastSyncedAt?: Date;
  };

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User' })
  approvedBy?: Types.ObjectId;

  @Prop({ trim: true })
  rejectionReason?: string;

  @Prop({ type: Number, default: 1 })
  revision: number;

  @Prop({ type: Boolean, default: false, index: true })
  isArchived: boolean;
}

export const SocialPostSchema = SchemaFactory.createForClass(SocialPost);

SocialPostSchema.index({ status: 1, scheduledAt: 1 });
SocialPostSchema.index({ platform: 1, status: 1 });
