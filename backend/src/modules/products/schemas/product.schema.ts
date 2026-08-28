import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, SchemaTypes } from 'mongoose';
import { ProductStatus } from '../../../common/enums';

export type ProductDocument = Product & Document;

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  slug: string;

  @Prop({ required: true, unique: true })
  sku: string;

  @Prop()
  description: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Category' })
  category: Types.ObjectId;

  @Prop()
  brand: string;

  @Prop()
  author: string;

  @Prop()
  publisher: string;

  @Prop()
  isbn: string;

  @Prop()
  publicationYear: number;

  @Prop({ type: [String], default: [] })
  subOptions: string[];

  @Prop({ required: true })
  price: number;

  @Prop({ default: 0 })
  discountPrice: number;

  @Prop({ default: 0 })
  stock: number;

  @Prop({ default: 'cái' })
  unit: string;

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ default: 0 })
  rating: number;

  @Prop({ default: 0 })
  sold: number;

  @Prop({ type: String, enum: ProductStatus, default: ProductStatus.ACTIVE })
  status: ProductStatus;

  @Prop({ default: false })
  isFeatured: boolean;

  @Prop({ default: false })
  isFlashSale: boolean;

  @Prop()
  flashSaleExpiry: Date;

  @Prop({ default: false })
  isDeleted: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

// FIX-2.4 & TASK 12: Indexes for search, multi-criteria filter, and sort performance
ProductSchema.index({
  name: 'text',
  description: 'text',
  author: 'text',
  publisher: 'text',
  sku: 'text',
  isbn: 'text',
  brand: 'text',
});
ProductSchema.index({ category: 1, isDeleted: 1, status: 1 });
ProductSchema.index({ price: 1, isDeleted: 1 });
ProductSchema.index({ discountPrice: 1, isDeleted: 1 });
ProductSchema.index({ sold: -1, isDeleted: 1 });
ProductSchema.index({ rating: -1, isDeleted: 1 });
ProductSchema.index({ isDeleted: 1, createdAt: -1 });
ProductSchema.index({ isFeatured: 1, isDeleted: 1 });
ProductSchema.index({ author: 1, isDeleted: 1 });
ProductSchema.index({ publisher: 1, isDeleted: 1 });
ProductSchema.index({ brand: 1, isDeleted: 1 });
ProductSchema.index({ sku: 1, isDeleted: 1 });
ProductSchema.index({ isbn: 1, isDeleted: 1 });
