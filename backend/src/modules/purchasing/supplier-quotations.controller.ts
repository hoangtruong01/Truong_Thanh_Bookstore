import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SupplierQuotationsService } from './supplier-quotations.service';
import {
  CreateSupplierQuotationDto,
  QuotationQueryDto,
  CompareSuppliersQueryDto,
  CreatePOFromQuotationDto,
} from './dto/supplier-quotation.dto';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { StaffPermission } from '../../common/enums';

@ApiTags('Supplier Quotations & Procurement')
@ApiBearerAuth()
@Controller('supplier-quotations')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Permissions(StaffPermission.MANAGE_INVENTORY)
export class SupplierQuotationsController {
  constructor(private readonly quotationsService: SupplierQuotationsService) {}

  @Post()
  @ApiOperation({
    summary: 'PUR-02: Tạo báo giá nhà cung cấp mới (Supplier Quotation / RFQ)',
  })
  async create(
    @Body() dto: CreateSupplierQuotationDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.quotationsService.create(dto, userId);
  }

  @Get()
  @ApiOperation({
    summary: 'PUR-02: Lấy danh sách báo giá có phân trang & lọc',
  })
  async findAll(@Query() query: QuotationQueryDto) {
    return this.quotationsService.findAll(query);
  }

  @Get('price-history/:productId')
  @ApiOperation({
    summary:
      'PUR-02: Lịch sử giá theo thời gian cho sản phẩm (Supplier Price History)',
  })
  async getPriceHistory(@Param('productId') productId: string) {
    return this.quotationsService.getPriceHistory(productId);
  }

  @Get('compare')
  @ApiOperation({
    summary:
      'PUR-02: So sánh NCC và Đề xuất nguồn hàng tối ưu (Purchase Recommendation Engine)',
  })
  async compareSuppliers(@Query() query: CompareSuppliersQueryDto) {
    return this.quotationsService.compareSuppliers(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'PUR-02: Chi tiết báo giá theo ID',
  })
  async findById(@Param('id') id: string) {
    return this.quotationsService.findById(id);
  }

  @Patch(':id/approve')
  @ApiOperation({
    summary: 'PUR-02: Duyệt báo giá nhà cung cấp',
  })
  async approve(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.quotationsService.approve(id, userId);
  }

  @Patch(':id/reject')
  @ApiOperation({
    summary: 'PUR-02: Từ chối báo giá nhà cung cấp',
  })
  async reject(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.quotationsService.reject(id, userId, reason);
  }

  @Post('create-po')
  @ApiOperation({
    summary:
      'PUR-02: Tạo đơn đặt mua hàng (PO) từ báo giá đã duyệt với snapshot đơn giá cố định',
  })
  async createPOFromQuotation(
    @Body() dto: CreatePOFromQuotationDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.quotationsService.createPOFromQuotation(dto, userId);
  }
}
