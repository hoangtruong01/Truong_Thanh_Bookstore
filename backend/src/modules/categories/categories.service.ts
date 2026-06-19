import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category, CategoryDocument } from './schemas/category.schema';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
  ) {}

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  async create(dto: CreateCategoryDto): Promise<CategoryDocument> {
    const slug = dto.slug || this.generateSlug(dto.name);
    const category = new this.categoryModel({ ...dto, slug });
    return category.save();
  }

  async findAll(): Promise<CategoryDocument[]> {
    return this.categoryModel.find({ status: true }).populate('parentId').exec();
  }

  async findAllAdmin(): Promise<CategoryDocument[]> {
    return this.categoryModel.find().populate('parentId').exec();
  }

  async findById(id: string): Promise<CategoryDocument> {
    const category = await this.categoryModel.findById(id).populate('parentId').exec();
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async findBySlug(slug: string): Promise<CategoryDocument> {
    const category = await this.categoryModel.findOne({ slug }).exec();
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<CategoryDocument> {
    if (dto.name && !dto.slug) {
      dto.slug = this.generateSlug(dto.name);
    }
    const category = await this.categoryModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async delete(id: string): Promise<void> {
    const result = await this.categoryModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException('Category not found');
  }

  async getParentCategories(): Promise<CategoryDocument[]> {
    return this.categoryModel.find({ parentId: null, status: true }).exec();
  }

  async getSubCategories(parentId: string): Promise<CategoryDocument[]> {
    return this.categoryModel.find({ parentId, status: true }).exec();
  }

  async count(): Promise<number> {
    return this.categoryModel.countDocuments().exec();
  }
}
