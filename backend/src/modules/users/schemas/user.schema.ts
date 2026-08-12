import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, SchemaTypes } from 'mongoose';
import { UserRole, LoyaltyTier } from '../../../common/enums';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true, unique: true, lowercase: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop()
  phone: string;

  @Prop({ type: String, enum: UserRole, default: UserRole.CUSTOMER })
  role: UserRole;

  @Prop()
  avatar: string;

  @Prop({ default: true })
  status: boolean;

  @Prop()
  resetOtp?: string;

  @Prop()
  resetOtpExpiry?: Date;

  @Prop({ default: 0 })
  resetOtpAttempts?: number;

  @Prop({ type: [{ type: SchemaTypes.ObjectId, ref: 'Product' }], default: [] })
  wishlist: Types.ObjectId[];

  @Prop({ default: 0 })
  loyaltyPoints: number;

  @Prop({ type: String, enum: LoyaltyTier, default: LoyaltyTier.BRONZE })
  loyaltyTier: LoyaltyTier;

  @Prop({ type: [String], default: [] })
  permissions: string[];

  createdAt: Date;
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

