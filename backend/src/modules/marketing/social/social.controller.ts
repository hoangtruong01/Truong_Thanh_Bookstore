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
import { SocialService } from './social.service';
import {
  ConnectSocialAccountDto,
  CreateSocialPostDto,
  UpdateSocialPostDto,
  UpdatePostStatusDto,
  RecordManualPostDto,
  GenerateContentFromProductDto,
  QuerySocialPostDto,
} from './dto/social.dto';

@ApiTags('Marketing Social')
@Controller('marketing/social')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  // --- ACCOUNTS (SOC-01) ---
  @Post('accounts/connect')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Kết nối hoặc cập nhật tài khoản mạng xã hội' })
  async connectAccount(@Body() dto: ConnectSocialAccountDto) {
    return this.socialService.connectAccount(dto);
  }

  @Get('accounts')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({
    summary: 'Lấy danh sách các tài khoản mạng xã hội đã cấu hình',
  })
  async getAccounts() {
    return this.socialService.getAccounts();
  }

  @Post('accounts/:id/disconnect')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Ngắt kết nối tài khoản mạng xã hội an toàn' })
  async disconnectAccount(@Param('id') id: string) {
    return this.socialService.disconnectAccount(id);
  }

  // --- CONTENT ASSISTANT / GENERATOR (SOC-02, SOC-05) ---
  @Post('content/generate-from-product')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({
    summary: 'Tạo nội dung bài viết Facebook / kịch bản TikTok 30s từ sản phẩm',
  })
  async generateContentFromProduct(@Body() dto: GenerateContentFromProductDto) {
    return this.socialService.generateContentFromProduct(dto);
  }

  // --- POSTS LIFECYCLE (SOC-02, SOC-03) ---
  @Post('posts')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Tạo bản nháp bài viết mới' })
  async createPost(@Body() dto: CreateSocialPostDto, @Request() req: any) {
    return this.socialService.createPost(
      dto,
      req.user?.userId || req.user?.sub,
    );
  }

  @Get('posts')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Danh sách bài viết mạng xã hội' })
  async findAllPosts(@Query() query: QuerySocialPostDto) {
    return this.socialService.findAllPosts(query);
  }

  @Get('posts/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Chi tiết bài viết mạng xã hội' })
  async findPostById(@Param('id') id: string) {
    return this.socialService.findPostById(id);
  }

  @Patch('posts/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Cập nhật nội dung bài viết' })
  async updatePost(
    @Param('id') id: string,
    @Body() dto: UpdateSocialPostDto,
    @Request() req: any,
  ) {
    return this.socialService.updatePost(
      id,
      dto,
      req.user?.userId || req.user?.sub,
    );
  }

  @Patch('posts/:id/status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Duyệt hoặc chuyển trạng thái bài viết (Rule D03)' })
  async updatePostStatus(
    @Param('id') id: string,
    @Body() dto: UpdatePostStatusDto,
    @Request() req: any,
  ) {
    return this.socialService.updatePostStatus(
      id,
      dto,
      req.user?.userId || req.user?.sub,
    );
  }

  @Post('posts/:id/manual-record')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({
    summary: 'Ghi nhận bài viết đã đăng thủ công trên nền tảng gốc',
  })
  async recordManualPost(
    @Param('id') id: string,
    @Body() dto: RecordManualPostDto,
  ) {
    return this.socialService.recordManualPost(id, dto);
  }

  @Delete('posts/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Lưu trữ / xóa mềm bài viết' })
  async deletePost(@Param('id') id: string) {
    return this.socialService.deletePost(id);
  }
}
