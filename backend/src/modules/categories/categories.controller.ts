import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { StaffPermission } from '../../common/enums';

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
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @Permissions(StaffPermission.MANAGE_PRODUCTS)
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
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @Permissions(StaffPermission.MANAGE_PRODUCTS)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a category' })
  create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @Permissions(StaffPermission.MANAGE_PRODUCTS)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a category' })
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @Permissions(StaffPermission.MANAGE_PRODUCTS)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a category' })
  delete(@Param('id') id: string) {
    return this.categoriesService.delete(id);
  }
}
