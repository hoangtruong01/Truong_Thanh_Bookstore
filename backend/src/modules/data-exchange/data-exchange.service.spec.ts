import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import {
  DataExchangeService,
  OnDuplicateSkuAction,
} from './data-exchange.service';
import { Product } from '../products/schemas/product.schema';
import { Category } from '../categories/schemas/category.schema';
import { Supplier } from '../suppliers/schemas/supplier.schema';
import { ImportBatch, ImportBatchStatus } from './schemas/import-batch.schema';
import { InventoryService } from '../inventory/inventory.service';

describe('DataExchangeService (TASK XLS-01 & SEC-01)', () => {
  let service: DataExchangeService;
  let mockProductModel: any;
  let mockCategoryModel: any;
  let mockSupplierModel: any;
  let mockImportBatchModel: any;
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

    mockImportBatchModel = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest
        .fn()
        .mockImplementation((dto) =>
          Promise.resolve({ _id: 'mock_batch_doc_id', ...dto }),
        ),
    };

    mockInventoryService = {
      importStock: jest.fn().mockResolvedValue({}),
      adjustStock: jest.fn().mockResolvedValue({}),
      ensureInventoryRecord: jest.fn().mockResolvedValue({}),
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
          provide: getModelToken(ImportBatch.name),
          useValue: mockImportBatchModel,
        },
        {
          provide: InventoryService,
          useValue: mockInventoryService,
        },
      ],
    }).compile();

    service = module.get<DataExchangeService>(DataExchangeService);
  });

  describe('SEC-01: File Safety & Integrity', () => {
    it('SEC-01-T02: Từ chối file không có zip/xlsx magic bytes', () => {
      const fakeExeBuffer = Buffer.from('MZ\x90\x00\x03\x00\x00\x00\x04\x00');
      expect(() =>
        service.validateFileSafety(fakeExeBuffer, 'virus.xlsx'),
      ).toThrow(BadRequestException);
    });

    it('SEC-01-T07: Từ chối filename có ký tự path traversal (../ hoặc ..\\)', () => {
      const validZipHeader = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00]);
      expect(() =>
        service.validateFileSafety(validZipHeader, '../../etc/passwd.xlsx'),
      ).toThrow(BadRequestException);
    });

    it('SEC-01-T05: Từ chối workbook có quá nhiều sheet (> 10 sheets)', async () => {
      const workbook = new ExcelJS.Workbook();
      for (let i = 1; i <= 12; i++) {
        workbook.addWorksheet(`Sheet_${i}`);
      }
      const buffer = Buffer.from(await workbook.xlsx.writeBuffer());

      await expect(service.parseWorkbook(buffer, 'products')).rejects.toThrow(
        'File Excel có quá nhiều sheet',
      );
    });
  });

  describe('XLS-01: Shared Validation & Business Rules', () => {
    it('XLS-T01: Supplier thiếu phone, skipErrors=true -> Dòng invalid không được import', async () => {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Du_Lieu');
      sheet.addRow([
        'Mã NCC',
        'Tên NCC',
        'Người LH',
        'Số ĐT',
        'Email',
        'Địa chỉ',
        'Mã số thuế',
      ]);
      sheet.addRow(['NCC-01', 'Công ty ABC', 'Nguyễn A', '0901234567']); // Hợp lệ
      sheet.addRow(['NCC-02', 'Công ty Thiếu Phone', 'Trần B', '']); // Thiếu phone

      const buffer = Buffer.from(await workbook.xlsx.writeBuffer());

      const result = await service.executeImport(
        'suppliers',
        buffer,
        'user_1',
        {
          skipErrors: true,
        },
      );

      expect(result.success).toBe(false);
      expect(result.partialSuccess).toBe(true);
      expect(result.importedCount).toBe(1);
      expect(result.skippedCount).toBe(1);
      expect(result.importedCodes).toEqual(['NCC-01']);
      // Verify NCC-02 was never saved
      expect(mockSupplierModel).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'NCC-01' }),
      );
      expect(mockSupplierModel).not.toHaveBeenCalledWith(
        expect.objectContaining({ code: 'NCC-02' }),
      );
    });

    it('XLS-T02: Product thiếu category -> Invalid và không tạo product', async () => {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Du_Lieu');
      sheet.addRow(['SKU', 'Tên', 'Danh mục', 'Giá bán']);
      sheet.addRow(['SKU-NOCAT', 'Sách Không Danh Mục', '', 50000]);

      const buffer = Buffer.from(await workbook.xlsx.writeBuffer());

      const preview = await service.previewImport('products', buffer);
      expect(preview.validRows).toBe(0);
      expect(preview.invalidRows).toBe(1);
      expect(preview.errors[0].field).toBe('category');

      await expect(
        service.executeImport('products', buffer, 'user_1', {
          skipErrors: false,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('XLS-T03: Product thiếu price -> Invalid, không tự đổi thành 0', async () => {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Du_Lieu');
      sheet.addRow(['SKU', 'Tên', 'Danh mục', 'Giá bán']);
      sheet.addRow(['SKU-NOPRICE', 'Sách Không Giá', 'Sách', '']); // Cột giá để trống

      const buffer = Buffer.from(await workbook.xlsx.writeBuffer());

      const preview = await service.previewImport('products', buffer);
      expect(preview.validRows).toBe(0);
      expect(preview.invalidRows).toBe(1);
      expect(preview.errors[0].field).toBe('price');
      expect(preview.errors[0].message).toContain('không được để trống');
    });

    it('XLS-T04: Product price = 0 -> Áp dụng rule quà tặng, không lỗi nhưng có cảnh báo', async () => {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Du_Lieu');
      sheet.addRow(['SKU', 'Tên', 'Danh mục', 'Giá bán']);
      sheet.addRow(['SKU-GIFT', 'Bút Tặng Kèm', 'VPP', 0]);

      const buffer = Buffer.from(await workbook.xlsx.writeBuffer());

      const preview = await service.previewImport('products', buffer);
      expect(preview.validRows).toBe(1);
      expect(preview.invalidRows).toBe(0);
      expect(preview.warnings.some((w) => w.includes('Giá bán bằng 0'))).toBe(
        true,
      );
    });

    it('XLS-T05: Opening stock = 0 -> Khởi tạo bản ghi tồn kho, không âm thầm bỏ qua', async () => {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Du_Lieu');
      sheet.addRow(['SKU', 'Tên', 'Tồn đầu kỳ', 'Giá vốn']);
      sheet.addRow(['SKU-ZERO-STOCK', 'Sách Hết Hàng', 0, 50000]);

      const buffer = Buffer.from(await workbook.xlsx.writeBuffer());

      mockProductModel.findOne.mockResolvedValue({
        _id: 'prod_zero_123',
        sku: 'SKU-ZERO-STOCK',
      });

      const result = await service.executeImport(
        'opening_stock',
        buffer,
        'user_1',
      );

      expect(result.success).toBe(true);
      expect(result.importedCount).toBe(1);
      expect(mockInventoryService.ensureInventoryRecord).toHaveBeenCalledWith(
        'prod_zero_123',
      );
      expect(mockInventoryService.importStock).not.toHaveBeenCalled();
    });

    it('XLS-T06: SKU trùng trong cùng file -> Preview và Execute báo đúng dòng trùng lặp', async () => {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Du_Lieu');
      sheet.addRow(['SKU', 'Tên', 'Danh mục', 'Giá bán']);
      sheet.addRow(['SKU-DUP', 'Sản phẩm 1', 'Văn phòng', 10000]);
      sheet.addRow(['SKU-DUP', 'Sản phẩm 1 lặp lại', 'Văn phòng', 12000]);

      const buffer = Buffer.from(await workbook.xlsx.writeBuffer());

      const preview = await service.previewImport('products', buffer);
      expect(preview.totalRows).toBe(2);
      expect(preview.validRows).toBe(1);
      expect(preview.invalidRows).toBe(1);
      expect(preview.errors[0].message).toContain('bị trùng lặp trong file');
      expect(preview.errors[0].rowNumber).toBe(3);
    });

    it('XLS-T07: 99 dòng valid, 1 invalid, skipErrors=true -> Import 99, báo 1 lỗi, partialSuccess=true', async () => {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Du_Lieu');
      sheet.addRow(['Mã NCC', 'Tên NCC', 'Người LH', 'Số ĐT']);

      for (let i = 1; i <= 99; i++) {
        sheet.addRow([
          `NCC-${i}`,
          `Nhà Cung Cấp ${i}`,
          'Người A',
          `09000000${i.toString().padStart(2, '0')}`,
        ]);
      }
      sheet.addRow(['NCC-100', 'NCC Thiếu Phone', 'Người B', '']); // 1 dòng lỗi

      const buffer = Buffer.from(await workbook.xlsx.writeBuffer());

      const result = await service.executeImport(
        'suppliers',
        buffer,
        'user_1',
        {
          skipErrors: true,
        },
      );

      expect(result.totalRows).toBe(100);
      expect(result.importedCount).toBe(99);
      expect(result.skippedCount).toBe(1);
      expect(result.failedCount).toBe(1);
      expect(result.partialSuccess).toBe(true);
      expect(result.success).toBe(false);
    });

    it('XLS-T08: 1 dòng invalid, skipErrors=false -> Chặn toàn bộ batch không cho execute', async () => {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Du_Lieu');
      sheet.addRow(['SKU', 'Tên', 'Danh mục', 'Giá bán']);
      sheet.addRow(['SKU-VALID', 'Hợp Lệ', 'Sách', 50000]);
      sheet.addRow(['', 'Không có SKU', 'Sách', 50000]); // Invalid

      const buffer = Buffer.from(await workbook.xlsx.writeBuffer());

      await expect(
        service.executeImport('products', buffer, 'user_1', {
          skipErrors: false,
        }),
      ).rejects.toThrow(BadRequestException);

      expect(mockProductModel).not.toHaveBeenCalled();
    });

    it('XLS-T09 & XLS-T10: File hash đã import trước đó -> Cảnh báo duplicate / từ chối reimport', async () => {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Du_Lieu');
      sheet.addRow(['SKU', 'Tên', 'Tồn đầu kỳ', 'Giá vốn']);
      sheet.addRow(['SKU-REIMPORT', 'Sách Test Reimport', 10, 40000]);

      const buffer = Buffer.from(await workbook.xlsx.writeBuffer());

      mockImportBatchModel.findOne.mockResolvedValueOnce({
        batchId: 'IB-PREVIOUS-BATCH-001',
        status: ImportBatchStatus.COMPLETED,
      });

      // XLS-T10: Preview có cảnh báo file trùng lặp
      const preview = await service.previewImport('opening_stock', buffer);
      expect(preview.isDuplicateFile).toBe(true);
      expect(
        preview.warnings.some((w) => w.includes('IB-PREVIOUS-BATCH-001')),
      ).toBe(true);

      // XLS-T09: Execute từ chối re-import nếu không bật allowReimport
      mockImportBatchModel.findOne.mockResolvedValueOnce({
        batchId: 'IB-PREVIOUS-BATCH-001',
        status: ImportBatchStatus.COMPLETED,
      });

      await expect(
        service.executeImport('opening_stock', buffer, 'user_1', {
          allowReimport: false,
        }),
      ).rejects.toThrow('File này đã từng được import thành công');
    });

    it('XLS-T11: Lỗi giữa batch -> Batch ghi nhận trạng thái PARTIAL, không báo success giả', async () => {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Du_Lieu');
      sheet.addRow(['SKU', 'Tên', 'Tồn đầu kỳ', 'Giá vốn']);
      sheet.addRow(['SKU-EXIST', 'Có Sẵn', 10, 50000]);
      sheet.addRow(['SKU-MISSING', 'Không Tồn Tại', 10, 50000]);

      const buffer = Buffer.from(await workbook.xlsx.writeBuffer());

      mockProductModel.findOne
        .mockResolvedValueOnce({ _id: 'prod_exist', sku: 'SKU-EXIST' }) // SKU 1 tìm thấy
        .mockResolvedValueOnce(null); // SKU 2 không tìm thấy

      const result = await service.executeImport(
        'opening_stock',
        buffer,
        'user_1',
      );

      expect(result.success).toBe(false);
      expect(result.partialSuccess).toBe(true);
      expect(result.importedCount).toBe(1);
      expect(result.failedCount).toBe(1);
      expect(
        result.errors.some((e) =>
          e.message.includes('Không tìm thấy sản phẩm'),
        ),
      ).toBe(true);
    });

    it('XLS-T12: Export error report -> Tạo buffer Excel có đủ thông tin chi tiết lỗi', async () => {
      const errors = [
        {
          rowNumber: 2,
          column: 'A',
          field: 'sku',
          value: '',
          message: 'Mã SKU không được để trống',
        },
        {
          rowNumber: 5,
          column: 'D',
          field: 'phone',
          value: null,
          message: 'Số điện thoại không được để trống',
        },
      ];

      const buffer = await service.exportErrorReport(errors);
      expect(buffer).toBeDefined();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);
      const sheet = workbook.getWorksheet('Bao_Cao_Loi');

      expect(sheet).toBeDefined();
      expect(sheet!.rowCount).toBe(3); // 1 header + 2 error rows
      expect(sheet!.getRow(2).getCell(5).value).toBe(
        'Mã SKU không được để trống',
      );
    });

    it('XLS-T13: Import product SKU tồn tại -> Xử lý theo onDuplicateSku (UPDATE / SKIP / REJECT)', async () => {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Du_Lieu');
      sheet.addRow(['SKU', 'Tên', 'Danh mục', 'Giá bán']);
      sheet.addRow(['SKU-EXIST-01', 'Tên Mới Cập Nhật', 'Sách', 60000]);

      const buffer = Buffer.from(await workbook.xlsx.writeBuffer());

      mockCategoryModel.findOne.mockResolvedValue({ _id: 'cat_book' });

      // Case 1: UPDATE (mặc định)
      const existingDoc = {
        _id: 'prod_exist_id',
        sku: 'SKU-EXIST-01',
        name: 'Tên Cũ',
        price: 50000,
        save: jest.fn().mockResolvedValue(true),
      };
      mockProductModel.findOne.mockResolvedValueOnce(existingDoc);

      const resultUpdate = await service.executeImport(
        'products',
        buffer,
        'user_1',
        {
          onDuplicateSku: OnDuplicateSkuAction.UPDATE,
        },
      );
      expect(resultUpdate.updatedCount).toBe(1);
      expect(existingDoc.name).toBe('Tên Mới Cập Nhật');

      // Case 2: SKIP
      mockProductModel.findOne.mockResolvedValueOnce(existingDoc);
      const resultSkip = await service.executeImport(
        'products',
        buffer,
        'user_1',
        {
          onDuplicateSku: OnDuplicateSkuAction.SKIP,
        },
      );
      expect(resultSkip.skippedCount).toBe(1);
      expect(resultSkip.importedCount).toBe(0);

      // Case 3: REJECT
      mockProductModel.findOne.mockResolvedValueOnce(existingDoc);
      const resultReject = await service.executeImport(
        'products',
        buffer,
        'user_1',
        {
          onDuplicateSku: OnDuplicateSkuAction.REJECT,
        },
      );
      expect(resultReject.failedCount).toBe(1);
      expect(
        resultReject.errors.some((e) =>
          e.message.includes('đã tồn tại trong hệ thống'),
        ),
      ).toBe(true);
    });
  });
});
