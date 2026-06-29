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
import { ProductsService } from './products.service';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductQueryDto,
} from './dto/product.dto';
import { CreateReviewDto, UpdateReviewDto } from './dto/review.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all products with filters and pagination' })
  findAll(@Query() query: ProductQueryDto) {
    return this.productsService.findAll(query);
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

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  findById(@Param('id') id: string) {
    return this.productsService.findById(id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a product' })
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a product' })
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
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
}
