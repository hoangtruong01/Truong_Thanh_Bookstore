import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { DataExchangeController } from './data-exchange.controller';
import { DataExchangeService } from './data-exchange.service';
import { StaffPermission, UserRole } from '../../common/enums';

describe('DataExchangeController (XLS-T14 & SEC-02)', () => {
  let controller: DataExchangeController;
  let mockDataExchangeService: any;

  beforeEach(async () => {
    mockDataExchangeService = {
      generateTemplate: jest
        .fn()
        .mockResolvedValue(Buffer.from('mock_template')),
      previewImport: jest
        .fn()
        .mockResolvedValue({ totalRows: 1, validRows: 1 }),
      executeImport: jest.fn().mockResolvedValue({ success: true }),
      exportErrorReport: jest
        .fn()
        .mockResolvedValue(Buffer.from('mock_error_report')),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DataExchangeController],
      providers: [
        {
          provide: DataExchangeService,
          useValue: mockDataExchangeService,
        },
      ],
    }).compile();

    controller = module.get<DataExchangeController>(DataExchangeController);
  });

  describe('XLS-T14: Phân quyền cụ thể theo từng loại Entity Type', () => {
    it('Nhân viên chỉ có MANAGE_PRODUCTS -> Bị từ chối khi truy cập opening_stock (403 Forbidden)', async () => {
      const mockReq = {
        user: {
          role: UserRole.STAFF,
          permissions: [StaffPermission.MANAGE_PRODUCTS], // Thiếu MANAGE_INVENTORY
        },
      };

      const mockFile = {
        buffer: Buffer.from([0x50, 0x4b, 0x03, 0x04]),
      };

      await expect(
        controller.preview('opening_stock', mockFile, mockReq),
      ).rejects.toThrow(ForbiddenException);

      await expect(
        controller.execute('opening_stock', mockFile, 'false', {}, mockReq),
      ).rejects.toThrow(ForbiddenException);
    });

    it('Nhân viên chỉ có MANAGE_INVENTORY -> Bị từ chối khi truy cập products (403 Forbidden)', async () => {
      const mockReq = {
        user: {
          role: UserRole.STAFF,
          permissions: [StaffPermission.MANAGE_INVENTORY], // Thiếu MANAGE_PRODUCTS
        },
      };

      const mockFile = {
        buffer: Buffer.from([0x50, 0x4b, 0x03, 0x04]),
      };

      await expect(
        controller.preview('products', mockFile, mockReq),
      ).rejects.toThrow(ForbiddenException);
    });

    it('Nhân viên có đủ quyền MANAGE_PRODUCTS -> Được phép preview products', async () => {
      const mockReq = {
        user: {
          id: 'staff_1',
          role: UserRole.STAFF,
          permissions: [StaffPermission.MANAGE_PRODUCTS],
        },
      };

      const mockFile = {
        buffer: Buffer.from([0x50, 0x4b, 0x03, 0x04]),
      };

      const result = await controller.preview('products', mockFile, mockReq);
      expect(result).toBeDefined();
      expect(mockDataExchangeService.previewImport).toHaveBeenCalled();
    });

    it('Quản trị viên (ADMIN / SUPER_ADMIN) -> Toàn quyền truy cập mọi entity type', async () => {
      const mockAdminReq = {
        user: {
          id: 'admin_1',
          role: UserRole.ADMIN,
        },
      };

      const mockFile = {
        buffer: Buffer.from([0x50, 0x4b, 0x03, 0x04]),
      };

      const resultProducts = await controller.preview(
        'products',
        mockFile,
        mockAdminReq,
      );
      expect(resultProducts).toBeDefined();

      const resultStock = await controller.preview(
        'opening_stock',
        mockFile,
        mockAdminReq,
      );
      expect(resultStock).toBeDefined();
    });
  });

  describe('Validation file rỗng', () => {
    it('Ném BadRequestException khi không có file tải lên', async () => {
      const mockReq = {
        user: {
          role: UserRole.ADMIN,
        },
      };

      await expect(
        controller.preview('products', null, mockReq),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
