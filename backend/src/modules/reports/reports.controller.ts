import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { StaffPermission } from '../../common/enums';

@ApiTags('reports')
@Controller('reports')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Permissions(StaffPermission.VIEW_REPORTS)
@ApiBearerAuth()
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  getDashboard() {
    return this.reportsService.getDashboard();
  }

  @Get('revenue')
  @ApiOperation({ summary: 'Get revenue by date range' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  getRevenue(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getRevenue(startDate, endDate);
  }

  @Get('best-selling-products')
  @ApiOperation({ summary: 'Get best selling products' })
  @ApiQuery({ name: 'limit', required: false })
  getBestSellingProducts(@Query('limit') limit?: number) {
    return this.reportsService.getBestSellingProducts(limit);
  }

  @Get('low-stock-products')
  @ApiOperation({ summary: 'Get low stock products' })
  getLowStockProducts() {
    return this.reportsService.getLowStockProducts();
  }

  @Get('notifications')
  @ApiOperation({ summary: 'Get admin system notifications' })
  getNotifications() {
    return this.reportsService.getNotifications();
  }

  @Get('dashboard/advanced')
  @ApiOperation({ summary: 'Get advanced dashboard reports' })
  getAdvancedDashboard() {
    return this.reportsService.getAdvancedDashboard();
  }
}
