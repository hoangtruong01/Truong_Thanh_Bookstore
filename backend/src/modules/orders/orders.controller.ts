import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Res,
  ForbiddenException,
  Headers,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { OrdersService } from './orders.service';
import {
  CreateOrderDto,
  UpdateOrderStatusDto,
  OrderQueryDto,
  CheckoutPreviewDto,
} from './dto/order.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { StaffPermission, UserRole } from '../../common/enums';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post('checkout-preview')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Preview checkout calculations, validate inventory, freeship and voucher' })
  checkoutPreview(@Body() dto: CheckoutPreviewDto, @Request() req: any) {
    const userId = req.user?._id;
    return this.ordersService.checkoutPreview(dto, userId);
  }

  @Post()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Create an order (guest)' })
  create(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
  }

  @Post('authenticated')
  @UseGuards(AuthGuard('jwt'))
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create an order (authenticated)' })
  createAuthenticated(@Body() dto: CreateOrderDto, @Request() req: any) {
    return this.ordersService.create(dto, req.user._id);
  }


  @Get()
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @Permissions(StaffPermission.MANAGE_ORDERS)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all orders (admin)' })
  findAll(@Query() query: OrderQueryDto) {
    return this.ordersService.findAll(query);
  }

  @Get('my-orders')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user orders' })
  myOrders(@Request() req: any, @Query() query: OrderQueryDto) {
    return this.ordersService.findByUser(req.user._id, query);
  }

  @Get(':id/invoice')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Export invoice PDF' })
  async getInvoice(@Param('id') id: string, @Request() req: any, @Res() res: Response) {
    const order = await this.ordersService.findByIdForActor(id, {
      ...req.user,
      _id: req.user._id.toString(),
    });
    
    // Verify ownership of the invoice before rendering the PDF
    if (
      order.customer &&
      order.customer._id.toString() !== req.user._id.toString() &&
      req.user.role !== UserRole.SUPER_ADMIN &&
      req.user.role !== UserRole.ADMIN &&
      req.user.role !== UserRole.STAFF
    ) {
      throw new ForbiddenException('Bạn không có quyền tải hóa đơn này');
    }
    
    const pdfDoc = await this.ordersService.generateInvoicePdf(order);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${order.orderCode}.pdf`);
    pdfDoc.pipe(res);
    pdfDoc.end();
  }

  @Get('guest/:id/invoice')
  @ApiOperation({ summary: 'Export a guest invoice using its private access token' })
  async getGuestInvoice(
    @Param('id') id: string,
    @Headers('x-guest-order-token') accessToken: string | undefined,
    @Res() res: Response,
  ) {
    const order = await this.ordersService.findGuestById(id, accessToken);
    const pdfDoc = await this.ordersService.generateInvoicePdf(order);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=invoice-${order.orderCode}.pdf`,
    );
    pdfDoc.pipe(res);
    pdfDoc.end();
  }

  @Get('guest/:id')
  @ApiOperation({ summary: 'Get a guest order using its private access token' })
  findGuestById(
    @Param('id') id: string,
    @Headers('x-guest-order-token') accessToken: string | undefined,
  ) {
    return this.ordersService.findGuestById(id, accessToken);
  }

  // Require authentication & ownership check to view order details
  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get order by ID (authenticated owner or staff/admin)' })
  findById(@Param('id') id: string, @Request() req: any) {
    return this.ordersService.findByIdForActor(id, {
      ...req.user,
      _id: req.user._id.toString(),
    });
  }

  @Patch(':id/status')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @Permissions(StaffPermission.MANAGE_ORDERS)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update order status' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(id, dto);
  }

  // Cancel with ownership check — pass userId so service can verify
  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel an order (owner or admin only)' })
  cancel(@Param('id') id: string, @Request() req: any) {
    return this.ordersService.cancelForActor(id, {
      ...req.user,
      _id: req.user._id.toString(),
    });
  }

  @Delete('guest/:id')
  @ApiOperation({ summary: 'Cancel a pending guest order using its private access token' })
  cancelGuest(
    @Param('id') id: string,
    @Headers('x-guest-order-token') accessToken: string | undefined,
  ) {
    return this.ordersService.cancelGuest(id, accessToken);
  }
}
