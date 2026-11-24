import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, SchemaTypes } from 'mongoose';

export type MarketingEventDocument = MarketingEvent & Document;

export enum MarketingEventType {
  PAGE_VIEW = 'PAGE_VIEW',
  BANNER_IMPRESSION = 'BANNER_IMPRESSION',
  BANNER_CLICK = 'BANNER_CLICK',
  PRODUCT_VIEW = 'PRODUCT_VIEW',
  ADD_TO_CART = 'ADD_TO_CART',
  INITIATE_CHECKOUT = 'INITIATE_CHECKOUT',
  PURCHASE = 'PURCHASE',
  LIVESTREAM_CLICK = 'LIVESTREAM_CLICK',
  CUSTOM = 'CUSTOM',
}

@Schema({ timestamps: true })
export class MarketingEvent {
  @Prop({
    type: String,
    enum: Object.values(MarketingEventType),
    required: true,
    index: true,
  })
  eventType: MarketingEventType;

  @Prop({ trim: true, index: true })
  sessionId?: string;

  @Prop({ trim: true, index: true })
  anonymousId?: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', index: true })
  userId?: Types.ObjectId;

  @Prop({ trim: true, index: true })
  utmSource?: string;

  @Prop({ trim: true, index: true })
  utmMedium?: string;

  @Prop({ trim: true, index: true })
  utmCampaign?: string;

  @Prop({ trim: true })
  utmContent?: string;

  @Prop({ trim: true })
  utmTerm?: string;

  @Prop({ trim: true })
  url?: string;

  @Prop({ trim: true })
  referrer?: string;

  @Prop({ trim: true, index: true })
  entityType?: string;

  @Prop({ trim: true, index: true })
  entityId?: string;

  @Prop({ type: SchemaTypes.Mixed })
  eventData?: Record<string, any>;

  @Prop({ trim: true })
  ipHash?: string;

  @Prop({ trim: true })
  userAgent?: string;

  @Prop({ type: Date, default: Date.now, index: true })
  timestamp: Date;
}

export const MarketingEventSchema =
  SchemaFactory.createForClass(MarketingEvent);

MarketingEventSchema.index({ eventType: 1, timestamp: -1 });
MarketingEventSchema.index({ utmCampaign: 1, eventType: 1 });
// 90-day TTL data retention (D06)
MarketingEventSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 90 * 24 * 3600 },
);
