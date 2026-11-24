import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SocialAccountDocument = SocialAccount & Document;

export enum SocialPlatform {
  FACEBOOK = 'FACEBOOK',
  TIKTOK = 'TIKTOK',
  INSTAGRAM = 'INSTAGRAM',
  OTHER = 'OTHER',
}

export enum SocialAccountType {
  PAGE = 'PAGE',
  AD_ACCOUNT = 'AD_ACCOUNT',
  CREATOR_PROFILE = 'CREATOR_PROFILE',
}

export enum SocialAccountStatus {
  NOT_CONNECTED = 'NOT_CONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  NEEDS_REAUTH = 'NEEDS_REAUTH',
  DISCONNECTED = 'DISCONNECTED',
  ERROR = 'ERROR',
}

@Schema({ timestamps: true })
export class SocialAccount {
  @Prop({
    type: String,
    enum: Object.values(SocialPlatform),
    required: true,
    index: true,
  })
  platform: SocialPlatform;

  @Prop({ required: true, trim: true })
  accountId: string;

  @Prop({ required: true, trim: true })
  accountName: string;

  @Prop({
    type: String,
    enum: Object.values(SocialAccountType),
    default: SocialAccountType.PAGE,
  })
  accountType: SocialAccountType;

  @Prop({
    type: String,
    enum: Object.values(SocialAccountStatus),
    default: SocialAccountStatus.NOT_CONNECTED,
    index: true,
  })
  status: SocialAccountStatus;

  @Prop({ type: [String], default: [] })
  capabilities: string[]; // e.g. ['read_insights', 'publish_posts']

  @Prop({ trim: true })
  avatarUrl?: string;

  // Stored as encrypted string or hash (never raw token in logs/response)
  @Prop({ trim: true, select: false })
  encryptedAccessToken?: string;

  @Prop({ type: Date })
  tokenExpiresAt?: Date;

  @Prop({ type: Date })
  lastSyncedAt?: Date;

  @Prop({ trim: true })
  lastErrorReason?: string;

  @Prop({ type: Boolean, default: false, index: true })
  isArchived: boolean;
}

export const SocialAccountSchema = SchemaFactory.createForClass(SocialAccount);

SocialAccountSchema.index({ platform: 1, accountId: 1 }, { unique: true });
