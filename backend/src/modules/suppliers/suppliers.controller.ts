import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SuppliersService } from './suppliers.service';
import {
  CreateSupplierDto,
  UpdateSupplierDto,
  SupplierQueryDto,
} from './dto/supplier.dto';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { StaffPermission } from '../../common/enums';

@ApiTags('Suppliers')
@ApiBearerAuth()
@Controller('suppliers')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Permissions(StaffPermission.MANAGE_INVENTORY)
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post()
  @ApiOperation({ summary: 'ERP-01: Tạo mới nhà cung cấp' })
  async create(
    @Body() dto: CreateSupplierDto,
    @CurrentUser('id') userId?: string,
  ) {
    return this.suppliersService.create(dto, userId);
  }

  @Get()
  @ApiOperation({
    summary:
      'ERP-01: Lấy danh sách nhà cung cấp (hỗ trợ tìm kiếm, lọc, phân trang)',
  })
  async findAll(@Query() query: SupplierQueryDto) {
    return this.suppliersService.findAll(query);
  }

  @Get('by-product/:productId')
  @ApiOperation({
    summary:
      'ERP-01: Tra cứu nhà cung cấp đã từng cung ứng sản phẩm kèm lịch sử giá mua',
  })
  async getSuppliersForProduct(@Param('productId') productId: string) {
    return this.suppliersService.getSuppliersForProduct(productId);
  }

  @Get('export')
  @ApiOperation({ summary: 'DOC-04: Xuất file Excel danh sách nhà cung cấp' })
  async exportToExcel(@Query() query: SupplierQueryDto, @Res() res: Response) {
    const buffer = await this.suppliersService.exportSuppliersToExcel(query);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=danh-sach-nha-cung-cap.xlsx',
    );
    res.send(buffer);
  }

  @Get(':id')
  @ApiOperation({ summary: 'ERP-01: Xem chi tiết nhà cung cấp' })
  async findById(@Param('id') id: string) {
    return this.suppliersService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'ERP-01: Cập nhật nhà cung cấp' })
  async update(@Param('id') id: string, @Body() dto: UpdateSupplierDto) {
    return this.suppliersService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'ERP-01: Xóa mềm nhà cung cấp' })
  async delete(@Param('id') id: string) {
    return this.suppliersService.delete(id);
  }
}
