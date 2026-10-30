import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken, getConnectionToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { GoodsReceiptsService } from './goods-receipts.service';
import { GoodsReceipt, ItemCondition } from './schemas/goods-receipt.schema';
import {
  PurchaseOrder,
  PurchaseOrderStatus,
} from './schemas/purchase-order.schema';
import { InventoryService } from '../inventory/inventory.service';
import { SuppliersService } from '../suppliers/suppliers.service';
import { BadRequestException } from '@nestjs/common';

describe('GoodsReceiptsService (ERP-03)', () => {
  let service: GoodsReceiptsService;
  let receiptModel: any;
  let poModel: any;
  let mockConnection: any;
  let inventoryService: any;
  let suppliersService: any;
  let mockCountersCollection: any;

  const supplierId = new Types.ObjectId().toString();
  const productId = new Types.ObjectId().toString();
  const poId = new Types.ObjectId().toString();
  const userId = new Types.ObjectId().toString();

  const mockPO: any = {
    _id: poId,
    poCode: 'PO261030-0001',
    supplier: supplierId,
    status: PurchaseOrderStatus.APPROVED,
    items: [
      {
        product: new Types.ObjectId(productId),
        productName: 'Bút bi Thiên Long TL-027',
        sku: 'TL027',
        unit: 'hộp',
        conversionRatio: 20,
        orderedQuantity: 5,
        baseQuantity: 100, // 5 hộp = 100 cây
        receivedQuantity: 0,
        expectedUnitPrice: 60000,
        lineTotal: 300000,
      },
    ],
    history: [],
    save: jest.fn().mockImplementation(function () {
      return Promise.resolve(this);
    }),
  };

  beforeEach(async () => {
    mockCountersCollection = {
      findOneAndUpdate: jest.fn().mockResolvedValue({ seq: 1 }),
    };

    receiptModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      _id: new Types.ObjectId().toString(),
      save: jest.fn().mockImplementation(function () {
        return Promise.resolve(this);
      }),
    }));

    receiptModel.db = {
      collection: jest.fn().mockReturnValue(mockCountersCollection),
    };

    receiptModel.findOne = jest.fn().mockReturnValue({
      session: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(null),
    });
    receiptModel.find = jest.fn();
    receiptModel.countDocuments = jest.fn();

    poModel = {
      findOne: jest.fn(),
    };

    mockConnection = {
      startSession: jest.fn().mockResolvedValue({
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        abortTransaction: jest.fn(),
        endSession: jest.fn(),
      }),
    };

    inventoryService = {
      importStock: jest.fn().mockResolvedValue({}),
    };

    suppliersService = {
      recordProductPurchase: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoodsReceiptsService,
        {
          provide: getModelToken(GoodsReceipt.name),
          useValue: receiptModel,
        },
        {
          provide: getModelToken(PurchaseOrder.name),
          useValue: poModel,
        },
        {
          provide: getConnectionToken(),
          useValue: mockConnection,
        },
        {
          provide: InventoryService,
          useValue: inventoryService,
        },
        {
          provide: SuppliersService,
          useValue: suppliersService,
        },
      ],
    }).compile();

    service = module.get<GoodsReceiptsService>(GoodsReceiptsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create (ERP-03)', () => {
    it('nhận một phần PO (PO 100 cây, nhận 60 cây) -> PO chuyển sang PARTIALLY_RECEIVED và tăng tồn 60', async () => {
      poModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          ...mockPO,
          items: [
            {
              product: new Types.ObjectId(productId),
              productName: 'Bút bi Thiên Long TL-027',
              sku: 'TL027',
              unit: 'hộp',
              conversionRatio: 20,
              orderedQuantity: 5,
              baseQuantity: 100,
              receivedQuantity: 0,
              expectedUnitPrice: 60000,
              lineTotal: 300000,
            },
          ],
          save: jest.fn().mockImplementation(function () {
            return Promise.resolve(this);
          }),
        }),
      });

      receiptModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      });

      const res = await service.create(
        {
          purchaseOrder: poId,
          items: [
            {
              product: productId,
              unit: 'hộp',
              receivedQuantity: 3, // 3 hộp = 60 cây
              rejectedQuantity: 0,
              actualUnitPrice: 60000,
            },
          ],
        },
        userId,
      );

      expect(res.receiptCode).toMatch(/^GR\d{6}-\d{4}$/);
      expect(res.items[0].acceptedQuantity).toBe(60);

      // Verify inventory was imported for 60 base units
      expect(inventoryService.importStock).toHaveBeenCalledWith(
        expect.objectContaining({
          product: productId,
          quantity: 60,
          costPrice: 3000, // 60,000 / 20 = 3,000 đ/cây
          reference: expect.stringMatching(/^GR\d{6}-\d{4}$/),
        }),
        userId,
      );

      // Verify supplier price history recorded
      expect(suppliersService.recordProductPurchase).toHaveBeenCalledWith(
        supplierId,
        expect.any(Types.ObjectId),
        60000,
        expect.any(Date),
        expect.anything(),
      );
    });

    it('nhận đủ số lượng còn lại -> PO chuyển sang FULLY_RECEIVED', async () => {
      const activePO: any = {
        ...mockPO,
        status: PurchaseOrderStatus.PARTIALLY_RECEIVED,
        items: [
          {
            product: new Types.ObjectId(productId),
            productName: 'Bút bi Thiên Long TL-027',
            sku: 'TL027',
            unit: 'hộp',
            conversionRatio: 20,
            orderedQuantity: 5,
            baseQuantity: 100,
            receivedQuantity: 60, // Đã nhận 60 cây trước đó
            expectedUnitPrice: 60000,
            lineTotal: 300000,
          },
        ],
        save: jest.fn().mockImplementation(function () {
          return Promise.resolve(this);
        }),
      };

      poModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(activePO),
      });

      receiptModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      });

      await service.create(
        {
          purchaseOrder: poId,
          items: [
            {
              product: productId,
              unit: 'hộp',
              receivedQuantity: 2, // 2 hộp = 40 cây (nhận đủ 100)
              rejectedQuantity: 0,
              actualUnitPrice: 60000,
            },
          ],
        },
        userId,
      );

      expect(activePO.status).toBe(PurchaseOrderStatus.FULLY_RECEIVED);
      expect(activePO.items[0].receivedQuantity).toBe(100);
      expect(inventoryService.importStock).toHaveBeenCalledWith(
        expect.objectContaining({
          product: productId,
          quantity: 40,
        }),
        userId,
      );
    });

    it('từ chối nhận vượt quá số lượng còn chờ nhận trên PO', async () => {
      const activePO: any = {
        ...mockPO,
        items: [
          {
            product: new Types.ObjectId(productId),
            productName: 'Bút bi Thiên Long TL-027',
            unit: 'hộp',
            conversionRatio: 20,
            baseQuantity: 100,
            receivedQuantity: 80, // Chỉ còn chờ nhận 20 cây
          },
        ],
      };

      poModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(activePO),
      });

      receiptModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      });

      // Nhận 2 hộp = 40 cây > 20 cây còn lại
      await expect(
        service.create(
          {
            purchaseOrder: poId,
            items: [
              {
                product: productId,
                unit: 'hộp',
                receivedQuantity: 2,
                actualUnitPrice: 60000,
              },
            ],
          },
          userId,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('ghi nhận hàng hỏng (rejectedQuantity) và chỉ nhập kho số lượng đạt chuẩn (acceptedQuantity)', async () => {
      poModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          ...mockPO,
          items: [
            {
              product: new Types.ObjectId(productId),
              productName: 'Bút bi Thiên Long TL-027',
              unit: 'cây',
              conversionRatio: 1,
              baseQuantity: 50,
              receivedQuantity: 0,
            },
          ],
          save: jest.fn().mockImplementation(function () {
            return Promise.resolve(this);
          }),
        }),
      });

      receiptModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      });

      // Giao 50 cây, 5 cây hỏng vỡ vỏ
      await service.create(
        {
          purchaseOrder: poId,
          items: [
            {
              product: productId,
              unit: 'cây',
              receivedQuantity: 50,
              rejectedQuantity: 5,
              condition: ItemCondition.MIXED,
              actualUnitPrice: 3000,
            },
          ],
        },
        userId,
      );

      // Chỉ nhập kho 45 cây đạt chuẩn
      expect(inventoryService.importStock).toHaveBeenCalledWith(
        expect.objectContaining({
          product: productId,
          quantity: 45,
        }),
        userId,
      );
    });

    it('idempotency replay: trả về phiếu cũ nếu đã xử lý idempotencyKey', async () => {
      const existingReceipt = {
        _id: 'receipt_123',
        receiptCode: 'GR261030-0088',
        idempotencyKey: 'idemp-po-123',
      };

      receiptModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(existingReceipt),
      });

      const res = await service.create(
        {
          purchaseOrder: poId,
          idempotencyKey: 'idemp-po-123',
          items: [
            {
              product: productId,
              receivedQuantity: 10,
              actualUnitPrice: 5000,
            },
          ],
        },
        userId,
      );

      expect(res.receiptCode).toBe('GR261030-0088');
      expect(inventoryService.importStock).not.toHaveBeenCalled();
    });
  });
});
