import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../common/enums';
import { AdsService } from './ads.service';
import {
  RecordAdPerformanceDto,
  QueryAdPerformanceDto,
  MapAdCampaignDto,
} from './dto/ads.dto';

@ApiTags('Marketing Ads & Measurement')
@Controller('marketing/ads')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class AdsController {
  constructor(private readonly adsService: AdsService) {}

  @Get('performance')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({
    summary:
      'Lấy dữ liệu hiệu quả quảng cáo và chỉ số tổng hợp (CTR, CPC, Spend)',
  })
  async findAll(@Query() query: QueryAdPerformanceDto) {
    return this.adsService.findAll(query);
  }

  @Post('performance')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Ghi nhận hoặc đồng bộ dữ liệu hiệu quả chiến dịch quảng cáo',
  })
  async recordPerformance(@Body() dto: RecordAdPerformanceDto) {
    return this.adsService.recordPerformance(dto);
  }

  @Post('map-campaign')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Liên kết mã chiến dịch ngoài (Meta/TikTok) với chiến dịch nội bộ',
  })
  async mapCampaign(@Body() dto: MapAdCampaignDto) {
    return this.adsService.mapCampaign(dto);
  }

  @Get('roas')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({
    summary:
      'Tính toán Blended ROAS đối chiếu doanh thu đơn hàng thực tế và chi phí ads',
  })
  async getBlendedRoas(@Query('campaignCode') campaignCode?: string) {
    return this.adsService.getBlendedRoas(campaignCode);
  }
}
