import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all active categories' })
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get('admin')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all categories (admin)' })
  findAllAdmin() {
    return this.categoriesService.findAllAdmin();
  }

  @Get('parents')
  @ApiOperation({ summary: 'Get parent categories' })
  getParents() {
    return this.categoriesService.getParentCategories();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category by ID' })
  findById(@Param('id') id: string) {
    return this.categoriesService.findById(id);
  }

  @Get(':id/subcategories')
  @ApiOperation({ summary: 'Get subcategories' })
  getSubCategories(@Param('id') id: string) {
    return this.categoriesService.getSubCategories(id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a category' })
  create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a category' })
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a category' })
  delete(@Param('id') id: string) {
    return this.categoriesService.delete(id);
  }
}
