import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { Types } from 'mongoose';
import { CustomersService } from './customers.service';
import { UpdateCustomerCRMProfileDto } from './dto/customer-crm.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { StaffPermission } from '../../common/enums';

@ApiTags('customers')
@Controller('customers')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Permissions(StaffPermission.MANAGE_CUSTOMERS)
@ApiBearerAuth()
export class CustomersController {
  constructor(private customersService: CustomersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all customers' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
  ) {
    return this.customersService.findAll(page || 1, limit || 10, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get customer details with order history' })
  findById(@Param('id') id: string) {
    return this.customersService.findById(id);
  }

  @Patch(':id/crm')
  @ApiOperation({
    summary:
      'Cập nhật hồ sơ CRM khách hàng (phân loại nhóm khách, hạng thẻ, ưu tiên chăm sóc, ghi chú)',
  })
  updateCRMProfile(
    @Param('id') id: string,
    @Body() dto: UpdateCustomerCRMProfileDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.customersService.updateCRMProfile(
      id,
      dto,
      new Types.ObjectId(userId),
    );
  }

  @Post(':id/evaluate-tier')
  @ApiOperation({
    summary:
      'Đánh giá hạng thẻ tự động dựa trên doanh số 365 ngày và kiểm soát nợ quá hạn',
  })
  evaluateTier(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.customersService.evaluateCustomerTier(
      id,
      new Types.ObjectId(userId),
    );
  }
}
