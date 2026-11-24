import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
  IsDateString,
  IsNumber,
  Min,
  ValidateNested,
  MaxLength,
  Matches,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  CampaignObjective,
  CampaignStatus,
  CampaignChannel,
} from '../schemas/marketing-campaign.schema';

export class BudgetPlanDto {
  @ApiPropertyOptional({ example: 10000000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalBudget?: number;

  @ApiPropertyOptional({ example: 500000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  dailyBudget?: number;

  @ApiPropertyOptional({ example: 'VND' })
  @IsOptional()
  @IsString()
  currency?: string;
}

export class UtmDefaultsDto {
  @ApiPropertyOptional({ example: 'facebook' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  source?: string;

  @ApiPropertyOptional({ example: 'cpc' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  medium?: string;

  @ApiPropertyOptional({ example: 'khai_truong_2026' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  campaign?: string;

  @ApiPropertyOptional({ example: 'banner_header' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  content?: string;
}

export class CreateCampaignDto {
  @ApiProperty({
    example: 'MKT-2026-001',
    description: 'Mã chiến dịch viết hoa duy nhất',
  })
  @IsNotEmpty({ message: 'Mã chiến dịch không được để trống' })
  @IsString()
  @MaxLength(50)
  @Matches(/^[A-Z0-9_-]+$/, {
    message:
      'Mã chiến dịch chỉ chứa chữ in hoa, số, dấu gạch nối hoặc gạch dưới',
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  code: string;

  @ApiProperty({ example: 'Chiến dịch Khai trương Tựu trường 2026' })
  @IsNotEmpty({ message: 'Tên chiến dịch không được để trống' })
  @IsString()
  @MaxLength(200)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({
    enum: CampaignObjective,
    default: CampaignObjective.CONVERSION,
  })
  @IsOptional()
  @IsEnum(CampaignObjective, { message: 'Mục tiêu chiến dịch không hợp lệ' })
  objective?: CampaignObjective;

  @ApiPropertyOptional({ enum: CampaignChannel, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(CampaignChannel, {
    each: true,
    message: 'Kênh truyền thông không hợp lệ',
  })
  channels?: CampaignChannel[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString({}, { message: 'Ngày bắt đầu không hợp lệ' })
  startAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString({}, { message: 'Ngày kết thúc không hợp lệ' })
  endAt?: string;

  @ApiPropertyOptional({ type: BudgetPlanDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => BudgetPlanDto)
  budgetPlan?: BudgetPlanDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  targetAudience?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  landingPageUrl?: string;

  @ApiPropertyOptional({ type: UtmDefaultsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UtmDefaultsDto)
  utmDefaults?: UtmDefaultsDto;
}

export class UpdateCampaignDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ enum: CampaignObjective })
  @IsOptional()
  @IsEnum(CampaignObjective)
  objective?: CampaignObjective;

  @ApiPropertyOptional({ enum: CampaignChannel, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(CampaignChannel, { each: true })
  channels?: CampaignChannel[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endAt?: string;

  @ApiPropertyOptional({ type: BudgetPlanDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => BudgetPlanDto)
  budgetPlan?: BudgetPlanDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  actualSpend?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  targetAudience?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  landingPageUrl?: string;

  @ApiPropertyOptional({ type: UtmDefaultsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UtmDefaultsDto)
  utmDefaults?: UtmDefaultsDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  revision?: number;
}

export class UpdateCampaignStatusDto {
  @ApiProperty({ enum: CampaignStatus })
  @IsNotEmpty()
  @IsEnum(CampaignStatus, { message: 'Trạng thái chiến dịch không hợp lệ' })
  status: CampaignStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class QueryCampaignDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: CampaignStatus })
  @IsOptional()
  @IsEnum(CampaignStatus)
  status?: CampaignStatus;

  @ApiPropertyOptional({ enum: CampaignObjective })
  @IsOptional()
  @IsEnum(CampaignObjective)
  objective?: CampaignObjective;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;
}
