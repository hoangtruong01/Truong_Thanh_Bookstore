import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, SchemaTypes } from 'mongoose';

export type WarehouseStockDocument = WarehouseStock & Document;

@Schema({ timestamps: true })
export class WarehouseStock {
  @Prop({
    type: SchemaTypes.ObjectId,
    ref: 'Warehouse',
    required: true,
    index: true,
  })
  warehouse: Types.ObjectId;

  @Prop({
    type: SchemaTypes.ObjectId,
    ref: 'Product',
    required: true,
    index: true,
  })
  product: Types.ObjectId;

  @Prop({ required: true, default: 0, min: 0 })
  quantity: number;

  @Prop({ required: true, default: 0, min: 0 })
  reservedQuantity: number;

  @Prop({ trim: true })
  binLocation?: string;
}

export const WarehouseStockSchema =
  SchemaFactory.createForClass(WarehouseStock);

WarehouseStockSchema.index({ warehouse: 1, product: 1 }, { unique: true });
WarehouseStockSchema.index({ product: 1, quantity: 1 });
