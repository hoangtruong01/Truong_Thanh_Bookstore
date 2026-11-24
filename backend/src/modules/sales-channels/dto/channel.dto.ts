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
import { ChannelProvider } from '../schemas/channel-account.schema';
import { MappingSyncStatus } from '../schemas/channel-sku-mapping.schema';

export class ConnectChannelAccountDto {
  @ApiProperty({ enum: ChannelProvider, default: ChannelProvider.TIKTOK_SHOP })
  @IsNotEmpty()
  @IsEnum(ChannelProvider)
  provider: ChannelProvider;

  @ApiProperty({ example: 'tts_shop_vn_102938' })
  @IsNotEmpty()
  @IsString()
  shopId: string;

  @ApiProperty({ example: 'Trường Thành Bookstore Official - TikTok Shop' })
  @IsNotEmpty()
  @IsString()
  shopName: string;

  @ApiPropertyOptional({ example: 'wh_main_01' })
  @IsOptional()
  @IsString()
  authorizedWarehouseId?: string;

  @ApiPropertyOptional({ example: 'app_key_tts_123' })
  @IsOptional()
  @IsString()
  appKey?: string;

  @ApiPropertyOptional({ example: 'secret_key_tts_xyz' })
  @IsOptional()
  @IsString()
  appSecret?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  accessToken?: string;
}

export class CreateSkuMappingDto {
  @ApiProperty({ enum: ChannelProvider, default: ChannelProvider.TIKTOK_SHOP })
  @IsNotEmpty()
  @IsEnum(ChannelProvider)
  provider: ChannelProvider;

  @ApiProperty({ example: 'tts_shop_vn_102938' })
  @IsNotEmpty()
  @IsString()
  shopId: string;

  @ApiProperty({ example: 'tts_sku_998877' })
  @IsNotEmpty()
  @IsString()
  externalSkuId: string;

  @ApiProperty({ example: 'tts_prod_112233' })
  @IsNotEmpty()
  @IsString()
  externalProductId: string;

  @ApiProperty({ example: 'Hộp 20 Bút bi Thiên Long TL-027 Xanh' })
  @IsNotEmpty()
  @IsString()
  externalSkuName: string;

  @ApiProperty({ example: '6b05606010010e99466479f0' })
  @IsNotEmpty()
  @IsString()
  productId: string;

  @ApiProperty({ example: 'TL-027-BL' })
  @IsNotEmpty()
  @IsString()
  sku: string;

  @ApiPropertyOptional({ example: 20, default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  packMultiplier?: number;
}

export class UpdateSkuMappingDto {
  @ApiPropertyOptional({ example: '6b05606010010e99466479f0' })
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiPropertyOptional({ example: 'TL-027-BL' })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  packMultiplier?: number;

  @ApiPropertyOptional({ enum: MappingSyncStatus })
  @IsOptional()
  @IsEnum(MappingSyncStatus)
  syncStatus?: MappingSyncStatus;
}

export class ProcessWebhookDto {
  @ApiProperty({ example: 'evt_tts_order_1001' })
  @IsNotEmpty()
  @IsString()
  eventId: string;

  @ApiProperty({ enum: ChannelProvider, default: ChannelProvider.TIKTOK_SHOP })
  @IsNotEmpty()
  @IsEnum(ChannelProvider)
  provider: ChannelProvider;

  @ApiProperty({ example: 'tts_shop_vn_102938' })
  @IsNotEmpty()
  @IsString()
  shopId: string;

  @ApiProperty({ example: 'ORDER_CREATED' })
  @IsNotEmpty()
  @IsString()
  eventType: string;

  @ApiProperty()
  @IsNotEmpty()
  payload: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  signature?: string;
}

export class RecordSettlementDto {
  @ApiProperty({ example: 'stmt_tts_202611_01' })
  @IsNotEmpty()
  @IsString()
  settlementId: string;

  @ApiProperty({ enum: ChannelProvider, default: ChannelProvider.TIKTOK_SHOP })
  @IsNotEmpty()
  @IsEnum(ChannelProvider)
  provider: ChannelProvider;

  @ApiProperty({ example: 'tts_shop_vn_102938' })
  @IsNotEmpty()
  @IsString()
  shopId: string;

  @ApiProperty({ example: '2026-11-01' })
  @IsNotEmpty()
  @IsDateString()
  periodStart: string;

  @ApiProperty({ example: '2026-11-15' })
  @IsNotEmpty()
  @IsDateString()
  periodEnd: string;

  @ApiProperty({ example: 25000000 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  grossSalesVnd: number;

  @ApiProperty({ example: 1250000 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  platformFeesVnd: number;

  @ApiPropertyOptional({ example: 500000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  commissionFeesVnd?: number;

  @ApiPropertyOptional({ example: 250000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  shippingFeesVnd?: number;

  @ApiProperty({ example: 23000000 })
  @IsNotEmpty()
  @IsNumber()
  netSettlementVnd: number;
}
