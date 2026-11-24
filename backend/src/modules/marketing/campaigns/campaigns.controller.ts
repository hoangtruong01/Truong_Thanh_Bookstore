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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../common/enums';
import { CampaignsService } from './campaigns.service';
import {
  CreateCampaignDto,
  UpdateCampaignDto,
  UpdateCampaignStatusDto,
  QueryCampaignDto,
} from './dto/campaign.dto';

@ApiTags('Marketing Campaigns')
@Controller('marketing/campaigns')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Tạo chiến dịch marketing mới' })
  async create(@Body() dto: CreateCampaignDto, @Request() req: any) {
    return this.campaignsService.create(dto, req.user?.userId || req.user?.sub);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Lấy danh sách chiến dịch marketing' })
  async findAll(@Query() query: QueryCampaignDto) {
    return this.campaignsService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Chi tiết chiến dịch marketing' })
  async findById(@Param('id') id: string) {
    return this.campaignsService.findById(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Cập nhật chiến dịch marketing' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCampaignDto,
    @Request() req: any,
  ) {
    return this.campaignsService.update(
      id,
      dto,
      req.user?.userId || req.user?.sub,
    );
  }

  @Patch(':id/status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Chuyển trạng thái chiến dịch marketing' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateCampaignStatusDto,
    @Request() req: any,
  ) {
    return this.campaignsService.updateStatus(
      id,
      dto,
      req.user?.userId || req.user?.sub,
    );
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Lưu trữ / xóa mềm chiến dịch marketing' })
  async delete(@Param('id') id: string) {
    return this.campaignsService.delete(id);
  }
}
