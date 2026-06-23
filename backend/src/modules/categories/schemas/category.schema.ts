import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, SchemaTypes } from 'mongoose';

export type CategoryDocument = Category & Document;

@Schema({ timestamps: true })
export class Category {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  slug: string;

  @Prop()
  description: string;

  @Prop()
  image: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Category', default: null })
  parentId: Types.ObjectId | null;

  @Prop({ type: [{ type: SchemaTypes.ObjectId, ref: 'Product' }], default: [] })
  products: Types.ObjectId[];

  @Prop({ type: Number, default: 0 })
  comboPrice: number;

  @Prop({ default: true })
  status: boolean;

  @Prop({ default: '' })
  optionsLabel: string;

  @Prop({ type: String, enum: ['grid', 'pills', ''], default: '' })
  optionsType: 'grid' | 'pills' | '';

  @Prop({ type: [String], default: [] })
  options: string[];

  createdAt: Date;
  updatedAt: Date;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
