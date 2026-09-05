import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { StaffPermission } from '../../common/enums';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CreateGhnShipmentDto } from './dto/shipping.dto';
import { GhnShippingService } from './ghn-shipping.service';

@ApiTags('shipping')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Permissions(StaffPermission.MANAGE_ORDERS)
@Controller('shipping')
export class ShippingController {
  constructor(private readonly shippingService: GhnShippingService) {}

  @Post('orders/:orderId/ghn')
  @ApiOperation({ summary: 'Create an idempotent GHN shipment' })
  create(@Param('orderId') orderId: string, @Body() dto: CreateGhnShipmentDto) {
    return this.shippingService.createShipment(orderId, dto);
  }

  @Get('orders/:orderId/track')
  @ApiOperation({
    summary: 'Fetch GHN tracking and advance the order state machine',
  })
  track(@Param('orderId') orderId: string) {
    return this.shippingService.syncTracking(orderId);
  }
}
