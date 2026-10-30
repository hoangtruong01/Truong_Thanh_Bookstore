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
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { PurchaseOrderStatus } from '../schemas/purchase-order.schema';
import { IsMongoObjectId } from '../../../common/validators';

export class CreatePurchaseOrderItemDto {
  @ApiProperty({ description: 'ID sản phẩm' })
  @IsNotEmpty({ message: 'product không được để trống' })
  @IsMongoObjectId({ message: 'product phải là ObjectId hợp lệ' })
  product: string;

  @ApiPropertyOptional({
    description: 'Đơn vị mua (nếu bỏ trống lấy đơn vị gốc của sản phẩm)',
    example: 'Hộp',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  unit?: string;

  @ApiProperty({ description: 'Số lượng đặt mua', example: 100 })
  @IsNotEmpty({ message: 'orderedQuantity không được để trống' })
  @Type(() => Number)
  @IsInt({ message: 'Số lượng mua phải là số nguyên' })
  @Min(1, { message: 'Số lượng mua tối thiểu là 1' })
  orderedQuantity: number;

  @ApiProperty({ description: 'Đơn giá dự kiến (VND)', example: 45000 })
  @IsNotEmpty({ message: 'expectedUnitPrice không được để trống' })
  @Type(() => Number)
  @Min(0, { message: 'Đơn giá không được âm' })
  expectedUnitPrice: number;
}

export class CreatePurchaseOrderDto {
  @ApiProperty({ description: 'ID nhà cung cấp' })
  @IsNotEmpty({ message: 'supplier không được để trống' })
  @IsMongoObjectId({ message: 'supplier phải là ObjectId hợp lệ' })
  supplier: string;

  @ApiProperty({
    description: 'Danh sách sản phẩm đặt mua',
    type: [CreatePurchaseOrderItemDto],
  })
  @IsArray({ message: 'items phải là một danh sách' })
  @ArrayMinSize(1, { message: 'Đơn đặt mua hàng phải có ít nhất 1 sản phẩm' })
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseOrderItemDto)
  items: CreatePurchaseOrderItemDto[];

  @ApiPropertyOptional({ description: 'Ngày dự kiến giao hàng' })
  @IsOptional()
  @Type(() => Date)
  expectedDeliveryDate?: Date;

  @ApiPropertyOptional({ description: 'Thuế VAT (VND)', default: 0 })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  tax?: number = 0;

  @ApiPropertyOptional({ description: 'Ghi chú đơn đặt mua' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  note?: string;
}

export class UpdatePurchaseOrderDto extends PartialType(
  CreatePurchaseOrderDto,
) {}

export class PurchaseOrderQueryDto {
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

  @ApiPropertyOptional({ description: 'Tìm theo mã PO hoặc ghi chú' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  search?: string;

  @ApiPropertyOptional({ enum: PurchaseOrderStatus })
  @IsOptional()
  @IsEnum(PurchaseOrderStatus)
  status?: PurchaseOrderStatus;

  @ApiPropertyOptional({ description: 'ID nhà cung cấp' })
  @IsOptional()
  @IsString()
  supplierId?: string;

  @ApiPropertyOptional({ description: 'Từ ngày (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Đến ngày (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  endDate?: string;
}

export class ApprovePurchaseOrderDto {
  @ApiPropertyOptional({ description: 'Ghi chú duyệt đơn mua' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  note?: string;
}

export class CancelPurchaseOrderDto {
  @ApiProperty({ description: 'Lý do hủy đơn đặt mua' })
  @IsNotEmpty({ message: 'Lý do hủy không được để trống' })
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  reason: string;
}
