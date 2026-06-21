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
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductQueryDto,
} from './dto/product.dto';
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
}
