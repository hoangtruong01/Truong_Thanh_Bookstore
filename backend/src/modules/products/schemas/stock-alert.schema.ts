import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, SchemaTypes } from 'mongoose';

export type StockAlertDocument = StockAlert & Document;

@Schema({ timestamps: true })
export class StockAlert {
  @Prop({ required: true, lowercase: true })
  email: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: false })
  user?: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Product', required: true })
  product: Types.ObjectId;
}

export const StockAlertSchema = SchemaFactory.createForClass(StockAlert);
