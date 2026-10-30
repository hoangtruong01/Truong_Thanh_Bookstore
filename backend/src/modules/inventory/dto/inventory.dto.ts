import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEnum,
  Min,
  IsInt,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  InventoryStatus,
  InventoryTransactionType,
} from '../../../common/enums';
import { IsMongoObjectId } from '../../../common/validators';

export class InventoryTransactionDto {
  @ApiProperty({
    description: 'ID sản phẩm',
    example: '507f1f77bcf86cd799439011',
  })
  @IsNotEmpty({ message: 'product không được để trống' })
  @IsMongoObjectId({ message: 'product phải là ObjectId hợp lệ' })
  product: string;

  @ApiProperty({ description: 'Số lượng giao dịch', example: 10 })
  @IsNotEmpty({ message: 'Số lượng không được để trống' })
  @Type(() => Number)
  @IsInt({ message: 'Số lượng phải là số nguyên' })
  @Min(1, { message: 'Số lượng tối thiểu là 1' })
  quantity: number;

  @ApiPropertyOptional({
    enum: InventoryTransactionType,
    default: InventoryTransactionType.IMPORT,
  })
  @IsOptional()
  @IsEnum(InventoryTransactionType, {
    message: 'Loại giao dịch kho không hợp lệ',
  })
  type?: InventoryTransactionType;

  @ApiPropertyOptional({
    description: 'Mã tham chiếu/idempotency của nghiệp vụ kho',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  reference?: string;

  @ApiPropertyOptional({
    description: 'Khóa chống trùng lặp idempotency (alias của reference)',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  idempotencyKey?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  note?: string;
}

export class AdjustInventoryDto {
  @ApiProperty({
    description: 'ID sản phẩm',
    example: '507f1f77bcf86cd799439011',
  })
  @IsNotEmpty({ message: 'product không được để trống' })
  @IsMongoObjectId({ message: 'product phải là ObjectId hợp lệ' })
  product: string;

  @ApiPropertyOptional({
    description: 'Số lượng tồn kho thực tế sau kiểm kê (TT-001)',
    example: 15,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Số lượng kho mới phải là số nguyên' })
  @Min(0, { message: 'Tồn kho không thể âm' })
  newStock?: number;

  @ApiPropertyOptional({
    description: 'Số lượng điều chỉnh (có thể âm hoặc dương - legacy format)',
    example: -5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Số lượng điều chỉnh phải là số nguyên' })
  quantity?: number;

  @ApiPropertyOptional({
    description:
      'Tồn kho hiện tại mà client thấy trước khi điều chỉnh (chống xung đột dữ liệu)',
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'expectedCurrentStock phải là số nguyên' })
  @Min(0)
  expectedCurrentStock?: number;

  @ApiPropertyOptional({
    description: 'Lý do/ghi chú điều chỉnh',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  note?: string;

  @ApiPropertyOptional({
    description: 'Mã tham chiếu/idempotency của nghiệp vụ kho',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  reference?: string;

  @ApiPropertyOptional({
    description: 'Khóa chống trùng lặp idempotency (alias của reference)',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  idempotencyKey?: string;
}

export class InventoryQueryDto {
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

  @ApiPropertyOptional({ description: 'Tìm theo tên sản phẩm, SKU' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  search?: string;

  @ApiPropertyOptional({ enum: InventoryStatus })
  @IsOptional()
  @IsEnum(InventoryStatus)
  status?: InventoryStatus;

  @ApiPropertyOptional({ description: 'ID danh mục' })
  @IsOptional()
  @IsString()
  category?: string;
}

export class InventoryTransactionQueryDto {
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

  @ApiPropertyOptional({ description: 'Lọc theo ID sản phẩm' })
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiPropertyOptional({ description: 'Lọc theo mã SKU' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  sku?: string;

  @ApiPropertyOptional({ enum: InventoryTransactionType })
  @IsOptional()
  @IsEnum(InventoryTransactionType)
  type?: InventoryTransactionType;

  @ApiPropertyOptional({ description: 'Từ ngày (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Đến ngày (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'ID người thực hiện' })
  @IsOptional()
  @IsString()
  createdBy?: string;

  @ApiPropertyOptional({
    description: 'Từ khóa tìm kiếm (tên sản phẩm, SKU, ghi chú, mã tham chiếu)',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  search?: string;
}
