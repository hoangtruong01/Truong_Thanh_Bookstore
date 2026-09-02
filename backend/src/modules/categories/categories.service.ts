import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Category, CategoryDocument } from './schemas/category.schema';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

export interface CategoryTreeItem {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: string | null;
  sortOrder: number;
  status: boolean;
  comboPrice?: number;
  options?: string[];
  optionsLabel?: string;
  optionsType?: string;
  productCount: number;
  children: CategoryTreeItem[];
}

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
  ) {}

  /**
   * Sinh slug chuẩn tiếng Việt và kiểm tra chống trùng lặp trong CSDL
   */
  async generateUniqueSlug(name: string, excludeId?: string): Promise<string> {
    const baseSlug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    let slug = baseSlug || 'danh-muc';
    let counter = 1;
    while (true) {
      const query: any = { slug };
      if (excludeId) {
        query._id = { $ne: excludeId };
      }
      const existing = await this.categoryModel.findOne(query).lean().exec();
      if (!existing) {
        break;
      }
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    return slug;
  }

  /**
   * Kiểm tra và ngăn chặn vòng lặp cha-con (Circular Parent Reference)
   */
  private async checkCircularReference(
    categoryId: string,
    targetParentId: string,
  ): Promise<void> {
    if (!targetParentId) return;

    if (categoryId.toString() === targetParentId.toString()) {
      throw new BadRequestException(
        'Một danh mục không thể làm cha của chính nó',
      );
    }

    let currentParentId: string | null = targetParentId;
    const visited = new Set<string>([categoryId.toString()]);

    while (currentParentId) {
      if (visited.has(currentParentId.toString())) {
        throw new BadRequestException(
          'Phát hiện vòng lặp phân cấp danh mục (Circular hierarchy reference)',
        );
      }
      visited.add(currentParentId.toString());

      const parentCategory = await this.categoryModel
        .findById(currentParentId)
        .lean()
        .exec();

      if (!parentCategory) {
        throw new BadRequestException('Danh mục cha không tồn tại');
      }

      currentParentId = parentCategory.parentId
        ? parentCategory.parentId.toString()
        : null;
    }
  }

  async create(dto: CreateCategoryDto): Promise<CategoryDocument> {
    if (dto.parentId) {
      const parent = await this.categoryModel.findById(dto.parentId).exec();
      if (!parent) {
        throw new BadRequestException('Danh mục cha không tồn tại');
      }
    }

    const slug = dto.slug ? dto.slug : await this.generateUniqueSlug(dto.name);

    const category = new this.categoryModel({
      ...dto,
      slug,
      sortOrder: dto.sortOrder ?? 0,
    });
    return category.save();
  }

  async findAll(): Promise<CategoryDocument[]> {
    return this.categoryModel
      .find({ status: true })
      .sort({ sortOrder: 1, name: 1 })
      .populate('parentId')
      .populate({
        path: 'products',
        match: { status: 'ACTIVE', isDeleted: false },
      })
      .exec();
  }

  async findAllAdmin(): Promise<CategoryDocument[]> {
    return this.categoryModel
      .find()
      .sort({ sortOrder: 1, name: 1 })
      .populate('parentId')
      .populate('products')
      .exec();
  }

  async findById(id: string): Promise<CategoryDocument> {
    const category = await this.categoryModel
      .findById(id)
      .populate('parentId')
      .populate('products')
      .exec();
    if (!category) throw new NotFoundException('Không tìm thấy danh mục');
    return category;
  }

  async findBySlug(slug: string): Promise<CategoryDocument> {
    const category = await this.categoryModel
      .findOne({ slug })
      .populate('parentId')
      .populate('products')
      .exec();
    if (!category) throw new NotFoundException('Không tìm thấy danh mục');
    return category;
  }

  /**
   * Xây dựng Cây danh mục đa cấp phân nhóm Cha -> Con -> Cháu
   */
  async getCategoryTree(includeInactive = false): Promise<CategoryTreeItem[]> {
    const filter = includeInactive ? {} : { status: true };
    const categories = await this.categoryModel
      .find(filter)
      .sort({ sortOrder: 1, name: 1 })
      .lean()
      .exec();

    const catMap = new Map<string, CategoryTreeItem>();

    categories.forEach((cat: any) => {
      const catId = cat._id.toString();
      catMap.set(catId, {
        _id: catId,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        image: cat.image,
        parentId: cat.parentId ? cat.parentId.toString() : null,
        sortOrder: cat.sortOrder ?? 0,
        status: cat.status ?? true,
        comboPrice: cat.comboPrice,
        options: cat.options,
        optionsLabel: cat.optionsLabel,
        optionsType: cat.optionsType,
        productCount: Array.isArray(cat.products) ? cat.products.length : 0,
        children: [],
      });
    });

    const rootCategories: CategoryTreeItem[] = [];

    catMap.forEach((cat) => {
      if (cat.parentId && catMap.has(cat.parentId)) {
        catMap.get(cat.parentId)!.children.push(cat);
      } else {
        rootCategories.push(cat);
      }
    });

    return rootCategories;
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<CategoryDocument> {
    // 1. Kiểm tra danh mục có tồn tại không
    const existing = await this.categoryModel.findById(id).exec();
    if (!existing) {
      throw new NotFoundException('Không tìm thấy danh mục');
    }

    // 2. Chống vòng lặp phân cấp nếu cập nhật parentId
    if (dto.parentId) {
      await this.checkCircularReference(id, dto.parentId);
    }

    // 3. Tự động sinh lại slug nếu đổi tên và không truyền slug thủ công
    if (dto.name && !dto.slug && dto.name !== existing.name) {
      dto.slug = await this.generateUniqueSlug(dto.name, id);
    }

    const category = await this.categoryModel
      .findByIdAndUpdate(id, dto, { returnDocument: 'after' })
      .populate('parentId')
      .exec();

    if (!category) throw new NotFoundException('Không tìm thấy danh mục');
    return category;
  }

  /**
   * Xóa danh mục an toàn: chuyển các danh mục con liên quan về null để tránh mồ côi
   */
  async delete(id: string): Promise<void> {
    const category = await this.categoryModel.findById(id).exec();
    if (!category) {
      throw new NotFoundException('Không tìm thấy danh mục');
    }

    // Re-parent all direct children to parentId of this category (or null)
    await this.categoryModel
      .updateMany(
        { parentId: new Types.ObjectId(id) },
        { $set: { parentId: category.parentId || null } },
      )
      .exec();

    await this.categoryModel.findByIdAndDelete(id).exec();
  }

  async toggleStatus(id: string): Promise<CategoryDocument> {
    const category = await this.categoryModel.findById(id).exec();
    if (!category) {
      throw new NotFoundException('Không tìm thấy danh mục');
    }

    category.status = !category.status;
    return category.save();
  }

  async getParentCategories(): Promise<CategoryDocument[]> {
    return this.categoryModel
      .find({ parentId: null, status: true })
      .sort({ sortOrder: 1, name: 1 })
      .exec();
  }

  async getSubCategories(parentId: string): Promise<CategoryDocument[]> {
    return this.categoryModel
      .find({ parentId, status: true })
      .sort({ sortOrder: 1, name: 1 })
      .exec();
  }

  async count(): Promise<number> {
    return this.categoryModel.countDocuments().exec();
  }
}
