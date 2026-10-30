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
import { StockAuditsService } from './stock-audits.service';
import {
  CreateStockAuditDto,
  SubmitStockAuditDto,
  ApproveStockAuditDto,
  RejectStockAuditDto,
  StockAuditQueryDto,
} from './dto/stock-audit.dto';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { StaffPermission } from '../../common/enums';

@ApiTags('Stock Audits')
@ApiBearerAuth()
@Controller('stock-audits')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Permissions(StaffPermission.MANAGE_INVENTORY)
export class StockAuditsController {
  constructor(private readonly auditsService: StockAuditsService) {}

  @Post()
  @ApiOperation({
    summary:
      'ERP-04: Tạo đợt kiểm kê kho (đóng băng số tồn hệ thống tại thời điểm kiểm)',
  })
  async create(
    @Body() dto: CreateStockAuditDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.auditsService.create(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'ERP-04: Lấy danh sách đợt kiểm kê kho' })
  async findAll(@Query() query: StockAuditQueryDto) {
    return this.auditsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'ERP-04: Xem chi tiết đợt kiểm kê kho' })
  async findById(@Param('id') id: string) {
    return this.auditsService.findById(id);
  }

  @Patch(':id/submit')
  @ApiOperation({
    summary:
      'ERP-04: Nhập số lượng thực đếm và gửi phê duyệt (tự tính chênh lệch & kiểm tra ngưỡng)',
  })
  async submitCount(
    @Param('id') id: string,
    @Body() dto: SubmitStockAuditDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.auditsService.submitCount(id, dto, userId);
  }

  @Patch(':id/approve')
  @ApiOperation({
    summary:
      'ERP-04: Phê duyệt đợt kiểm kê (chỉ cập nhật kho sau khi được phê duyệt và kiểm tra xung đột)',
  })
  async approve(
    @Param('id') id: string,
    @Body() dto: ApproveStockAuditDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.auditsService.approve(id, userId, dto);
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'ERP-04: Từ chối kết quả kiểm kê kho' })
  async reject(
    @Param('id') id: string,
    @Body() dto: RejectStockAuditDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.auditsService.reject(id, userId, dto);
  }
}
