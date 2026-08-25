import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { BannersService } from './banners.service';
import { CreateBannerDto, UpdateBannerDto } from './dto/banner.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { StaffPermission } from '../../common/enums';

@ApiTags('banners')
@Controller('banners')
export class BannersController {
  constructor(private bannersService: BannersService) {}

  @Get('active')
  @ApiOperation({ summary: 'Get all active banners grouped by position' })
  findActive() {
    return this.bannersService.findActive();
  }

  @Get()
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @Permissions(StaffPermission.MANAGE_BANNERS)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all banners (admin/staff)' })
  findAll() {
    return this.bannersService.findAll();
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @Permissions(StaffPermission.MANAGE_BANNERS)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a banner' })
  create(@Body() dto: CreateBannerDto) {
    return this.bannersService.create(dto);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @Permissions(StaffPermission.MANAGE_BANNERS)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a banner' })
  update(@Param('id') id: string, @Body() dto: UpdateBannerDto) {
    return this.bannersService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @Permissions(StaffPermission.MANAGE_BANNERS)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a banner' })
  delete(@Param('id') id: string) {
    return this.bannersService.delete(id);
  }
}
