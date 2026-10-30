import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { StaffPermission } from '../../common/enums';
import { PricingService } from './pricing.service';
import {
  CreatePricePolicyDto,
  UpdatePricePolicyDto,
  PricePolicyQueryDto,
  CalculatePriceDto,
  CheckMarginDto,
} from './dto/price-policy.dto';

@Controller('pricing')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  /**
   * PRC-01: Công cụ tính toán giá bán đề xuất, Markup & Margin
   */
  @Post('calculate')
  @Permissions(
    StaffPermission.MANAGE_PRICING,
    StaffPermission.MANAGE_PRODUCTS,
    StaffPermission.POS_ACCESS,
  )
  calculatePrice(@Body() dto: CalculatePriceDto) {
    return this.pricingService.calculatePrice(dto);
  }

  /**
   * PRC-02 & PRC-03: Kiểm tra mức sàn lợi nhuận (Margin Floor) và hạn mức chiết khấu
   */
  @Post('check-margin')
  @Permissions(
    StaffPermission.MANAGE_PRICING,
    StaffPermission.MANAGE_PRODUCTS,
    StaffPermission.POS_ACCESS,
  )
  checkMargin(@Body() dto: CheckMarginDto) {
    return this.pricingService.checkMargin(dto);
  }

  /**
   * Tạo chính sách giá mới
   */
  @Post('policies')
  @Permissions(StaffPermission.MANAGE_PRICING, StaffPermission.MANAGE_PRODUCTS)
  createPolicy(@Body() dto: CreatePricePolicyDto, @Request() req: any) {
    return this.pricingService.create(dto, req.user.id || req.user._id);
  }

  /**
   * Lấy danh sách chính sách giá (phân trang, lọc)
   */
  @Get('policies')
  @Permissions(StaffPermission.MANAGE_PRICING, StaffPermission.MANAGE_PRODUCTS)
  findAllPolicies(@Query() query: PricePolicyQueryDto) {
    return this.pricingService.findAll(query);
  }

  /**
   * Xem chi tiết chính sách giá
   */
  @Get('policies/:id')
  @Permissions(StaffPermission.MANAGE_PRICING, StaffPermission.MANAGE_PRODUCTS)
  findPolicyById(@Param('id') id: string) {
    return this.pricingService.findById(id);
  }

  /**
   * Cập nhật chính sách giá
   */
  @Put('policies/:id')
  @Permissions(StaffPermission.MANAGE_PRICING, StaffPermission.MANAGE_PRODUCTS)
  updatePolicy(@Param('id') id: string, @Body() dto: UpdatePricePolicyDto) {
    return this.pricingService.update(id, dto);
  }

  /**
   * Xóa mềm chính sách giá
   */
  @Delete('policies/:id')
  @Permissions(StaffPermission.MANAGE_PRICING, StaffPermission.MANAGE_PRODUCTS)
  removePolicy(@Param('id') id: string) {
    return this.pricingService.remove(id);
  }
}
