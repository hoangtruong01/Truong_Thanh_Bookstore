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
import { ReviewsService } from './reviews.service';
import { CreateReviewDto, UpdateReviewDto, ModerateReviewDto } from './dto/review.dto';
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

  @Post('product/:productId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Đăng đánh giá cho một sản phẩm' })
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
  findAllAdmin(@Query('productId') productId?: string) {
    return this.reviewsService.findAllAdmin(productId);
  }

  @Patch(':id/moderate')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @Permissions(StaffPermission.MANAGE_PRODUCTS)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ẩn / hiện đánh giá sản phẩm (kiểm duyệt)' })
  moderate(@Param('id') reviewId: string, @Body() dto: ModerateReviewDto) {
    return this.reviewsService.moderate(reviewId, dto);
  }
}
