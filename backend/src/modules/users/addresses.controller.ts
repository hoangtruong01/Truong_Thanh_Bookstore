import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AddressesService } from './addresses.service';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('addresses')
@Controller('addresses')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class AddressesController {
  constructor(private addressesService: AddressesService) {}

  @Post()
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'Tạo địa chỉ giao hàng mới' })
  @ApiResponse({
    status: 201,
    description: 'Địa chỉ giao hàng được tạo thành công',
  })
  async create(
    @CurrentUser('_id') userId: string,
    @Body() dto: CreateAddressDto,
  ) {
    return this.addressesService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách sổ địa chỉ của người dùng hiện tại' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách địa chỉ giao hàng của người dùng',
  })
  async findMyAddresses(@CurrentUser('_id') userId: string) {
    return this.addressesService.findByUser(userId);
  }

  @Get('default')
  @ApiOperation({ summary: 'Lấy địa chỉ giao hàng mặc định của người dùng' })
  @ApiResponse({ status: 200, description: 'Địa chỉ giao hàng mặc định' })
  async getDefaultAddress(@CurrentUser('_id') userId: string) {
    return this.addressesService.getDefault(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết một địa chỉ' })
  @ApiResponse({ status: 200, description: 'Chi tiết địa chỉ giao hàng' })
  async findById(@CurrentUser('_id') userId: string, @Param('id') id: string) {
    return this.addressesService.findById(id, userId);
  }

  @Put(':id')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Cập nhật thông tin địa chỉ giao hàng' })
  @ApiResponse({ status: 200, description: 'Cập nhật địa chỉ thành công' })
  async update(
    @CurrentUser('_id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.addressesService.update(id, userId, dto);
  }

  @Delete(':id')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'Xóa địa chỉ giao hàng (xóa mềm)' })
  @ApiResponse({ status: 200, description: 'Xóa địa chỉ thành công' })
  async delete(@CurrentUser('_id') userId: string, @Param('id') id: string) {
    await this.addressesService.softDelete(id, userId);
    return { success: true, message: 'Xóa địa chỉ thành công' };
  }

  @Put(':id/default')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Thiết lập địa chỉ làm mặc định' })
  @ApiResponse({
    status: 200,
    description: 'Thiết lập địa chỉ mặc định thành công',
  })
  async setDefault(
    @CurrentUser('_id') userId: string,
    @Param('id') id: string,
  ) {
    return this.addressesService.setDefault(id, userId);
  }
}
