import {
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsString,
  IsArray,
  IsBoolean,
  Min,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoObjectId, IsPhoneNumberVN } from '../../../common/validators';

export class CreateLandingPageDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'Tiêu đề không được để trống' })
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  title: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'Slug không được để trống' })
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  slug: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  images?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  countdownMinutes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  originalPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  badgeText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  benefits?: any[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  packages?: any[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  testimonials?: any[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  primaryColor?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  backgroundColor?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  textColor?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customCss?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  status?: boolean;
}

export class GenerateLandingPageDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'Tiêu đề không được để trống' })
  @IsString()
  title: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'Giá không được để trống' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  originalPrice?: number;

  @ApiProperty()
  @IsNotEmpty({ message: 'Danh sách ảnh không được để trống' })
  @IsArray()
  images: string[]; // Base64 images

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  prompt?: string;
}

export class SubmitOrderDto {
  @ApiProperty({ description: 'Landing Page ObjectId' })
  @IsNotEmpty({ message: 'landingPageId không được để trống' })
  @IsMongoObjectId({ message: 'landingPageId phải là ObjectId hợp lệ' })
  landingPageId: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'Họ và tên không được để trống' })
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  fullName: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  @IsPhoneNumberVN()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  phone: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'Địa chỉ nhận hàng không được để trống' })
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  address: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'Gói sản phẩm không được để trống' })
  @IsString()
  packageName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}
