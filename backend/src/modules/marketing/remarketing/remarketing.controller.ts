import {
  Controller,
  Get,
  Post,
  Param,
  Body,
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
import { RemarketingService } from './remarketing.service';
import {
  TriggerRestockAlertDto,
  TriggerPriceDropAlertDto,
  TriggerAbandonedCartDto,
} from './dto/remarketing.dto';

@ApiTags('Marketing Remarketing (OPT-02)')
@Controller('marketing/remarketing')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
@ApiBearerAuth()
export class RemarketingController {
  constructor(private readonly remarketingService: RemarketingService) {}

  @Post('restock-alert/:productId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Kích hoạt cảnh báo hàng về cho khách có sản phẩm trong Wishlist' })
  async triggerRestock(
    @Param('productId') productId: string,
    @Body() dto: { newStock?: number },
  ) {
    return this.remarketingService.triggerRestockAlert(productId, dto.newStock);
  }

  @Post('price-drop-alert')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Kích hoạt cảnh báo giảm giá cho khách có sản phẩm trong Wishlist' })
  async triggerPriceDrop(@Body() dto: TriggerPriceDropAlertDto) {
    return this.remarketingService.triggerPriceDropAlert(dto.productId, dto.oldPrice, dto.newPrice);
  }

  @Post('abandoned-carts')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Quét và gửi remarketing giỏ hàng bỏ quên (tuân thủ giới hạn 7 ngày)' })
  async triggerAbandonedCart(@Body() dto: TriggerAbandonedCartDto) {
    return this.remarketingService.triggerAbandonedCartRemarketing(
      dto.minInactiveMinutes,
      dto.maxInactiveHours,
    );
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Thống kê chiến dịch remarketing, số lượng gửi và tỷ lệ chuyển đổi' })
  async getAnalytics() {
    return this.remarketingService.getRemarketingAnalytics();
  }
}
