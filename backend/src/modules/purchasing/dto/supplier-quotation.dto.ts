import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEnum,
  Min,
  Max,
  IsInt,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  IsDateString,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { QuotationStatus } from '../../../common/enums';
import { IsMongoObjectId } from '../../../common/validators';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class QuotationPriceTierDto {
  @ApiProperty({
    description: 'Số lượng mua tối thiểu để áp dụng giá bậc',
    example: 100,
  })
  @IsNotEmpty({ message: 'minQuantity không được để trống' })
  @Type(() => Number)
  @IsInt({ message: 'minQuantity phải là số nguyên' })
  @Min(1, { message: 'minQuantity tối thiểu là 1' })
  minQuantity: number;

  @ApiProperty({
    description: 'Đơn giá tương ứng với bậc số lượng (VND)',
    example: 42000,
  })
  @IsNotEmpty({ message: 'unitPrice không được để trống' })
  @Type(() => Number)
  @Min(0, { message: 'unitPrice không được âm' })
  unitPrice: number;
}

export class QuotationItemDto {
  @ApiProperty({ description: 'ID sản phẩm' })
  @IsNotEmpty({ message: 'product không được để trống' })
  @IsMongoObjectId({ message: 'product phải là ObjectId hợp lệ' })
  product: string;

  @ApiProperty({
    description: 'Tên sản phẩm',
    example: 'Bút bi Thiên Long TL-027',
  })
  @IsNotEmpty({ message: 'productName không được để trống' })
  @IsString()
  productName: string;

  @ApiProperty({ description: 'SKU sản phẩm', example: 'SKU-TL-027' })
  @IsNotEmpty({ message: 'sku không được để trống' })
  @IsString()
  sku: string;

