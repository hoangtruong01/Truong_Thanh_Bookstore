import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException } from '@nestjs/common';
import { PosService } from './pos.service';
import { POSOrder } from './schemas/pos-order.schema';
import { Product } from '../products/schemas/product.schema';
import {
  Inventory,
  InventoryTransaction,
} from '../inventory/schemas/inventory.schema';
import { ProductsService } from '../products/products.service';
import { InventoryService } from '../inventory/inventory.service';
import { Types } from 'mongoose';
import { PaymentMethod, ProductStatus, UserRole } from '../../common/enums';

describe('POS-03 Omnichannel Stock Concurrency (Web vs POS)', () => {
  let posService: PosService;
  let mockPOSOrderModel: any;
  let mockProductModel: any;
  let mockInventoryModel: any;
  let mockTransactionModel: any;
  let mockConnection: any;
  let mockProductsService: any;
  let mockInventoryService: any;

  // Shared in-memory stock representing single source of truth in DB
  let currentDatabaseStock = 1;

  const sampleProduct = {
    _id: new Types.ObjectId('507f1f77bcf86cd799439055'),
    name: 'Sách Cuộc Sống Không Giới Hạn',
    sku: 'SP000099',
    price: 120000,
    discountPrice: 0,
    stock: 1,
    unit: 'cuốn',
    status: ProductStatus.ACTIVE,
    isDeleted: false,
  };

  beforeEach(async () => {
    currentDatabaseStock = 1;

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
      countDocuments: jest.fn().mockReturnValue({
        session: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(0),
      }),
    };

    mockProductModel = {
      findById: jest.fn().mockReturnValue({
        exec: jest
          .fn()
          .mockImplementation(() =>
            Promise.resolve({ ...sampleProduct, stock: currentDatabaseStock }),
          ),
      }),
    };

    mockInventoryModel = {
      findOne: jest.fn().mockReturnValue({
        session: jest.fn().mockReturnThis(),
        exec: jest.fn().mockImplementation(() =>
          Promise.resolve({
            product: sampleProduct._id,
            currentStock: currentDatabaseStock,
          }),
        ),
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

    // Atomic stock deduction simulation matching MongoDB $inc with $gte guard
    mockProductsService = {
      deductStock: jest
        .fn()
        .mockImplementation(async (_id: string, qty: number) => {
          if (currentDatabaseStock < qty) {
            throw new BadRequestException('Không đủ tồn kho cho sản phẩm');
          }
          currentDatabaseStock -= qty;
        }),
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

    posService = module.get<PosService>(PosService);
  });

  it('TEST BẮT BUỘC (POS-03): Tồn = 1, Web và POS cùng bán tranh chấp -> Đúng 1 giao dịch thành công, tồn = 0 (không âm)', async () => {
    expect(currentDatabaseStock).toBe(1);

    const cashier = {
      _id: '507f1f77bcf86cd799439011',
      fullName: 'Thu Ngân Quầy',
      role: UserRole.STAFF,
    };

    const posSalePromise = posService.createPOSOrder(
      {
        items: [
          {
            productId: sampleProduct._id.toString(),
            quantity: 1,
            unit: 'cuốn',
          },
        ],
        paymentMethod: PaymentMethod.CASH,
      },
      cashier,
    );

    // Simulating Web Checkout executing simultaneously
    const webOrderPromise = (async () => {
      await mockProductsService.deductStock(sampleProduct._id.toString(), 1);
      return { channel: 'WEB', success: true };
    })();

    const results = await Promise.allSettled([posSalePromise, webOrderPromise]);

    const succeeded = results.filter((r) => r.status === 'fulfilled');
    const failed = results.filter((r) => r.status === 'rejected');

    // Exactly one must succeed and one must fail
    expect(succeeded.length).toBe(1);
    expect(failed.length).toBe(1);

    // Stock must be exactly 0, never negative
    expect(currentDatabaseStock).toBe(0);
    expect(currentDatabaseStock).toBeGreaterThanOrEqual(0);
  });
});
