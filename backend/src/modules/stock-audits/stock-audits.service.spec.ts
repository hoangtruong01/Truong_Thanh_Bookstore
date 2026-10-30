import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { StockAuditsService } from './stock-audits.service';
import { StockAudit, StockAuditStatus } from './schemas/stock-audit.schema';
import { Product } from '../products/schemas/product.schema';
import { Inventory } from '../inventory/schemas/inventory.schema';
import { InventoryService } from '../inventory/inventory.service';
import { ConflictException, BadRequestException } from '@nestjs/common';

describe('StockAuditsService (ERP-04)', () => {
  let service: StockAuditsService;
  let auditModel: any;
  let productModel: any;
  let inventoryModel: any;
  let inventoryService: any;
  let mockCountersCollection: any;

  const productId1 = new Types.ObjectId().toString();
  const productId2 = new Types.ObjectId().toString();
  const auditId = new Types.ObjectId().toString();
  const userId = new Types.ObjectId().toString();

  const mockProducts = [
    {
      _id: new Types.ObjectId(productId1),
      name: 'Bút bi Thiên Long TL-027',
      sku: 'TL027',
      unit: 'cây',
      isDeleted: false,
    },
    {
      _id: new Types.ObjectId(productId2),
      name: 'Sổ tay bìa da A5',
      sku: 'ST-A5',
      unit: 'cuốn',
      isDeleted: false,
    },
  ];

  const mockInventories = [
    {
      product: new Types.ObjectId(productId1),
      currentStock: 100,
      costPrice: 3000,
    },
    {
      product: new Types.ObjectId(productId2),
      currentStock: 20,
      costPrice: 60000,
    },
  ];

  beforeEach(async () => {
    mockCountersCollection = {
      findOneAndUpdate: jest.fn().mockResolvedValue({ seq: 1 }),
    };

    auditModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      _id: auditId,
      save: jest.fn().mockImplementation(function () {
        return Promise.resolve(this);
      }),
    }));

    auditModel.db = {
      collection: jest.fn().mockReturnValue(mockCountersCollection),
    };

    auditModel.findOne = jest.fn().mockReturnValue({
      session: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(null),
    });
    auditModel.find = jest.fn();
    auditModel.countDocuments = jest.fn();

    productModel = {
      find: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockProducts),
      }),
    };

    inventoryModel = {
      find: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockInventories),
      }),
    };

    inventoryService = {
      adjustStock: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockAuditsService,
        {
          provide: getModelToken(StockAudit.name),
          useValue: auditModel,
        },
        {
          provide: getModelToken(Product.name),
          useValue: productModel,
        },
        {
          provide: getModelToken(Inventory.name),
          useValue: inventoryModel,
        },
        {
          provide: InventoryService,
          useValue: inventoryService,
        },
      ],
    }).compile();

    service = module.get<StockAuditsService>(StockAuditsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create (ERP-04)', () => {
    it('tạo đợt kiểm kê thành công và đóng băng số tồn hệ thống (systemStock)', async () => {
      const res = await service.create(
        { title: 'Kiểm kê định kỳ tháng 10' },
        userId,
      );

      expect(res.auditCode).toMatch(/^AUD\d{6}-\d{4}$/);
      expect(res.status).toBe(StockAuditStatus.DRAFT);
      expect(res.items).toHaveLength(2);

      // Verify systemStock was captured accurately
      const pen = res.items.find(
        (i: any) => i.product.toString() === productId1,
      )!;
      expect(pen).toBeDefined();
      expect(pen.systemStock).toBe(100);
      expect(pen.costPrice).toBe(3000);
      expect(pen.discrepancy).toBe(0);

      const book = res.items.find(
        (i: any) => i.product.toString() === productId2,
      )!;
      expect(book).toBeDefined();
      expect(book.systemStock).toBe(20);
      expect(book.costPrice).toBe(60000);
    });
  });

  describe('submitCount (ERP-04)', () => {
    it('tự tính chênh lệch và kích hoạt requiresApproval nếu lệch > 5 sản phẩm', async () => {
      const draftAudit: any = {
        _id: auditId,
        status: StockAuditStatus.DRAFT,
        items: [
          {
            product: new Types.ObjectId(productId1),
            productName: 'Bút bi TL-027',
            sku: 'TL027',
            unit: 'cây',
            systemStock: 100,
            actualStock: 100,
            costPrice: 3000,
            discrepancy: 0,
            discrepancyValue: 0,
          },
        ],
        save: jest.fn().mockImplementation(function () {
          return Promise.resolve(this);
        }),
      };

      auditModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(draftAudit),
      });

      // Thực tế đếm được 92 cây (thất thoát 8 cây > ngưỡng 5)
      const res = await service.submitCount(
        auditId,
        {
          items: [
            {
              product: productId1,
              actualStock: 92,
              reason: 'Rơi mất trong quầy',
            },
          ],
        },
        userId,
      );

      expect(res.items[0].discrepancy).toBe(-8);
      expect(res.items[0].discrepancyValue).toBe(-24000);
      expect(res.requiresApproval).toBe(true);
      expect(res.status).toBe(StockAuditStatus.PENDING_APPROVAL);
      expect(res.submittedAt).toBeInstanceOf(Date);
    });

    it('kích hoạt requiresApproval nếu tổng giá trị chênh lệch > 500.000 VND', async () => {
      const draftAudit: any = {
        _id: auditId,
        status: StockAuditStatus.DRAFT,
        items: [
          {
            product: new Types.ObjectId(productId2),
            productName: 'Sổ tay bìa da A5',
            sku: 'ST-A5',
            unit: 'cuốn',
            systemStock: 20,
            actualStock: 20,
            costPrice: 600000, // Sổ tay cao cấp 600,000 đ/cuốn
            discrepancy: 0,
            discrepancyValue: 0,
          },
        ],
        save: jest.fn().mockImplementation(function () {
          return Promise.resolve(this);
        }),
      };

      auditModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(draftAudit),
      });

      // Mất 1 cuốn (lệch 1 cái <= 5 nhưng giá trị = -600,000 đ > 500,000 đ)
      const res = await service.submitCount(
        auditId,
        {
          items: [
            {
              product: productId2,
              actualStock: 19,
              reason: 'Thất thoát 1 cuốn',
            },
          ],
        },
        userId,
      );

      expect(res.items[0].discrepancy).toBe(-1);
      expect(res.items[0].discrepancyValue).toBe(-600000);
      expect(res.requiresApproval).toBe(true);
    });
  });

  describe('approve (ERP-04)', () => {
    it('áp dụng điều chỉnh tồn kho qua optimistic locking transaction khi được duyệt', async () => {
      const pendingAudit: any = {
        _id: auditId,
        auditCode: 'AUD261030-0001',
        status: StockAuditStatus.PENDING_APPROVAL,
        items: [
          {
            product: new Types.ObjectId(productId1),
            productName: 'Bút bi TL-027',
            sku: 'TL027',
            unit: 'cây',
            systemStock: 100,
            actualStock: 95,
            discrepancy: -5,
            costPrice: 3000,
            discrepancyValue: -15000,
            reason: 'Hư hỏng 5 cây',
          },
        ],
        save: jest.fn().mockImplementation(function () {
          return Promise.resolve(this);
        }),
      };

      auditModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(pendingAudit),
      });

      const res = await service.approve(auditId, userId, {
        note: 'Quản lý duyệt chênh lệch',
      });

      expect(res.status).toBe(StockAuditStatus.APPROVED);
      expect(res.approvedBy).toEqual(new Types.ObjectId(userId));
      expect(res.appliedAt).toBeInstanceOf(Date);

      // Verify adjustStock was called with expectedCurrentStock to prevent race condition
      expect(inventoryService.adjustStock).toHaveBeenCalledWith(
        expect.objectContaining({
          product: productId1,
          newStock: 95,
          expectedCurrentStock: 100,
          reference: 'AUD261030-0001',
        }),
        userId,
      );
    });

    it('ném ConflictException nếu tồn kho thực tế bị tranh chấp (POS vừa bán trong lúc kiểm kê)', async () => {
      const pendingAudit: any = {
        _id: auditId,
        auditCode: 'AUD261030-0001',
        status: StockAuditStatus.PENDING_APPROVAL,
        items: [
          {
            product: new Types.ObjectId(productId1),
            productName: 'Bút bi TL-027',
            unit: 'cây',
            systemStock: 100,
            actualStock: 95,
            discrepancy: -5,
          },
        ],
      };

      auditModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(pendingAudit),
      });

      // Giả lập inventoryService ném ConflictException vì tồn thực tế không còn là 100
      inventoryService.adjustStock.mockRejectedValue(
        new ConflictException('Số lượng tồn kho hiện tại đã thay đổi'),
      );

      await expect(service.approve(auditId, userId)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('reject (ERP-04)', () => {
    it('từ chối đợt kiểm kê mà không thay đổi kho', async () => {
      const pendingAudit: any = {
        _id: auditId,
        status: StockAuditStatus.PENDING_APPROVAL,
        save: jest.fn().mockImplementation(function () {
          return Promise.resolve(this);
        }),
      };

      auditModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(pendingAudit),
      });

      const res = await service.reject(auditId, userId, {
        reason: 'Số liệu không chính xác, đếm lại',
      });
      expect(res.status).toBe(StockAuditStatus.REJECTED);
      expect(res.rejectionReason).toBe('Số liệu không chính xác, đếm lại');
      expect(inventoryService.adjustStock).not.toHaveBeenCalled();
    });
  });
});
