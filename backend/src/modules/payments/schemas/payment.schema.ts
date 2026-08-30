import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, SchemaTypes } from 'mongoose';
import { PaymentMethod, PaymentStatus } from '../../../common/enums';

export type PaymentDocument = Payment & Document;

@Schema({ timestamps: true })
export class Payment {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Order', required: true, index: true })
  order: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', index: true })
  user: Types.ObjectId;

  @Prop({ required: true, index: true })
  orderCode: string;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({
    type: String,
    enum: Object.values(PaymentMethod),
    default: PaymentMethod.COD,
  })
  provider: PaymentMethod;

  @Prop({
    type: String,
    enum: Object.values(PaymentStatus),
    default: PaymentStatus.PENDING,
    index: true,
  })
  status: PaymentStatus;

  @Prop()
  transactionId?: string;

  @Prop()
  providerReference?: string;

  @Prop({ type: Object, default: {} })
  gatewayResponse: Record<string, any>;

  @Prop()
  paidAt: Date;

  @Prop()
  expiresAt?: Date;

  @Prop()
  callbackProcessedAt?: Date;

  @Prop()
  failureReason?: string;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

PaymentSchema.index({ order: 1, provider: 1 });
PaymentSchema.index({ createdAt: -1 });
PaymentSchema.index(
  { providerReference: 1 },
  { unique: true, partialFilterExpression: { providerReference: { $type: 'string' } } },
);
PaymentSchema.index(
  { transactionId: 1, provider: 1 },
  { unique: true, partialFilterExpression: { transactionId: { $type: 'string' } } },
);
PaymentSchema.index({ expiresAt: 1, status: 1 });
