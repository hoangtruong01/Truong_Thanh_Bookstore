import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, SchemaTypes } from 'mongoose';

export type LivestreamSessionDocument = LivestreamSession & Document;

export enum LivestreamPlatform {
  FACEBOOK = 'FACEBOOK',
  TIKTOK = 'TIKTOK',
  YOUTUBE = 'YOUTUBE',
  OTHER = 'OTHER',
}

export enum LivestreamStatus {
  SCHEDULED = 'SCHEDULED',
  LIVE = 'LIVE',
  ENDED = 'ENDED',
  CANCELLED = 'CANCELLED',
}

@Schema({ timestamps: true })
export class LivestreamSession {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({
    type: String,
    enum: Object.values(LivestreamPlatform),
    default: LivestreamPlatform.FACEBOOK,
    index: true,
  })
  platform: LivestreamPlatform;

  @Prop({ required: true, trim: true })
  streamUrl: string;

  @Prop({ trim: true })
  thumbnailUrl?: string;

  @Prop({
    type: String,
    enum: Object.values(LivestreamStatus),
    default: LivestreamStatus.SCHEDULED,
    index: true,
  })
  status: LivestreamStatus;

  @Prop({ type: Date, index: true })
  startAt?: Date;

  @Prop({ type: Date, index: true })
  endAt?: Date;

  @Prop({ type: [{ type: SchemaTypes.ObjectId, ref: 'Product' }] })
  featuredProductIds: Types.ObjectId[];

  @Prop({ type: SchemaTypes.ObjectId, ref: 'MarketingCampaign' })
  campaignId?: Types.ObjectId;

  @Prop({ type: Number, default: 0, min: 0 })
  viewerCountPeak: number;

  @Prop({ trim: true })
  notes?: string;

  @Prop({ type: Boolean, default: false, index: true })
  isArchived: boolean;
}

export const LivestreamSessionSchema =
  SchemaFactory.createForClass(LivestreamSession);

LivestreamSessionSchema.index({ status: 1, startAt: 1 });
