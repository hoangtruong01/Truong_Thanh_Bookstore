import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsDateString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AdPlatform } from '../schemas/ads-performance.schema';

export class RecordAdPerformanceDto {
  @ApiProperty({ enum: AdPlatform, default: AdPlatform.META })
  @IsNotEmpty()
  @IsEnum(AdPlatform)
  platform: AdPlatform;

  @ApiProperty({ example: 'act_1029384756' })
  @IsNotEmpty()
  @IsString()
  adAccountId: string;

  @ApiProperty({ example: '238510293847501' })
  @IsNotEmpty()
  @IsString()
  campaignId: string;

  @ApiProperty({ example: 'Chiến Dịch Khai Trương 2026 - Brand Awareness' })
  @IsNotEmpty()
  @IsString()
  campaignName: string;

  @ApiPropertyOptional({ example: 'KHAITRUONG_2026' })
  @IsOptional()
  @IsString()
  internalCampaignCode?: string;

  @ApiProperty({ example: '2026-11-24' })
  @IsNotEmpty()
  @IsDateString()
  date: string;

  @ApiProperty({ example: 500000 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  spend: number;

  @ApiPropertyOptional({ example: 'VND' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ example: 12500 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  impressions: number;

  @ApiProperty({ example: 340 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  clicks: number;

  @ApiPropertyOptional({ example: 12 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  providerConversions?: number;

  @ApiPropertyOptional({ example: 2450000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  providerConversionValue?: number;
}

export class QueryAdPerformanceDto {
  @ApiPropertyOptional({ enum: AdPlatform })
  @IsOptional()
  @IsEnum(AdPlatform)
  platform?: AdPlatform;

  @ApiPropertyOptional({ example: 'KHAITRUONG_2026' })
  @IsOptional()
  @IsString()
  internalCampaignCode?: string;

  @ApiPropertyOptional({ example: '2026-11-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-11-30' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class MapAdCampaignDto {
  @ApiProperty({ example: '238510293847501' })
  @IsNotEmpty()
  @IsString()
  campaignId: string;

  @ApiProperty({ example: 'KHAITRUONG_2026' })
  @IsNotEmpty()
  @IsString()
  internalCampaignCode: string;
}
