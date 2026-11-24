import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  IsDateString,
  IsNumber,
  Min,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  SocialPlatform,
  SocialAccountType,
} from '../schemas/social-account.schema';
import { PostStatus, PostType } from '../schemas/social-post.schema';

export class ConnectSocialAccountDto {
  @ApiProperty({ enum: SocialPlatform })
  @IsNotEmpty()
  @IsEnum(SocialPlatform)
  platform: SocialPlatform;

  @ApiProperty({ example: '1092837465' })
  @IsNotEmpty()
  @IsString()
  accountId: string;

  @ApiProperty({ example: 'Nhà sách Trường Thành - Fanpage Chính Thức' })
  @IsNotEmpty()
  @IsString()
  accountName: string;

  @ApiPropertyOptional({ enum: SocialAccountType })
  @IsOptional()
  @IsEnum(SocialAccountType)
  accountType?: SocialAccountType;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  capabilities?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  accessToken?: string;
}

export class VideoScriptDetailsDto {
  @ApiPropertyOptional({
    example: '3 dụng cụ học tập không thể thiếu cho kỳ thi sắp tới!',
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  hook?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  bodyPoints?: string[];

  @ApiPropertyOptional({
    example: 'Bấm ngay link bio để nhận ưu đãi giảm 20% hôm nay!',
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  cta?: string;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @IsNumber()
  @Min(5)
  estimatedDurationSeconds?: number;
}

export class CreateSocialPostDto {
  @ApiProperty({ example: 'Khám phá Bộ Sưu Tập Bút Cao Cấp 2026' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiProperty({ enum: SocialPlatform, default: SocialPlatform.FACEBOOK })
  @IsNotEmpty()
  @IsEnum(SocialPlatform)
  platform: SocialPlatform;

  @ApiProperty({ enum: PostType, default: PostType.PRODUCT_SPOTLIGHT })
  @IsOptional()
  @IsEnum(PostType)
  postType?: PostType;

  @ApiProperty({ example: 'Bộ bút bi chất lượng cao, nét mực êm mượt...' })
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hashtags?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mediaUrls?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  targetUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  campaignId?: string;

  @ApiPropertyOptional({ type: VideoScriptDetailsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => VideoScriptDetailsDto)
  videoScriptDetails?: VideoScriptDetailsDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}

export class UpdateSocialPostDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ enum: SocialPlatform })
  @IsOptional()
  @IsEnum(SocialPlatform)
  platform?: SocialPlatform;

  @ApiPropertyOptional({ enum: PostType })
  @IsOptional()
  @IsEnum(PostType)
  postType?: PostType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hashtags?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mediaUrls?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  targetUrl?: string;

  @ApiPropertyOptional({ type: VideoScriptDetailsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => VideoScriptDetailsDto)
  videoScriptDetails?: VideoScriptDetailsDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  revision?: number;
}

export class UpdatePostStatusDto {
  @ApiProperty({ enum: PostStatus })
  @IsNotEmpty()
  @IsEnum(PostStatus)
  status: PostStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}

export class RecordManualPostDto {
  @ApiProperty({ example: 'https://facebook.com/truongthanh/posts/1029384756' })
  @IsNotEmpty()
  @IsString()
  externalPermalink: string;

  @ApiPropertyOptional({ example: 'fb_post_1029384756' })
  @IsOptional()
  @IsString()
  externalPostId?: string;
}

export class GenerateContentFromProductDto {
  @ApiProperty({ example: '6b05606010010e99466479f0' })
  @IsNotEmpty()
  @IsString()
  productId: string;

  @ApiProperty({ enum: SocialPlatform, default: SocialPlatform.FACEBOOK })
  @IsNotEmpty()
  @IsEnum(SocialPlatform)
  platform: SocialPlatform;

  @ApiPropertyOptional({ example: 'thân thiện, hào hứng, kích thích mua sắm' })
  @IsOptional()
  @IsString()
  tone?: string;

  @ApiPropertyOptional({ example: 'KHAITRUONG_2026' })
  @IsOptional()
  @IsString()
  campaignCode?: string;
}

export class QuerySocialPostDto {
  @ApiPropertyOptional({ enum: SocialPlatform })
  @IsOptional()
  @IsEnum(SocialPlatform)
  platform?: SocialPlatform;

  @ApiPropertyOptional({ enum: PostStatus })
  @IsOptional()
  @IsEnum(PostStatus)
  status?: PostStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}
