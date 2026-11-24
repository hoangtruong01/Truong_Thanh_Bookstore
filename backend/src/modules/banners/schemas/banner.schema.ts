import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BannerDocument = Banner & Document;

export enum BannerPosition {
  MAIN_SLIDER = 'main_slider',
  SIDEBAR_LEFT = 'sidebar_left',
  SIDEBAR_RIGHT_TOP = 'sidebar_right_top',
  SIDEBAR_RIGHT_BOTTOM = 'sidebar_right_bottom',
  BOTTOM_ROW = 'bottom_row',
  ENTRY_POPUP = 'entry_popup',
}

export enum BannerFrequency {
  EVERY_VISIT = 'EVERY_VISIT',
  ONCE_PER_SESSION = 'ONCE_PER_SESSION',
  ONCE_PER_DAY = 'ONCE_PER_DAY',
}

export enum BannerTargetType {
  NONE = 'NONE',
  PRODUCT = 'PRODUCT',
  CATEGORY = 'CATEGORY',
  LANDING_PAGE = 'LANDING_PAGE',
  INTERNAL_PATH = 'INTERNAL_PATH',
  EXTERNAL_HTTPS = 'EXTERNAL_HTTPS',
  LIVESTREAM = 'LIVESTREAM',
}

@Schema({ timestamps: true })
export class Banner {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  imageUrl: string;

  @Prop({ type: String, required: false, default: null })
  mobileImageUrl?: string;

  @Prop({ type: String, required: false, default: '' })
  altText?: string;

  @Prop({ default: '' })
  linkUrl: string;

  @Prop({
    type: String,
    enum: BannerTargetType,
    required: false,
    default: BannerTargetType.INTERNAL_PATH,
  })
  targetType?: BannerTargetType;

  @Prop({ type: String, required: false, default: '' })
  targetRef?: string;

  @Prop({
    type: String,
    enum: BannerPosition,
    required: true,
    default: BannerPosition.MAIN_SLIDER,
  })
  position: BannerPosition;

  @Prop({ default: 0 })
  sortOrder: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({
    type: String,
    enum: BannerFrequency,
    required: false,
    default: BannerFrequency.EVERY_VISIT,
  })
  frequency?: BannerFrequency;

  @Prop({ type: Date, required: false, default: null })
  startAt?: Date;

  @Prop({ type: Date, required: false, default: null })
  endAt?: Date;

  @Prop({ type: String, required: false, default: 'Mở' })
  ctaLabel?: string;

  @Prop({ type: Boolean, required: false, default: true })
  closeable?: boolean;

  @Prop({ type: Number, required: false, default: 3000 })
  delayMs?: number;

  @Prop({ type: [String], required: false, default: ['Home'] })
  allowedRouteNames?: string[];

  @Prop({ type: String, required: false, default: null })
  campaignId?: string;

  @Prop({ type: Number, required: false, default: 1 })
  creativeVersion?: number;

  @Prop({ type: Number, required: false, default: 0 })
  impressionCount?: number;

  @Prop({ type: Number, required: false, default: 0 })
  clickCount?: number;

  createdAt: Date;
  updatedAt: Date;
}

export const BannerSchema = SchemaFactory.createForClass(Banner);
