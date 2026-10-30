import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
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
import { UsersService } from '../users/users.service';
import { Types } from 'mongoose';
import {
  PaymentMethod,
  ProductStatus,
  StaffPermission,
  UserRole,
} from '../../common/enums';

describe('PosService (POS-01 to POS-12 & SPRINT 1 NEW-001 -> NEW-006)', () => {
  let service: PosService;
  let mockPOSOrderModel: any;
  let mockProductModel: any;
  let mockInventoryModel: any;
  let mockTransactionModel: any;
  let mockConnection: any;
  let mockProductsService: any;
  let mockInventoryService: any;
  let mockUsersService: any;
  let mockCountersCollection: any;

  const cashierUser = {
    _id: '507f1f77bcf86cd799439011',
    fullName: 'Nguyễn Thu Ngân',
    role: UserRole.STAFF,
    permissions: [StaffPermission.POS_ACCESS],
  };

  const cashierWithOverridePerm = {
    _id: '507f1f77bcf86cd799439012',
    fullName: 'Lê Giám Sát Ca',
    role: UserRole.STAFF,
    permissions: [
      StaffPermission.POS_ACCESS,
      StaffPermission.POS_OVERRIDE_DISCOUNT,
    ],
  };

  const adminUser = {
    _id: '507f1f77bcf86cd799439099',
    fullName: 'Trần Quản Lý',
    role: UserRole.ADMIN,
    permissions: [],
  };

  const sampleProduct = {
    _id: new Types.ObjectId('507f1f77bcf86cd799439022'),
    name: 'Bút bi Thiên Long TL-027',
    sku: 'SP000001',
    barcode: '8935001234567',
    price: 5000,
    discountPrice: 0,
    wholesalePrice: 4000,
    wholesaleMinQuantity: 20,
    stock: 50,
    unit: 'cây',
    status: ProductStatus.ACTIVE,
    isDeleted: false,
    unitConversions: [
      { unit: 'hộp', ratio: 20, price: 90000, barcode: '8935001234568' },
    ],
  };

  const sampleProduct2 = {
    _id: new Types.ObjectId('507f1f77bcf86cd799439033'),
    name: 'Vở Campus B5 200 trang',
    sku: 'SP000002',
    barcode: '8935001234599',
    price: 25000,
    discountPrice: 0,
    wholesalePrice: 20000,
    wholesaleMinQuantity: 5,
    stock: 40,
    unit: 'cuốn',
    status: ProductStatus.ACTIVE,
    isDeleted: false,
    unitConversions: [],
  };

  const sampleInventory = {
    _id: new Types.ObjectId(),
    product: sampleProduct._id,
    currentStock: 50,
    costPrice: 3000,
  };

  beforeEach(async () => {
    mockCountersCollection = {
      findOneAndUpdate: jest.fn().mockResolvedValue({ seq: 1 }),
      findOne: jest.fn().mockResolvedValue({ seq: 1 }),
      updateOne: jest.fn().mockResolvedValue({}),
    };

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
      findById: jest.fn().mockReturnValue({
        session: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      }),
      find: jest.fn(),
      countDocuments: jest.fn().mockReturnValue({
        session: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(0),
      }),
      db: {
        collection: jest.fn().mockReturnValue(mockCountersCollection),
      },
    };

    mockProductModel = {
      findById: jest.fn().mockImplementation((id: any) => {
        const idStr = id?.toString();
        let prod = sampleProduct;
        if (idStr === sampleProduct2._id.toString()) {
          prod = sampleProduct2;
        }
        return {
          exec: jest.fn().mockResolvedValue({ ...prod }),
        };
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

    mockUsersService = {
      findById: jest.fn().mockImplementation((id: string) => {
        if (id === adminUser._id) {
          return Promise.resolve({
            _id: new Types.ObjectId(adminUser._id),
            fullName: adminUser.fullName,
            role: adminUser.role,
            status: true,
            permissions: [],
          });
        }
        return Promise.resolve(null);
      }),
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
        { provide: UsersService, useValue: mockUsersService },
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
        40,
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
  });

  describe('NEW-001 — Khóa quyền giảm giá tại quầy [P0]', () => {
    it('should block staff applying > 20% discount even if reason is entered, when manager has not approved', async () => {
      const dto = {
        items: [
          {
            productId: sampleProduct._id.toString(),
            quantity: 10,
            unit: 'cây',
          },
        ],
        discountAmount: 15000, // 15k out of 50k = 30% discount (> 20%)
        discountReason: 'Khách quen mua nhiều lần trong tuần',
      };

      await expect(
        service.createPOSOrder(dto as any, cashierUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should account for line item discounts + order discount when calculating total discount rate', async () => {
      // 10 cây * 5000 = 50,000đ
      // Line discount: 7,500đ (15%) -> lineTotal = 42,500đ
      // Order discount: 5,000đ (10% of 50,000)
      // Total discount: 12,500đ / 50,000đ = 25% (> 20%)
      const dto = {
        items: [
          {
            productId: sampleProduct._id.toString(),
            quantity: 10,
            unit: 'cây',
            discount: 7500,
          },
        ],
        discountAmount: 5000,
        discountReason: 'Giảm giá phối hợp',
      };

      await expect(
        service.createPOSOrder(dto as any, cashierUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow staff to apply > 20% discount when valid approvedById from manager is provided', async () => {
      const dto = {
        items: [
          {
            productId: sampleProduct._id.toString(),
            quantity: 10,
            unit: 'cây',
          },
        ],
        discountAmount: 15000, // 30%
        discountReason: 'Quản lý duyệt xả hàng',
        approvedById: adminUser._id,
      };

      const result = await service.createPOSOrder(dto, cashierUser);
      expect(result).toBeDefined();
      expect(result.approvedBy?.toString()).toBe(adminUser._id);
      expect(result.approvedByName).toBe(adminUser.fullName);
      expect(result.totalDiscountPercent).toBe(30);
    });

    it('should allow manager (ADMIN) to apply > 20% discount directly', async () => {
      const dto = {
        items: [
          {
            productId: sampleProduct._id.toString(),
            quantity: 10,
            unit: 'cây',
          },
        ],
        discountAmount: 25000, // 50% discount
        discountReason: 'Thanh lý hàng trưng bày',
      };

      const result = await service.createPOSOrder(dto, adminUser);
      expect(result).toBeDefined();
      expect(result.finalAmount).toBe(25000);
      expect(result.totalDiscountPercent).toBe(50);
    });

    it('should allow staff with POS_OVERRIDE_DISCOUNT permission to apply > 20% discount directly', async () => {
      const dto = {
        items: [
          {
            productId: sampleProduct._id.toString(),
            quantity: 10,
            unit: 'cây',
          },
        ],
        discountAmount: 15000, // 30%
        discountReason: 'Giám sát ca đồng ý',
      };

      const result = await service.createPOSOrder(dto, cashierWithOverridePerm);
      expect(result).toBeDefined();
      expect(result.finalAmount).toBe(35000);
    });

    it('should reject line item discount exceeding item gross amount', async () => {
      const dto = {
        items: [
          {
            productId: sampleProduct._id.toString(),
            quantity: 2, // 2 * 5000 = 10,000đ
            unit: 'cây',
            discount: 15000, // Exceeds 10,000đ
          },
        ],
      };

      await expect(
        service.createPOSOrder(dto as any, cashierUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject negative, NaN or Infinity discounts', async () => {
      const dtoNegative = {
        items: [
          {
            productId: sampleProduct._id.toString(),
            quantity: 2,
            discount: -5000,
          },
        ],
      };
      await expect(
        service.createPOSOrder(dtoNegative as any, cashierUser),
      ).rejects.toThrow(BadRequestException);

      const dtoNaN = {
        items: [{ productId: sampleProduct._id.toString(), quantity: 2 }],
        discountAmount: NaN,
      };
      await expect(
        service.createPOSOrder(dtoNaN as any, cashierUser),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('NEW-002 — Không tin tỷ lệ quy đổi đơn vị do client gửi [P0]', () => {
    it('should reject client forged conversion ratio that differs from DB configuration', async () => {
      // Product box ratio is 20 in DB, but client submits conversionRatio = 1
      const dto = {
        items: [
          {
            productId: sampleProduct._id.toString(),
            quantity: 2,
            unit: 'hộp',
            conversionRatio: 1, // Fraudulent ratio
          },
        ],
      };

      await expect(
        service.createPOSOrder(dto as any, cashierUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject unconfigured unit submitted by client', async () => {
      const dto = {
        items: [
          {
            productId: sampleProduct._id.toString(),
            quantity: 2,
            unit: 'thùng_chưa_cấu_hình',
          },
        ],
      };

      await expect(
        service.createPOSOrder(dto as any, cashierUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject non-integer quantities for discrete countable units', async () => {
      const dto = {
        items: [
          {
            productId: sampleProduct._id.toString(),
            quantity: 1.5, // 1.5 cây bút is invalid
            unit: 'cây',
          },
        ],
      };

      await expect(
        service.createPOSOrder(dto as any, cashierUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject multi-line order with same product when total requested quantity exceeds stock', async () => {
      // sampleProduct stock is 100. Let's request 60 + 50 = 110 cây
      const dto = {
        items: [
          {
            productId: sampleProduct._id.toString(),
            quantity: 60,
            unit: 'cây',
          },
          {
            productId: sampleProduct._id.toString(),
            quantity: 50,
            unit: 'cây',
          },
        ],
      };

      await expect(
        service.createPOSOrder(dto as any, cashierUser),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('NEW-004 — Phân bổ giảm giá và tính giá trị hàng trả [P0]', () => {
    it('should proportionally allocate order discount to items so sum of effective totals matches finalAmount exactly', async () => {
      // Item 1: 10 cây * 5000 = 50,000đ
      // Item 2: 2 cuốn * 25000 = 50,000đ
      // Subtotal = 100,000đ, Order discount = 20,000đ -> Final = 80,000đ
      const dto = {
        items: [
          {
            productId: sampleProduct._id.toString(),
            quantity: 10,
            unit: 'cây',
          },
          {
            productId: sampleProduct2._id.toString(),
            quantity: 2,
            unit: 'cuốn',
          },
        ],
        discountAmount: 20000,
        discountReason: 'Khuyến mãi thành viên',
      };

      const result = await service.createPOSOrder(dto, adminUser);
      expect(result).toBeDefined();
      expect(result.subtotal).toBe(100000);
      expect(result.finalAmount).toBe(80000);

      const item1 = result.items[0];
      const item2 = result.items[1];

      // Each line had 50k/100k (50%), so each receives 10k allocated discount
      expect(item1.allocatedOrderDiscount).toBe(10000);
      expect(item1.effectiveLineTotal).toBe(40000);
      expect(item1.netUnitPrice).toBe(4000); // 40,000 / 10

      expect(item2.allocatedOrderDiscount).toBe(10000);
      expect(item2.effectiveLineTotal).toBe(40000);
      expect(item2.netUnitPrice).toBe(20000); // 40,000 / 2

      expect(item1.effectiveLineTotal + item2.effectiveLineTotal).toBe(
        result.finalAmount,
      );
    });

    it('should refund based on net discounted price rather than undiscounted gross price', async () => {
      // Two items: Subtotal 200,000đ, Discount 50,000đ, Final 150,000đ
      const order = {
        _id: new Types.ObjectId(),
        invoiceCode: 'HD261030-0088',
        status: POSOrderStatus.COMPLETED,
        subtotal: 200000,
        discountAmount: 50000,
        finalAmount: 150000,
        totalRefundedAmount: 0,
        items: [
          {
            product: sampleProduct._id,
            sku: sampleProduct.sku,
            name: sampleProduct.name,
            unit: 'cây',
            conversionRatio: 1,
            quantity: 20, // 20 * 5k = 100k
            unitPrice: 5000,
            lineTotal: 100000,
            allocatedOrderDiscount: 25000,
            effectiveLineTotal: 75000,
            netUnitPrice: 3750, // 75,000 / 20 = 3,750đ
            returnedQuantity: 0,
          },
          {
            product: sampleProduct2._id,
            sku: sampleProduct2.sku,
            name: sampleProduct2.name,
            unit: 'cuốn',
            conversionRatio: 1,
            quantity: 4, // 4 * 25k = 100k
            unitPrice: 25000,
            lineTotal: 100000,
            allocatedOrderDiscount: 25000,
            effectiveLineTotal: 75000,
            netUnitPrice: 18750, // 75,000 / 4 = 18,750đ
            returnedQuantity: 0,
          },
        ],
        refundHistory: [] as any[],
        save: jest.fn().mockResolvedValue(true),
      };

      mockPOSOrderModel.findById.mockReturnValue({
        session: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(order),
      });

      // Customer returns 10 pens (out of 20)
      const refundDto1 = {
        items: [
          {
            productId: sampleProduct._id.toString(),
            quantity: 10,
            condition: POSItemCondition.GOOD,
          },
        ],
        reason: 'Khách đổi ý trả nửa số bút',
      };

      const res1 = await service.refundPOSOrder(
        order._id.toString(),
        refundDto1,
        adminUser,
      );
      // 10 * 3,750đ = 37,500đ (NOT 10 * 5,000đ = 50,000đ!)
      expect(res1.refundHistory[0].totalRefundAmount).toBe(37500);
      expect(res1.totalRefundedAmount).toBe(37500);

      // Now customer returns remaining 10 pens and all 4 notebooks
      const refundDto2 = {
        items: [
          {
            productId: sampleProduct._id.toString(),
            quantity: 10,
            condition: POSItemCondition.GOOD,
          },
          {
            productId: sampleProduct2._id.toString(),
            quantity: 4,
            condition: POSItemCondition.GOOD,
          },
        ],
        reason: 'Trả hết các món còn lại',
      };

      const res2 = await service.refundPOSOrder(
        order._id.toString(),
        refundDto2,
        adminUser,
      );
      // Pen remaining: 75,000 - 37,500 = 37,500đ
      // Notebook: 75,000đ
      // Second refund: 37,500 + 75,000 = 112,500đ
      // Total refunded across both: 37,500 + 112,500 = 150,000đ (matches finalAmount exactly!)
      expect(res2.totalRefundedAmount).toBe(150000);
      expect(res2.status).toBe(POSOrderStatus.RETURNED);
    });
  });

  describe('NEW-003 & NEW-005 — Chống hoàn trả trùng và tranh chấp đồng thời [P0]', () => {
    it('should reject returning more than sold quantity', async () => {
      const order = {
        _id: new Types.ObjectId(),
        invoiceCode: 'HD261030-0010',
        status: POSOrderStatus.COMPLETED,
        finalAmount: 50000,
        totalRefundedAmount: 0,
        items: [
          {
            product: sampleProduct._id,
            sku: sampleProduct.sku,
            name: sampleProduct.name,
            unit: 'cây',
            quantity: 10,
            lineTotal: 50000,
            effectiveLineTotal: 50000,
            netUnitPrice: 5000,
            returnedQuantity: 7, // Already returned 7
          },
        ],
        refundHistory: [] as any[],
        save: jest.fn().mockResolvedValue(true),
      };

      mockPOSOrderModel.findById.mockReturnValue({
        session: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(order),
      });

      // Requesting 4 more when only 3 remain (10 - 7 = 3)
      const refundDto = {
        items: [
          {
            productId: sampleProduct._id.toString(),
            quantity: 4,
            condition: POSItemCondition.GOOD,
          },
        ],
        reason: 'Khách muốn trả thêm',
      };

      await expect(
        service.refundPOSOrder(order._id.toString(), refundDto, adminUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should perform safe idempotent replay on identical refund key without restocking twice', async () => {
      const existingRefundHash = service['computeRefundPayloadHash']({
        items: [
          {
            productId: sampleProduct._id.toString(),
            quantity: 2,
            condition: POSItemCondition.GOOD,
          },
        ],
        reason: 'Khách đổi trả hàng',
      });

      const order = {
        _id: new Types.ObjectId(),
        invoiceCode: 'HD261030-0011',
        status: POSOrderStatus.PARTIALLY_RETURNED,
        finalAmount: 50000,
        totalRefundedAmount: 10000,
        items: [
          {
            product: sampleProduct._id,
            sku: sampleProduct.sku,
            name: sampleProduct.name,
            unit: 'cây',
            quantity: 10,
            lineTotal: 50000,
            effectiveLineTotal: 50000,
            netUnitPrice: 5000,
            returnedQuantity: 2,
          },
        ],
        refundHistory: [
          {
            refundId: 'RF-001',
            idempotencyKey: 'refund-key-abc',
            payloadHash: existingRefundHash,
            totalRefundAmount: 10000,
            items: [],
          },
        ],
        save: jest.fn().mockResolvedValue(true),
      };

      mockPOSOrderModel.findById.mockReturnValue({
        session: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(order),
      });

      const replayDto = {
        idempotencyKey: 'refund-key-abc',
        items: [
          {
            productId: sampleProduct._id.toString(),
            quantity: 2,
            condition: POSItemCondition.GOOD,
          },
        ],
        reason: 'Khách đổi trả hàng',
      };

      const res = await service.refundPOSOrder(
        order._id.toString(),
        replayDto,
        adminUser,
      );

      expect(res).toBe(order);
      // No stock update on replay
      expect(mockProductsService.updateStock).not.toHaveBeenCalled();
    });

    it('should throw ConflictException (409) when same refund key is sent with different payload', async () => {
      const order = {
        _id: new Types.ObjectId(),
        invoiceCode: 'HD261030-0012',
        status: POSOrderStatus.PARTIALLY_RETURNED,
        finalAmount: 50000,
        totalRefundedAmount: 10000,
        items: [
          {
            product: sampleProduct._id,
            quantity: 10,
            lineTotal: 50000,
            effectiveLineTotal: 50000,
            netUnitPrice: 5000,
            returnedQuantity: 2,
          },
        ],
        refundHistory: [
          {
            refundId: 'RF-001',
            idempotencyKey: 'refund-key-conflict',
            payloadHash: 'hash-original-refund',
            totalRefundAmount: 10000,
          },
        ],
        save: jest.fn().mockResolvedValue(true),
      };

      mockPOSOrderModel.findById.mockReturnValue({
        session: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(order),
      });

      const conflictingDto = {
        idempotencyKey: 'refund-key-conflict',
        items: [
          {
            productId: sampleProduct._id.toString(),
            quantity: 5,
            condition: POSItemCondition.GOOD,
          },
        ],
        reason: 'Nội dung khác',
      };

      await expect(
        service.refundPOSOrder(order._id.toString(), conflictingDto, adminUser),
      ).rejects.toThrow(ConflictException);
    });

    it('should NOT restock sellable stock when item condition is DAMAGED', async () => {
      const order = {
        _id: new Types.ObjectId(),
        invoiceCode: 'HD261030-0013',
        status: POSOrderStatus.COMPLETED,
        finalAmount: 10000,
        totalRefundedAmount: 0,
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
            effectiveLineTotal: 10000,
            netUnitPrice: 5000,
            returnedQuantity: 0,
          },
        ],
        refundHistory: [] as any[],
        save: jest.fn().mockResolvedValue(true),
      };

      mockPOSOrderModel.findById.mockReturnValue({
        session: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(order),
      });

      const refundDto = {
        items: [
          {
            productId: sampleProduct._id.toString(),
            quantity: 2,
            condition: POSItemCondition.DAMAGED,
          },
        ],
        reason: 'Bút bị hỏng mực do khách',
      };

      const res = await service.refundPOSOrder(
        order._id.toString(),
        refundDto,
        adminUser,
      );

      expect(res.status).toBe(POSOrderStatus.RETURNED);
      expect(mockProductsService.updateStock).not.toHaveBeenCalled();
      expect(mockTransactionModel.create).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'DAMAGE',
            change: 0,
          }),
        ]),
        expect.anything(),
      );
    });

    it('should accurately target matching unit when refunding order having multiple units of same product', async () => {
      const order = {
        _id: new Types.ObjectId(),
        invoiceCode: 'HD261030-0088',
        finalAmount: 185000,
        totalRefundedAmount: 0,
        status: POSOrderStatus.COMPLETED,
        items: [
          {
            product: sampleProduct._id,
            sku: 'TL-027',
            name: 'Bút bi Thiên Long TL-027',
            unit: 'cây',
            conversionRatio: 1,
            quantity: 5,
            lineTotal: 25000,
            effectiveLineTotal: 25000,
            netUnitPrice: 5000,
            returnedQuantity: 0,
          },
          {
            product: sampleProduct._id,
            sku: 'TL-027-BOX',
            name: 'Bút bi Thiên Long TL-027 (Hộp)',
            unit: 'hộp',
            conversionRatio: 20,
            quantity: 2,
            lineTotal: 160000,
            effectiveLineTotal: 160000,
            netUnitPrice: 80000,
            returnedQuantity: 0,
          },
        ],
        refundHistory: [] as any[],
        save: jest.fn().mockResolvedValue(true),
      };

      mockPOSOrderModel.findById.mockReturnValue({
        session: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(order),
      });

      // Refund 1 hộp (not cây)
      const refundDto = {
        items: [
          {
            productId: sampleProduct._id.toString(),
            quantity: 1,
            unit: 'hộp',
            condition: POSItemCondition.GOOD,
          },
        ],
        reason: 'Khách thừa 1 hộp',
      };

      const res = await service.refundPOSOrder(
        order._id.toString(),
        refundDto,
        adminUser,
      );

      // Verify the hộp item was refunded (1 * 80000 = 80000)
      const boxItem = res.items.find((it) => it.unit === 'hộp');
      const penItem = res.items.find((it) => it.unit === 'cây');
      expect(boxItem?.returnedQuantity).toBe(1);
      expect(penItem?.returnedQuantity).toBe(0);
      expect(res.totalRefundedAmount).toBe(80000);
      expect(res.status).toBe(POSOrderStatus.PARTIALLY_RETURNED);
    });
  });

  describe('NEW-005 — Khóa idempotency của phiếu POS theo nội dung request [P1]', () => {
    it('should return existing order on exact idempotent replay (same key, same payload)', async () => {
      const dto = {
        items: [{ productId: sampleProduct._id.toString(), quantity: 3 }],
        idempotencyKey: 'pos-idemp-001',
      };

      const expectedHash = service['computeOrderPayloadHash'](dto);

      const existingOrder = {
        _id: new Types.ObjectId(),
        invoiceCode: 'HD261030-0001',
        idempotencyKey: 'pos-idemp-001',
        payloadHash: expectedHash,
        finalAmount: 15000,
      };

      mockPOSOrderModel.findOne.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(existingOrder),
      });

      const result = await service.createPOSOrder(dto, cashierUser);
      expect(result).toBe(existingOrder);
      expect(mockProductsService.deductStock).not.toHaveBeenCalled();
    });

    it('should throw ConflictException (409) if same idempotencyKey is used with different payload', async () => {
      const existingOrder = {
        _id: new Types.ObjectId(),
        invoiceCode: 'HD261030-0001',
        idempotencyKey: 'pos-idemp-002',
        payloadHash: 'hash-for-3-items',
        finalAmount: 15000,
      };

      mockPOSOrderModel.findOne.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(existingOrder),
      });

      // Different quantity (5 instead of 3)
      const alteredDto = {
        items: [{ productId: sampleProduct._id.toString(), quantity: 5 }],
        idempotencyKey: 'pos-idemp-002',
      };

      await expect(
        service.createPOSOrder(alteredDto, cashierUser),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('NEW-006 — Sửa mã hóa đơn POS bị tranh chấp [P1]', () => {
    it('should generate invoice code atomically from counters collection', async () => {
      mockCountersCollection.findOneAndUpdate.mockResolvedValueOnce({
        seq: 42,
      });

      const dto = {
        items: [{ productId: sampleProduct._id.toString(), quantity: 1 }],
      };

      const res = await service.createPOSOrder(dto, cashierUser);
      expect(res.invoiceCode).toMatch(/^HD\d{6}-0042$/);
      expect(mockCountersCollection.findOneAndUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: expect.stringMatching(/^pos_invoice_HD\d{6}$/),
        }),
        { $inc: { seq: 1 } },
        expect.objectContaining({ upsert: true, returnDocument: 'after' }),
      );
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
