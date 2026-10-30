import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PosService } from './pos.service';
import {
  POSOrder,
  POSOrderStatus,
  POSCustomerType,
  POSItemCondition,
} from './schemas/pos-order.schema';
import { Product } from '../products/schemas/product.schema';
import {
  Inventory,
  InventoryTransaction,
} from '../inventory/schemas/inventory.schema';
import { ProductsService } from '../products/products.service';
import { InventoryService } from '../inventory/inventory.service';
import { Types } from 'mongoose';
import { PaymentMethod, ProductStatus, UserRole } from '../../common/enums';

describe('PosService (POS-01 to POS-12 & TT-021)', () => {
  let service: PosService;
  let mockPOSOrderModel: any;
  let mockProductModel: any;
  let mockInventoryModel: any;
  let mockTransactionModel: any;
  let mockConnection: any;
  let mockProductsService: any;
  let mockInventoryService: any;

  const cashierUser = {
    _id: '507f1f77bcf86cd799439011',
    fullName: 'Nguyễn Thu Ngân',
    role: UserRole.STAFF,
  };

  const adminUser = {
    _id: '507f1f77bcf86cd799439099',
    fullName: 'Trần Quản Lý',
    role: UserRole.ADMIN,
  };

  const sampleProduct = {
    _id: new Types.ObjectId('507f1f77bcf86cd799439022'),
    name: 'Bút bi Thiên Long TL-027',
    sku: 'SP000001',
    barcode: '8935001234567',
    price: 5000,
    discountPrice: 0,
    wholesalePrice: 4000,
    wholesaleMinQuantity: 10,
    stock: 50,
    unit: 'cây',
    status: ProductStatus.ACTIVE,
    isDeleted: false,
    unitConversions: [
      { unit: 'hộp', ratio: 20, price: 90000, barcode: '8935001234568' },
    ],
  };

  const sampleInventory = {
    _id: new Types.ObjectId(),
    product: sampleProduct._id,
    currentStock: 50,
    costPrice: 3000,
  };

  beforeEach(async () => {
    mockPOSOrderModel = {
      create: jest
        .fn()
        .mockImplementation((docs) =>
          Promise.resolve(
            docs.map((d: any) => ({ ...d, _id: new Types.ObjectId() })),
          ),
        ),
      findOne: jest.fn().mockReturnValue({
        session: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      }),
      findById: jest.fn(),
      find: jest.fn(),
      countDocuments: jest.fn().mockReturnValue({
        session: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(0),
      }),
    };

    mockProductModel = {
      findById: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({ ...sampleProduct }),
      }),
      find: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([{ ...sampleProduct }]),
      }),
    };

    mockInventoryModel = {
      findOne: jest.fn().mockReturnValue({
        session: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue({ ...sampleInventory }),
      }),
    };

    mockTransactionModel = {
      create: jest.fn().mockResolvedValue([]),
    };

    const mockSession = {
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      endSession: jest.fn(),
    };

    mockConnection = {
      startSession: jest.fn().mockResolvedValue(mockSession),
    };

    mockProductsService = {
      deductStock: jest.fn().mockResolvedValue(undefined),
      incrementSold: jest.fn().mockResolvedValue(undefined),
      updateStock: jest.fn().mockResolvedValue(undefined),
    };

    mockInventoryService = {
      recordExternalMovement: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PosService,
        { provide: getModelToken(POSOrder.name), useValue: mockPOSOrderModel },
        { provide: getModelToken(Product.name), useValue: mockProductModel },
        {
          provide: getModelToken(Inventory.name),
          useValue: mockInventoryModel,
        },
        {
          provide: getModelToken(InventoryTransaction.name),
          useValue: mockTransactionModel,
        },
        { provide: 'DatabaseConnection', useValue: mockConnection },
        { provide: ProductsService, useValue: mockProductsService },
        { provide: InventoryService, useValue: mockInventoryService },
      ],
    }).compile();

    service = module.get<PosService>(PosService);
  });

  describe('createPOSOrder (POS-01, POS-03, TT-021)', () => {
    it('should successfully create POS order and deduct stock atomically', async () => {
      const dto = {
        items: [
          {
            productId: sampleProduct._id.toString(),
            quantity: 3,
            unit: 'cây',
          },
        ],
        customerName: 'Khách mua tại quầy',
        paymentMethod: PaymentMethod.CASH,
        cashGiven: 20000,
      };

      const result = await service.createPOSOrder(dto, cashierUser);

      expect(result).toBeDefined();
      expect(result.invoiceCode).toMatch(/^HD\d{6}-\d{4}$/);
      expect(result.subtotal).toBe(15000); // 3 * 5000
      expect(result.finalAmount).toBe(15000);
      expect(result.changeGiven).toBe(5000); // 20000 - 15000
      expect(mockProductsService.deductStock).toHaveBeenCalledWith(
        sampleProduct._id.toString(),
        3,
        expect.anything(),
      );
      expect(mockProductsService.incrementSold).toHaveBeenCalledWith(
        sampleProduct._id.toString(),
        3,
        expect.anything(),
      );
      expect(mockTransactionModel.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException when requested quantity exceeds available stock (POS-03)', async () => {
      mockInventoryModel.findOne.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue({ currentStock: 2 }),
      });

      const dto = {
        items: [
          {
            productId: sampleProduct._id.toString(),
            quantity: 5,
          },
        ],
      };

      await expect(
        service.createPOSOrder(dto as any, cashierUser),
      ).rejects.toThrow(BadRequestException);
      expect(mockProductsService.deductStock).not.toHaveBeenCalled();
    });

    it('should handle unit conversion and deduct base quantity (POS-05)', async () => {
      // Selling 2 hộp (where 1 hộp = 20 cây => 40 cây base quantity)
      const dto = {
        items: [
          {
            productId: sampleProduct._id.toString(),
            quantity: 2,
            unit: 'hộp',
          },
        ],
      };

      const result = await service.createPOSOrder(dto, cashierUser);

      expect(result).toBeDefined();
      expect(result.items[0].conversionRatio).toBe(20);
      expect(result.items[0].baseQuantity).toBe(40);
      expect(result.items[0].unitPrice).toBe(90000); // Custom box price
      expect(result.subtotal).toBe(180000); // 2 * 90000
      expect(mockProductsService.deductStock).toHaveBeenCalledWith(
        sampleProduct._id.toString(),
        40, // 40 base units deducted
        expect.anything(),
      );
    });

    it('should automatically apply wholesale price when customerType is WHOLESALE (POS-06)', async () => {
      const dto = {
        customerType: POSCustomerType.WHOLESALE,
        items: [
          {
            productId: sampleProduct._id.toString(),
            quantity: 5,
            unit: 'cây',
          },
        ],
      };

      const result = await service.createPOSOrder(dto, cashierUser);

      expect(result).toBeDefined();
      expect(result.items[0].unitPrice).toBe(4000); // wholesale price applied
      expect(result.subtotal).toBe(20000); // 5 * 4000
    });

    it('should enforce manager approval or reason for discount > 20% (POS-06, POS-08)', async () => {
      const dto = {
        items: [
          {
            productId: sampleProduct._id.toString(),
            quantity: 10,
            unit: 'cây',
          },
        ],
        discountAmount: 20000, // 20k out of 50k is 40% discount
        discountReason: '', // missing reason
      };

      await expect(
        service.createPOSOrder(dto as any, cashierUser),
      ).rejects.toThrow(ForbiddenException);

      // But should succeed for ADMIN
      const adminResult = await service.createPOSOrder(dto, adminUser);
      expect(adminResult).toBeDefined();
    });

    it('should be idempotent and prevent double-charging (TT-005, POS-01)', async () => {
      const existingOrder = {
        _id: new Types.ObjectId(),
        invoiceCode: 'HD261030-0001',
        idempotencyKey: 'idemp-12345',
        finalAmount: 15000,
      };

      mockPOSOrderModel.findOne.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(existingOrder),
      });

      const dto = {
        items: [{ productId: sampleProduct._id.toString(), quantity: 3 }],
        idempotencyKey: 'idemp-12345',
      };

      const result = await service.createPOSOrder(dto, cashierUser);

      expect(result).toBe(existingOrder);
      expect(mockProductsService.deductStock).not.toHaveBeenCalled();
    });
  });

  describe('refundPOSOrder (POS-07)', () => {
    it('should process partial return with GOOD condition and restock inventory', async () => {
      const existingOrder = {
        _id: new Types.ObjectId('607f1f77bcf86cd799439088'),
        invoiceCode: 'HD261030-0001',
        status: POSOrderStatus.COMPLETED,
        finalAmount: 50000,
        items: [
          {
            product: sampleProduct._id,
            sku: sampleProduct.sku,
            name: sampleProduct.name,
            unit: 'cây',
            conversionRatio: 1,
            quantity: 10,
            unitPrice: 5000,
            lineTotal: 50000,
            returnedQuantity: 0,
          },
        ],
        refundHistory: [],
        totalRefundedAmount: 0,
        save: jest.fn().mockResolvedValue(true),
      };

      mockPOSOrderModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(existingOrder),
      });

      const refundDto = {
        items: [
          {
            productId: sampleProduct._id.toString(),
            quantity: 3,
            condition: POSItemCondition.GOOD,
          },
        ],
        reason: 'Khách mua nhầm loại',
      };

      const res = await service.refundPOSOrder(
        existingOrder._id.toString(),
        refundDto,
        adminUser,
      );

      expect(res).toBeDefined();
      expect(res.status).toBe(POSOrderStatus.PARTIALLY_RETURNED);
      expect(res.items[0].returnedQuantity).toBe(3);
      expect(res.totalRefundedAmount).toBe(15000); // 3 * 5000
      expect(mockProductsService.updateStock).toHaveBeenCalledWith(
        sampleProduct._id.toString(),
        3, // 3 units restocked
        expect.anything(),
      );
      expect(mockProductsService.incrementSold).toHaveBeenCalledWith(
        sampleProduct._id.toString(),
        -3,
        expect.anything(),
      );
    });

    it('should NOT restock inventory when returned condition is DAMAGED (POS-07)', async () => {
      const existingOrder = {
        _id: new Types.ObjectId(),
        invoiceCode: 'HD261030-0002',
        status: POSOrderStatus.COMPLETED,
        finalAmount: 10000,
        items: [
          {
            product: sampleProduct._id,
            sku: sampleProduct.sku,
            name: sampleProduct.name,
            unit: 'cây',
            conversionRatio: 1,
            quantity: 2,
            unitPrice: 5000,
            lineTotal: 10000,
            returnedQuantity: 0,
          },
        ],
        refundHistory: [],
        totalRefundedAmount: 0,
        save: jest.fn().mockResolvedValue(true),
      };

      mockPOSOrderModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(existingOrder),
      });

      const refundDto = {
        items: [
          {
            productId: sampleProduct._id.toString(),
            quantity: 2,
            condition: POSItemCondition.DAMAGED,
          },
        ],
        reason: 'Bút bị gãy ngòi do khách làm rơi',
      };

      const res = await service.refundPOSOrder(
        existingOrder._id.toString(),
        refundDto,
        adminUser,
      );

      expect(res.status).toBe(POSOrderStatus.RETURNED);
      expect(mockProductsService.updateStock).not.toHaveBeenCalled(); // No restock for damaged goods
    });
  });

  describe('getSessionReport (POS-10)', () => {
    it('should aggregate revenue, cash, transfer and refund totals correctly', async () => {
      const todayOrders = [
        {
          status: POSOrderStatus.COMPLETED,
          finalAmount: 100000,
          totalRefundedAmount: 0,
          paymentMethod: PaymentMethod.CASH,
          items: [{ quantity: 5, returnedQuantity: 0 }],
        },
        {
          status: POSOrderStatus.COMPLETED,
          finalAmount: 200000,
          totalRefundedAmount: 50000,
          paymentMethod: PaymentMethod.BANK_TRANSFER,
          items: [{ quantity: 10, returnedQuantity: 2 }],
        },
      ];

      mockPOSOrderModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(todayOrders),
      });

      const report = await service.getSessionReport({});

      expect(report.totalOrders).toBe(2);
      expect(report.totalRevenue).toBe(250000); // (100k - 0) + (200k - 50k)
      expect(report.cashTotal).toBe(100000);
      expect(report.transferTotal).toBe(150000);
      expect(report.totalRefundedAmount).toBe(50000);
      expect(report.refundedOrdersCount).toBe(1);
      expect(report.itemsSoldCount).toBe(13); // 5 + (10 - 2)
    });
  });
});
