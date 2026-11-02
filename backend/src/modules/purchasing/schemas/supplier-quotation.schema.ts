import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, SchemaTypes } from 'mongoose';
import { QuotationStatus } from '../../../common/enums';

export type SupplierQuotationDocument = SupplierQuotation & Document;

@Schema({ _id: false })
export class QuotationPriceTier {
  @Prop({ required: true, min: 1 })
  minQuantity: number;

  @Prop({ required: true, min: 0 })
  unitPrice: number;
}

export const QuotationPriceTierSchema =
  SchemaFactory.createForClass(QuotationPriceTier);

@Schema({ _id: false })
export class QuotationItem {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Product', required: true })
  product: Types.ObjectId;

  @Prop({ required: true })
  productName: string;

  @Prop({ required: true })
  sku: string;

  @Prop({ default: 'cái' })
  unit: string;

  @Prop({ required: true, default: 1, min: 1 })
  moq: number;

  @Prop({ required: true, default: 1, min: 0 })
  leadTimeDays: number;

  @Prop({ required: true, min: 0 })
  baseUnitPrice: number;

  @Prop({ type: [QuotationPriceTierSchema], default: [] })
  priceTiers: QuotationPriceTier[];
}

export const QuotationItemSchema = SchemaFactory.createForClass(QuotationItem);

@Schema({ timestamps: true })
export class SupplierQuotation {
  @Prop({ required: true, unique: true, uppercase: true, trim: true })
  quotationCode: string;

  @Prop({
    type: SchemaTypes.ObjectId,
    ref: 'Supplier',
    required: true,
    index: true,
  })
  supplier: Types.ObjectId;

  @Prop({
    type: String,
    enum: QuotationStatus,
    default: QuotationStatus.DRAFT,
    index: true,
  })
  status: QuotationStatus;

  @Prop({ required: true })
  validFrom: Date;

  @Prop({ required: true, index: true })
  validUntil: Date;

  @Prop({ default: 'NET30', trim: true })
  paymentTerms: string;

  @Prop({ default: 0, min: 0, max: 1 })
  defectRate: number;

  @Prop({ default: 1, min: 0, max: 1 })
  onTimeDeliveryRate: number;

  @Prop({ type: [QuotationItemSchema], required: true, default: [] })
  items: QuotationItem[];

  @Prop({ trim: true })
  notes?: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User' })
  approvedBy?: Types.ObjectId;

  @Prop()
  approvedAt?: Date;

  @Prop({ default: false, index: true })
  isDeleted: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const SupplierQuotationSchema =
  SchemaFactory.createForClass(SupplierQuotation);

SupplierQuotationSchema.index({ quotationCode: 1, isDeleted: 1 });
SupplierQuotationSchema.index({ supplier: 1, status: 1, isDeleted: 1 });
SupplierQuotationSchema.index({ 'items.product': 1, status: 1, validUntil: 1 });
