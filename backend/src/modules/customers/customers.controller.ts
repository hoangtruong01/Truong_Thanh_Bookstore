import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('customers')
@Controller('customers')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN', 'STAFF')
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
}
