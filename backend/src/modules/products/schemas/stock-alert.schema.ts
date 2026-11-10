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

// Phục vụ: findOne({product, email}) khi đăng ký nhận báo hàng về, và find/deleteMany({product})
// khi gửi thông báo (dùng tiền tố `product` của index). Không đặt unique: code chỉ kiểm tra
// check-then-insert (có thể đã có bản ghi trùng do race), unique sẽ làm build index thất bại.
StockAlertSchema.index({ product: 1, email: 1 });
