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
  BadRequestException,
  Res,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import {
  ProductsService,
  isStaffViewer,
  stripPrivateProductFields,
} from './products.service';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductQueryDto,
} from './dto/product.dto';
import { SubscribeStockAlertDto } from './dto/stock-alert.dto';
import { CreateReviewDto, UpdateReviewDto } from '../reviews/dto/review.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { StaffPermission } from '../../common/enums';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  /**
   * SEC-016: Các GET công khai dùng OptionalJwtAuthGuard để nhận diện nhân sự nội bộ.
   * Khách / CUSTOMER chỉ thấy sản phẩm ACTIVE và không nhận giá sỉ / giá vốn.
   */
  private forViewer<T>(data: T, user?: { role?: string } | null): T {
    return isStaffViewer(user) ? data : stripPrivateProductFields(data);
  }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get all products with filters and pagination' })
  async findAll(
    @Query() query: ProductQueryDto,
    @CurrentUser() user?: { role?: string } | null,
  ) {
    return this.forViewer(
      await this.productsService.findAll(query, user),
      user,
    );
  }

  @Get('export/template')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @Permissions(StaffPermission.MANAGE_PRODUCTS)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Download Excel import template' })
  async downloadTemplate(@Res() res: Response) {
    const buffer = await this.productsService.generateImportTemplate();
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="Mau_nhap_san_pham_TruongThanh.xlsx"',
    );
    res.setHeader('Content-Length', buffer.length);
    res.end(buffer);
  }

  @Get('export/excel')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @Permissions(StaffPermission.MANAGE_PRODUCTS)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Export all products to Excel' })
  async exportExcel(@Res() res: Response) {
    const buffer = await this.productsService.exportToExcel();
    const dateStr = new Date().toISOString().slice(0, 10);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Danh_sach_san_pham_${dateStr}.xlsx"`,
    );
    res.setHeader('Content-Length', buffer.length);
    res.end(buffer);
  }

  @Post('import/excel')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @Permissions(StaffPermission.MANAGE_PRODUCTS)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiBearerAuth()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 }, // Tối đa 10MB
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Import products from Excel file' })
  async importExcel(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('_id') userId?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn file Excel để tải lên');
    }
    if (!file.originalname.match(/\.(xlsx|xls)$/i)) {
      throw new BadRequestException(
        'Chỉ chấp nhận file Excel định dạng .xlsx hoặc .xls',
      );
    }
    return this.productsService.importFromExcel(
      file.buffer,
      userId,
      file.originalname,
    );
  }

  @Get('featured')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get featured products' })
  async getFeatured(@CurrentUser() user?: { role?: string } | null) {
    return this.forViewer(await this.productsService.getFeatured(), user);
  }

  @Get('best-selling')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get best selling products' })
  async getBestSelling(
    @Query('limit') limit?: number,
    @CurrentUser() user?: { role?: string } | null,
  ) {
    return this.forViewer(
      await this.productsService.getBestSelling(limit),
      user,
    );
  }

  @Get('discounted')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get discounted products' })
  async getDiscounted(
    @Query('limit') limit?: number,
    @CurrentUser() user?: { role?: string } | null,
  ) {
    return this.forViewer(
      await this.productsService.getDiscounted(limit),
      user,
    );
  }

  @Get('new')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get newest products' })
  async getNew(
    @Query('limit') limit?: number,
    @CurrentUser() user?: { role?: string } | null,
  ) {
    return this.forViewer(await this.productsService.getNew(limit), user);
  }

  @Get('search')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Search products' })
  async search(
    @Query('q') q: string,
    @CurrentUser() user?: { role?: string } | null,
  ) {
    return this.forViewer(await this.productsService.search(q || ''), user);
  }

  @Get('suggestions')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary:
      'Get search autocomplete suggestions (keywords, categories, products)',
  })
  async getSuggestions(
    @Query('q') q?: string,
    @Query('limit') limit?: number,
    @CurrentUser() user?: { role?: string } | null,
  ) {
    return this.forViewer(
      await this.productsService.getSuggestions(q || '', limit),
      user,
    );
  }

  @Get('slug/:slug')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get product detail by SEO slug' })
  async findBySlug(
    @Param('slug') slug: string,
    @CurrentUser() user?: { role?: string } | null,
  ) {
    return this.forViewer(await this.productsService.findBySlug(slug), user);
  }

  @Get(':id/related')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get related / similar products' })
  async getRelated(
    @Param('id') id: string,
    @Query('limit') limit?: number,
    @CurrentUser() user?: { role?: string } | null,
  ) {
    return this.forViewer(
      await this.productsService.getRelated(id, limit),
      user,
    );
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get product by ID or Slug' })
  async findById(
    @Param('id') id: string,
    @CurrentUser() user?: { role?: string } | null,
  ) {
    return this.forViewer(
      await this.productsService.findByIdForViewer(id, user),
      user,
    );
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @Permissions(StaffPermission.MANAGE_PRODUCTS)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a product' })
  create(@Body() dto: CreateProductDto, @CurrentUser('_id') userId?: string) {
    return this.productsService.create(dto, userId);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @Permissions(StaffPermission.MANAGE_PRODUCTS)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a product' })
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @Permissions(StaffPermission.MANAGE_PRODUCTS)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft delete a product' })
  delete(@Param('id') id: string) {
    return this.productsService.softDelete(id);
  }

  @Get(':id/reviews')
  @ApiOperation({ summary: 'Get all reviews of a product' })
  getReviews(@Param('id') id: string) {
    return this.productsService.getReviews(id);
  }

  @Post(':id/reviews')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a review to a product' })
  addReview(
    @Param('id') id: string,
    @Body() dto: CreateReviewDto,
    @Request() req: any,
  ) {
    return this.productsService.addReview(
      id,
      req.user._id,
      req.user.fullName,
      dto,
    );
  }

  @Patch(':id/reviews/:reviewId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a product review' })
  updateReview(
    @Param('id') id: string,
    @Param('reviewId') reviewId: string,
    @Body() dto: UpdateReviewDto,
    @Request() req: any,
  ) {
    return this.productsService.updateReview(id, reviewId, req.user._id, dto);
  }

  @Delete(':id/reviews/:reviewId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a product review' })
  deleteReview(
    @Param('id') id: string,
    @Param('reviewId') reviewId: string,
    @Request() req: any,
  ) {
    return this.productsService.deleteReview(
      id,
      reviewId,
      req.user._id,
      req.user.role,
    );
  }

  @Post(':id/alert')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Subscribe to back-in-stock alerts for a product' })
  async subscribeToStockAlert(
    @Param('id') id: string,
    @Body() dto: SubscribeStockAlertDto,
  ) {
    const success = await this.productsService.subscribeToStockAlert(
      id,
      dto.email,
    );
    return { success, message: 'Đăng ký nhận thông báo thành công!' };
  }
}
