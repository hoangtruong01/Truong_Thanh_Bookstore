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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GoodsReceiptsService } from './goods-receipts.service';
import {
  CreateGoodsReceiptDto,
  GoodsReceiptQueryDto,
} from './dto/goods-receipt.dto';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { StaffPermission } from '../../common/enums';

@ApiTags('Goods Receipts')
@ApiBearerAuth()
@Controller('goods-receipts')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Permissions(StaffPermission.MANAGE_INVENTORY)
export class GoodsReceiptsController {
  constructor(private readonly grService: GoodsReceiptsService) {}

  @Post()
  @ApiOperation({
    summary:
      'ERP-03: Tạo phiếu nhận hàng và nhập kho từ PO (tự động cập nhật tồn kho, giá vốn & trạng thái PO)',
  })
  async create(
    @Body() dto: CreateGoodsReceiptDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.grService.create(dto, userId);
  }

  @Get()
  @ApiOperation({
    summary: 'ERP-03: Lấy danh sách phiếu nhận hàng (phân trang và lọc)',
  })
  async findAll(@Query() query: GoodsReceiptQueryDto) {
    return this.grService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'ERP-03: Xem chi tiết phiếu nhận hàng' })
  async findById(@Param('id') id: string) {
    return this.grService.findById(id);
  }
}
