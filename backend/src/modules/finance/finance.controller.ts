import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { StaffPermission } from '../../common/enums';
import { FinanceService } from './finance.service';
import {
  CreateCashAccountDto,
  UpdateCashAccountDto,
  CreateCashEntryDto,
  ReverseCashEntryDto,
  CashEntryQueryDto,
  PaySupplierDto,
  SupplierPayableQueryDto,
} from './dto/finance.dto';

@Controller('finance')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  // ==================== CASH ACCOUNTS ====================

  @Post('accounts')
  @Permissions(StaffPermission.MANAGE_FINANCE)
  createAccount(@Body() dto: CreateCashAccountDto, @Request() req: any) {
    return this.financeService.createAccount(dto, req.user.id || req.user._id);
  }

  @Get('accounts')
  @Permissions(StaffPermission.MANAGE_FINANCE, StaffPermission.VIEW_REPORTS)
  findAllAccounts() {
    return this.financeService.findAllAccounts();
  }

  @Get('accounts/:id')
  @Permissions(StaffPermission.MANAGE_FINANCE)
  findAccountById(@Param('id') id: string) {
    return this.financeService.findAccountById(id);
  }

  @Put('accounts/:id')
  @Permissions(StaffPermission.MANAGE_FINANCE)
  updateAccount(@Param('id') id: string, @Body() dto: UpdateCashAccountDto) {
    return this.financeService.updateAccount(id, dto);
  }

  // ==================== CASH ENTRIES ====================

  @Post('entries')
  @Permissions(StaffPermission.MANAGE_FINANCE)
  createEntry(@Body() dto: CreateCashEntryDto, @Request() req: any) {
    return this.financeService.createEntry(dto, req.user.id || req.user._id);
  }

  @Get('entries')
  @Permissions(StaffPermission.MANAGE_FINANCE, StaffPermission.VIEW_REPORTS)
  findAllEntries(@Query() query: CashEntryQueryDto) {
    return this.financeService.findAllEntries(query);
  }

  @Post('entries/:id/reverse')
  @Permissions(StaffPermission.MANAGE_FINANCE)
  reverseEntry(
    @Param('id') id: string,
    @Body() dto: ReverseCashEntryDto,
    @Request() req: any,
  ) {
    return this.financeService.reverseEntry(
      id,
      dto,
      req.user.id || req.user._id,
    );
  }

  @Get('entries/export')
  @Permissions(StaffPermission.MANAGE_FINANCE, StaffPermission.VIEW_REPORTS)
  async exportEntries(@Query() query: CashEntryQueryDto, @Res() res: Response) {
    const buffer = await this.financeService.exportCashEntriesToExcel(query);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=so-quy-thu-chi.xlsx',
    );
    res.send(buffer);
  }

  // ==================== SUPPLIER PAYABLES ====================

  @Get('payables')
  @Permissions(StaffPermission.MANAGE_FINANCE, StaffPermission.MANAGE_INVENTORY)
  findAllPayables(@Query() query: SupplierPayableQueryDto) {
    return this.financeService.findAllPayables(query);
  }

  @Post('payables/:id/pay')
  @Permissions(StaffPermission.MANAGE_FINANCE)
  paySupplier(
    @Param('id') id: string,
    @Body() dto: PaySupplierDto,
    @Request() req: any,
  ) {
    return this.financeService.paySupplier(
      id,
      dto,
      req.user.id || req.user._id,
    );
  }
}
