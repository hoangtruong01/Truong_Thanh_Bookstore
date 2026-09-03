import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import * as ExcelJS from 'exceljs';
import { Product, ProductDocument } from './schemas/product.schema';
import { StockAlert, StockAlertDocument } from './schemas/stock-alert.schema';
import {
  Category,
  CategoryDocument,
} from '../categories/schemas/category.schema';
import {
  Inventory,
  InventoryDocument,
} from '../inventory/schemas/inventory.schema';
import { ReviewsService } from '../reviews/reviews.service';
import { EmailService } from '../email/email.service';
import { ConfigService } from '@nestjs/config';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductQueryDto,
} from './dto/product.dto';
import { PaginatedResult, paginate } from '../../common/dto/pagination.dto';
import { InventoryStatus, ProductStatus } from '../../common/enums';

function makeDiacriticRegex(str: string): string {
  if (!str) return '';
  const escaped = str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const diacriticsMap: { [key: string]: string } = {
    a: '[aàáảãạăằắẳẵặâầấẩẫậ]',
    d: '[dđ]',
    e: '[eèéẻẽẹêềếểễệ]',
    i: '[iìíỉĩị]',
    o: '[oòóỏõọôồốổỗộơờớởỡợ]',
    u: '[uùúủũụưừứửữự]',
    y: '[yỳýỷỹỵ]',
  };
  const normalized = escaped
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
  return normalized
    .split('')
    .map((char) => diacriticsMap[char] || char)
    .join('');
}

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    private reviewsService: ReviewsService,
    @InjectModel(StockAlert.name)
    private stockAlertModel: Model<StockAlertDocument>,
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    @InjectModel(Inventory.name)
    private inventoryModel: Model<InventoryDocument>,
    private emailService: EmailService,
    private configService: ConfigService,
  ) {}

  private generateSlug(name: string): string {
    const base = name
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'd')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const suffix = Math.random().toString(36).substring(2, 6);
    return `${base}-${suffix}`;
  }

  private extractCellValue(cell: any): string {
    if (cell === null || cell === undefined) return '';
    if (cell instanceof Date) return cell.toISOString().slice(0, 10);
    if (typeof cell === 'object') {
      if (cell.text !== undefined) return String(cell.text).trim();
      if (cell.result !== undefined) return String(cell.result).trim();
      if (cell.richText && Array.isArray(cell.richText)) {
        return cell.richText
          .map((r: any) => r.text || '')
          .join('')
          .trim();
      }
      if (cell.hyperlink !== undefined) return String(cell.hyperlink).trim();
      if (cell.error !== undefined) return '';
      return '';
    }
    return String(cell).trim();
  }

  async create(dto: CreateProductDto): Promise<ProductDocument> {
    const slug = dto.slug || this.generateSlug(dto.name);
    const product = new this.productModel({ ...dto, slug });
    const savedProduct = await product.save();

    // Automatically create inventory entry
    try {
      const currentStock = savedProduct.stock || 0;
      let status = InventoryStatus.IN_STOCK;
      if (currentStock <= 0) {
        status = InventoryStatus.OUT_OF_STOCK;
      } else if (currentStock <= 10) {
        status = InventoryStatus.LOW_STOCK;
      }

      await this.inventoryModel.create({
        product: savedProduct._id,
        currentStock,
        minStock: 10,
        maxStock: 1000,
        status,
        lastUpdated: new Date(),
      });
    } catch (err) {
      this.logger.error(
        'Failed to auto-create inventory for new product:',
        err,
      );
    }

    return savedProduct;
  }

  async findAll(
    query: ProductQueryDto,
  ): Promise<PaginatedResult<ProductDocument>> {
    const {
      page = 1,
      limit = 10,
      category,
      brand,
      author,
      publisher,
      isbn,
      subOption,
      minPrice,
      maxPrice,
      status,
      sort,
      sortBy,
      q,
      discounted,
      minRating,
      inStock,
      isFlashSale,
    } = query;
    const filter: any = { isDeleted: false };

    if (status) filter.status = status;

    if (discounted === true || (discounted as any) === 'true') {
      filter.discountPrice = { $gt: 0 };
    }

    if (isFlashSale === true || (isFlashSale as any) === 'true') {
      filter.isFlashSale = true;
    }

    if (category) {
      try {
        const catObjId = Types.ObjectId.isValid(category)
          ? new Types.ObjectId(category)
          : null;
        const subCategories = catObjId
          ? await this.categoryModel.find({ parentId: catObjId }).exec()
          : [];
        const categoryIds: any[] = [
          category,
          ...(catObjId ? [catObjId] : []),
          ...subCategories.map((c) => c._id),
          ...subCategories.map((c) => c._id.toString()),
        ];
        filter.category = { $in: categoryIds };
      } catch {
        filter.category = category;
      }
    }

    if (brand) {
      if (typeof brand === 'string' && brand.includes(',')) {
        filter.brand = { $in: brand.split(',').map((b) => b.trim()) };
      } else {
        filter.brand = brand;
      }
    }

    if (author) {
      if (typeof author === 'string' && author.includes(',')) {
        const authors = author.split(',').map((a) => a.trim());
        filter.author = { $in: authors };
      } else {
        const authorRegex = makeDiacriticRegex(author.trim().substring(0, 100));
        filter.author = { $regex: authorRegex, $options: 'i' };
      }
    }

    if (publisher) {
      if (typeof publisher === 'string' && publisher.includes(',')) {
        const publishers = publisher.split(',').map((p) => p.trim());
        filter.publisher = { $in: publishers };
      } else {
        const pubRegex = makeDiacriticRegex(publisher.trim().substring(0, 100));
        filter.publisher = { $regex: pubRegex, $options: 'i' };
      }
    }

    if (isbn) {
      const safeIsbn = isbn
        .trim()
        .substring(0, 50)
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.isbn = { $regex: safeIsbn, $options: 'i' };
    }

    if (subOption) {
      filter.subOptions = { $in: [subOption] };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (
        minPrice !== undefined &&
        minPrice !== null &&
        !isNaN(Number(minPrice))
      ) {
        filter.price.$gte = Number(minPrice);
      }
      if (
        maxPrice !== undefined &&
        maxPrice !== null &&
        !isNaN(Number(maxPrice))
      ) {
        filter.price.$lte = Number(maxPrice);
      }
    }

    if (minRating) {
      filter.rating = { $gte: Number(minRating) };
    }

    if (inStock !== undefined && inStock !== '') {
      const isInStock = inStock === true || inStock === 'true';
      if (isInStock) {
        filter.stock = { $gt: 0 };
      } else {
        filter.stock = { $lte: 0 };
      }
    }

    if (q && q.trim()) {
      // ReDoS Prevention: Limit search query length to 100 characters
      const safeQ = q.trim().substring(0, 100);
      const regexPattern = makeDiacriticRegex(safeQ);
      const rawEscaped = safeQ.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      filter.$or = [
        { name: { $regex: regexPattern, $options: 'i' } },
        { description: { $regex: regexPattern, $options: 'i' } },
        { sku: { $regex: rawEscaped, $options: 'i' } },
        { isbn: { $regex: rawEscaped, $options: 'i' } },
        { author: { $regex: regexPattern, $options: 'i' } },
        { publisher: { $regex: regexPattern, $options: 'i' } },
        { brand: { $regex: regexPattern, $options: 'i' } },
      ];
    }

    const sortChoice = sort || sortBy || 'newest';
    let sortObj: any = { createdAt: -1 };
    switch (sortChoice) {
      case 'price_asc':
        sortObj = { price: 1 };
        break;
      case 'price_desc':
        sortObj = { price: -1 };
        break;
      case 'rating':
        sortObj = { rating: -1 };
        break;
      case 'best_selling':
        sortObj = { sold: -1 };
        break;
      case 'name_asc':
        sortObj = { name: 1 };
        break;
      case 'name_desc':
        sortObj = { name: -1 };
        break;
      case 'discount_desc':
        sortObj = { discountPrice: -1, price: -1 };
        break;
      case 'newest':
      default:
        sortObj = { createdAt: -1 };
        break;
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.productModel
        .find(filter)
        .populate({
          path: 'category',
          populate: { path: 'parentId', select: 'name slug' },
        })
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.productModel.countDocuments(filter).exec(),
    ]);

    return paginate(data, total, page, limit);
  }

  async findById(id: string): Promise<ProductDocument> {
    let product: ProductDocument | null = null;
    if (Types.ObjectId.isValid(id)) {
      product = await this.productModel
        .findById(id)
        .populate('category')
        .exec();
    } else {
      product = await this.productModel
        .findOne({ slug: id, isDeleted: false })
        .populate('category')
        .exec();
    }
    if (!product || product.isDeleted) {
      throw new NotFoundException('Sản phẩm không tồn tại hoặc đã bị xóa');
    }
    return product;
  }

  async findBySlug(slug: string): Promise<ProductDocument> {
    const product = await this.productModel
      .findOne({ slug, isDeleted: false })
      .populate('category')
      .exec();
    if (!product) {
      throw new NotFoundException('Sản phẩm không tồn tại hoặc đã bị xóa');
    }
    return product;
  }

  async findByIds(ids: string[]): Promise<ProductDocument[]> {
    const objectIds = ids.map((id) => new Types.ObjectId(id));
    return this.productModel
      .find({ _id: { $in: objectIds }, isDeleted: false })
      .exec();
  }

  async getRelated(id: string, limit = 8): Promise<ProductDocument[]> {
    let currentProduct: ProductDocument | null = null;
    if (Types.ObjectId.isValid(id)) {
      currentProduct = await this.productModel.findById(id).exec();
    }
    if (!currentProduct) {
      currentProduct = await this.productModel.findOne({ slug: id }).exec();
    }
    if (!currentProduct) {
      return [];
    }

    const conditions: any[] = [];
    if (currentProduct.category) {
      const catId =
        typeof currentProduct.category === 'object' &&
        (currentProduct.category as any)._id
          ? (currentProduct.category as any)._id
          : currentProduct.category;
      conditions.push({ category: catId });
    }
    if (currentProduct.author && currentProduct.author.trim()) {
      conditions.push({ author: currentProduct.author });
    }
    if (currentProduct.publisher && currentProduct.publisher.trim()) {
      conditions.push({ publisher: currentProduct.publisher });
    }
    if (
      currentProduct.brand &&
      currentProduct.brand.trim() &&
      currentProduct.brand !== 'Khác' &&
      currentProduct.brand !== 'Chưa rõ'
    ) {
      conditions.push({ brand: currentProduct.brand });
    }

    const query: any = {
      _id: { $ne: currentProduct._id },
      isDeleted: false,
    };

    if (conditions.length > 0) {
      query.$or = conditions;
    }

    let related = await this.productModel
      .find(query)
      .populate('category')
      .sort({ rating: -1, sold: -1, createdAt: -1 })
      .limit(limit)
      .exec();

    // Fallback if no matching related items found
    if (related.length === 0) {
      related = await this.productModel
        .find({
          _id: { $ne: currentProduct._id },
          isDeleted: false,
        })
        .populate('category')
        .sort({ rating: -1, sold: -1, createdAt: -1 })
        .limit(limit)
        .exec();
    }

    return related;
  }

  async update(id: string, dto: UpdateProductDto): Promise<ProductDocument> {
    if (dto.name && !dto.slug) {
      dto.slug = this.generateSlug(dto.name);
    }
    const product = await this.productModel
      .findByIdAndUpdate(id, dto, { returnDocument: 'after' })
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
    if (!q || !q.trim()) return [];
    const safeQ = q.trim().substring(0, 100);
    const regexPattern = makeDiacriticRegex(safeQ);
    const rawEscaped = safeQ.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    return this.productModel
      .find({
        isDeleted: false,
        $or: [
          { name: { $regex: regexPattern, $options: 'i' } },
          { description: { $regex: regexPattern, $options: 'i' } },
          { sku: { $regex: rawEscaped, $options: 'i' } },
          { isbn: { $regex: rawEscaped, $options: 'i' } },
          { author: { $regex: regexPattern, $options: 'i' } },
          { publisher: { $regex: regexPattern, $options: 'i' } },
          { brand: { $regex: regexPattern, $options: 'i' } },
        ],
      })
      .populate('category')
      .limit(20)
      .exec();
  }

  async getSuggestions(
    q: string,
    limit = 6,
  ): Promise<{
    keywords: string[];
    categories: any[];
    products: ProductDocument[];
  }> {
    if (!q || !q.trim()) {
      return { keywords: [], categories: [], products: [] };
    }

    const safeQ = q.trim().substring(0, 100);
    const regexPattern = makeDiacriticRegex(safeQ);
    const rawEscaped = safeQ.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const [matchedCategories, matchedProducts] = await Promise.all([
      this.categoryModel
        .find({
          name: { $regex: regexPattern, $options: 'i' },
          status: true,
        })
        .select('_id name slug')
        .limit(4)
        .exec(),
      this.productModel
        .find({
          isDeleted: false,
          $or: [
            { name: { $regex: regexPattern, $options: 'i' } },
            { sku: { $regex: rawEscaped, $options: 'i' } },
            { isbn: { $regex: rawEscaped, $options: 'i' } },
            { author: { $regex: regexPattern, $options: 'i' } },
            { brand: { $regex: regexPattern, $options: 'i' } },
          ],
        })
        .populate('category', 'name slug')
        .limit(limit)
        .exec(),
    ]);

    // Extract keyword recommendations
    const keywordSet = new Set<string>();
    for (const p of matchedProducts) {
      if (p.name) keywordSet.add(p.name);
      if (p.author) keywordSet.add(p.author);
      if (p.brand) keywordSet.add(p.brand);
    }
    for (const c of matchedCategories) {
      if (c.name) keywordSet.add(c.name);
    }

    const keywords = Array.from(keywordSet).slice(0, 6);

    return {
      keywords,
      categories: matchedCategories,
      products: matchedProducts,
    };
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

  async updateStock(
    id: string,
    quantity: number,
    session?: ClientSession,
  ): Promise<void> {
    const beforeQuery = this.productModel.findById(id);
    if (session) beforeQuery.session(session);
    const productBefore = await beforeQuery.exec();
    const oldStock = productBefore?.stock || 0;

    const updated = await this.productModel
      .findByIdAndUpdate(
        id,
        { $inc: { stock: quantity } },
        { returnDocument: 'after', ...(session ? { session } : {}) },
      )
      .exec();
    if (updated) {
      try {
        const minStock = 10;
        let status = InventoryStatus.IN_STOCK;
        if (updated.stock <= 0) {
          status = InventoryStatus.OUT_OF_STOCK;
        } else if (updated.stock <= minStock) {
          status = InventoryStatus.LOW_STOCK;
        }
        await this.inventoryModel
          .findOneAndUpdate(
            { product: id },
            { currentStock: updated.stock, status, lastUpdated: new Date() },
            { upsert: true, ...(session ? { session } : {}) },
          )
          .exec();
      } catch {
        // Ignore if model not registered
      }

      // Trigger back-in-stock alerts if stock transitioned from <= 0 to > 0
      if (oldStock <= 0 && updated.stock > 0) {
        this.checkAndTriggerStockAlerts(id, updated.stock).catch((err) =>
          this.logger.error('Failed to trigger stock alerts:', err),
        );
      }
    }
  }

  async setStock(id: string, quantity: number): Promise<void> {
    const productBefore = await this.productModel.findById(id).exec();
    const oldStock = productBefore?.stock || 0;

    const updated = await this.productModel
      .findByIdAndUpdate(id, { stock: quantity }, { returnDocument: 'after' })
      .exec();
    if (updated) {
      try {
        const minStock = 10;
        let status = InventoryStatus.IN_STOCK;
        if (updated.stock <= 0) {
          status = InventoryStatus.OUT_OF_STOCK;
        } else if (updated.stock <= minStock) {
          status = InventoryStatus.LOW_STOCK;
        }
        await this.inventoryModel
          .findOneAndUpdate(
            { product: id },
            { currentStock: updated.stock, status, lastUpdated: new Date() },
            { upsert: true },
          )
          .exec();
      } catch {
        // Ignore
      }

      // Trigger back-in-stock alerts if stock transitioned from <= 0 to > 0
      if (oldStock <= 0 && updated.stock > 0) {
        this.checkAndTriggerStockAlerts(id, updated.stock).catch((err) =>
          this.logger.error('Failed to trigger stock alerts:', err),
        );
      }
    }
  }

  // FIX-C04: Safe stock deduction with atomic check
  async deductStock(
    id: string,
    quantity: number,
    session?: ClientSession,
  ): Promise<void> {
    const updated = await this.productModel
      .findOneAndUpdate(
        { _id: id, stock: { $gte: quantity } },
        { $inc: { stock: -quantity } },
        { returnDocument: 'after', ...(session ? { session } : {}) },
      )
      .exec();
    if (!updated) {
      throw new BadRequestException(
        `Không đủ tồn kho cho sản phẩm (ID: ${id})`,
      );
    }
    // Sync inventory status
    try {
      const minStock = 10;
      let status = InventoryStatus.IN_STOCK;
      if (updated.stock <= 0) {
        status = InventoryStatus.OUT_OF_STOCK;
      } else if (updated.stock <= minStock) {
        status = InventoryStatus.LOW_STOCK;
      }
      await this.inventoryModel
        .findOneAndUpdate(
          { product: id },
          { currentStock: updated.stock, status, lastUpdated: new Date() },
          { upsert: true, ...(session ? { session } : {}) },
        )
        .exec();
    } catch {
      // Ignore if model not registered
    }
  }

  async incrementSold(
    id: string,
    quantity: number,
    session?: ClientSession,
  ): Promise<void> {
    await this.productModel
      .findByIdAndUpdate(
        id,
        { $inc: { sold: quantity } },
        session ? { session } : {},
      )
      .exec();
  }

  async getReviews(productId: string): Promise<any[]> {
    return this.reviewsService.findByProduct(productId);
  }

  async addReview(
    productId: string,
    userId: string,
    userName: string,
    dto: any,
  ): Promise<any> {
    return this.reviewsService.create(productId, userId, userName, dto);
  }

  async updateReview(
    productId: string,
    reviewId: string,
    userId: string,
    dto: any,
  ): Promise<any> {
    return this.reviewsService.update(productId, reviewId, userId, dto);
  }

  async deleteReview(
    productId: string,
    reviewId: string,
    userId: string,
    userRole: string,
  ): Promise<any> {
    return this.reviewsService.delete(productId, reviewId, userId, userRole);
  }

  async subscribeToStockAlert(
    productId: string,
    email: string,
    userId?: string,
  ): Promise<boolean> {
    const product = await this.productModel.findById(productId).exec();
    if (!product) throw new NotFoundException('Sản phẩm không tồn tại');

    // Check if subscription already exists
    const existing = await this.stockAlertModel
      .findOne({
        product: new Types.ObjectId(productId),
        email: email.toLowerCase().trim(),
      })
      .exec();

    if (existing) {
      return true; // Already subscribed
    }

    await this.stockAlertModel.create({
      product: new Types.ObjectId(productId),
      email: email.toLowerCase().trim(),
      user: userId ? new Types.ObjectId(userId) : undefined,
    });

    return true;
  }

  async checkAndTriggerStockAlerts(
    productId: string,
    newStock: number,
  ): Promise<void> {
    if (newStock <= 0) return;

    // Fetch all alerts for this product
    const alerts = await this.stockAlertModel
      .find({ product: new Types.ObjectId(productId) })
      .exec();
    if (alerts.length === 0) return;

    const product = await this.productModel.findById(productId).exec();
    if (!product) return;

    this.logger.log(
      `🔔 Triggering back-in-stock alerts for "${product.name}" to ${alerts.length} subscribers`,
    );

    // Trigger emails async
    for (const alert of alerts) {
      const subject = `[Có hàng trở lại] Sản phẩm "${product.name}" đã có hàng!`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; background-color: #ffffff;">
          <h2 style="color: #dc2626; text-align: center; border-bottom: 2px solid #dc2626; padding-bottom: 10px; margin-bottom: 20px;">SẢN PHẨM CÓ HÀNG TRỞ LẠI</h2>
          <p>Xin chào,</p>
          <p>Sản phẩm mà bạn đang quan tâm: <strong>"${product.name}"</strong> hiện đã có hàng trở lại tại <strong>Trường Thành Bookstore</strong>!</p>
          
          <div style="text-align: center; margin: 30px 0;">
             <a href="${this.configService.get('FRONTEND_URL') || 'http://localhost:5173'}/products/${product._id.toString()}"
               style="background-color: #dc2626; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Mua Ngay
            </a>
          </div>

          <p style="color: #64748b; font-size: 12px; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 15px; margin-top: 30px;">
            Cảm ơn bạn đã quan tâm đến Trường Thành Bookstore.<br>
            Hotline: 0982938316
          </p>
        </div>
      `;

      this.emailService.sendMail(alert.email, subject, html).catch((err) => {
        this.logger.error(
          `Failed to send stock alert email to ${alert.email}:`,
          err,
        );
      });
    }

    // Clear alerts
    await this.stockAlertModel
      .deleteMany({ product: new Types.ObjectId(productId) })
      .exec();
  }

  /**
   * 1. Tạo file Excel mẫu (.xlsx) đa sheet chuẩn cho Admin nhập sản phẩm
   */
  async generateImportTemplate(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Trường Thành Bookstore';
    workbook.lastModifiedBy = 'Trường Thành Bookstore Admin';
    workbook.created = new Date();

    // ====== SHEET 1: DANH SÁCH SẢN PHẨM (MẪU) ======
    const sheet = workbook.addWorksheet('DanhSachSanPham', {
      views: [{ showGridLines: true }],
    });

    sheet.columns = [
      { header: 'Tên sản phẩm (*)', key: 'name', width: 36 },
      { header: 'Mã SKU (*)', key: 'sku', width: 22 },
      { header: 'Tên danh mục (*)', key: 'category', width: 25 },
      { header: 'Giá bán (*)', key: 'price', width: 18 },
      { header: 'Giá khuyến mãi', key: 'discountPrice', width: 18 },
      { header: 'Số lượng kho', key: 'stock', width: 15 },
      { header: 'Đơn vị tính', key: 'unit', width: 14 },
      { header: 'Thương hiệu / Tác giả', key: 'brand', width: 24 },
      { header: 'Trạng thái (Đang bán / Ngừng bán)', key: 'status', width: 26 },
      { header: 'Nổi bật (Có / Không)', key: 'isFeatured', width: 20 },
      { header: 'Link hình ảnh', key: 'images', width: 40 },
      { header: 'Mô tả sản phẩm', key: 'description', width: 45 },
    ];

    // Định dạng Header Sheet 1
    const headerRow = sheet.getRow(1);
    headerRow.height = 32;
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFDC2626' }, // Màu đỏ Trường Thành Bookstore
      };
      cell.font = {
        name: 'Segoe UI',
        bold: true,
        color: { argb: 'FFFFFFFF' },
        size: 11,
      };
      cell.alignment = {
        vertical: 'middle',
        horizontal: 'center',
        wrapText: true,
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'medium', color: { argb: 'FF991B1B' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
    });

    // Lấy danh mục đầu tiên thực tế từ database để làm mẫu chuẩn xác
    const firstCat = await this.categoryModel.findOne({ status: true }).lean();
    const sampleCategoryName = firstCat ? firstCat.name : 'Văn phòng phẩm';

    // Thêm các dòng mẫu thực tế
    const sampleRows = [
      {
        name: 'Bút bi Thiên Long TL-027 (Mực Xanh)',
        sku: 'TL-027-BLUE',
        category: sampleCategoryName,
        price: 5000,
        discountPrice: 4500,
        stock: 200,
        unit: 'cây',
        brand: 'Thiên Long',
        status: 'Đang bán',
        isFeatured: 'Có',
        images:
          'https://res.cloudinary.com/truongthanh/image/upload/sample_but_tl027.jpg',
        description:
          'Bút bi đầu bấm 0.5mm êm trơn, mực đậm rõ nét, thích hợp học sinh và văn phòng.',
      },
      {
        name: 'Sách Đắc Nhân Tâm (Khổ Lớn - Bìa Mềm)',
        sku: 'SACH-DNT-01',
        category: sampleCategoryName,
        price: 86000,
        discountPrice: 68000,
        stock: 50,
        unit: 'cuốn',
        brand: 'NXB First News',
        status: 'Đang bán',
        isFeatured: 'Có',
        images: '',
        description:
          'Cuốn sách nghệ thuật ứng xử kinh điển được hàng triệu độc giả yêu thích.',
      },
    ];

    sampleRows.forEach((item) => {
      const row = sheet.addRow(item);
      row.height = 24;
      row.getCell('price').numFmt = '#,##0';
      row.getCell('discountPrice').numFmt = '#,##0';
      row.getCell('stock').numFmt = '#,##0';
      row.eachCell((cell) => {
        cell.alignment = { vertical: 'middle', wrapText: true };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };
      });
    });

    // ====== SHEET 2: DANH MỤC CÓ SẴN TRONG CƠ SỞ DỮ LIỆU ======
    const catSheet = workbook.addWorksheet('DanhSachDanhMuc', {
      views: [{ showGridLines: true }],
    });

    catSheet.columns = [
      { header: 'STT', key: 'stt', width: 8 },
      { header: 'Tên danh mục', key: 'name', width: 32 },
      { header: 'Mã định danh (Slug)', key: 'slug', width: 28 },
      { header: 'Mô tả danh mục', key: 'description', width: 45 },
    ];

    const catHeaderRow = catSheet.getRow(1);
    catHeaderRow.height = 30;
    catHeaderRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2563EB' }, // Màu xanh dương
      };
      cell.font = {
        name: 'Segoe UI',
        bold: true,
        color: { argb: 'FFFFFFFF' },
        size: 11,
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    const categories = await this.categoryModel.find().sort({ name: 1 }).lean();
    categories.forEach((cat, idx) => {
      const row = catSheet.addRow({
        stt: idx + 1,
        name: cat.name,
        slug: cat.slug || '',
        description: cat.description || '',
      });
      row.height = 22;
      row.eachCell((cell) => {
        cell.alignment = { vertical: 'middle' };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };
      });
    });

    // ====== SHEET 3: HƯỚNG DẪN SỬ DỤNG VÀ QUY TẮC NHẬP LIỆU ======
    const guideSheet = workbook.addWorksheet('HuongDanSuDung', {
      views: [{ showGridLines: true }],
    });

    guideSheet.columns = [
      { header: 'Cột thông tin', key: 'column', width: 28 },
      { header: 'Bắt buộc', key: 'required', width: 14 },
      { header: 'Định dạng dữ liệu', key: 'type', width: 22 },
      { header: 'Quy tắc & Ghi chú quan trọng', key: 'rule', width: 65 },
    ];

    const guideHeaderRow = guideSheet.getRow(1);
    guideHeaderRow.height = 30;
    guideHeaderRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF475569' }, // Màu Slate
      };
      cell.font = {
        name: 'Segoe UI',
        bold: true,
        color: { argb: 'FFFFFFFF' },
        size: 11,
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    const guideRows = [
      {
        column: 'Tên sản phẩm (*)',
        required: 'BẮT BUỘC',
        type: 'Văn bản (Text)',
        rule: 'Tên đầy đủ của sản phẩm. Không được để trống.',
      },
      {
        column: 'Mã SKU (*)',
        required: 'BẮT BUỘC',
        type: 'Mã duy nhất (Text)',
        rule: 'QUAN TRỌNG: Mã SKU là định danh duy nhất. Nếu SKU ĐÃ TỒN TẠI trong hệ thống, sản phẩm đó sẽ BỎ QUA / TỪ CHỐI tải lên để tránh ghi đè sai lệch dữ liệu kho.',
      },
      {
        column: 'Tên danh mục (*)',
        required: 'BẮT BUỘC',
        type: 'Văn bản (Text)',
        rule: 'Nên copy chính xác tên danh mục tại Sheet "DanhSachDanhMuc" để tự động liên kết chuẩn xác nhất.',
      },
      {
        column: 'Giá bán (*)',
        required: 'BẮT BUỘC',
        type: 'Số nguyên (VNĐ)',
        rule: 'Giá bán lẻ của sản phẩm (>= 0). Ví dụ: 50000',
      },
      {
        column: 'Giá khuyến mãi',
        required: 'Tùy chọn',
        type: 'Số nguyên (VNĐ)',
        rule: 'Giá sau khi giảm hoặc để 0 nếu không có giảm giá.',
      },
      {
        column: 'Số lượng kho',
        required: 'Tùy chọn',
        type: 'Số nguyên >= 0',
        rule: 'Số lượng tồn kho ban đầu (mặc định 0 nếu để trống). Hệ thống sẽ tự động cập nhật kho.',
      },
      {
        column: 'Đơn vị tính',
        required: 'Tùy chọn',
        type: 'Văn bản (Text)',
        rule: 'Ví dụ: cuốn, cái, cây, hộp, bộ, vỉ... (Mặc định: cái).',
      },
      {
        column: 'Thương hiệu / Tác giả',
        required: 'Tùy chọn',
        type: 'Văn bản (Text)',
        rule: 'Tên thương hiệu, nhà sản xuất hoặc tác giả sách.',
      },
      {
        column: 'Trạng thái',
        required: 'Tùy chọn',
        type: 'Đang bán / Ngừng bán',
        rule: 'Điền "Đang bán" hoặc "Ngừng bán" (Mặc định: Đang bán).',
      },
      {
        column: 'Nổi bật',
        required: 'Tùy chọn',
        type: 'Có / Không',
        rule: 'Điền "Có" nếu muốn ghim sản phẩm nổi bật ở trang chủ (Mặc định: Không).',
      },
      {
        column: 'Link hình ảnh',
        required: 'Tùy chọn',
        type: 'Đường dẫn URL',
        rule: 'Link ảnh trực tuyến (https://...). Nếu có nhiều ảnh, phân cách bằng dấu phẩy (,).',
      },
      {
        column: 'Mô tả sản phẩm',
        required: 'Tùy chọn',
        type: 'Văn bản (Text)',
        rule: 'Mô tả chi tiết, đặc điểm nổi bật hoặc thông số kỹ thuật của sản phẩm.',
      },
    ];

    guideRows.forEach((g) => {
      const row = guideSheet.addRow(g);
      row.height = 24;
      row.eachCell((cell) => {
        cell.alignment = { vertical: 'middle', wrapText: true };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * 2. Xuất toàn bộ danh sách sản phẩm hiện có ra file Excel (.xlsx)
   */
  async exportToExcel(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Trường Thành Bookstore';
    workbook.lastModifiedBy = 'Trường Thành Bookstore Admin';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('DanhSachSanPham', {
      views: [{ showGridLines: true }],
    });

    sheet.columns = [
      { header: 'STT', key: 'stt', width: 8 },
      { header: 'Mã SKU', key: 'sku', width: 18 },
      { header: 'Tên sản phẩm', key: 'name', width: 36 },
      { header: 'Danh mục', key: 'category', width: 24 },
      { header: 'Giá bán (VNĐ)', key: 'price', width: 16 },
      { header: 'Giá KM (VNĐ)', key: 'discountPrice', width: 16 },
      { header: 'Tồn kho', key: 'stock', width: 14 },
      { header: 'Đã bán', key: 'sold', width: 12 },
      { header: 'Đơn vị', key: 'unit', width: 12 },
      { header: 'Thương hiệu', key: 'brand', width: 20 },
      { header: 'Trạng thái', key: 'status', width: 16 },
      { header: 'Nổi bật', key: 'isFeatured', width: 14 },
      { header: 'Link ảnh', key: 'images', width: 36 },
      { header: 'Ngày tạo', key: 'createdAt', width: 20 },
    ];

    // Header styling
    const headerRow = sheet.getRow(1);
    headerRow.height = 30;
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFDC2626' },
      };
      cell.font = {
        name: 'Segoe UI',
        bold: true,
        color: { argb: 'FFFFFFFF' },
        size: 11,
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'medium', color: { argb: 'FF991B1B' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
    });

    const products = await this.productModel
      .find({ isDeleted: false })
      .populate('category')
      .sort({ createdAt: -1 })
      .lean();

    products.forEach((prod: any, idx: number) => {
      const categoryName =
        prod.category && typeof prod.category === 'object'
          ? prod.category.name
          : 'Chưa phân loại';

      const statusText =
        prod.status === ProductStatus.ACTIVE ||
        prod.status === 'ACTIVE' ||
        prod.status === 'active'
          ? 'Đang bán'
          : 'Ngừng bán';

      const isFeaturedText = prod.isFeatured ? 'Có' : 'Không';
      const imagesText = Array.isArray(prod.images)
        ? prod.images.join(', ')
        : '';
      const createdDateText = prod.createdAt
        ? new Date(prod.createdAt).toLocaleString('vi-VN')
        : '';

      const row = sheet.addRow({
        stt: idx + 1,
        sku: prod.sku || '',
        name: prod.name || '',
        category: categoryName,
        price: prod.price || 0,
        discountPrice: prod.discountPrice || 0,
        stock: prod.stock || 0,
        sold: prod.sold || 0,
        unit: prod.unit || 'cái',
        brand: prod.brand || '',
        status: statusText,
        isFeatured: isFeaturedText,
        images: imagesText,
        createdAt: createdDateText,
      });

      row.height = 22;
      row.getCell('price').numFmt = '#,##0';
      row.getCell('discountPrice').numFmt = '#,##0';
      row.getCell('stock').numFmt = '#,##0';
      row.getCell('sold').numFmt = '#,##0';

      // Màu nền so le cho dễ nhìn
      if (idx % 2 === 1) {
        row.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF8FAFC' },
          };
        });
      }

      row.eachCell((cell) => {
        cell.alignment = { vertical: 'middle' };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * 3. Nhập sản phẩm từ file Excel (.xlsx), kiểm tra trùng lặp SKU & Tên,
   * từ chối tải lại những sản phẩm đã có và báo cáo thống kê chi tiết.
   */
  async importFromExcel(buffer: Buffer) {
    const workbook = new ExcelJS.Workbook();
    try {
      await workbook.xlsx.load(buffer as any);
    } catch {
      throw new BadRequestException(
        'Định dạng file Excel không hợp lệ hoặc file bị hỏng.',
      );
    }

    const sheet =
      workbook.getWorksheet('DanhSachSanPham') ||
      workbook.getWorksheet('Sheet1') ||
      workbook.worksheets[0];

    if (!sheet) {
      throw new BadRequestException(
        'Không tìm thấy Sheet dữ liệu trong file Excel.',
      );
    }

    const created: Array<{
      row: number;
      sku: string;
      name: string;
      category: string;
      price: number;
      stock: number;
    }> = [];

    const skipped: Array<{
      row: number;
      sku: string;
      name: string;
      reason: string;
    }> = [];

    const errors: Array<{
      row: number;
      sku?: string;
      name?: string;
      reason: string;
    }> = [];

    const seenInFile = new Set<string>();

    // Lấy toàn bộ sản phẩm hiện có trong CSDL (chưa bị xóa mềm) để kiểm tra trùng lặp
    const existingProducts = await this.productModel
      .find({ isDeleted: false }, { sku: 1, name: 1, slug: 1 })
      .lean();

    const existingSkuMap = new Map<string, any>();
    for (const p of existingProducts) {
      if (p.sku) {
        existingSkuMap.set(p.sku.trim().toUpperCase(), p);
      }
    }

    // Lấy toàn bộ danh mục hiện có
    const existingCategories = await this.categoryModel.find().lean();

    // Duyệt qua từng dòng trong Excel (bắt đầu từ dòng 2 vì dòng 1 là Tiêu đề)
    const rowCount = sheet.rowCount;
    if (rowCount < 2) {
      throw new BadRequestException(
        'File Excel không có dòng dữ liệu sản phẩm nào.',
      );
    }

    for (let r = 2; r <= rowCount; r++) {
      const row = sheet.getRow(r);

      const name = this.extractCellValue(row.getCell(1).value);
      const sku = this.extractCellValue(row.getCell(2).value);
      const categoryName = this.extractCellValue(row.getCell(3).value);
      const priceRaw = this.extractCellValue(row.getCell(4).value);
      const discountPriceRaw = this.extractCellValue(row.getCell(5).value);
      const stockRaw = this.extractCellValue(row.getCell(6).value);
      const unit = this.extractCellValue(row.getCell(7).value);
      const brand = this.extractCellValue(row.getCell(8).value);
      const statusRaw = this.extractCellValue(row.getCell(9).value);
      const isFeaturedRaw = this.extractCellValue(row.getCell(10).value);
      const imagesRaw = this.extractCellValue(row.getCell(11).value);
      const description = this.extractCellValue(row.getCell(12).value);

      // Nếu cả dòng trống hoàn toàn thì bỏ qua
      if (!name && !sku && !priceRaw && !categoryName) {
        continue;
      }

      // 1. Kiểm tra trường bắt buộc
      if (!name) {
        errors.push({
          row: r,
          sku: sku || undefined,
          name: undefined,
          reason: 'Thiếu Tên sản phẩm (Bắt buộc).',
        });
        continue;
      }

      if (!sku) {
        errors.push({
          row: r,
          sku: undefined,
          name,
          reason: 'Thiếu Mã SKU sản phẩm (Bắt buộc).',
        });
        continue;
      }

      // Xử lý giá bán
      const cleanPriceStr = priceRaw.replace(/[^0-9.-]+/g, '');
      const price = Number(cleanPriceStr);
      if (isNaN(price) || price < 0) {
        errors.push({
          row: r,
          sku,
          name,
          reason: `Giá bán không hợp lệ: "${priceRaw}" (Phải là số >= 0).`,
        });
        continue;
      }

      // 2. KIỂM TRA TRÙNG LẶP SẢN PHẨM (DUPLICATE DETECTION)
      const normalizedSku = sku.trim().toUpperCase();

      // Kiểm tra xem SKU đã có trong CSDL chưa
      if (existingSkuMap.has(normalizedSku)) {
        const existProd = existingSkuMap.get(normalizedSku);
        skipped.push({
          row: r,
          sku: sku.trim(),
          name: name.trim(),
          reason: `Mã SKU "${sku.trim()}" đã tồn tại trong kho (Sản phẩm: "${existProd.name || ''}"). Hệ thống từ chối tải lại để tránh trùng lặp.`,
        });
        continue;
      }

      // Kiểm tra xem SKU có bị lặp lại trong chính file Excel tải lên không
      if (seenInFile.has(normalizedSku)) {
        skipped.push({
          row: r,
          sku: sku.trim(),
          name: name.trim(),
          reason: `Mã SKU "${sku.trim()}" bị lặp lại nhiều lần trong file Excel. Bỏ qua dòng này.`,
        });
        continue;
      }

      // Đánh dấu đã thấy SKU
      seenInFile.add(normalizedSku);
      existingSkuMap.set(normalizedSku, { sku, name });

      // 3. Khớp danh mục sản phẩm (Category Matching)
      let categoryId: Types.ObjectId | null = null;
      let matchedCategoryName = categoryName || 'Văn phòng phẩm';

      if (categoryName) {
        const normalizedInputCat = categoryName.trim().toLowerCase();
        const matched = existingCategories.find(
          (c) =>
            c.name.trim().toLowerCase() === normalizedInputCat ||
            (c.slug && c.slug.toLowerCase() === normalizedInputCat) ||
            String(c._id) === categoryName.trim() ||
            makeDiacriticRegex(c.name).toLowerCase() ===
              makeDiacriticRegex(categoryName).toLowerCase(),
        );

        if (matched) {
          categoryId = matched._id;
          matchedCategoryName = matched.name;
        } else {
          // Nếu danh mục chưa có trong DB, tạo danh mục mới tự động
          try {
            const newCat = new this.categoryModel({
              name: categoryName.trim(),
              slug: this.generateSlug(categoryName.trim()),
              description: 'Danh mục được tạo tự động từ Import Excel',
              status: true,
            });
            const savedCat = await newCat.save();
            existingCategories.push(savedCat.toObject());
            categoryId = savedCat._id;
            matchedCategoryName = savedCat.name;
          } catch {
            if (existingCategories.length > 0) {
              categoryId = existingCategories[0]._id;
              matchedCategoryName = existingCategories[0].name;
            }
          }
        }
      } else if (existingCategories.length > 0) {
        categoryId = existingCategories[0]._id;
        matchedCategoryName = existingCategories[0].name;
      }

      // Xử lý các trường phụ
      const cleanDiscountStr = discountPriceRaw
        ? discountPriceRaw.replace(/[^0-9.-]+/g, '')
        : '0';
      const discountPrice = Math.max(0, Number(cleanDiscountStr) || 0);

      const cleanStockStr = stockRaw ? stockRaw.replace(/[^0-9.-]+/g, '') : '0';
      const stock = Math.max(0, Math.floor(Number(cleanStockStr) || 0));

      const finalUnit = unit && unit.trim() ? unit.trim() : 'cái';
      const finalBrand = brand && brand.trim() ? brand.trim() : '';

      const statusLower = (statusRaw || '').toLowerCase();
      const finalStatus =
        statusLower.includes('ngừng') ||
        statusLower.includes('ngung') ||
        statusLower.includes('dừng') ||
        statusLower.includes('inactive') ||
        statusLower === 'false' ||
        statusRaw === '0'
          ? ProductStatus.INACTIVE
          : ProductStatus.ACTIVE;

      const featLower = (isFeaturedRaw || '').toLowerCase();
      const finalIsFeatured =
        featLower.includes('có') ||
        featLower.includes('co') ||
        featLower === 'true' ||
        featLower === '1' ||
        featLower === 'yes' ||
        featLower === 'x' ||
        featLower === 'v';

      const imagesList = imagesRaw
        ? imagesRaw
            .split(/[\n,;]+/)
            .map((img) => img.replace(/^["']|["']$/g, '').trim())
            .filter((img) => img.length > 0)
        : [];

      // 4. TIẾN HÀNH TẠO MỚI SẢN PHẨM & TỒN KHO
      try {
        const slug = this.generateSlug(name.trim());
        const product = new this.productModel({
          name: name.trim(),
          sku: sku.trim(),
          slug,
          category: categoryId,
          brand: finalBrand,
          price,
          discountPrice,
          stock,
          unit: finalUnit,
          status: finalStatus,
          isFeatured: finalIsFeatured,
          images: imagesList,
          description: description || '',
          sold: 0,
          rating: 5,
          isDeleted: false,
        });

        const savedProduct = await product.save();

        // Tự động tạo bản ghi quản lý kho (Inventory)
        try {
          let invStatus = InventoryStatus.IN_STOCK;
          if (stock <= 0) invStatus = InventoryStatus.OUT_OF_STOCK;
          else if (stock <= 10) invStatus = InventoryStatus.LOW_STOCK;

          await this.inventoryModel.create({
            product: savedProduct._id,
            currentStock: stock,
            minStock: 10,
            maxStock: 1000,
            status: invStatus,
            lastUpdated: new Date(),
          });
        } catch (invErr) {
          this.logger.error(
            'Lỗi khi tự động tạo kho cho sản phẩm import:',
            invErr,
          );
        }

        created.push({
          row: r,
          sku: sku.trim(),
          name: name.trim(),
          category: matchedCategoryName,
          price,
          stock,
        });
      } catch (saveErr: any) {
        this.logger.error(`Lỗi lưu sản phẩm tại dòng ${r}:`, saveErr);
        errors.push({
          row: r,
          sku,
          name,
          reason: `Lỗi CSDL khi tạo sản phẩm: ${saveErr.message || 'Không xác định'}`,
        });
      }
    }

    return {
      success: true,
      message: `Xử lý hoàn tất: Đã thêm mới ${created.length} sản phẩm, Bỏ qua ${skipped.length} sản phẩm đã có, ${errors.length} dòng bị lỗi.`,
      summary: {
        totalRows: created.length + skipped.length + errors.length,
        createdCount: created.length,
        skippedCount: skipped.length,
        errorCount: errors.length,
      },
      details: {
        created,
        skipped,
        errors,
      },
    };
  }
}
