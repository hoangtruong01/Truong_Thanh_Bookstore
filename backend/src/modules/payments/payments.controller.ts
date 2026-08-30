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
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto, PaymentCallbackDto, PaymentQueryDto } from './dto/payment.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { StaffPermission } from '../../common/enums';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Khởi tạo phiên thanh toán cho đơn hàng' })
  create(@Body() dto: CreatePaymentDto, @Request() req: any) {
    return this.paymentsService.createPayment(dto, {
      ...req.user,
      _id: req.user._id.toString(),
    });
  }

  @Get('order/:orderId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy thông tin thanh toán của một đơn hàng' })
  findByOrderId(@Param('orderId') orderId: string, @Request() req: any) {
    return this.paymentsService.findByOrderId(orderId, {
      ...req.user,
      _id: req.user._id.toString(),
    });
  }

  @Post('callback')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'Webhook callback từ cổng thanh toán đối tác' })
  handleCallback(@Body() dto: PaymentCallbackDto) {
    return this.paymentsService.handleCallback(dto);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @Permissions(StaffPermission.MANAGE_ORDERS)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Quản trị viên tra cứu danh sách thanh toán' })
  findAll(@Query() query: PaymentQueryDto) {
    return this.paymentsService.findAll(query);
  }
}
