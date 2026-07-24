import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { AddressesService } from './addresses.service';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';

@ApiTags('addresses')
@Controller('addresses')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class AddressesController {
  constructor(private addressesService: AddressesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new shipping address' })
  async create(@Request() req: any, @Body() dto: CreateAddressDto) {
    return this.addressesService.create(req.user._id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get list of current user shipping addresses' })
  async findMyAddresses(@Request() req: any) {
    return this.addressesService.findByUser(req.user._id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get address details' })
  async findById(@Request() req: any, @Param('id') id: string) {
    return this.addressesService.findById(id, req.user._id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update address details' })
  async update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.addressesService.update(id, req.user._id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete address (soft delete)' })
  async delete(@Request() req: any, @Param('id') id: string) {
    await this.addressesService.softDelete(id, req.user._id);
    return { success: true, message: 'Xóa địa chỉ thành công' };
  }

  @Put(':id/default')
  @ApiOperation({ summary: 'Set default shipping address' })
  async setDefault(@Request() req: any, @Param('id') id: string) {
    return this.addressesService.setDefault(id, req.user._id);
  }
}
