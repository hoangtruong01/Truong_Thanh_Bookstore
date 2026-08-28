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
import { ApiBearerAuth, ApiTags, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import { ProductsService } from './products.service';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductQueryDto,
} from './dto/product.dto';
import { CreateReviewDto, UpdateReviewDto } from './dto/review.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { StaffPermission } from '../../common/enums';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all products with filters and pagination' })
  findAll(@Query() query: ProductQueryDto) {
    return this.productsService.findAll(query);
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
  async importExcel(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn file Excel để tải lên');
    }
    if (!file.originalname.match(/\.(xlsx|xls)$/i)) {
      throw new BadRequestException('Chỉ chấp nhận file Excel định dạng .xlsx hoặc .xls');
    }
    return this.productsService.importFromExcel(file.buffer);
  }

  @Get('featured')
  @ApiOperation({ summary: 'Get featured products' })
  getFeatured() {
    return this.productsService.getFeatured();
  }

  @Get('best-selling')
  @ApiOperation({ summary: 'Get best selling products' })
  getBestSelling(@Query('limit') limit?: number) {
    return this.productsService.getBestSelling(limit);
  }

  @Get('discounted')
  @ApiOperation({ summary: 'Get discounted products' })
  getDiscounted(@Query('limit') limit?: number) {
    return this.productsService.getDiscounted(limit);
  }

  @Get('new')
  @ApiOperation({ summary: 'Get newest products' })
  getNew(@Query('limit') limit?: number) {
    return this.productsService.getNew(limit);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search products' })
  search(@Query('q') q: string) {
    return this.productsService.search(q || '');
  }

  @Get('suggestions')
  @ApiOperation({ summary: 'Get search autocomplete suggestions (keywords, categories, products)' })
  getSuggestions(
    @Query('q') q?: string,
    @Query('limit') limit?: number,
  ) {
    return this.productsService.getSuggestions(q || '', limit ? Number(limit) : 6);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get product detail by SEO slug' })
  findBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }

  @Get(':id/related')
  @ApiOperation({ summary: 'Get related / similar products' })
  getRelated(
    @Param('id') id: string,
    @Query('limit') limit?: number,
  ) {
    return this.productsService.getRelated(id, limit ? Number(limit) : 8);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID or Slug' })
  findById(@Param('id') id: string) {
    return this.productsService.findById(id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @Permissions(StaffPermission.MANAGE_PRODUCTS)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a product' })
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
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
  @ApiOperation({ summary: 'Subscribe to back-in-stock alerts for a product' })
  async subscribeToStockAlert(
    @Param('id') id: string,
    @Body('email') email: string,
  ) {
    if (!email) {
      throw new BadRequestException('Email không được để trống');
    }
    const success = await this.productsService.subscribeToStockAlert(id, email);
    return { success, message: 'Đăng ký nhận thông báo thành công!' };
  }
}
