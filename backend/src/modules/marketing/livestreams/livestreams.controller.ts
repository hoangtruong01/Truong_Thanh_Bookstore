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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../common/enums';
import { LivestreamsService } from './livestreams.service';
import {
  CreateLivestreamDto,
  UpdateLivestreamDto,
  UpdateLivestreamStatusDto,
} from './dto/livestream.dto';
import { LivestreamStatus } from './schemas/livestream-session.schema';

@ApiTags('Marketing Livestreams')
@Controller('marketing/livestreams')
export class LivestreamsController {
  constructor(private readonly livestreamsService: LivestreamsService) {}

  @Get('active')
  @ApiOperation({
    summary: 'Lấy phiên livestream đang phát trực tiếp (Public)',
  })
  async findActiveLive() {
    return this.livestreamsService.findActiveLive();
  }

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy danh sách các phiên livestream' })
  async findAll(@Query('status') status?: LivestreamStatus) {
    return this.livestreamsService.findAll({ status });
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Chi tiết phiên livestream' })
  async findById(@Param('id') id: string) {
    return this.livestreamsService.findById(id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo phiên livestream mới' })
  async create(@Body() dto: CreateLivestreamDto) {
    return this.livestreamsService.create(dto);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật phiên livestream' })
  async update(@Param('id') id: string, @Body() dto: UpdateLivestreamDto) {
    return this.livestreamsService.update(id, dto);
  }

  @Patch(':id/status')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Chuyển trạng thái phiên livestream' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateLivestreamStatusDto,
  ) {
    return this.livestreamsService.updateStatus(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Lưu trữ phiên livestream' })
  async delete(@Param('id') id: string) {
    return this.livestreamsService.delete(id);
  }
}
