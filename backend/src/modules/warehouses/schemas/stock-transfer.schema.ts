import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, SchemaTypes } from 'mongoose';
import { StockTransferStatus } from '../../../common/enums';

export type StockTransferDocument = StockTransfer & Document;

@Schema({ _id: false })
export class StockTransferItem {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Product', required: true })
  product: Types.ObjectId;

  @Prop({ required: true })
  productName: string;

  @Prop({ required: true })
  sku: string;

  @Prop({ required: true, min: 1 })
  requestedQty: number;

  @Prop({ required: true, default: 0, min: 0 })
  shippedQty: number;

  @Prop({ required: true, default: 0, min: 0 })
  receivedQty: number;

  @Prop({ required: true, default: 0 })
  variance: number; // shippedQty - receivedQty

  @Prop({ default: 0, min: 0 })
  costPrice: number;

  @Prop({ trim: true })
  note?: string;
}

export const StockTransferItemSchema =
  SchemaFactory.createForClass(StockTransferItem);

@Schema({ timestamps: true })
export class StockTransfer {
  @Prop({ required: true, unique: true, uppercase: true, trim: true })
  transferCode: string;

  @Prop({
    type: SchemaTypes.ObjectId,
    ref: 'Warehouse',
    required: true,
    index: true,
  })
  fromWarehouse: Types.ObjectId;

  @Prop({
    type: SchemaTypes.ObjectId,
    ref: 'Warehouse',
    required: true,
    index: true,
  })
  toWarehouse: Types.ObjectId;

  @Prop({ type: [StockTransferItemSchema], required: true, default: [] })
  items: StockTransferItem[];

  @Prop({
    type: String,
    enum: StockTransferStatus,
    default: StockTransferStatus.DRAFT,
    index: true,
  })
  status: StockTransferStatus;

  @Prop({ trim: true })
  note?: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User' })
  approvedBy?: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User' })
  shippedBy?: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User' })
  receivedBy?: Types.ObjectId;

  @Prop()
  shippedAt?: Date;

  @Prop()
  receivedAt?: Date;
}

export const StockTransferSchema = SchemaFactory.createForClass(StockTransfer);

StockTransferSchema.index({ transferCode: 1 }, { unique: true });
StockTransferSchema.index({ fromWarehouse: 1, toWarehouse: 1, status: 1 });
StockTransferSchema.index({ createdAt: -1 });
