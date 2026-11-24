import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Request,
  UseGuards,
  Ip,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../common/enums';
import { TrackingService } from './tracking.service';
import { CollectEventDto } from './dto/tracking-event.dto';

@ApiTags('Marketing Tracking')
@Controller('marketing/events')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Post()
  @ApiOperation({
    summary: 'Thu thập sự kiện marketing (Public, anonymous-friendly)',
  })
  async collect(
    @Body() dto: CollectEventDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
    @Request() req: any,
  ) {
    const userId = req.user?.userId || req.user?.sub;
    return this.trackingService.recordEvent(dto, userId, ip, userAgent);
  }

  @Get('summary')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Tổng hợp sự kiện marketing theo chiến dịch / thời gian',
  })
  async getSummary(
    @Query('campaign') campaign?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.trackingService.getSummary({ campaign, startDate, endDate });
  }
}
