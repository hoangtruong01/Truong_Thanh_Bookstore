import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, SchemaTypes } from 'mongoose';

export type CodReconciliationBatchDocument = CodReconciliationBatch & Document;

@Schema({ timestamps: true })
export class CodReconciliationBatch {
  @Prop({ required: true, unique: true, index: true })
  statementId: string;

  @Prop({ default: 'GHN' })
  carrier: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'CashAccount', required: true })
  bankAccount: Types.ObjectId;

  @Prop({ required: true, min: 0 })
  totalCod: number;

  @Prop({ required: true, min: 0 })
  totalShipping: number;

  @Prop({ required: true })
  netPayout: number;

  @Prop({ default: 0 })
  matchedOrdersCount: number;

  @Prop({ default: 0 })
  discrepanciesCount: number;

  @Prop({ type: Array, default: [] })
  discrepancies: Array<{
    trackingCode: string;
    reason: string;
  }>;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'CashEntry' })
  cashEntry?: Types.ObjectId;

  @Prop()
  note?: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User' })
  reconciledBy: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

export const CodReconciliationBatchSchema = SchemaFactory.createForClass(
  CodReconciliationBatch,
);
