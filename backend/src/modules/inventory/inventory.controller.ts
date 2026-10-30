import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import {
  InventoryTransactionDto,
  AdjustInventoryDto,
  InventoryQueryDto,
  InventoryTransactionQueryDto,
} from './dto/inventory.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { StaffPermission } from '../../common/enums';

@ApiTags('inventory')
@Controller('inventory')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Permissions(StaffPermission.MANAGE_INVENTORY)
@ApiBearerAuth()
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all inventory items (paginated & filterable - read-only)',
  })
  findAll(@Query() query: InventoryQueryDto) {
    return this.inventoryService.findAll(query);
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Get low stock items' })
  getLowStock() {
    return this.inventoryService.getLowStock();
  }

  @Get('reconcile')
  @ApiOperation({
    summary:
      'Reconcile Product.stock vs Inventory.currentStock (audit tool - TT-002)',
  })
  reconcile() {
    return this.inventoryService.reconcile();
  }

  @Post('sync-missing')
  @ApiOperation({
    summary: 'Manually sync missing inventory documents for products (TT-006)',
  })
  syncMissing() {
    return this.inventoryService.syncMissingInventories();
  }

  @Get('transactions/export')
  @ApiOperation({ summary: 'Export inventory transactions to Excel (TT-004)' })
  async exportTransactions(
    @Query() query: InventoryTransactionQueryDto,
    @Res() res: Response,
  ) {
    const buffer = await this.inventoryService.exportTransactionsToExcel(query);
    const dateStr = new Date().toISOString().slice(0, 10);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Lich_su_kho_${dateStr}.xlsx"`,
    );
    res.setHeader('Content-Length', buffer.length);
    res.end(buffer);
  }

  @Get('transactions')
  @ApiOperation({
    summary: 'Get inventory transactions (paginated & filterable - TT-004)',
  })
  getTransactions(@Query() query: InventoryTransactionQueryDto) {
    return this.inventoryService.getTransactions(query);
  }

  @Post('import')
  @ApiOperation({ summary: 'Import stock' })
  importStock(
    @Body() dto: InventoryTransactionDto,
    @CurrentUser('_id') userId?: string,
  ) {
    return this.inventoryService.importStock(dto, userId);
  }

  @Post('transactions')
  @ApiOperation({
    summary: 'Create one of the supported inventory movements',
  })
  createTransaction(
    @Body() dto: InventoryTransactionDto,
    @CurrentUser('_id') userId?: string,
  ) {
    return this.inventoryService.createTransaction(dto, userId);
  }

  @Post('export')
  @ApiOperation({ summary: 'Record a manual sale (legacy /export route)' })
  exportStock(
    @Body() dto: InventoryTransactionDto,
    @CurrentUser('_id') userId?: string,
  ) {
    return this.inventoryService.exportStock(dto, userId);
  }

  @Post('sale')
  @ApiOperation({ summary: 'Record a SALE stock movement' })
  saleStock(
    @Body() dto: InventoryTransactionDto,
    @CurrentUser('_id') userId?: string,
  ) {
    return this.inventoryService.exportStock(dto, userId);
  }

  @Post('return')
  @ApiOperation({ summary: 'Record a RETURN stock movement' })
  returnStock(
    @Body() dto: InventoryTransactionDto,
    @CurrentUser('_id') userId?: string,
  ) {
    return this.inventoryService.returnStock(dto, userId);
  }

  @Post('damage')
  @ApiOperation({ summary: 'Record a DAMAGE stock movement' })
  damageStock(
    @Body() dto: InventoryTransactionDto,
    @CurrentUser('_id') userId?: string,
  ) {
    return this.inventoryService.damageStock(dto, userId);
  }

  @Post('adjust')
  @ApiOperation({
    summary: 'Adjust stock (by newStock after physical count - TT-001)',
  })
  adjustStock(
    @Body() dto: AdjustInventoryDto,
    @CurrentUser('_id') userId?: string,
  ) {
    return this.inventoryService.adjustStock(dto, userId);
  }
}
