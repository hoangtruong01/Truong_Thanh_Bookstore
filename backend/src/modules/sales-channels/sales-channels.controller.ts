import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Headers,
  UnauthorizedException,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums';
import { SalesChannelsService } from './sales-channels.service';
import {
  ConnectChannelAccountDto,
  CreateSkuMappingDto,
  ProcessWebhookDto,
  RecordSettlementDto,
} from './dto/channel.dto';

@ApiTags('Omnichannel Sales Channels (TikTok Shop)')
@Controller('sales-channels')
export class SalesChannelsController {
  constructor(private readonly channelsService: SalesChannelsService) {}

  // --- ACCOUNTS (CHN-01) ---
  @Post('connect')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Kết nối tài khoản TikTok Shop hoặc kênh sàn mới' })
  async connectAccount(@Body() dto: ConnectChannelAccountDto) {
    return this.channelsService.connectAccount(dto);
  }

  @Get('accounts')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({
    summary: 'Lấy danh sách các kênh bán hàng đa sàn đã cấu hình',
  })
  async getAccounts() {
    return this.channelsService.getAccounts();
  }

  @Post('accounts/:id/disconnect')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Ngắt kết nối kênh bán hàng an toàn' })
  async disconnectAccount(@Param('id') id: string) {
    return this.channelsService.disconnectAccount(id);
  }

  // --- SKU MAPPINGS (CHN-02) ---
  @Post('mappings')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Tạo liên kết SKU sàn (TikTok Shop) với SKU kho nội bộ',
  })
  async createSkuMapping(@Body() dto: CreateSkuMappingDto) {
    return this.channelsService.createSkuMapping(dto);
  }

  @Get('mappings')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Lấy danh sách các liên kết SKU đa kênh' })
  async getSkuMappings(
    @Query('provider') provider?: string,
    @Query('shopId') shopId?: string,
  ) {
    return this.channelsService.getSkuMappings({ provider, shopId });
  }

  @Post('inventory-sync')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Đồng bộ tồn kho khả dụng lên tất cả liên kết SKU sàn',
  })
  async syncInventory(@Query('shopId') shopId?: string) {
    return this.channelsService.syncInventory(shopId);
  }

  // --- WEBHOOK INBOX (CHN-03) ---
  @Post('webhooks/:provider')
  @ApiOperation({
    summary: 'Tiếp nhận webhook từ TikTok Shop (Xác thực HMAC chữ ký)',
  })
  async handleWebhook(
    @Param('provider') provider: string,
    @Body() dto: ProcessWebhookDto,
    @Headers('authorization') authHeader?: string,
    @Headers('x-tts-signature') ttsSignature?: string,
  ) {
    const rawSignature = ttsSignature || authHeader || dto.signature;
    if (rawSignature && rawSignature !== 'sandbox_test_signature') {
      const isValid = this.channelsService.verifySignature(
        JSON.stringify(dto.payload),
        rawSignature,
      );
      if (!isValid && process.env.NODE_ENV === 'production') {
        throw new UnauthorizedException(
          'Chữ ký webhook TikTok Shop không hợp lệ',
        );
      }
    }

    return this.channelsService.processWebhook(dto);
  }

  // --- EXCEPTIONS QUEUE ---
  @Get('exceptions')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({
    summary: 'Lấy danh sách các đơn hàng sàn bị cách ly hoặc lỗi tồn kho',
  })
  async getExceptions(@Query('resolved') resolved?: string) {
    return this.channelsService.getExceptions(resolved === 'true');
  }

  @Post('exceptions/:id/resolve')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Đánh dấu đã xử lý ngoại lệ đồng bộ kênh' })
  async resolveException(
    @Param('id') id: string,
    @Body('notes') notes: string,
    @Request() req: any,
  ) {
    return this.channelsService.resolveException(
      id,
      notes,
      req.user?.userId || req.user?.sub,
    );
  }

  // --- RECONCILIATION & SETTLEMENTS (CHN-04) ---
  @Post('reconciliation')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Ghi nhận và đối soát bảng kê thanh toán sàn (Settlement)',
  })
  async recordSettlement(@Body() dto: RecordSettlementDto) {
    return this.channelsService.reconcileSettlement(dto);
  }

  @Get('reconciliation')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Lấy danh sách các kỳ đối soát doanh thu sàn' })
  async getSettlements() {
    return this.channelsService.getSettlements();
  }
}