  @ApiPropertyOptional({ description: 'Đơn vị tính', example: 'cây' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiProperty({
    description: 'Số lượng đặt hàng tối thiểu (MOQ)',
    example: 50,
  })
  @IsNotEmpty({ message: 'moq không được để trống' })
  @Type(() => Number)
  @IsInt({ message: 'moq phải là số nguyên' })
  @Min(1, { message: 'moq tối thiểu là 1' })
  moq: number;

  @ApiProperty({
    description: 'Thời gian giao hàng dự kiến (ngày)',
    example: 3,
  })
  @IsNotEmpty({ message: 'leadTimeDays không được để trống' })
  @Type(() => Number)
  @IsInt({ message: 'leadTimeDays phải là số nguyên' })
  @Min(0, { message: 'leadTimeDays không được âm' })
  leadTimeDays: number;

  @ApiProperty({
    description: 'Đơn giá cơ sở tiêu chuẩn (VND)',
    example: 45000,
  })
  @IsNotEmpty({ message: 'baseUnitPrice không được để trống' })
  @Type(() => Number)
  @Min(0, { message: 'baseUnitPrice không được âm' })
  baseUnitPrice: number;

  @ApiPropertyOptional({
    description: 'Bậc giá theo số lượng',
    type: [QuotationPriceTierDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuotationPriceTierDto)
  priceTiers?: QuotationPriceTierDto[];
}

export class CreateSupplierQuotationDto {
  @ApiProperty({ description: 'ID nhà cung cấp' })
  @IsNotEmpty({ message: 'supplier không được để trống' })
  @IsMongoObjectId({ message: 'supplier phải là ObjectId hợp lệ' })
  supplier: string;

  @ApiProperty({
    description: 'Ngày bắt đầu hiệu lực (ISO 8601)',
    example: '2026-11-01',
  })
  @IsNotEmpty({ message: 'validFrom không được để trống' })
  @IsDateString({}, { message: 'validFrom phải là chuỗi ngày hợp lệ ISO 8601' })
  validFrom: string;

  @ApiProperty({
    description: 'Ngày kết thúc hiệu lực (ISO 8601)',
    example: '2026-12-31',
  })
  @IsNotEmpty({ message: 'validUntil không được để trống' })
  @IsDateString(
    {},
    { message: 'validUntil phải là chuỗi ngày hợp lệ ISO 8601' },
  )
  validUntil: string;

  @ApiPropertyOptional({
    description: 'Điều khoản thanh toán',
    example: 'NET30',
  })
  @IsOptional()
  @IsString()
  paymentTerms?: string;

  @ApiPropertyOptional({
    description: 'Tỷ lệ hàng lỗi từ NCC (0..1)',
    example: 0.01,
  })
  @IsOptional()
  @Type(() => Number)
  @Min(0, { message: 'defectRate không được âm' })
  @Max(1, { message: 'defectRate tối đa là 1 (100%)' })
  defectRate?: number;

  @ApiPropertyOptional({
    description: 'Tỷ lệ giao hàng đúng hạn (0..1)',
    example: 0.98,
  })
  @IsOptional()
  @Type(() => Number)
  @Min(0, { message: 'onTimeDeliveryRate không được âm' })
  @Max(1, { message: 'onTimeDeliveryRate tối đa là 1 (100%)' })
  onTimeDeliveryRate?: number;

  @ApiProperty({
    description: 'Danh sách sản phẩm trong báo giá',
    type: [QuotationItemDto],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'Báo giá phải có ít nhất 1 sản phẩm' })
  @ValidateNested({ each: true })
  @Type(() => QuotationItemDto)
  items: QuotationItemDto[];

  @ApiPropertyOptional({ description: 'Ghi chú bổ sung' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateSupplierQuotationDto extends PartialType(
  CreateSupplierQuotationDto,
) {}

export class QuotationQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Lọc theo ID nhà cung cấp' })
  @IsOptional()
  @IsMongoObjectId({ message: 'supplier phải là ObjectId hợp lệ' })
  supplier?: string;

  @ApiPropertyOptional({
    description: 'Lọc theo trạng thái báo giá',
    enum: QuotationStatus,
  })
  @IsOptional()
  @IsEnum(QuotationStatus, { message: 'Trạng thái báo giá không hợp lệ' })
  status?: QuotationStatus;

  @ApiPropertyOptional({
    description: 'Từ khóa tìm kiếm (Mã báo giá, ghi chú)',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  search?: string;
}

export class CompareSuppliersQueryDto {
  @ApiProperty({ description: 'ID sản phẩm cần so sánh nguồn hàng' })
  @IsNotEmpty({ message: 'productId không được để trống' })
  @IsMongoObjectId({ message: 'productId phải là ObjectId hợp lệ' })
  productId: string;

  @ApiProperty({ description: 'Số lượng dự kiến đặt mua', example: 120 })
  @IsNotEmpty({ message: 'quantity không được để trống' })
  @Type(() => Number)
  @IsInt({ message: 'Số lượng mua phải là số nguyên' })
  @Min(1, { message: 'Số lượng mua tối thiểu là 1' })
  quantity: number;
}

export class CreatePOFromQuotationItemDto {
  @ApiProperty({ description: 'ID sản phẩm' })
  @IsNotEmpty({ message: 'product không được để trống' })
  @IsMongoObjectId({ message: 'product phải là ObjectId hợp lệ' })
  product: string;

  @ApiProperty({ description: 'Số lượng đặt mua', example: 100 })
  @IsNotEmpty({ message: 'orderedQuantity không được để trống' })
  @Type(() => Number)
  @IsInt({ message: 'orderedQuantity phải là số nguyên' })
  @Min(1, { message: 'Số lượng mua tối thiểu là 1' })
  orderedQuantity: number;
}

export class CreatePOFromQuotationDto {
  @ApiProperty({ description: 'ID báo giá đã duyệt' })
  @IsNotEmpty({ message: 'quotationId không được để trống' })
  @IsMongoObjectId({ message: 'quotationId phải là ObjectId hợp lệ' })
  quotationId: string;

  @ApiProperty({
    description: 'Danh sách sản phẩm và số lượng đặt mua',
    type: [CreatePOFromQuotationItemDto],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'PO phải có ít nhất 1 sản phẩm' })
  @ValidateNested({ each: true })
  @Type(() => CreatePOFromQuotationItemDto)
  items: CreatePOFromQuotationItemDto[];

  @ApiPropertyOptional({ description: 'Ngày dự kiến giao hàng (ISO 8601)' })
  @IsOptional()
  @IsDateString(
    {},
    { message: 'expectedDeliveryDate phải là chuỗi ngày hợp lệ ISO 8601' },
  )
  expectedDeliveryDate?: string;

  @ApiPropertyOptional({ description: 'Ghi chú cho đơn đặt hàng PO' })
  @IsOptional()
  @IsString()
  note?: string;
}
