import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { User } from './user.schema';

export type AddressDocument = Address & Document;

@Schema({ timestamps: true })
export class Address {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user: User | Types.ObjectId | string;

  @Prop({ required: true })
  label: string; // e.g., "Nhà riêng", "Văn phòng"

  @Prop({ required: true })
  recipientName: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ required: true })
  province: string;

  @Prop({ required: true })
  district: string;

  @Prop({ required: true })
  ward: string;

  @Prop({ required: true })
  detail: string;

  @Prop({ default: false })
  isDefault: boolean;

  @Prop({ default: false })
  isDeleted: boolean;
}

export const AddressSchema = SchemaFactory.createForClass(Address);
// Add index for query optimization
AddressSchema.index({ user: 1, isDeleted: 1 });
