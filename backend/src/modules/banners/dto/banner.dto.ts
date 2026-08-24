import { IsString, IsOptional, IsEnum, IsNumber, IsBoolean, IsNotEmpty, Min, IsInt } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { BannerPosition } from '../schemas/banner.schema';

export class CreateBannerDto {
  @ApiProperty({ description: 'Banner title' })
  @IsNotEmpty({ message: 'Tiêu đề banner không được để trống' })
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  title: string;

  @ApiProperty({ description: 'Image URL or base64 data' })
  @IsNotEmpty({ message: 'Hình ảnh banner không được để trống' })
  @IsString()
  imageUrl: string;

  @ApiProperty({ description: 'Link URL when banner is clicked', required: false })
  @IsOptional()
  @IsString()
  linkUrl?: string;

  @ApiProperty({ description: 'Banner position in the grid', enum: BannerPosition })
  @IsNotEmpty({ message: 'Vị trí banner không được để trống' })
  @IsEnum(BannerPosition, { message: 'Vị trí banner không hợp lệ' })
  position: BannerPosition;

  @ApiProperty({ description: 'Sort order within the position group', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Thứ tự hiển thị phải là số nguyên' })
  @Min(0, { message: 'Thứ tự hiển thị không được âm' })
  sortOrder?: number;

  @ApiProperty({ description: 'Whether the banner is active', required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateBannerDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  title?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  linkUrl?: string;

  @ApiProperty({ required: false, enum: BannerPosition })
  @IsOptional()
  @IsEnum(BannerPosition, { message: 'Vị trí banner không hợp lệ' })
  position?: BannerPosition;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Thứ tự hiển thị phải là số nguyên' })
  @Min(0, { message: 'Thứ tự hiển thị không được âm' })
  sortOrder?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
