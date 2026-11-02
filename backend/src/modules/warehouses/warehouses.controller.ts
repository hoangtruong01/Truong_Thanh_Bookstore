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
import { Types } from 'mongoose';
import { WarehousesService } from './warehouses.service';
import {
  CreateWarehouseDto,
  UpdateWarehouseDto,
  CreateStockTransferDto,
  ReceiveStockTransferDto,
  WarehouseQueryDto,
  StockTransferQueryDto,
} from './dto/warehouse.dto';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { StaffPermission } from '../../common/enums';

@ApiTags('warehouses')
@ApiBearerAuth()
@Controller('warehouses')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Permissions(StaffPermission.MANAGE_INVENTORY)
export class WarehousesController {
  constructor(private readonly warehousesService: WarehousesService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo kho mới (Kho tổng, cửa hàng, online, lỗi...)' })
  async create(
    @Body() dto: CreateWarehouseDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.warehousesService.createWarehouse(
      dto,
      new Types.ObjectId(userId),
    );
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách kho có lọc và phân trang' })
  async findAll(@Query() query: WarehouseQueryDto) {
    return this.warehousesService.findAll(query);
  }

  @Get('sellable/:productId')
  @ApiOperation({
    summary:
      'Tính tổng tồn khả dụng bán được (tự động loại trừ kho lỗi DAMAGED/QUARANTINE)',
  })
  async getSellableStock(@Param('productId') productId: string) {
    return this.warehousesService.getSellableStock(productId);
  }

  @Get('transfers/list')
  @ApiOperation({ summary: 'Lấy danh sách phiếu chuyển kho' })
  async findTransfers(@Query() query: StockTransferQueryDto) {
    return this.warehousesService.findTransfers(query);
  }

  @Post('transfers')
  @ApiOperation({ summary: 'Lập phiếu chuyển kho mới (DRAFT)' })
  async createTransfer(
    @Body() dto: CreateStockTransferDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.warehousesService.createTransfer(
      dto,
      new Types.ObjectId(userId),
    );
  }

  @Get('transfers/:id')
  @ApiOperation({ summary: 'Xem chi tiết phiếu chuyển kho' })
  async findTransferById(@Param('id') id: string) {
    return this.warehousesService.findTransferById(id);
  }

  @Patch('transfers/:id/approve')
  @ApiOperation({ summary: 'Phê duyệt phiếu chuyển kho (APPROVED)' })
  async approveTransfer(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.warehousesService.approveTransfer(
      id,
      new Types.ObjectId(userId),
    );
  }

  @Patch('transfers/:id/ship')
  @ApiOperation({
    summary: 'Xuất kho vận chuyển (IN_TRANSIT) — Trừ tồn kho nguồn nguyên tử',
  })
  async shipTransfer(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.warehousesService.shipTransfer(id, new Types.ObjectId(userId));
  }

  @Patch('transfers/:id/receive')
  @ApiOperation({
    summary:
      'Nhận hàng tại kho đích (COMPLETED) — Cộng tồn kho đích & ghi nhận hao hụt',
  })
  async receiveTransfer(
    @Param('id') id: string,
    @Body() dto: ReceiveStockTransferDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.warehousesService.receiveTransfer(
      id,
      dto,
      new Types.ObjectId(userId),
    );
  }

  @Patch('transfers/:id/cancel')
  @ApiOperation({
    summary:
      'Hủy phiếu chuyển kho (CANCELLED) — Hoàn tồn về kho nguồn nếu đã xuất',
  })
  async cancelTransfer(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.warehousesService.cancelTransfer(
      id,
      new Types.ObjectId(userId),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết kho' })
  async findById(@Param('id') id: string) {
    return this.warehousesService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin kho' })
  async update(@Param('id') id: string, @Body() dto: UpdateWarehouseDto) {
    return this.warehousesService.update(id, dto);
  }

  @Get(':id/stock')
  @ApiOperation({ summary: 'Xem danh sách tồn kho theo từng kho' })
  async getWarehouseStock(
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.warehousesService.getWarehouseStock(id, page, limit);
  }
}
