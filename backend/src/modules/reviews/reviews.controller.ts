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
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ReviewsService } from './reviews.service';
import {
  CreateReviewDto,
  UpdateReviewDto,
  ModerateReviewDto,
  AdminReplyReviewDto,
  ReviewQueryDto,
} from './dto/review.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { StaffPermission } from '../../common/enums';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('product/:productId')
  @ApiOperation({ summary: 'Lấy tất cả đánh giá của một sản phẩm' })
  findByProduct(@Param('productId') productId: string) {
    return this.reviewsService.findByProduct(productId);
  }

  @Get('product/:productId/breakdown')
  @ApiOperation({ summary: 'Lấy phân bổ đánh giá sao (1-5 sao) và tỷ lệ %' })
  getRatingBreakdown(@Param('productId') productId: string) {
    return this.reviewsService.getRatingBreakdown(productId);
  }

  @Get('product/:productId/can-review')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kiểm tra người dùng hiện tại có đủ điều kiện đánh giá sản phẩm (đã mua & nhận hàng)' })
  canUserReview(@Param('productId') productId: string, @Request() req: any) {
    return this.reviewsService.canUserReview(productId, req.user._id);
  }

  @Post('product/:productId')
  @UseGuards(AuthGuard('jwt'))
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Đăng đánh giá cho một sản phẩm (yêu cầu Verified Purchase)' })
  create(
    @Param('productId') productId: string,
    @Body() dto: CreateReviewDto,
    @Request() req: any,
  ) {
    return this.reviewsService.create(
      productId,
      req.user._id,
      req.user.fullName || req.user.name || 'Khách hàng',
      dto,
    );
  }

  @Patch(':id/product/:productId')
  @UseGuards(AuthGuard('jwt'))
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật đánh giá' })
  update(
    @Param('productId') productId: string,
    @Param('id') reviewId: string,
    @Body() dto: UpdateReviewDto,
    @Request() req: any,
  ) {
    return this.reviewsService.update(productId, reviewId, req.user._id, dto);
  }

  @Delete(':id/product/:productId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xóa đánh giá' })
  delete(
    @Param('productId') productId: string,
    @Param('id') reviewId: string,
    @Request() req: any,
  ) {
    return this.reviewsService.delete(
      productId,
      reviewId,
      req.user._id,
      req.user.role,
    );
  }

  @Get('admin')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @Permissions(StaffPermission.MANAGE_PRODUCTS)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Quản trị viên lấy danh sách đánh giá để kiểm duyệt' })
  findAllAdmin(@Query() query: ReviewQueryDto) {
    return this.reviewsService.findAllAdmin(query);
  }

  @Patch(':id/moderate')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @Permissions(StaffPermission.MANAGE_PRODUCTS)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ẩn / hiện đánh giá sản phẩm (kiểm duyệt)' })
  moderate(@Param('id') reviewId: string, @Body() dto: ModerateReviewDto) {
    return this.reviewsService.moderate(reviewId, dto);
  }

  @Patch(':id/reply')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @Permissions(StaffPermission.MANAGE_PRODUCTS)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Quản trị viên phản hồi đánh giá của khách hàng' })
  adminReply(@Param('id') reviewId: string, @Body() dto: AdminReplyReviewDto) {
    return this.reviewsService.adminReply(reviewId, dto);
  }
}
