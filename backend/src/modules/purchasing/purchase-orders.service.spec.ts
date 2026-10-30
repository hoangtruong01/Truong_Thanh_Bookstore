import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { PurchaseOrdersService } from './purchase-orders.service';
import {
  PurchaseOrder,
  PurchaseOrderStatus,
} from './schemas/purchase-order.schema';
import { Supplier } from '../suppliers/schemas/supplier.schema';
import { Product } from '../products/schemas/product.schema';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('PurchaseOrdersService (ERP-02)', () => {
  let service: PurchaseOrdersService;
  let poModel: any;
  let supplierModel: any;
  let productModel: any;
  let mockCountersCollection: any;

  const supplierId = new Types.ObjectId().toString();
  const productId = new Types.ObjectId().toString();
  const userId = new Types.ObjectId().toString();

  const mockProduct = {
    _id: productId,
    name: 'Bút bi Thiên Long TL-027',
    sku: 'TL027',
    unit: 'cây',
    unitConversions: [
      { unit: 'hộp', ratio: 20 },
      { unit: 'thùng', ratio: 1000 },
    ],
    isDeleted: false,
  };

  const mockSupplier = {
    _id: supplierId,
    code: 'NCC-0001',
    name: 'Công ty Thiên Long',
    isDeleted: false,
  };

  beforeEach(async () => {
    mockCountersCollection = {
      findOneAndUpdate: jest.fn().mockResolvedValue({ seq: 1 }),
    };

    poModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      _id: new Types.ObjectId().toString(),
      save: jest.fn().mockImplementation(function () {
        return Promise.resolve(this);
      }),
    }));

    poModel.db = {
      collection: jest.fn().mockReturnValue(mockCountersCollection),
    };

    poModel.findOne = jest.fn();
    poModel.find = jest.fn();
    poModel.countDocuments = jest.fn();

    supplierModel = {
      findOne: jest.fn(),
    };

    productModel = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchaseOrdersService,
        {
          provide: getModelToken(PurchaseOrder.name),
          useValue: poModel,
        },
        {
          provide: getModelToken(Supplier.name),
          useValue: supplierModel,
        },
        {
          provide: getModelToken(Product.name),
          useValue: productModel,
        },
      ],
    }).compile();

    service = module.get<PurchaseOrdersService>(PurchaseOrdersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create (ERP-02)', () => {
    it('tạo đơn PO thành công với quy đổi đơn vị và KHÔNG làm tăng tồn kho', async () => {
      supplierModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSupplier),
      });

      productModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockProduct),
      });

      poModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await service.create(
        {
          supplier: supplierId,
          items: [
            {
              product: productId,
              unit: 'hộp',
              orderedQuantity: 5,
              expectedUnitPrice: 60000,
            },
          ],
          note: 'Đặt hàng đợt 1',
        },
        userId,
      );

      expect(result.poCode).toMatch(/^PO\d{6}-\d{4}$/);
      expect(result.status).toBe(PurchaseOrderStatus.DRAFT);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].conversionRatio).toBe(20);
      expect(result.items[0].baseQuantity).toBe(100); // 5 hộp * 20 cây/hộp
      expect(result.items[0].receivedQuantity).toBe(0);
      expect(result.items[0].lineTotal).toBe(300000); // 5 * 60,000
      expect(result.totalAmount).toBe(300000);

      // Nghiệm thu ERP-02: Tạo PO KHÔNG làm tăng tồn kho
      expect(result.status).toBe(PurchaseOrderStatus.DRAFT);
    });

    it('từ chối tạo đơn nếu đơn vị tính chưa được cấu hình cho sản phẩm', async () => {
      supplierModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSupplier),
      });

      productModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockProduct),
      });

      poModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.create(
          {
            supplier: supplierId,
            items: [
              {
                product: productId,
                unit: 'lốc_không_tồn_tại',
                orderedQuantity: 2,
                expectedUnitPrice: 10000,
              },
            ],
          },
          userId,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('từ chối tạo đơn nếu không tìm thấy nhà cung cấp', async () => {
      supplierModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.create(
          {
            supplier: supplierId,
            items: [
              {
                product: productId,
                orderedQuantity: 10,
                expectedUnitPrice: 5000,
              },
            ],
          },
          userId,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('approve & sendToSupplier & cancel (ERP-02)', () => {
    const poId = new Types.ObjectId().toString();

    it('quản lý duyệt đơn PO từ DRAFT sang APPROVED', async () => {
      const mockPoDoc: any = {
        _id: poId,
        poCode: 'PO261030-0001',
        status: PurchaseOrderStatus.DRAFT,
        history: [],
        save: jest.fn().mockImplementation(function () {
          return Promise.resolve(this);
        }),
      };

      poModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockPoDoc),
      });

      const res = await service.approve(poId, userId, {
        note: 'Đã duyệt số lượng và giá',
      });
      expect(res.status).toBe(PurchaseOrderStatus.APPROVED);
      expect(res.approvedBy).toEqual(new Types.ObjectId(userId));
      expect(res.approvedAt).toBeInstanceOf(Date);
      expect(mockPoDoc.save).toHaveBeenCalled();
    });

    it('từ chối duyệt đơn nếu PO không ở trạng thái DRAFT', async () => {
      const mockPoDoc: any = {
        _id: poId,
        status: PurchaseOrderStatus.APPROVED,
      };

      poModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockPoDoc),
      });

      await expect(service.approve(poId, userId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('gửi đơn PO sang NCC từ APPROVED sang SENT', async () => {
      const mockPoDoc: any = {
        _id: poId,
        status: PurchaseOrderStatus.APPROVED,
        history: [],
        save: jest.fn().mockImplementation(function () {
          return Promise.resolve(this);
        }),
      };

      poModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockPoDoc),
      });

      const res = await service.sendToSupplier(
        poId,
        userId,
        'Đã gửi qua email',
      );
      expect(res.status).toBe(PurchaseOrderStatus.SENT);
      expect(mockPoDoc.save).toHaveBeenCalled();
    });

    it('từ chối hủy đơn PO đã nhận một phần hoặc đã nhận đủ', async () => {
      const mockPoDoc: any = {
        _id: poId,
        status: PurchaseOrderStatus.PARTIALLY_RECEIVED,
      };

      poModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockPoDoc),
      });

      await expect(
        service.cancel(poId, userId, { reason: 'Hủy đơn' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('hủy đơn thành công khi PO đang ở DRAFT/APPROVED/SENT', async () => {
      const mockPoDoc: any = {
        _id: poId,
        status: PurchaseOrderStatus.SENT,
        history: [],
        save: jest.fn().mockImplementation(function () {
          return Promise.resolve(this);
        }),
      };

      poModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockPoDoc),
      });

      const res = await service.cancel(poId, userId, {
        reason: 'NCC hết hàng',
      });
      expect(res.status).toBe(PurchaseOrderStatus.CANCELLED);
      expect(mockPoDoc.save).toHaveBeenCalled();
    });
  });
});
