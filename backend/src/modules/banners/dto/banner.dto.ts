import { IsString, IsOptional, IsEnum, IsNumber, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BannerPosition } from '../schemas/banner.schema';

export class CreateBannerDto {
  @ApiProperty({ description: 'Banner title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Image URL or base64 data' })
  @IsString()
  imageUrl: string;

  @ApiProperty({ description: 'Link URL when banner is clicked', required: false })
  @IsOptional()
  @IsString()
  linkUrl?: string;

  @ApiProperty({ description: 'Banner position in the grid', enum: BannerPosition })
  @IsEnum(BannerPosition)
  position: BannerPosition;

  @ApiProperty({ description: 'Sort order within the position group', required: false })
  @IsOptional()
  @IsNumber()
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
  @IsEnum(BannerPosition)
  position?: BannerPosition;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
