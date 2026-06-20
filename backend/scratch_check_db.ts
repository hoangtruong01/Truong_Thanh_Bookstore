import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes, Types } from 'mongoose';

@Schema()
class TestInventory {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Product' })
  product: Types.ObjectId;
}

const schema = SchemaFactory.createForClass(TestInventory);
console.log('Compiled product path type with SchemaTypes.ObjectId:', schema.path('product').instance);
