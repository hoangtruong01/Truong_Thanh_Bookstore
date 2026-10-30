import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsDateString,
  IsMongoId,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  PricePolicyScope,
  PricePolicyStatus,
} from '../schemas/price-policy.schema';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class CreatePricePolicyDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên chính sách giá không được để trống' })
  name: string;

  @IsEnum(PricePolicyScope, { message: 'Phạm vi chính sách giá không hợp lệ' })
  scope: PricePolicyScope;

  @IsOptional()
  @IsMongoId({ message: 'ID danh mục không hợp lệ' })
  category?: string;

  @IsOptional()
  @IsMongoId({ message: 'ID sản phẩm không hợp lệ' })
  product?: string;

  @IsOptional()
  @IsString()
  channel?: string;

  @IsOptional()
  @IsString()
  customerTier?: string;

  @Type(() => Number)
  @IsNumber({}, { message: 'Tỷ lệ biên lợi nhuận mục tiêu phải là số' })
  @Min(0, { message: 'Biên lợi nhuận không được âm' })
  @Max(99.99, { message: 'Biên lợi nhuận mục tiêu phải nhỏ hơn 100%' })
  targetMarginPercent: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Tỷ lệ markup phải là số' })
  @Min(0, { message: 'Markup không được âm' })
  markupPercent?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Biên lợi nhuận sàn phải là số' })
  @Min(0, { message: 'Biên sàn không được âm' })
  @Max(99.99, { message: 'Biên sàn phải nhỏ hơn 100%' })
  minMarginFloor?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Chiết khấu tối đa phải là số' })
  @Min(0)
  @Max(100)
  maxDiscountPercent?: number;

  @IsOptional()
  @IsDateString({}, { message: 'Ngày bắt đầu hiệu lực không hợp lệ' })
  effectiveFrom?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Ngày kết thúc hiệu lực không hợp lệ' })
  effectiveTo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  priority?: number;

  @IsOptional()
  @IsEnum(PricePolicyStatus)
  status?: PricePolicyStatus;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class UpdatePricePolicyDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(99.99)
  targetMarginPercent?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  markupPercent?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(99.99)
  minMarginFloor?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  maxDiscountPercent?: number;

  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;

  @IsOptional()
  @IsDateString()
  effectiveTo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  priority?: number;

  @IsOptional()
  @IsEnum(PricePolicyStatus)
  status?: PricePolicyStatus;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class PricePolicyQueryDto extends PaginationDto {
  @IsOptional()
  @IsEnum(PricePolicyScope)
  scope?: PricePolicyScope;

  @IsOptional()
  @IsEnum(PricePolicyStatus)
  status?: PricePolicyStatus;

  @IsOptional()
  @IsString()
  search?: string;
}

export class CalculatePriceDto {
  @Type(() => Number)
  @IsNumber({}, { message: 'Giá vốn phải là số' })
  costPrice: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(99.99)
  targetMarginPercent?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  markupPercent?: number;
}

export class CheckMarginDto {
  @Type(() => Number)
  @IsNumber()
  costPrice: number;

  @Type(() => Number)
  @IsNumber()
  sellingPrice: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  discountPercent?: number;

  @IsOptional()
  @IsMongoId()
  productId?: string;

  @IsOptional()
  @IsMongoId()
  categoryId?: string;

  @IsOptional()
  @IsString()
  channel?: string;

  @IsOptional()
  @IsString()
  customerTier?: string;
}
