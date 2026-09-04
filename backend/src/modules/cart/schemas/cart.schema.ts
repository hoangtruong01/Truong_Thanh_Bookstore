import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Product } from '../../products/schemas/product.schema';
import { User } from '../../users/schemas/user.schema';

export type CartDocument = Cart & Document;

@Schema({ _id: false })
export class CartItem {
  @Prop({ type: Types.ObjectId, ref: Product.name, required: true })
  product: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ default: 0, min: 0 })
  discountPrice: number;

  @Prop({ default: '' })
  image: string;

  @Prop({ required: true, min: 1, default: 1 })
  quantity: number;
}

export const CartItemSchema = SchemaFactory.createForClass(CartItem);

@Schema({ _id: false })
export class AppliedVoucher {
  @Prop({ required: true, uppercase: true })
  code: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  discountType: string;

  @Prop({ required: true })
  discountValue: number;

  @Prop({ default: 0 })
  discountAmount: number;

  @Prop({ default: 0 })
  minOrderValue: number;

  @Prop({ default: 0 })
  maxDiscount?: number;
}

export const AppliedVoucherSchema =
  SchemaFactory.createForClass(AppliedVoucher);

@Schema({ timestamps: true })
export class Cart {
  @Prop({
    type: Types.ObjectId,
    ref: User.name,
    required: true,
    unique: true,
    index: true,
  })
  user: Types.ObjectId;

  @Prop({ type: [CartItemSchema], default: [] })
  items: CartItem[];

  @Prop({ default: 0, min: 0 })
  subtotal: number;

  @Prop({ default: 0, min: 0 })
  shippingFee: number;

  @Prop({ default: 0, min: 0 })
  discountAmount: number;

  @Prop({ type: AppliedVoucherSchema, default: null })
  appliedVoucher?: AppliedVoucher;

  @Prop({ default: 0, min: 0 })
  totalPrice: number;
}

export const CartSchema = SchemaFactory.createForClass(Cart);

// BE-08: Explicit unique index for user cart lookups
CartSchema.index({ user: 1 }, { unique: true });
