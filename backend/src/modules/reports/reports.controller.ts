import { Controller, Get, Query, UseGuards, Res } from '@nestjs/common';
import { Response } from 'express';
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
import {
  InventoryLedgerQueryDto,
  ReorderSuggestionQueryDto,
} from './dto/inventory-ledger.dto';

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
  @ApiOperation({
    summary: 'Get revenue by date range and sales channel (NEW-013)',
  })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({
    name: 'channel',
    required: false,
    enum: ['ALL', 'POS', 'WEB', 'MOBILE', 'WHOLESALE'],
  })
  getRevenue(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('channel') channel?: string,
  ) {
    return this.reportsService.getRevenue(startDate, endDate, channel);
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

  @Get('summary')
  @ApiOperation({ summary: 'Lấy báo cáo tổng hợp KPI và biểu đồ dashboard' })
  @ApiQuery({
    name: 'range',
    required: false,
    enum: ['day', 'week', 'month', 'year'],
  })
  getSummary(@Query('range') range?: 'day' | 'week' | 'month' | 'year') {
    return this.reportsService.getSummary(range);
  }

  @Get('order-status-stats')
  @ApiOperation({ summary: 'Lấy phân bổ tỷ lệ các trạng thái đơn hàng' })
  getOrderStatusStats() {
    return this.reportsService.getOrderStatusStats();
  }

  @Get('category-revenue')
  @ApiOperation({
    summary: 'Lấy cơ cấu doanh thu theo danh mục sản phẩm (NEW-016)',
  })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({
    name: 'channel',
    required: false,
    enum: ['ALL', 'POS', 'WEB', 'MOBILE', 'WHOLESALE'],
  })
  getCategoryRevenue(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('channel') channel?: string,
  ) {
    return this.reportsService.getCategoryRevenue(startDate, endDate, channel);
  }

  /**
   * ERP-05 / REP-02 & REP-04: Báo cáo Nhập Xuất Tồn và Lãi Gộp
   */
  @Get('inventory-ledger-profit')
  @ApiOperation({
    summary: 'Báo cáo Nhập Xuất Tồn và Lãi Gộp theo sản phẩm và kỳ (ERP-05)',
  })
  getInventoryLedgerProfit(@Query() query: InventoryLedgerQueryDto) {
    return this.reportsService.getInventoryLedgerAndProfit(query);
  }

  /**
   * DOC-04: Xuất Excel Báo cáo Nhập Xuất Tồn và Lãi Gộp
   */
  @Get('export/inventory-ledger-profit')
  @ApiOperation({
    summary: 'Xuất file Excel Báo cáo Nhập Xuất Tồn và Lãi Gộp (ERP-05)',
  })
  async exportInventoryLedgerProfit(
    @Query() query: InventoryLedgerQueryDto,
    @Res() res: Response,
  ) {
    const buffer =
      await this.reportsService.exportInventoryLedgerProfitToExcel(query);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=nhap-xuat-ton-lai-gop.xlsx',
    );
    res.send(buffer);
  }

  /**
   * ERP-06: Đề xuất nhập hàng thông minh (Smart Reordering Suggestions)
   */
  @Get('reorder-suggestions')
  @ApiOperation({
    summary: 'Gợi ý và đề xuất số lượng đặt mua hàng thông minh (ERP-06)',
  })
  getReorderSuggestions(@Query() query: ReorderSuggestionQueryDto) {
    return this.reportsService.getReorderSuggestions(query);
  }
}
