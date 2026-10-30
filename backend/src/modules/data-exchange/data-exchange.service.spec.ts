import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { DataExchangeService } from './data-exchange.service';
import { Product } from '../products/schemas/product.schema';
import { Category } from '../categories/schemas/category.schema';
import { Supplier } from '../suppliers/schemas/supplier.schema';
import { InventoryService } from '../inventory/inventory.service';

describe('DataExchangeService', () => {
  let service: DataExchangeService;
  let mockProductModel: any;
  let mockCategoryModel: any;
  let mockSupplierModel: any;
  let mockInventoryService: any;

  beforeEach(async () => {
    mockProductModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      _id: 'mock_prod_id',
      save: jest.fn().mockResolvedValue({ _id: 'mock_prod_id', ...dto }),
    }));
    mockProductModel.findOne = jest.fn();

    mockCategoryModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      _id: 'mock_cat_id',
      save: jest.fn().mockResolvedValue({ _id: 'mock_cat_id', ...dto }),
    }));
    mockCategoryModel.findOne = jest.fn();

    mockSupplierModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      _id: 'mock_sup_id',
      save: jest.fn().mockResolvedValue({ _id: 'mock_sup_id', ...dto }),
    }));
    mockSupplierModel.findOne = jest.fn();

    mockInventoryService = {
      importStock: jest.fn().mockResolvedValue({}),
      adjustStock: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DataExchangeService,
        {
          provide: getModelToken(Product.name),
          useValue: mockProductModel,
        },
        {
          provide: getModelToken(Category.name),
          useValue: mockCategoryModel,
        },
        {
          provide: getModelToken(Supplier.name),
          useValue: mockSupplierModel,
        },
        {
          provide: InventoryService,
          useValue: mockInventoryService,
        },
      ],
    }).compile();

    service = module.get<DataExchangeService>(DataExchangeService);
  });

  describe('DOC-01: Template Generation & Security Sanitization', () => {
    it('Tạo template Excel có đủ sheet Huong_Dan và Du_Lieu', async () => {
      const buffer = await service.generateTemplate('products');
      expect(buffer).toBeDefined();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      expect(workbook.getWorksheet('Huong_Dan')).toBeDefined();
      expect(workbook.getWorksheet('Du_Lieu')).toBeDefined();
    });

    it('Khử nguy cơ Formula Injection (=, +, -, @, |)', () => {
      expect(service.sanitizeCellValue('=cmd|/C calc')).toBe("'=cmd|/C calc");
      expect(service.sanitizeCellValue('+12345')).toBe("'+12345");
      expect(service.sanitizeCellValue('@SUM(A1:A10)')).toBe("'@SUM(A1:A10)");
      expect(service.sanitizeCellValue('Sản phẩm bình thường')).toBe(
        'Sản phẩm bình thường',
      );
    });
  });

  describe('DOC-02: Preview Import', () => {
    it('Phát hiện dòng lỗi (thiếu SKU, giá âm, trùng lặp)', async () => {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Du_Lieu');
      sheet.addRow(['SKU', 'Tên', 'Danh mục', 'Giá', 'Giá vốn', 'Tồn']);
      sheet.addRow(['SKU-001', 'Sách Toán', 'Sách', 50000, 30000, 10]); // Hợp lệ
      sheet.addRow(['', 'Sách Văn', 'Sách', 40000, 20000, 5]); // Thiếu SKU
      sheet.addRow(['SKU-002', 'Vở', 'VPP', -1000, 2000, 5]); // Giá âm
      sheet.addRow(['SKU-001', 'Sách Toán 2', 'Sách', 50000, 30000, 10]); // Trùng SKU-001

      const buffer = Buffer.from(await workbook.xlsx.writeBuffer());

      const preview = await service.previewImport('products', buffer);

      expect(preview.totalRows).toBe(4);
      expect(preview.validRows).toBe(1);
      expect(preview.invalidRows).toBe(3);
      expect(preview.errors.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('DOC-03: Execute Import', () => {
    it('Import sản phẩm hợp lệ -> Lưu DB và cập nhật tồn kho', async () => {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Du_Lieu');
      sheet.addRow(['SKU', 'Tên', 'Danh mục', 'Giá', 'Giá vốn', 'Tồn']);
      sheet.addRow([
        'SKU-TEST-01',
        'Bút bi Thiên Long',
        'Bút viết',
        5000,
        3000,
        100,
      ]);

      const buffer = Buffer.from(await workbook.xlsx.writeBuffer());

      mockProductModel.findOne.mockResolvedValue(null);
      mockCategoryModel.findOne.mockResolvedValue({ _id: 'cat_123' });

      const result = await service.executeImport(
        'products',
        buffer,
        'user_123',
      );

      expect(result.success).toBe(true);
      expect(result.importedCount).toBe(1);
      expect(mockInventoryService.importStock).toHaveBeenCalledWith(
        expect.objectContaining({
          quantity: 100,
          costPrice: 3000,
        }),
        'user_123',
      );
    });
  });
});
