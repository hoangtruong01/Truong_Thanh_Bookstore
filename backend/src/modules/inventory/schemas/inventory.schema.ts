import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, SchemaTypes } from 'mongoose';
import {
  InventoryStatus,
  InventoryTransactionType,
} from '../../../common/enums';

export type InventoryDocument = Inventory & Document;

@Schema({ timestamps: true })
export class Inventory {
  @Prop({
    type: SchemaTypes.ObjectId,
    ref: 'Product',
    required: true,
    unique: true,
  })
  product: Types.ObjectId;

  @Prop({ default: 0 })
  currentStock: number;

  @Prop({ default: 10 })
  minStock: number;

  @Prop({ default: 1000 })
  maxStock: number;

  @Prop({
    type: String,
    enum: InventoryStatus,
    default: InventoryStatus.IN_STOCK,
  })
  status: InventoryStatus;

  @Prop({ default: Date.now })
  lastUpdated: Date;
}

export const InventorySchema = SchemaFactory.createForClass(Inventory);

// FIX-2.4: Indexes for inventory queries
InventorySchema.index({ status: 1 });
InventorySchema.index({ currentStock: 1 });

export type InventoryTransactionDocument = InventoryTransaction & Document;

@Schema({ timestamps: true })
export class InventoryTransaction {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Product', required: true })
  product: Types.ObjectId;

  @Prop({ type: String, enum: InventoryTransactionType, required: true })
  type: InventoryTransactionType;

  @Prop({ required: true })
  quantity: number;

  @Prop()
  note: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User' })
  createdBy: Types.ObjectId;

  createdAt: Date;
}

export const InventoryTransactionSchema =
  SchemaFactory.createForClass(InventoryTransaction);
