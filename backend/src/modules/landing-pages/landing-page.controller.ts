import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { LandingPageService } from './landing-page.service';
import { CreateLandingPageDto, GenerateLandingPageDto, SubmitOrderDto } from './dto/landing-page.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('landing-pages')
@Controller('landing-pages')
export class LandingPageController {
  constructor(private readonly landingPageService: LandingPageService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy tất cả landing pages' })
  findAll() {
    return this.landingPageService.findAll();
  }

  // Public endpoint to load landing page by slug
  @Get('public/:slug')
  @ApiOperation({ summary: 'Lấy landing page công khai bằng slug' })
  findBySlug(@Param('slug') slug: string) {
    return this.landingPageService.findBySlug(slug);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy thông tin chi tiết một landing page' })
  findOne(@Param('id') id: string) {
    return this.landingPageService.findOne(id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo một landing page thủ công' })
  create(@Body() dto: CreateLandingPageDto) {
    return this.landingPageService.create(dto);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật landing page' })
  update(@Param('id') id: string, @Body() dto: CreateLandingPageDto) {
    return this.landingPageService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xóa landing page' })
  remove(@Param('id') id: string) {
    return this.landingPageService.remove(id);
  }

  // Public endpoint for submitting checkout orders from landing pages
  @Post('submit-order')
  @ApiOperation({ summary: 'Gửi đơn hàng từ landing page' })
  submitOrder(@Body() dto: SubmitOrderDto) {
    return this.landingPageService.submitOrder(dto);
  }

  @Post('generate')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo giao diện landing page bằng AI (Gemini)' })
  generate(@Body() dto: GenerateLandingPageDto) {
    return this.landingPageService.generateLandingPage(dto);
  }
}
