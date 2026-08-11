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
} from '@nestjs/common';
import { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import {
  CreateOrderDto,
  UpdateOrderStatusDto,
  OrderQueryDto,
} from './dto/order.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create an order (guest)' })
  create(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
  }

  @Post('authenticated')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create an order (authenticated)' })
  createAuthenticated(@Body() dto: CreateOrderDto, @Request() req: any) {
    return this.ordersService.create(dto, req.user._id);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'STAFF')
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
    const order = await this.ordersService.findById(id);
    
    // BUG-03: Verify ownership of the invoice before rendering the PDF
    if (
      order.customer &&
      order.customer._id.toString() !== req.user._id.toString() &&
      req.user.role !== 'ADMIN' &&
      req.user.role !== 'STAFF'
    ) {
      throw new ForbiddenException('Bạn không có quyền tải hóa đơn này');
    }
    
    const pdfDoc = await this.ordersService.generateInvoicePdf(order);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${order.orderCode}.pdf`);
    pdfDoc.pipe(res);
    pdfDoc.end();
  }

  // Require authentication & ownership check to view order details
  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get order by ID (authenticated owner or staff/admin)' })
  findById(@Param('id') id: string, @Request() req: any) {
    return this.ordersService.findById(id, req.user._id, req.user.role);
  }

  @Patch(':id/status')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update order status' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(id, dto);
  }

  // FIX-C01: Cancel with ownership check — pass userId so service can verify
  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel an order (owner or admin only)' })
  cancel(@Param('id') id: string, @Request() req: any) {
    return this.ordersService.cancel(id, req.user._id);
  }

}
