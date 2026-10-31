import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { PurchaseReturnsService } from './purchase-returns.service';
import {
  PurchaseReturn,
  PurchaseReturnStatus,
  CreditAdjustmentStatus,
} from './schemas/purchase-return.schema';
import { GoodsReceipt, ItemCondition } from './schemas/goods-receipt.schema';
import { InventoryService } from '../inventory/inventory.service';
import { FinanceService } from '../finance/finance.service';

describe('PurchaseReturnsService', () => {
  let service: PurchaseReturnsService;
  let mockReturnModel: any;
  let mockReceiptModel: any;
  let mockInventoryService: any;
  let mockFinanceService: any;

  beforeEach(async () => {
    mockReturnModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      save: jest.fn().mockResolvedValue({ _id: new Types.ObjectId(), ...dto }),
    }));
    mockReturnModel.find = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue([]),
    });
    mockReturnModel.findOne = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });
    mockReturnModel.countDocuments = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(0),
    });
    mockReturnModel.db = {
      collection: jest.fn().mockReturnValue({
        findOneAndUpdate: jest.fn().mockResolvedValue({ seq: 1 }),
      }),
    };

    mockReceiptModel = {
      findOne: jest.fn(),
    };

    mockInventoryService = {
      adjustStock: jest.fn().mockResolvedValue({}),
    };

    mockFinanceService = {
      applyPurchaseReturnCredit: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchaseReturnsService,
        {
          provide: getModelToken(PurchaseReturn.name),
          useValue: mockReturnModel,
        },
        {
          provide: getModelToken(GoodsReceipt.name),
          useValue: mockReceiptModel,
        },
        {
          provide: InventoryService,
          useValue: mockInventoryService,
        },
        {
          provide: FinanceService,
          useValue: mockFinanceService,
        },
      ],
    }).compile();

    service = module.get<PurchaseReturnsService>(PurchaseReturnsService);
  });

  describe('PUR-04: Purchase Returns to Supplier', () => {
    const grId = new Types.ObjectId().toString();
    const prodId = new Types.ObjectId().toString();
    const supplierId = new Types.ObjectId().toString();
    const userId = new Types.ObjectId().toString();

    const mockGR: any = {
      _id: new Types.ObjectId(grId),
      receiptCode: 'GR261030-0001',
      supplier: new Types.ObjectId(supplierId),
      items: [
        {
          product: new Types.ObjectId(prodId),
          productName: 'Giấy A4 Double A',
          sku: 'GIAY-A4-001',
          unit: 'ram',
          conversionRatio: 1,
          receivedQuantity: 100,
          baseQuantity: 100,
          actualUnitPrice: 80000,
          condition: ItemCondition.GOOD,
        },
      ],
    };

    it('PUR04-T01: Tạo phiếu trả hàng thành công -> Giảm tồn kho, lưu chứng từ', async () => {
      mockReceiptModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockGR),
        }),
      });

      mockReturnModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([]), // Chưa trả lần nào
      });
      mockReturnModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const res = await service.createReturn(
        {
          goodsReceiptId: grId,
          items: [
            {
              productId: prodId,
              unit: 'ram',
              returnedQuantity: 10,
              condition: ItemCondition.DAMAGED,
              reason: 'Bao bì rách, ẩm ướt',
            },
          ],
          note: 'Trả 10 ram bị hỏng',
        },
        userId,
      );

      expect(res.returnCode).toBeDefined();
      expect(res.items.length).toBe(1);
      expect(res.items[0].returnedQuantity).toBe(10);
      expect(res.items[0].baseQuantity).toBe(10);
      expect(res.totalAmount).toBe(800000); // 10 * 80.000
      expect(mockInventoryService.adjustStock).toHaveBeenCalledWith(
        expect.objectContaining({
          product: prodId,
          quantity: -10, // Giảm 10
        }),
        userId,
      );
    });

    it('PUR04-T02: Trả vượt quá số lượng đã nhận theo GRN -> Báo lỗi', async () => {
      mockReceiptModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockGR),
        }),
      });

      mockReturnModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([
          {
            items: [{ product: new Types.ObjectId(prodId), baseQuantity: 95 }],
          },
        ]),
      });

      await expect(
        service.createReturn(
          {
            goodsReceiptId: grId,
            items: [
              {
                productId: prodId,
                unit: 'ram',
                returnedQuantity: 10, // 95 + 10 = 105 > 100
                reason: 'Hàng lỗi',
              },
            ],
          },
          userId,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('PUR04-T03: Trả sản phẩm không thuộc GRN -> Báo lỗi', async () => {
      mockReceiptModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockGR),
        }),
      });

      const unknownProdId = new Types.ObjectId().toString();

      await expect(
        service.createReturn(
          {
            goodsReceiptId: grId,
            items: [
              {
                productId: unknownProdId,
                unit: 'ram',
                returnedQuantity: 5,
                reason: 'Lỗi',
              },
            ],
          },
          userId,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('PUR04-T04: Idempotency retry -> Không trừ kho lần hai', async () => {
      const existingPR: any = {
        _id: new Types.ObjectId(),
        returnCode: 'PR261030-0001',
        idempotencyKey: 'retry_key_123',
      };

      mockReturnModel.findOne.mockResolvedValue(existingPR);

      const res = await service.createReturn(
        {
          goodsReceiptId: grId,
          idempotencyKey: 'retry_key_123',
          items: [
            {
              productId: prodId,
              unit: 'ram',
              returnedQuantity: 5,
              reason: 'Lỗi',
            },
          ],
        },
        userId,
      );

      expect(res.returnCode).toBe('PR261030-0001');
      expect(mockInventoryService.adjustStock).not.toHaveBeenCalled();
    });

    it('PUR04-T05: Xác nhận bù trừ công nợ sau khi NCC chấp thuận', async () => {
      const prId = new Types.ObjectId().toString();
      const mockPR: any = {
        _id: new Types.ObjectId(prId),
        returnCode: 'PR261030-0001',
        goodsReceipt: new Types.ObjectId(grId),
        totalAmount: 800000,
        creditAdjustmentStatus: CreditAdjustmentStatus.PENDING,
        save: jest.fn().mockImplementation(function () {
          return Promise.resolve(this);
        }),
      };

      mockReturnModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockPR),
      });

      const res = await service.confirmCreditAdjustment(
        prId,
        { note: 'NCC đã gửi biên bản cấn trừ công nợ' },
        userId,
      );

      expect(res.creditAdjustmentStatus).toBe(CreditAdjustmentStatus.APPLIED);
      expect(mockFinanceService.applyPurchaseReturnCredit).toHaveBeenCalledWith(
        mockPR.goodsReceipt,
        800000,
        'PR261030-0001',
        'NCC đã gửi biên bản cấn trừ công nợ',
      );
    });
  });
});
