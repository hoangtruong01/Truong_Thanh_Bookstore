import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../common/enums';
import { AbTestingService } from './ab-testing.service';
import {
  CreateAbExperimentDto,
  UpdateAbExperimentDto,
  RecordAbImpressionDto,
  RecordAbConversionDto,
} from './dto/ab-experiment.dto';

@ApiTags('Marketing A/B Testing (OPT-01)')
@Controller('marketing/ab-testing')
export class AbTestingController {
  constructor(private readonly abTestingService: AbTestingService) {}

  // ── Public Routes (Storefront & Mobile clients) ──

  @Get('variant')
  @ApiOperation({ summary: 'Lấy biến thể được gán cho client (A/B testing assignment)' })
  @ApiQuery({ name: 'key', required: true, description: 'Mã thử nghiệm, vd: pdp_cta_button' })
  @ApiQuery({ name: 'distinctId', required: true, description: 'ID định danh người dùng hoặc sessionId' })
  async getAssignedVariant(
    @Query('key') key: string,
    @Query('distinctId') distinctId: string,
  ) {
    const variant = await this.abTestingService.assignVariant(key, distinctId);
    return { data: variant };
  }

  @Post('impression')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ghi nhận lượt hiển thị biến thể (Impression tracking)' })
  async recordImpression(@Body() dto: RecordAbImpressionDto) {
    return this.abTestingService.recordImpression(dto);
  }

  @Post('conversion')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ghi nhận lượt chuyển đổi của biến thể (Conversion tracking)' })
  async recordConversion(@Body() dto: RecordAbConversionDto) {
    return this.abTestingService.recordConversion(dto);
  }

  // ── Admin Protected Routes ──

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Danh sách tất cả thử nghiệm A/B (Admin)' })
  async findAll() {
    return this.abTestingService.findAll();
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo thử nghiệm A/B mới (Admin)' })
  async create(@Body() dto: CreateAbExperimentDto, @Request() req: any) {
    const userId = req.user?.userId || req.user?.sub;
    return this.abTestingService.create(dto, userId);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Chi tiết một thử nghiệm A/B (Admin)' })
  async findById(@Param('id') id: string) {
    return this.abTestingService.findById(id);
  }

  @Get(':id/results')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Báo cáo thống kê hiệu quả & Uplift của thử nghiệm (Admin)' })
  async getResults(@Param('id') id: string) {
    return this.abTestingService.getExperimentResults(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật cấu hình / trạng thái thử nghiệm A/B (Admin)' })
  async update(@Param('id') id: string, @Body() dto: UpdateAbExperimentDto) {
    return this.abTestingService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xóa thử nghiệm A/B (Admin)' })
  async delete(@Param('id') id: string) {
    return this.abTestingService.delete(id);
  }
}
