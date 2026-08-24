import {
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsString,
  IsEnum,
  IsDateString,
  IsBoolean,
  Min,
  IsInt,
  Matches,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DiscountType } from '../../../common/enums';

export class CreatePromotionDto {
  @ApiProperty({ example: 'SUMMER2024' })
  @IsNotEmpty({ message: 'Mã khuyến mãi không được để trống' })
  @IsString()
  @Matches(/^[A-Za-z0-9_-]+$/, { message: 'Mã khuyến mãi chỉ được chứa chữ cái, số, gạch nối hoặc gạch dưới' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  code: string;

  @ApiProperty({ example: 'Khuyến mãi mùa hè' })
  @IsNotEmpty({ message: 'Tên chương trình khuyến mãi không được để trống' })
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  description?: string;

  @ApiProperty({ enum: DiscountType })
  @IsNotEmpty({ message: 'Loại giảm giá không được để trống' })
  @IsEnum(DiscountType, { message: 'Loại giảm giá không hợp lệ (PERCENT hoặc FIXED)' })
  discountType: DiscountType;

  @ApiProperty({ example: 10 })
  @IsNotEmpty({ message: 'Giá trị giảm giá không được để trống' })
  @Type(() => Number)
  @IsNumber({}, { message: 'Giá trị giảm giá phải là số' })
  @Min(0, { message: 'Giá trị giảm giá không được âm' })
  discountValue: number;

  @ApiPropertyOptional({ example: 100000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Giá trị đơn hàng tối thiểu phải là số' })
  @Min(0, { message: 'Giá trị đơn hàng tối thiểu không được âm' })
  minOrderValue?: number;

  @ApiPropertyOptional({ example: 50000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Mức giảm tối đa phải là số' })
  @Min(0, { message: 'Mức giảm tối đa không được âm' })
  maxDiscount?: number;

  @ApiProperty()
  @IsNotEmpty({ message: 'Ngày bắt đầu không được để trống' })
  @IsDateString({}, { message: 'Ngày bắt đầu phải đúng định dạng ISO Date' })
  startDate: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'Ngày kết thúc không được để trống' })
  @IsDateString({}, { message: 'Ngày kết thúc phải đúng định dạng ISO Date' })
  endDate: string;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Giới hạn sử dụng phải là số nguyên' })
  @Min(1, { message: 'Giới hạn sử dụng tối thiểu là 1' })
  usageLimit?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean({ message: 'Trạng thái phải là boolean' })
  status?: boolean;
}

export class ApplyPromotionDto {
  @ApiProperty({ example: 'SUMMER2024' })
  @IsNotEmpty({ message: 'Mã khuyến mãi không được để trống' })
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  code: string;

  @ApiProperty({ example: 500000 })
  @IsNotEmpty({ message: 'Tổng tiền đơn hàng không được để trống' })
  @Type(() => Number)
  @IsNumber({}, { message: 'Tổng tiền đơn hàng phải là số' })
  @Min(0, { message: 'Tổng tiền đơn hàng không được âm' })
  orderTotal: number;
}
