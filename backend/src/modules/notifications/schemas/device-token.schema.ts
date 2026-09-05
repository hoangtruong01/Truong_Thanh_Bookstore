import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';

export type DeviceTokenDocument = DeviceToken & Document;

@Schema({ timestamps: true })
export class DeviceToken {
  @Prop({
    type: SchemaTypes.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  userId: Types.ObjectId;

  @Prop({ required: true, unique: true, select: false })
  token: string;

  @Prop({ required: true, enum: ['android', 'ios', 'web'] })
  platform: 'android' | 'ios' | 'web';

  createdAt: Date;
  updatedAt: Date;
}

export const DeviceTokenSchema = SchemaFactory.createForClass(DeviceToken);
DeviceTokenSchema.index({ userId: 1, updatedAt: -1 });
