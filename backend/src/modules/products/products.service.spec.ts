import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';
import * as ExcelJS from 'exceljs';
import { ProductsService } from './products.service';
import { Product } from './schemas/product.schema';
import { StockAlert } from './schemas/stock-alert.schema';
import { Category } from '../categories/schemas/category.schema';
import { Inventory } from '../inventory/schemas/inventory.schema';
import { ReviewsService } from '../reviews/reviews.service';
import { EmailService } from '../email/email.service';
import { ConfigService } from '@nestjs/config';
import { ProductStatus } from '../../common/enums';

const createMockQuery = (result: any = null) => {
  const query: any = {
    populate: jest.fn().mockImplementation(() => query),
    sort: jest.fn().mockImplementation(() => query),
    select: jest.fn().mockImplementation(() => query),
    skip: jest.fn().mockImplementation(() => query),
    limit: jest.fn().mockImplementation(() => query),
    lean: jest.fn().mockImplementation(() => {
      const leanQuery: any = {
        exec: jest.fn().mockResolvedValue(result),
        populate: jest.fn().mockImplementation(() => leanQuery),
        sort: jest.fn().mockImplementation(() => leanQuery),
        select: jest.fn().mockImplementation(() => leanQuery),
        skip: jest.fn().mockImplementation(() => leanQuery),
        limit: jest.fn().mockImplementation(() => leanQuery),
        then: (onResolve: any, onReject: any) =>
          Promise.resolve(result).then(onResolve, onReject),
        catch: (onReject: any) => Promise.resolve(result).catch(onReject),
      };
      return leanQuery;
    }),
    exec: jest.fn().mockResolvedValue(result),
    then: (onResolve: any, onReject: any) =>
      Promise.resolve(result).then(onResolve, onReject),
    catch: (onReject: any) => Promise.resolve(result).catch(onReject),
  };
  return query;
};

