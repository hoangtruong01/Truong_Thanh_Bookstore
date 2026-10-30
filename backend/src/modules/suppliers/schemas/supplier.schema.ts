import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, SchemaTypes } from 'mongoose';

export type SupplierDocument = Supplier & Document;

export enum SupplierStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

@Schema({ _id: false })
export class SuppliedProductItem {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Product', required: true })
  product: Types.ObjectId;

  @Prop({ required: true, min: 0 })
  lastPurchasePrice: number;

  @Prop({ default: Date.now })
  lastPurchasedAt: Date;
}

export const SuppliedProductItemSchema =
  SchemaFactory.createForClass(SuppliedProductItem);

@Schema({ timestamps: true })
export class Supplier {
  @Prop({ required: true, unique: true, uppercase: true, trim: true })
  code: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  contactPerson?: string;

  @Prop({ required: true, trim: true })
  phone: string;

  @Prop({ trim: true, lowercase: true })
  email?: string;

  @Prop({ trim: true })
  address?: string;

  @Prop({ trim: true })
  taxCode?: string;

  @Prop({ type: [SuppliedProductItemSchema], default: [] })
  suppliedProducts: SuppliedProductItem[];

  @Prop({
    type: String,
    enum: SupplierStatus,
    default: SupplierStatus.ACTIVE,
  })
  status: SupplierStatus;

  @Prop({ trim: true })
  notes?: string;

  @Prop({ default: false, index: true })
  isDeleted: boolean;

  @Prop()
  deletedAt?: Date;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

export const SupplierSchema = SchemaFactory.createForClass(Supplier);

SupplierSchema.index({ code: 1, isDeleted: 1 });
SupplierSchema.index({ status: 1, isDeleted: 1 });
SupplierSchema.index({ name: 'text', code: 'text', phone: 'text' });
SupplierSchema.index({ 'suppliedProducts.product': 1 });
