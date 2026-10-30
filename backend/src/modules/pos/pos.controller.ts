import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { PosService } from './pos.service';
import {
  CreatePOSOrderDto,
  RefundPOSOrderDto,
  POSOrderQueryDto,
  POSSessionReportQueryDto,
} from './dto/pos.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { StaffPermission, UserRole } from '../../common/enums';

@ApiTags('pos')
@Controller('pos')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Permissions(StaffPermission.POS_ACCESS, StaffPermission.MANAGE_ORDERS)
@ApiBearerAuth()
export class PosController {
  constructor(private readonly posService: PosService) {}

  @Post('orders')
  @ApiOperation({
    summary:
      'Tạo phiếu bán lẻ tại quầy POS và trừ tồn kho nguyên tử (POS-01 / TT-021)',
  })
  createPOSOrder(
    @Body() dto: CreatePOSOrderDto,
    @CurrentUser()
    user: { _id: string; fullName?: string; name?: string; role?: string },
  ) {
    return this.posService.createPOSOrder(dto, user);
  }

  @Get('orders')
  @ApiOperation({
    summary: 'Tra cứu danh sách hóa đơn bán hàng POS có phân trang (POS-04)',
  })
  getPOSOrders(
    @Query() query: POSOrderQueryDto,
    @CurrentUser('role') userRole?: string,
  ) {
    return this.posService.findAll(query, userRole);
  }

  @Get('orders/:id')
  @ApiOperation({
    summary: 'Xem chi tiết hóa đơn POS để in lại phiếu (POS-04)',
  })
  getPOSOrderById(
    @Param('id') id: string,
    @CurrentUser('role') userRole?: string,
  ) {
    return this.posService.findById(id, userRole);
  }

  @Post('orders/:id/refund')
  @ApiOperation({
    summary: 'Hoàn trả hàng tại quầy và cập nhật tồn kho (POS-07)',
  })
  refundPOSOrder(
    @Param('id') id: string,
    @Body() dto: RefundPOSOrderDto,
    @CurrentUser()
    user: { _id: string; fullName?: string; name?: string; role?: string },
  ) {
    return this.posService.refundPOSOrder(id, dto, user);
  }

  @Get('reports/session')
  @ApiOperation({
    summary:
      'Báo cáo doanh số và đơn hàng theo ca làm việc của thu ngân (POS-10)',
  })
  getSessionReport(
    @Query() query: POSSessionReportQueryDto,
    @CurrentUser() user: { _id: string; role?: string },
  ) {
    // Nếu là STAFF bình thường, chỉ xem ca bán của chính mình
    if (
      user.role !== UserRole.ADMIN &&
      user.role !== UserRole.SUPER_ADMIN &&
      !query.cashierId
    ) {
      query.cashierId = user._id;
    }
    return this.posService.getSessionReport(query);
  }

  @Get('products/search')
  @ApiOperation({
    summary:
      'Tìm kiếm sản phẩm nhanh cho POS qua mã vạch, SKU hoặc tên (POS-02)',
  })
  searchProducts(@Query('q') keyword: string) {
    return this.posService.searchProductsForPOS(keyword);
  }
}
