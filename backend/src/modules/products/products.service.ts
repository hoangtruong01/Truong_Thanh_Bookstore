import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';
import { CreateProductDto, UpdateProductDto, ProductQueryDto } from './dto/product.dto';
import { PaginatedResult, paginate } from '../../common/dto/pagination.dto';
import { InventoryStatus } from '../../common/enums';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
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

  async create(dto: CreateProductDto): Promise<ProductDocument> {
    const slug = dto.slug || this.generateSlug(dto.name);
    const product = new this.productModel({ ...dto, slug });
    const savedProduct = await product.save();

    // Automatically create inventory entry
    try {
      const inventoryModel = this.productModel.db.model('Inventory');
      const currentStock = savedProduct.stock || 0;
      let status = InventoryStatus.IN_STOCK;
      if (currentStock <= 0) {
        status = InventoryStatus.OUT_OF_STOCK;
      } else if (currentStock <= 10) {
        status = InventoryStatus.LOW_STOCK;
      }

      await inventoryModel.create({
        product: savedProduct._id,
        currentStock,
        minStock: 10,
        maxStock: 1000,
        status,
        lastUpdated: new Date(),
      });
    } catch (err) {
      console.error('Failed to auto-create inventory for new product:', err);
    }

    return savedProduct;
  }

  async findAll(query: ProductQueryDto): Promise<PaginatedResult<ProductDocument>> {
    const { page = 1, limit = 10, category, brand, minPrice, maxPrice, status, sort, q } = query;
    const filter: any = { isDeleted: false };

    if (category) {
      try {
        const categoryModel = this.productModel.db.model('Category');
        const subCategories = await categoryModel.find({ parentId: category }).exec();
        const categoryIds = [category, ...subCategories.map(c => c._id)];
        filter.category = { $in: categoryIds };
      } catch (err) {
        filter.category = category;
      }
    }
    if (brand) filter.brand = brand;
    if (status) filter.status = status;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = minPrice;
      if (maxPrice) filter.price.$lte = maxPrice;
    }
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { sku: { $regex: q, $options: 'i' } },
        { brand: { $regex: q, $options: 'i' } },
      ];
    }

    let sortObj: any = { createdAt: -1 };
    if (sort) {
      switch (sort) {
        case 'price_asc': sortObj = { price: 1 }; break;
        case 'price_desc': sortObj = { price: -1 }; break;
        case 'name_asc': sortObj = { name: 1 }; break;
        case 'name_desc': sortObj = { name: -1 }; break;
        case 'best_selling': sortObj = { sold: -1 }; break;
        case 'newest': sortObj = { createdAt: -1 }; break;
        default: sortObj = { createdAt: -1 };
      }
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.productModel.find(filter).populate('category').sort(sortObj).skip(skip).limit(limit).exec(),
      this.productModel.countDocuments(filter).exec(),
    ]);

    return paginate(data, total, page, limit);
  }

  async findById(id: string): Promise<ProductDocument> {
    const product = await this.productModel.findById(id).populate('category').exec();
    if (!product || product.isDeleted) throw new NotFoundException('Product not found');
    return product;
  }

  async findBySlug(slug: string): Promise<ProductDocument> {
    const product = await this.productModel.findOne({ slug, isDeleted: false }).populate('category').exec();
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async update(id: string, dto: UpdateProductDto): Promise<ProductDocument> {
    if (dto.name && !dto.slug) {
      dto.slug = this.generateSlug(dto.name);
    }
    const product = await this.productModel
      .findByIdAndUpdate(id, dto, { new: true })
      .populate('category')
      .exec();
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async softDelete(id: string): Promise<void> {
    const result = await this.productModel
      .findByIdAndUpdate(id, { isDeleted: true })
      .exec();
    if (!result) throw new NotFoundException('Product not found');
  }

  async getFeatured(): Promise<ProductDocument[]> {
    return this.productModel
      .find({ isFeatured: true, isDeleted: false })
      .populate('category')
      .limit(12)
      .exec();
  }

  async search(q: string): Promise<ProductDocument[]> {
    return this.productModel
      .find({
        isDeleted: false,
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } },
        ],
      })
      .populate('category')
      .limit(20)
      .exec();
  }

  async getBestSelling(limit = 10): Promise<ProductDocument[]> {
    return this.productModel
      .find({ isDeleted: false })
      .sort({ sold: -1 })
      .limit(limit)
      .populate('category')
      .exec();
  }

  async getDiscounted(limit = 10): Promise<ProductDocument[]> {
    return this.productModel
      .find({ isDeleted: false, discountPrice: { $gt: 0 } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('category')
      .exec();
  }

  async getNew(limit = 10): Promise<ProductDocument[]> {
    return this.productModel
      .find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('category')
      .exec();
  }

  async count(): Promise<number> {
    return this.productModel.countDocuments({ isDeleted: false }).exec();
  }

  async updateStock(id: string, quantity: number): Promise<void> {
    const updated = await this.productModel.findByIdAndUpdate(id, { $inc: { stock: quantity } }, { new: true }).exec();
    if (updated) {
      try {
        const inventoryModel = this.productModel.db.model('Inventory');
        const minStock = 10;
        let status = InventoryStatus.IN_STOCK;
        if (updated.stock <= 0) {
          status = InventoryStatus.OUT_OF_STOCK;
        } else if (updated.stock <= minStock) {
          status = InventoryStatus.LOW_STOCK;
        }
        await inventoryModel.findOneAndUpdate(
          { product: id },
          { currentStock: updated.stock, status, lastUpdated: new Date() },
          { upsert: true }
        ).exec();
      } catch (err) {
        // Ignore if model not registered
      }
    }
  }

  async setStock(id: string, quantity: number): Promise<void> {
    const updated = await this.productModel.findByIdAndUpdate(id, { stock: quantity }, { new: true }).exec();
    if (updated) {
      try {
        const inventoryModel = this.productModel.db.model('Inventory');
        const minStock = 10;
        let status = InventoryStatus.IN_STOCK;
        if (updated.stock <= 0) {
          status = InventoryStatus.OUT_OF_STOCK;
        } else if (updated.stock <= minStock) {
          status = InventoryStatus.LOW_STOCK;
        }
        await inventoryModel.findOneAndUpdate(
          { product: id },
          { currentStock: updated.stock, status, lastUpdated: new Date() },
          { upsert: true }
        ).exec();
      } catch (err) {
        // Ignore
      }
    }
  }

  async incrementSold(id: string, quantity: number): Promise<void> {
    await this.productModel.findByIdAndUpdate(id, { $inc: { sold: quantity } }).exec();
  }
}
