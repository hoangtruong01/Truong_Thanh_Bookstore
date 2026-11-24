/* eslint-disable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access */
import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsNotEmpty,
  Min,
  IsInt,
  IsDate,
  MaxLength,
  Matches,
  ValidateIf,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
  BannerPosition,
  BannerFrequency,
  BannerTargetType,
} from '../schemas/banner.schema';

const SAFE_URL_REGEX = /^(\/|https?:\/\/)/i;

export class CreateBannerDto {
  @ApiProperty({ description: 'Banner title' })
  @IsNotEmpty({ message: 'Tiêu đề banner không được để trống' })
  @IsString()
  @MaxLength(200, { message: 'Tiêu đề banner không vượt quá 200 ký tự' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  title: string;

  @ApiProperty({ description: 'Image URL or base64 data' })
  @IsNotEmpty({ message: 'Hình ảnh banner không được để trống' })
  @IsString()
  imageUrl: string;

  @ApiProperty({
    description: 'Optional mobile-specific image URL',
    required: false,
  })
  @IsOptional()
  @IsString()
  mobileImageUrl?: string;

  @ApiProperty({
    description: 'Image ALT text for accessibility',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200, {
    message: 'Mô tả hình ảnh (altText) không vượt quá 200 ký tự',
  })
  altText?: string;

  @ApiProperty({
    description: 'Link URL when banner is clicked',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Đường dẫn liên kết không vượt quá 1000 ký tự' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @ValidateIf((o) => o.linkUrl && o.linkUrl.length > 0)
  @Matches(SAFE_URL_REGEX, {
    message: 'Đường dẫn liên kết phải bắt đầu bằng / hoặc http://, https://',
  })
  linkUrl?: string;

  @ApiProperty({
    description: 'Navigation target type',
    enum: BannerTargetType,
    required: false,
  })
  @IsOptional()
  @IsEnum(BannerTargetType, { message: 'Loại đích chuyển hướng không hợp lệ' })
  targetType?: BannerTargetType;

  @ApiProperty({ description: 'Target reference ID or Slug', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  targetRef?: string;

  @ApiProperty({
    description: 'Banner position in the grid or entry popup',
    enum: BannerPosition,
  })
  @IsNotEmpty({ message: 'Vị trí banner không được để trống' })
  @IsEnum(BannerPosition, { message: 'Vị trí banner không hợp lệ' })
  position: BannerPosition;

  @ApiProperty({
    description: 'Sort order within the position group',
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Thứ tự hiển thị phải là số nguyên' })
  @Min(0, { message: 'Thứ tự hiển thị không được âm' })
  sortOrder?: number;

  @ApiProperty({ description: 'Whether the banner is active', required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    description: 'Display frequency mode for popup ads',
    enum: BannerFrequency,
    required: false,
  })
  @IsOptional()
  @IsEnum(BannerFrequency, { message: 'Tần suất hiển thị không hợp lệ' })
  frequency?: BannerFrequency;

  @ApiProperty({
    description: 'Scheduled start date/time',
    required: false,
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'Thời gian bắt đầu không hợp lệ' })
  startAt?: Date;

  @ApiProperty({
    description: 'Scheduled expiration date/time',
    required: false,
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'Thời gian kết thúc không hợp lệ' })
  endAt?: Date;

  @ApiProperty({
    description: 'CTA button label for entry popup',
    required: false,
    default: 'Mở',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Nhãn CTA không vượt quá 50 ký tự' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  ctaLabel?: string;

  @ApiProperty({
    description: 'Whether the popup can be closed by user',
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  closeable?: boolean;

  @ApiProperty({
    description: 'Delay in milliseconds before popup opens',
    required: false,
    default: 3000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Thời gian trễ (delayMs) phải là số nguyên' })
  @Min(0, { message: 'Thời gian trễ không được âm' })
  delayMs?: number;

  @ApiProperty({
    description: 'Allowed route names for popup',
    required: false,
    default: ['Home'],
  })
  @IsOptional()
  @IsString({ each: true })
  allowedRouteNames?: string[];

  @ApiProperty({
    description: 'Associated marketing campaign ID',
    required: false,
  })
  @IsOptional()
  @IsString()
  campaignId?: string;

  @ApiProperty({
    description: 'Creative version number',
    required: false,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  creativeVersion?: number;
}

export class UpdateBannerDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Tiêu đề banner không vượt quá 200 ký tự' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  title?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({
    description: 'Optional mobile-specific image URL',
    required: false,
  })
  @IsOptional()
  @IsString()
  mobileImageUrl?: string;

  @ApiProperty({
    description: 'Image ALT text for accessibility',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200, {
    message: 'Mô tả hình ảnh (altText) không vượt quá 200 ký tự',
  })
  altText?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Đường dẫn liên kết không vượt quá 1000 ký tự' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @ValidateIf((o) => o.linkUrl && o.linkUrl.length > 0)
  @Matches(SAFE_URL_REGEX, {
    message: 'Đường dẫn liên kết phải bắt đầu bằng / hoặc http://, https://',
  })
  linkUrl?: string;

  @ApiProperty({
    description: 'Navigation target type',
    enum: BannerTargetType,
    required: false,
  })
  @IsOptional()
  @IsEnum(BannerTargetType, { message: 'Loại đích chuyển hướng không hợp lệ' })
  targetType?: BannerTargetType;

  @ApiProperty({ description: 'Target reference ID or Slug', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  targetRef?: string;

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

  @ApiProperty({
    description: 'Display frequency mode for popup ads',
    enum: BannerFrequency,
    required: false,
  })
  @IsOptional()
  @IsEnum(BannerFrequency, { message: 'Tần suất hiển thị không hợp lệ' })
  frequency?: BannerFrequency;

  @ApiProperty({
    description: 'Scheduled start date/time',
    required: false,
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'Thời gian bắt đầu không hợp lệ' })
  startAt?: Date;

  @ApiProperty({
    description: 'Scheduled expiration date/time',
    required: false,
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'Thời gian kết thúc không hợp lệ' })
  endAt?: Date;

  @ApiProperty({
    description: 'CTA button label for entry popup',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Nhãn CTA không vượt quá 50 ký tự' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  ctaLabel?: string;

  @ApiProperty({
    description: 'Whether the popup can be closed by user',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  closeable?: boolean;

  @ApiProperty({
    description: 'Delay in milliseconds before popup opens',
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Thời gian trễ (delayMs) phải là số nguyên' })
  @Min(0, { message: 'Thời gian trễ không được âm' })
  delayMs?: number;

  @ApiProperty({
    description: 'Allowed route names for popup',
    required: false,
  })
  @IsOptional()
  @IsString({ each: true })
  allowedRouteNames?: string[];

  @ApiProperty({
    description: 'Associated marketing campaign ID',
    required: false,
  })
  @IsOptional()
  @IsString()
  campaignId?: string;

  @ApiProperty({
    description: 'Creative version number',
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  creativeVersion?: number;
}
