import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  Max,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExperimentStatus } from '../schemas/ab-experiment.schema';

export class ExperimentVariantDto {
  @ApiProperty({ description: 'Mã biến thể, ví dụ: control, variant_a', example: 'control' })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty({ description: 'Tên hiển thị biến thể', example: 'Gốc (Nút Đặt Ngay màu xanh)' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Tỷ trọng phần trăm (1-100)', example: 50 })
  @IsNumber()
  @Min(1)
  @Max(100)
  weight: number;

  @ApiPropertyOptional({ description: 'Payload cấu hình JSON cho biến thể' })
  @IsOptional()
  @IsObject()
  payload?: Record<string, any>;
}

export class CreateAbExperimentDto {
  @ApiProperty({ description: 'Tên thử nghiệm A/B', example: 'Thử nghiệm CTA trang Chi tiết' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Key duy nhất định danh thử nghiệm', example: 'pdp_cta_button_color' })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiPropertyOptional({ description: 'Mô tả mục tiêu thử nghiệm' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ExperimentStatus, default: ExperimentStatus.DRAFT })
  @IsOptional()
  @IsEnum(ExperimentStatus)
  status?: ExperimentStatus;

  @ApiProperty({ type: [ExperimentVariantDto], description: 'Danh sách các biến thể' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExperimentVariantDto)
  variants: ExperimentVariantDto[];

  @ApiPropertyOptional({ description: 'Đối tượng áp dụng (ALL, GUEST, CUSTOMER)', default: 'ALL' })
  @IsOptional()
  @IsString()
  targetAudience?: string;

  @ApiPropertyOptional({ description: 'Ngày bắt đầu' })
  @IsOptional()
  startDate?: Date;

  @ApiPropertyOptional({ description: 'Ngày kết thúc' })
  @IsOptional()
  endDate?: Date;
}

export class UpdateAbExperimentDto {
  @ApiPropertyOptional({ description: 'Tên thử nghiệm' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Mô tả thử nghiệm' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ExperimentStatus })
  @IsOptional()
  @IsEnum(ExperimentStatus)
  status?: ExperimentStatus;

  @ApiPropertyOptional({ type: [ExperimentVariantDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExperimentVariantDto)
  variants?: ExperimentVariantDto[];

  @ApiPropertyOptional({ description: 'Biến thể chiến thắng được chọn sau thử nghiệm' })
  @IsOptional()
  @IsString()
  winningVariantKey?: string;
}

export class RecordAbImpressionDto {
  @ApiProperty({ description: 'Mã thử nghiệm' })
  @IsString()
  @IsNotEmpty()
  experimentKey: string;

  @ApiProperty({ description: 'Mã biến thể' })
  @IsString()
  @IsNotEmpty()
  variantKey: string;
}

export class RecordAbConversionDto {
  @ApiProperty({ description: 'Mã thử nghiệm' })
  @IsString()
  @IsNotEmpty()
  experimentKey: string;

  @ApiProperty({ description: 'Mã biến thể' })
  @IsString()
  @IsNotEmpty()
  variantKey: string;

  @ApiPropertyOptional({ description: 'Doanh thu phát sinh từ chuyển đổi', example: 150000 })
  @IsOptional()
  @IsNumber()
  revenue?: number;
}
