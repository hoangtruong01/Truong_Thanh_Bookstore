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

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Category' })
  category?: Types.ObjectId;

  @Prop()
  categoryName?: string;

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

  @Prop({ select: false })
  guestPhoneKey?: string;

  @Prop({ type: Number, select: false })
  guestPendingSlot?: number;

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

  @Prop({ type: Number, default: 0, min: 0 })
  loyaltyPointsAwarded: number;

  @Prop({ type: Number, default: 0, min: 0 })
  loyaltyPointsUsed: number;

  @Prop({ type: Number, default: 0, min: 0 })
  loyaltyDiscount: number;

  @Prop({ type: Boolean, default: false })
  loyaltyPointsRefunded: boolean;

  @Prop()
  revenueRecognizedAt?: Date;

  @Prop()
  autoCancelWarningSentAt?: Date;

  @Prop({ enum: ['GHN'] })
  shippingProvider?: 'GHN';

  @Prop({ index: true })
  trackingCode?: string;

  @Prop()
  shippingStatus?: string;

  @Prop()
  shippingSyncedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

// BE-08 & FIX-2.4: Indexes for order queries
OrderSchema.index({ customer: 1, createdAt: -1 });
OrderSchema.index({ orderStatus: 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ revenueRecognizedAt: -1 });
OrderSchema.index({ promotionCode: 1 });
// BE-10: each phone can occupy only a bounded set of pending guest slots.
// The slot is released automatically when orderStatus leaves PENDING because
// the document no longer participates in this partial unique index.
OrderSchema.index(
  { guestPhoneKey: 1, guestPendingSlot: 1 },
  {
    unique: true,
    partialFilterExpression: {
      guestPhoneKey: { $type: 'string' },
      guestPendingSlot: { $type: 'number' },
      orderStatus: OrderStatus.PENDING,
    },
  },
);
OrderSchema.index(
  { customer: 1, idempotencyKeyHash: 1 },
  {
    unique: true,
    partialFilterExpression: { idempotencyKeyHash: { $type: 'string' } },
  },
);
