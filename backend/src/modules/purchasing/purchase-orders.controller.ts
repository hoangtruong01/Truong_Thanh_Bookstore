import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PurchaseOrdersService } from './purchase-orders.service';
import {
  CreatePurchaseOrderDto,
  UpdatePurchaseOrderDto,
  PurchaseOrderQueryDto,
  ApprovePurchaseOrderDto,
  CancelPurchaseOrderDto,
} from './dto/purchase-order.dto';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { StaffPermission } from '../../common/enums';

@ApiTags('Purchase Orders')
@ApiBearerAuth()
@Controller('purchase-orders')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Permissions(StaffPermission.MANAGE_INVENTORY)
export class PurchaseOrdersController {
  constructor(private readonly poService: PurchaseOrdersService) {}

  @Post()
  @ApiOperation({
    summary:
      'ERP-02: Tạo đơn đặt mua hàng (PO). Lưu ý: KHÔNG làm tăng tồn kho thực tế!',
  })
  async create(
    @Body() dto: CreatePurchaseOrderDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.poService.create(dto, userId);
  }

  @Get()
  @ApiOperation({
    summary: 'ERP-02: Lấy danh sách đơn đặt mua hàng (lọc và phân trang)',
  })
  async findAll(@Query() query: PurchaseOrderQueryDto) {
    return this.poService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'ERP-02: Xem chi tiết đơn đặt mua hàng' })
  async findById(@Param('id') id: string) {
    return this.poService.findById(id);
  }

  @Put(':id')
  @ApiOperation({
    summary:
      'ERP-02: Cập nhật đơn đặt mua hàng (chỉ khi còn ở trạng thái DRAFT)',
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePurchaseOrderDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.poService.update(id, dto, userId);
  }

  @Patch(':id/approve')
  @ApiOperation({
    summary: 'ERP-02: Phê duyệt đơn đặt mua hàng (DRAFT -> APPROVED)',
  })
  async approve(
    @Param('id') id: string,
    @Body() dto: ApprovePurchaseOrderDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.poService.approve(id, userId, dto);
  }

  @Patch(':id/send')
  @ApiOperation({
    summary: 'ERP-02: Gửi đơn đặt mua hàng tới NCC (APPROVED -> SENT)',
  })
  async sendToSupplier(
    @Param('id') id: string,
    @Body('note') note: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.poService.sendToSupplier(id, userId, note);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'ERP-02: Hủy đơn đặt mua hàng' })
  async cancel(
    @Param('id') id: string,
    @Body() dto: CancelPurchaseOrderDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.poService.cancel(id, userId, dto);
  }
}
