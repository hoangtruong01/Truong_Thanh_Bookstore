import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { StaffPermission } from '../../common/enums';
import { PurchaseReturnsService } from './purchase-returns.service';
import {
  CreatePurchaseReturnDto,
  PurchaseReturnQueryDto,
  ConfirmCreditAdjustmentDto,
} from './dto/purchase-return.dto';

@Controller('purchasing/returns')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class PurchaseReturnsController {
  constructor(
    private readonly purchaseReturnsService: PurchaseReturnsService,
  ) {}

  @Post()
  @Permissions(
    StaffPermission.MANAGE_INVENTORY,
    StaffPermission.MANAGE_PRODUCTS,
  )
  create(@Body() dto: CreatePurchaseReturnDto, @Request() req: any) {
    return this.purchaseReturnsService.createReturn(
      dto,
      req.user.id || req.user._id,
    );
  }

  @Get()
  @Permissions(
    StaffPermission.MANAGE_INVENTORY,
    StaffPermission.VIEW_REPORTS,
    StaffPermission.MANAGE_FINANCE,
  )
  findAll(@Query() query: PurchaseReturnQueryDto) {
    return this.purchaseReturnsService.findAll(query);
  }

  @Get(':id')
  @Permissions(StaffPermission.MANAGE_INVENTORY, StaffPermission.VIEW_REPORTS)
  findById(@Param('id') id: string) {
    return this.purchaseReturnsService.findById(id);
  }

  @Post(':id/credit-adjustment')
  @Permissions(StaffPermission.MANAGE_FINANCE)
  confirmCreditAdjustment(
    @Param('id') id: string,
    @Body() dto: ConfirmCreditAdjustmentDto,
    @Request() req: any,
  ) {
    return this.purchaseReturnsService.confirmCreditAdjustment(
      id,
      dto,
      req.user.id || req.user._id,
    );
  }
}
