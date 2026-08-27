import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { ProductsService } from './products.service';
import { Product } from './schemas/product.schema';
import { Review } from './schemas/review.schema';
import { StockAlert } from './schemas/stock-alert.schema';
import { Category } from '../categories/schemas/category.schema';
import { Inventory } from '../inventory/schemas/inventory.schema';
import { EmailService } from '../email/email.service';
import { ConfigService } from '@nestjs/config';
import { ProductStatus } from '../../common/enums';

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

    mockProductModel.find = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([mockProduct]),
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue([mockProduct]),
            }),
          }),
        }),
      }),
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([mockProduct]),
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue([mockProduct]),
          }),
        }),
      }),
      lean: jest.fn().mockResolvedValue([mockProduct]),
      exec: jest.fn().mockResolvedValue([mockProduct]),
    });

    mockProductModel.findOne = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockProduct),
      lean: jest.fn().mockResolvedValue(mockProduct),
    });

    mockProductModel.findById = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockProduct),
      }),
      exec: jest.fn().mockResolvedValue(mockProduct),
    });

    mockProductModel.findByIdAndUpdate = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          ...mockProduct,
          name: 'Bút bi Thiên Long Cập Nhật',
        }),
      }),
      exec: jest.fn().mockResolvedValue({
        ...mockProduct,
        name: 'Bút bi Thiên Long Cập Nhật',
      }),
    });

    mockProductModel.countDocuments = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(1),
    });

    mockProductModel.distinct = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(['Thiên Long', 'Bến Nghé']),
    });

    mockCategoryModel = {
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([mockCategory]),
        }),
        lean: jest.fn().mockResolvedValue([mockCategory]),
        exec: jest.fn().mockResolvedValue([mockCategory]),
      }),
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
        { provide: getModelToken(Review.name), useValue: {} },
        { provide: getModelToken(StockAlert.name), useValue: {} },
        { provide: getModelToken(Category.name), useValue: mockCategoryModel },
        { provide: getModelToken(Inventory.name), useValue: mockInventoryModel },
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
      mockProductModel.findById.mockReturnValueOnce({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      await expect(service.findById('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
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

      await expect(service.softDelete(mockProduct._id)).resolves.toBeUndefined();
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

      const importResult = await service.importFromExcel(Buffer.from(excelBuffer));
      expect(importResult).toBeDefined();
      expect(importResult.success).toBe(true);
      expect(importResult.summary.createdCount).toBe(1);
      expect(importResult.summary.errorCount).toBe(0);
    });
  });
});