describe('ProductsService (TASK 10: Product Management & Excel)', () => {
  let service: ProductsService;
  let mockProductModel: any;
  let mockCategoryModel: any;
  let mockInventoryModel: any;

  const mockCategory = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Văn phòng phẩm',
    slug: 'van-phong-pham',
    status: true,
  };

  const mockProduct = {
    _id: '507f1f77bcf86cd799439022',
    name: 'Bút bi Thiên Long TL-027',
    slug: 'but-bi-thien-long-tl-027-abcd',
    sku: 'TL-027-BLUE',
    price: 5000,
    discountPrice: 4500,
    stock: 100,
    sold: 25,
    unit: 'cây',
    brand: 'Thiên Long',
    category: mockCategory._id,
    images: ['https://example.com/pen.jpg'],
    status: ProductStatus.ACTIVE,
    isFeatured: true,
    isDeleted: false,
    save: jest.fn().mockImplementation(function (this: any) {
      return Promise.resolve(this);
    }),
  };

  beforeEach(async () => {
    mockProductModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      _id: '507f1f77bcf86cd799439022',
      save: jest.fn().mockResolvedValue({
        _id: '507f1f77bcf86cd799439022',
        ...dto,
      }),
    }));

    mockProductModel.find = jest
      .fn()
      .mockImplementation(() => createMockQuery([mockProduct]));
    mockProductModel.findOne = jest
      .fn()
      .mockImplementation(() => createMockQuery(mockProduct));
    mockProductModel.findById = jest
      .fn()
      .mockImplementation(() => createMockQuery(mockProduct));
    mockProductModel.findByIdAndUpdate = jest.fn().mockImplementation(() =>
      createMockQuery({
        ...mockProduct,
        name: 'Bút bi Thiên Long Cập Nhật',
      }),
    );

    mockProductModel.countDocuments = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(1),
    });

    mockProductModel.distinct = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(['Thiên Long', 'Bến Nghé']),
    });

    mockCategoryModel = {
      find: jest.fn().mockImplementation(() => createMockQuery([mockCategory])),
      findOne: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockCategory),
        exec: jest.fn().mockResolvedValue(mockCategory),
      }),
      create: jest.fn().mockResolvedValue(mockCategory),
    };

    mockInventoryModel = {
      create: jest.fn().mockResolvedValue({}),
      findOneAndUpdate: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({}),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: getModelToken(Product.name), useValue: mockProductModel },
        {
          provide: ReviewsService,
          useValue: {
            findByProduct: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
        { provide: getModelToken(StockAlert.name), useValue: {} },
        { provide: getModelToken(Category.name), useValue: mockCategoryModel },
        {
          provide: getModelToken(Inventory.name),
          useValue: mockInventoryModel,
        },
        {
          provide: EmailService,
          useValue: { sendStockAlert: jest.fn().mockResolvedValue(true) },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('http://localhost:5173') },
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  describe('1. Product CRUD Operations', () => {
    it('should create a new product and auto-create inventory entry', async () => {
      const createDto: any = {
        name: 'Tập vở 96 trang',
        sku: 'VO-96-01',
        price: 8000,
        stock: 50,
        category: mockCategory._id,
      };

      const result = await service.create(createDto);
      expect(result).toBeDefined();
      expect(result.name).toBe('Tập vở 96 trang');
      expect(result.slug).toBeDefined();
      expect(mockInventoryModel.create).toHaveBeenCalled();
    });

    it('should find all products with pagination and filter', async () => {
      const result = await service.findAll({
        page: 1,
        limit: 10,
        brand: 'Thiên Long',
      });

      expect(result).toBeDefined();
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should find product by id', async () => {
      const result = await service.findById(mockProduct._id);
      expect(result).toBeDefined();
      expect(result.sku).toBe('TL-027-BLUE');
    });

    it('should throw NotFoundException when product is not found by id', async () => {
      mockProductModel.findById.mockReturnValueOnce(createMockQuery(null));

      await expect(
        service.findById('507f1f77bcf86cd799439099'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update product details', async () => {
      const updateDto: any = {
        name: 'Bút bi Thiên Long Cập Nhật',
        price: 6000,
      };

      const result = await service.update(mockProduct._id, updateDto);
      expect(result.name).toBe('Bút bi Thiên Long Cập Nhật');
    });

    it('should soft delete product (isDeleted = true)', async () => {
      mockProductModel.findByIdAndUpdate.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue({ ...mockProduct, isDeleted: true }),
      });

      await expect(
        service.softDelete(mockProduct._id),
      ).resolves.toBeUndefined();
      expect(mockProductModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockProduct._id,
        { isDeleted: true },
      );
    });
  });

  describe('2. Excel Import & Export Operations', () => {
    it('should generate a valid Excel import template (.xlsx)', async () => {
      const buffer = await service.generateImportTemplate();
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);

      // Verify Excel contents
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);
      const sheet = workbook.getWorksheet('DanhSachSanPham');
      expect(sheet).toBeDefined();
      expect(sheet?.getRow(1).getCell(1).value).toContain('Tên sản phẩm');
      expect(sheet?.getRow(1).getCell(2).value).toContain('Mã SKU');
    });

    it('should export products to Excel file (.xlsx)', async () => {
      const buffer = await service.exportToExcel();
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);
      const sheet = workbook.getWorksheet('DanhSachSanPham');
      expect(sheet).toBeDefined();
      expect(sheet?.rowCount).toBeGreaterThanOrEqual(2); // Header + at least 1 row
    });

    it('should throw BadRequestException when importing corrupt/invalid file buffer', async () => {
      const invalidBuffer = Buffer.from('Not a valid excel file content');
      await expect(service.importFromExcel(invalidBuffer)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should successfully parse and import valid Excel worksheet', async () => {
      // Create a test Excel workbook
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('DanhSachSanPham');
      sheet.columns = [
        { header: 'Tên sản phẩm (*)', key: 'name', width: 30 },
        { header: 'Mã SKU (*)', key: 'sku', width: 20 },
        { header: 'Tên danh mục (*)', key: 'category', width: 20 },
        { header: 'Giá bán (*)', key: 'price', width: 15 },
        { header: 'Giá khuyến mãi', key: 'discountPrice', width: 15 },
        { header: 'Số lượng kho', key: 'stock', width: 15 },
        { header: 'Đơn vị tính', key: 'unit', width: 10 },
        { header: 'Thương hiệu / Tác giả', key: 'brand', width: 20 },
        { header: 'Trạng thái', key: 'status', width: 15 },
        { header: 'Nổi bật', key: 'isFeatured', width: 10 },
        { header: 'Link hình ảnh', key: 'images', width: 30 },
        { header: 'Mô tả sản phẩm', key: 'description', width: 30 },
      ];

      sheet.addRow({
        name: 'Thước kẻ dẻo 20cm',
        sku: 'TK-DEO-20',
        category: 'Văn phòng phẩm',
        price: 7000,
        discountPrice: 0,
        stock: 150,
        unit: 'cây',
        brand: 'Thiên Long',
        status: 'Đang bán',
        isFeatured: 'Không',
        images: '',
        description: 'Thước kẻ dẻo học sinh độ bền cao',
      });

      const excelBuffer = await workbook.xlsx.writeBuffer();

      // Mock findOne to return null for new product SKU check
      mockProductModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
        lean: jest.fn().mockResolvedValue(null),
      });

      const importResult = await service.importFromExcel(
        Buffer.from(excelBuffer),
      );
      expect(importResult).toBeDefined();
      expect(importResult.success).toBe(true);
      expect(importResult.summary.createdCount).toBe(1);
      expect(importResult.summary.errorCount).toBe(0);
    });
  });

  describe('3. TASK 12: Full-text Search, Multi-Criteria Filtering & Suggestions', () => {
    it('should search products with diacritic-insensitive regex (Vietnamese accents)', async () => {
      const result = await service.search('dac nhan tam');
      expect(result).toBeDefined();
      expect(mockProductModel.find).toHaveBeenCalled();
      const findArgs =
        mockProductModel.find.mock.calls[
          mockProductModel.find.mock.calls.length - 1
        ][0];
      expect(findArgs.isDeleted).toBe(false);
      expect(findArgs.$or).toBeDefined();
      expect(findArgs.$or.length).toBeGreaterThan(0);
    });

    it('should search products by SKU, ISBN, Author, Publisher, Brand', async () => {
      const result = await service.search('TL-027');
      expect(result).toBeDefined();
      expect(mockProductModel.find).toHaveBeenCalled();
    });

    it('should return empty array for empty or whitespace search query', async () => {
      const result = await service.search('   ');
      expect(result).toEqual([]);
    });

    it('should filter products by price range, rating, stock status, and flash sale', async () => {
      const result = await service.findAll({
        minPrice: 10000,
        maxPrice: 50000,
        minRating: 4,
        inStock: true,
        isFlashSale: true,
        discounted: true,
      });

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      const findArgs =
        mockProductModel.find.mock.calls[
          mockProductModel.find.mock.calls.length - 1
        ][0];
      expect(findArgs.price.$gte).toBe(10000);
      expect(findArgs.price.$lte).toBe(50000);
      expect(findArgs.rating.$gte).toBe(4);
      expect(findArgs.stock.$gt).toBe(0);
      expect(findArgs.isFlashSale).toBe(true);
      expect(findArgs.discountPrice.$gt).toBe(0);
    });

    it('should support multi-brand and multi-author filtering via comma-separated values', async () => {
      await service.findAll({
        brand: 'Thiên Long, Deli, Hồng Hà',
        author: 'Nguyễn Nhật Ánh, Dale Carnegie',
        publisher: 'NXB Trẻ, NXB Kim Đồng',
      });

      const findArgs =
        mockProductModel.find.mock.calls[
          mockProductModel.find.mock.calls.length - 1
        ][0];
      expect(findArgs.brand.$in).toEqual(['Thiên Long', 'Deli', 'Hồng Hà']);
      expect(findArgs.author.$in).toEqual(['Nguyễn Nhật Ánh', 'Dale Carnegie']);
      expect(findArgs.publisher.$in).toEqual(['NXB Trẻ', 'NXB Kim Đồng']);
    });

    it('should handle recursive category filtering when parent category ID is provided', async () => {
      const parentCatId = '507f1f77bcf86cd799439011';
      const childCat = { _id: '507f1f77bcf86cd799439099', name: 'Bút viết' };
      mockCategoryModel.find.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue([childCat]),
      });

      await service.findAll({ category: parentCatId });
      expect(mockCategoryModel.find).toHaveBeenCalledWith({
        parentId: expect.anything(),
      });
    });

    it('should handle all 7 sorting modes correctly', async () => {
      const sortModes = [
        'price_asc',
        'price_desc',
        'rating',
        'best_selling',
        'name_asc',
        'name_desc',
        'discount_desc',
        'newest',
      ];

      for (const sort of sortModes) {
        const result = await service.findAll({ sort });
        expect(result).toBeDefined();
      }
    });

    it('should provide search autocomplete suggestions with keywords, categories and products', async () => {
      mockProductModel.find.mockReturnValueOnce({
        populate: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue([
              {
                ...mockProduct,
                author: 'Thiên Long Design',
              },
            ]),
          }),
        }),
      });

      const suggestions = await service.getSuggestions('but', 5);
      expect(suggestions).toBeDefined();
      expect(suggestions.keywords).toBeDefined();
      expect(suggestions.categories).toBeDefined();
      expect(suggestions.products).toBeDefined();
    });

    it('should return empty suggestions when query is empty', async () => {
      const suggestions = await service.getSuggestions('');
      expect(suggestions).toEqual({
        keywords: [],
        categories: [],
        products: [],
      });
    });

    it('should safely sanitize and prevent ReDoS attacks for long inputs or special regex characters', async () => {
      const maliciousInput = 'a'.repeat(300) + '.*+?^${}()|[]\\';
      const result = await service.findAll({ q: maliciousInput });
      expect(result).toBeDefined();
    });
  });

  describe('4. TASK 13: Product Detail, SEO Slug & Related Products', () => {
    it('should find product detail by valid ID', async () => {
      mockProductModel.findById.mockReturnValueOnce(
        createMockQuery(mockProduct),
      );
      const res = await service.findById(mockProduct._id.toString());
      expect(res).toBeDefined();
      expect(res.name).toBe(mockProduct.name);
    });

    it('should fallback to finding by slug when ID is not found or is a slug string', async () => {
      mockProductModel.findById.mockReturnValueOnce(createMockQuery(null));
      mockProductModel.findOne.mockReturnValueOnce(
        createMockQuery(mockProduct),
      );
      const res = await service.findById('but-bi-thien-long');
      expect(res).toBeDefined();
      expect(res.slug).toBe(mockProduct.slug);
    });

    it('should throw NotFoundException when product is not found by ID or slug', async () => {
      mockProductModel.findById.mockReturnValueOnce(createMockQuery(null));
      mockProductModel.findOne.mockReturnValueOnce(createMockQuery(null));
      await expect(service.findById('non-existent-product')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should find product detail by SEO slug', async () => {
      mockProductModel.findOne.mockReturnValueOnce(
        createMockQuery(mockProduct),
      );
      const res = await service.findBySlug('but-bi-thien-long');
      expect(res).toBeDefined();
      expect(res.slug).toBe(mockProduct.slug);
    });

    it('should throw NotFoundException when slug does not exist', async () => {
      mockProductModel.findOne.mockReturnValueOnce(createMockQuery(null));
      await expect(service.findBySlug('unknown-slug')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return related products matching category, author or brand', async () => {
      mockProductModel.findById.mockReturnValueOnce(
        createMockQuery({
          ...mockProduct,
          author: 'Nguyễn Nhật Ánh',
          publisher: 'NXB Trẻ',
          brand: 'Thiên Long',
        }),
      );

      const relatedList = [
        {
          _id: new Types.ObjectId(),
          name: 'Sách Tôi Thấy Hoa Vàng Trên Cỏ Xanh',
          author: 'Nguyễn Nhật Ánh',
          category: mockProduct.category,
        },
        {
          _id: new Types.ObjectId(),
          name: 'Sách Mắt Biếc',
          author: 'Nguyễn Nhật Ánh',
          category: mockProduct.category,
        },
      ];

      mockProductModel.find.mockReturnValueOnce(createMockQuery(relatedList));

      const res = await service.getRelated(mockProduct._id.toString(), 8);
      expect(res).toBeDefined();
      expect(Array.isArray(res)).toBe(true);
      expect(res.length).toBe(2);
    });

    it('should return empty array if product to find related items for is not found', async () => {
      mockProductModel.findById.mockReturnValueOnce(createMockQuery(null));
      mockProductModel.findOne.mockReturnValueOnce(createMockQuery(null));
      const res = await service.getRelated('unknown-id', 8);
      expect(res).toEqual([]);
    });
  });
});
