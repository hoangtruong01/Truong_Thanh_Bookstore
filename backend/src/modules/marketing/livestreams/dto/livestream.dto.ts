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
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  LivestreamPlatform,
  LivestreamStatus,
} from '../schemas/livestream-session.schema';

export class CreateLivestreamDto {
  @ApiProperty({ example: 'Livestream Săn Sale Tựu Trường 2026' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiProperty({
    enum: LivestreamPlatform,
    default: LivestreamPlatform.FACEBOOK,
  })
  @IsNotEmpty()
  @IsEnum(LivestreamPlatform)
  platform: LivestreamPlatform;

  @ApiProperty({ example: 'https://facebook.com/truongthanh/live/12345' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  streamUrl: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  thumbnailUrl?: string;

  @ApiPropertyOptional({
    enum: LivestreamStatus,
    default: LivestreamStatus.SCHEDULED,
  })
  @IsOptional()
  @IsEnum(LivestreamStatus)
  status?: LivestreamStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endAt?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  featuredProductIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  campaignId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class UpdateLivestreamDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ enum: LivestreamPlatform })
  @IsOptional()
  @IsEnum(LivestreamPlatform)
  platform?: LivestreamPlatform;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  streamUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  thumbnailUrl?: string;

  @ApiPropertyOptional({ enum: LivestreamStatus })
  @IsOptional()
  @IsEnum(LivestreamStatus)
  status?: LivestreamStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endAt?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  featuredProductIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  campaignId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  viewerCountPeak?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class UpdateLivestreamStatusDto {
  @ApiProperty({ enum: LivestreamStatus })
  @IsNotEmpty()
  @IsEnum(LivestreamStatus)
  status: LivestreamStatus;
}
