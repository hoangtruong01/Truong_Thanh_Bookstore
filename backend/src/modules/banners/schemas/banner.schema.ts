import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BannerDocument = Banner & Document;

export enum BannerPosition {
  MAIN_SLIDER = 'main_slider',
  SIDEBAR_LEFT = 'sidebar_left',
  SIDEBAR_RIGHT_TOP = 'sidebar_right_top',
  SIDEBAR_RIGHT_BOTTOM = 'sidebar_right_bottom',
  BOTTOM_ROW = 'bottom_row',
}

@Schema({ timestamps: true })
export class Banner {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  imageUrl: string;

  @Prop({ default: '' })
  linkUrl: string;

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

  createdAt: Date;
  updatedAt: Date;
}

export const BannerSchema = SchemaFactory.createForClass(Banner);
