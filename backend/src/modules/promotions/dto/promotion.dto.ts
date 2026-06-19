import { IsNotEmpty, IsOptional, IsNumber, IsString, IsEnum, IsDateString, IsBoolean, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DiscountType } from '../../../common/enums';

export class CreatePromotionDto {
  @ApiProperty({ example: 'SUMMER2024' })
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiProperty({ example: 'Khuyến mãi mùa hè' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: DiscountType })
  @IsNotEmpty()
  @IsEnum(DiscountType)
  discountType: DiscountType;

  @ApiProperty({ example: 10 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  discountValue: number;

  @ApiPropertyOptional({ example: 100000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minOrderValue?: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsNumber()
  usageLimit?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  status?: boolean;
}

export class ApplyPromotionDto {
  @ApiProperty({ example: 'SUMMER2024' })
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiProperty({ example: 500000 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  orderTotal: number;
}
