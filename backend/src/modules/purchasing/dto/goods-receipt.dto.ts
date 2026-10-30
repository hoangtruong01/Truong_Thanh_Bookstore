import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEnum,
  Min,
  IsInt,
  IsArray,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ItemCondition } from '../schemas/goods-receipt.schema';
import { IsMongoObjectId } from '../../../common/validators';

export class CreateGoodsReceiptItemDto {
  @ApiProperty({ description: 'ID sản phẩm' })
  @IsNotEmpty({ message: 'product không được để trống' })
  @IsMongoObjectId({ message: 'product phải là ObjectId hợp lệ' })
  product: string;

  @ApiPropertyOptional({
    description: 'Đơn vị nhận hàng thực tế',
    example: 'Hộp',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  unit?: string;

  @ApiProperty({
    description: 'Số lượng kiểm đếm thực tế nhận từ đơn vị vận chuyển',
    example: 60,
  })
  @IsNotEmpty({ message: 'receivedQuantity không được để trống' })
  @Type(() => Number)
  @IsInt({ message: 'Số lượng nhận phải là số nguyên' })
  @Min(1, { message: 'Số lượng nhận tối thiểu là 1' })
  receivedQuantity: number;

  @ApiPropertyOptional({
    description: 'Số lượng hàng hỏng, lỗi, không đạt tiêu chuẩn kiểm nhận',
    default: 0,
    example: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Số lượng hàng hỏng phải là số nguyên' })
  @Min(0)
  rejectedQuantity?: number = 0;

  @ApiPropertyOptional({
    enum: ItemCondition,
    default: ItemCondition.GOOD,
    description: 'Tình trạng hàng hóa kiểm nhận',
  })
  @IsOptional()
  @IsEnum(ItemCondition, { message: 'Tình trạng hàng nhận không hợp lệ' })
  condition?: ItemCondition = ItemCondition.GOOD;

  @ApiProperty({
    description: 'Đơn giá mua thực tế trên hóa đơn/phiếu giao (VND)',
    example: 45000,
  })
  @IsNotEmpty({ message: 'actualUnitPrice không được để trống' })
  @Type(() => Number)
  @Min(0, { message: 'Đơn giá không được âm' })
  actualUnitPrice: number;
}

export class CreateGoodsReceiptDto {
  @ApiProperty({ description: 'ID đơn đặt mua hàng (PO)' })
  @IsNotEmpty({ message: 'purchaseOrder không được để trống' })
  @IsMongoObjectId({ message: 'purchaseOrder phải là ObjectId hợp lệ' })
  purchaseOrder: string;

  @ApiProperty({
    description: 'Danh sách sản phẩm nhận hàng',
    type: [CreateGoodsReceiptItemDto],
  })
  @IsArray({ message: 'items phải là một danh sách' })
  @ArrayMinSize(1, {
    message: 'Phiếu nhận hàng phải có ít nhất 1 dòng sản phẩm',
  })
  @ValidateNested({ each: true })
  @Type(() => CreateGoodsReceiptItemDto)
  items: CreateGoodsReceiptItemDto[];

  @ApiPropertyOptional({
    description: 'Khóa idempotency chống tạo trùng lặp phiếu nhận hàng',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  idempotencyKey?: string;

  @ApiPropertyOptional({ description: 'Ghi chú phiếu nhận hàng' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  note?: string;
}

export class GoodsReceiptQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'ID đơn PO' })
  @IsOptional()
  @IsString()
  purchaseOrderId?: string;

  @ApiPropertyOptional({ description: 'ID nhà cung cấp' })
  @IsOptional()
  @IsString()
  supplierId?: string;

  @ApiPropertyOptional({ description: 'Tìm theo mã GR, ghi chú' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  search?: string;

  @ApiPropertyOptional({ description: 'Từ ngày (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Đến ngày (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  endDate?: string;
}
