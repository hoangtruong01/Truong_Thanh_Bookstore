import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, SchemaTypes } from 'mongoose';
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from '../../../common/enums';

@Schema()
export class OrderItem {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Product', required: false })
  product: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  quantity: number;

  @Prop()
  image: string;
}

export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

@Schema()
export class OrderTimelineItem {
  @Prop({ type: String, enum: OrderStatus, required: true })
  status: OrderStatus | string;

  @Prop()
  note: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const OrderTimelineItemSchema =
  SchemaFactory.createForClass(OrderTimelineItem);

export type OrderDocument = Order & Document;

@Schema({ timestamps: true })
export class Order {
  @Prop({ required: true, unique: true })
  orderCode: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User' })
  customer: Types.ObjectId;

  /**
   * Hashes only: the raw guest/idempotency tokens are returned once to the
   * client and must never be persisted or serialized in API responses.
   */
  @Prop({ select: false })
  guestAccessTokenHash?: string;

  @Prop({ select: false })
  idempotencyKeyHash?: string;

  @Prop({ type: [OrderItemSchema], required: true })
  items: OrderItem[];

  @Prop({ required: true })
  shippingAddress: string;

  @Prop({ required: true })
  phone: string;

  @Prop()
  note: string;

  @Prop({ type: String, enum: PaymentMethod, default: PaymentMethod.COD })
  paymentMethod: PaymentMethod;

  @Prop({ type: String, enum: PaymentStatus, default: PaymentStatus.UNPAID })
  paymentStatus: PaymentStatus;

  @Prop({ type: String, enum: OrderStatus, default: OrderStatus.PENDING })
  orderStatus: OrderStatus;

  @Prop({ required: true })
  subtotal: number;

  @Prop({ default: 0 })
  shippingFee: number;

  @Prop({ default: 0 })
  discount: number;

  @Prop({ required: true })
  total: number;

  @Prop()
  customerName: string;

  @Prop()
  customerEmail: string;

  @Prop()
  promotionCode: string;

  @Prop({ default: 'WEB' })
  orderSource?: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'LandingPage' })
  landingPageId?: Types.ObjectId;

  @Prop({ type: [OrderTimelineItemSchema], default: [] })
  timeline: OrderTimelineItem[];

  @Prop()
  inventoryRestoredAt?: Date;

  @Prop()
  promotionUsageReleasedAt?: Date;

  @Prop({ type: Boolean, default: false })
  loyaltyAwarded: boolean;

  @Prop()
  autoCancelWarningSentAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

// BE-08 & FIX-2.4: Indexes for order queries
OrderSchema.index({ orderCode: 1 }, { unique: true });
OrderSchema.index({ customer: 1, createdAt: -1 });
OrderSchema.index({ orderStatus: 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ promotionCode: 1 });
OrderSchema.index(
  { customer: 1, idempotencyKeyHash: 1 },
  {
    unique: true,
    partialFilterExpression: { idempotencyKeyHash: { $type: 'string' } },
  },
);
