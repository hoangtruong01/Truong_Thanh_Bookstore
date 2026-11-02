import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, SchemaTypes } from 'mongoose';
import { WarehouseType } from '../../../common/enums';

export type WarehouseDocument = Warehouse & Document;

@Schema({ timestamps: true })
export class Warehouse {
  @Prop({ required: true, unique: true, uppercase: true, trim: true })
  code: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({
    type: String,
    enum: WarehouseType,
    default: WarehouseType.MAIN,
    required: true,
  })
  type: WarehouseType;

  @Prop({ required: true, trim: true })
  address: string;

  @Prop({ trim: true })
  phone?: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User' })
  manager?: Types.ObjectId;

  @Prop({ default: false, index: true })
  isDefault: boolean;

  @Prop({ default: true, index: true })
  isActive: boolean;

  @Prop({ trim: true })
  description?: string;
}

export const WarehouseSchema = SchemaFactory.createForClass(Warehouse);

WarehouseSchema.index({ code: 1 }, { unique: true });
WarehouseSchema.index({ type: 1, isActive: 1 });
