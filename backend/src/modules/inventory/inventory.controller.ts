import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import {
  InventoryTransactionDto,
  AdjustInventoryDto,
} from './dto/inventory.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('inventory')
@Controller('inventory')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN', 'STAFF')
@ApiBearerAuth()
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  @Get()
  @ApiOperation({ summary: 'Get all inventory' })
  findAll() {
    return this.inventoryService.findAll();
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Get low stock items' })
  getLowStock() {
    return this.inventoryService.getLowStock();
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get inventory transactions' })
  getTransactions(@Query('productId') productId?: string) {
    return this.inventoryService.getTransactions(productId);
  }

  @Post('import')
  @ApiOperation({ summary: 'Import stock' })
  importStock(@Body() dto: InventoryTransactionDto, @Request() req: any) {
    return this.inventoryService.importStock(dto, req.user._id);
  }

  @Post('export')
  @ApiOperation({ summary: 'Export stock' })
  exportStock(@Body() dto: InventoryTransactionDto, @Request() req: any) {
    return this.inventoryService.exportStock(dto, req.user._id);
  }

  @Post('adjust')
  @ApiOperation({ summary: 'Adjust stock' })
  adjustStock(@Body() dto: AdjustInventoryDto, @Request() req: any) {
    return this.inventoryService.adjustStock(dto, req.user._id);
  }
}
