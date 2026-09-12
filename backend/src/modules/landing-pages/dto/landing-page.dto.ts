import {
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsString,
  IsArray,
  IsBoolean,
  Min,
  MaxLength,
  Matches,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoObjectId, IsPhoneNumberVN } from '../../../common/validators';

export class LandingPageBenefitDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  icon?: string;
}

export class LandingPagePackageDto {
  @IsString()
  name: string;

  @IsNumber()
  price: number;

  @IsOptional()
  @IsNumber()
  originalPrice?: number;

  @IsOptional()
  @IsString()
  badge?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsBoolean()
  isBestSeller?: boolean;

  @IsOptional()
  @IsMongoObjectId()
  productId?: string;
}

export class LandingPageTestimonialDto {
  @IsString()
  authorName: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsNumber()
  rating?: number;
}

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

  @ApiPropertyOptional({ description: 'ID sản phẩm chính liên kết trong kho' })
  @IsOptional()
  @IsMongoObjectId({ message: 'productId phải là ObjectId hợp lệ' })
  productId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  badgeText?: string;

  @ApiPropertyOptional({ type: () => [LandingPageBenefitDto] })
  @IsOptional()
  @IsArray()
  benefits?: LandingPageBenefitDto[];

  @ApiPropertyOptional({ type: () => [LandingPagePackageDto] })
  @IsOptional()
  @IsArray()
  packages?: LandingPagePackageDto[];

  @ApiPropertyOptional({ type: () => [LandingPageTestimonialDto] })
  @IsOptional()
  @IsArray()
  testimonials?: LandingPageTestimonialDto[];

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

  @ApiPropertyOptional({
    description: 'Khóa chống gửi trùng đơn hàng từ client',
  })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  @Matches(/^[A-Za-z0-9._:-]{16,128}$/, {
    message:
      'idempotencyKey phải dài từ 16 đến 128 ký tự gồm chữ, số hoặc . _ : -',
  })
  idempotencyKey?: string;
}
