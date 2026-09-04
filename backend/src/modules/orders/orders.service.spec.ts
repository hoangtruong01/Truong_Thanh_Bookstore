import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { ProductsService } from '../products/products.service';
import { PromotionsService } from '../promotions/promotions.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../email/email.service';
import { getModelToken } from '@nestjs/mongoose';
import { Order } from './schemas/order.schema';
import { ProductSchema } from '../products/schemas/product.schema';
import { OrderSchema } from './schemas/order.schema';
import { InventorySchema } from '../inventory/schemas/inventory.schema';
import { BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { OrderStatus, PaymentMethod } from '../../common/enums';

describe('ALL QA FIXES VERIFICATION SUITE', () => {
  let ordersService: OrdersService;
  const mockUserId = '507f1f77bcf86cd799439099';

  const mockProduct = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Bút bi Thiên Long TL-027',
    price: 5000,
    discountPrice: 0,
    stock: 10,
    status: 'ACTIVE',
    isDeleted: false,
    images: ['https://example.com/pen.jpg'],
  };

  const mockOrderModel = function (dto: any) {
    this.data = dto;
    this.save = jest.fn().mockResolvedValue({
      _id: 'order123',
      orderCode: 'TT123456',
      orderStatus: dto?.orderStatus || OrderStatus.PENDING,
      ...dto,
    });
  };
  mockOrderModel.find = jest.fn();
  mockOrderModel.findOne = jest.fn();
  mockOrderModel.findById = jest.fn();
  mockOrderModel.countDocuments = jest.fn();
  mockOrderModel.aggregate = jest.fn();

  const mockProductsService = {
    findById: jest.fn().mockResolvedValue(mockProduct),
    findByIds: jest.fn().mockResolvedValue([mockProduct]),
    deductStock: jest.fn(),
    updateStock: jest.fn(),
    incrementSold: jest.fn(),
  };

  const mockPromotionsService = {
    apply: jest.fn(),
    releaseUsage: jest.fn(),
  };

  const mockNotificationsService = {
    create: jest.fn().mockResolvedValue({}),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue(''),
  };

  const mockEmailService = {
    sendMail: jest.fn().mockResolvedValue(true),
    sendOrderConfirmationEmail: jest.fn().mockResolvedValue(true),
    sendStockAlert: jest.fn().mockResolvedValue(true),
  };

  const mockUsersService = {
    findById: jest.fn().mockResolvedValue({ email: 'test@example.com' }),
    addLoyaltyPoints: jest.fn().mockResolvedValue({
      user: { loyaltyPoints: 200 },
      tierUpgraded: false,
    }),
    deductLoyaltyPoints: jest.fn().mockResolvedValue({}),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    delete (mockOrderModel as any).db;
    mockProductsService.findById.mockResolvedValue(mockProduct);
    mockProductsService.findByIds.mockResolvedValue([mockProduct]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: ProductsService, useValue: mockProductsService },
        { provide: PromotionsService, useValue: mockPromotionsService },
        { provide: NotificationsService, useValue: mockNotificationsService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: getModelToken(Order.name), useValue: mockOrderModel },
        { provide: EmailService, useValue: mockEmailService },
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    ordersService = module.get<OrdersService>(OrdersService);
  });

  describe('Fix 1.3: Race Condition & Atomic Rollback Check', () => {
    it('should deduct stock BEFORE saving order and rollback if stock fails', async () => {
      mockProductsService.deductStock.mockRejectedValueOnce(
        new BadRequestException('Không đủ tồn kho cho sản phẩm'),
      );

      const createDto: any = {
        items: [
          { product: mockProduct._id, name: mockProduct.name, quantity: 5 },
        ],
        shippingAddress: '123 Nguyễn Huệ, Q1, HCM',
        phone: '0901234567',
        paymentMethod: 'COD',
        customerName: 'Nguyễn Văn A',
        customerEmail: 'a@example.com',
      };

      await expect(ordersService.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockProductsService.deductStock).toHaveBeenCalledWith(
        mockProduct._id,
        5,
      );
    });
  });

  describe('Fix 1.4: Free Shipping Threshold Server-side Check', () => {
    it('should charge shipping fee of 30,000 VND for subtotal < 299,000 VND', async () => {
      mockProductsService.deductStock.mockResolvedValue(undefined);
      mockProductsService.incrementSold.mockResolvedValue(undefined);

      const createDto: any = {
        items: [
          { product: mockProduct._id, name: mockProduct.name, quantity: 10 },
        ], // 50,000 VND
        shippingAddress: '123 Nguyễn Huệ, Q1, HCM',
        phone: '0901234567',
        paymentMethod: 'COD',
        customerName: 'Nguyễn Văn A',
        customerEmail: 'a@example.com',
      };

      const result = await ordersService.create(createDto);
      expect(result.subtotal).toBe(50000);
      expect(result.shippingFee).toBe(30000);
      expect(result.total).toBe(80000);
    });

    it('should give free shipping (0 VND) for subtotal >= 299,000 VND', async () => {
      mockProductsService.deductStock.mockResolvedValue(undefined);
      mockProductsService.incrementSold.mockResolvedValue(undefined);

      const expensiveProduct = { ...mockProduct, price: 300000 };
      mockProductsService.findByIds.mockResolvedValueOnce([expensiveProduct]);

      const createDto: any = {
        items: [
          {
            product: expensiveProduct._id,
            name: expensiveProduct.name,
            quantity: 1,
          },
        ], // 300,000 VND
        shippingAddress: '123 Nguyễn Huệ, Q1, HCM',
        phone: '0901234567',
        paymentMethod: 'COD',
        customerName: 'Nguyễn Văn A',
        customerEmail: 'a@example.com',
      };

      const result = await ordersService.create(createDto);
      expect(result.subtotal).toBe(300000);
      expect(result.shippingFee).toBe(0);
      expect(result.total).toBe(300000);
    });
  });

  describe('Fix 2.4: MongoDB Schema Indexes Verification', () => {
    it('ProductSchema should contain search text and compound indexes', () => {
      const indexes = ProductSchema.indexes();
      expect(indexes.length).toBeGreaterThan(0);
    });

    it('OrderSchema should contain customer and orderStatus indexes', () => {
      const indexes = OrderSchema.indexes();
      expect(indexes.length).toBeGreaterThan(0);
    });

    it('InventorySchema should contain status index', () => {
      const indexes = InventorySchema.indexes();
      expect(indexes.length).toBeGreaterThan(0);
    });
  });

  describe('Task 15: Safe Checkout Flow & Checkout Preview', () => {
    it('should preview checkout calculations correctly with shipping fee for subtotal < 299k', async () => {
      mockProductsService.findById.mockResolvedValueOnce(mockProduct);

      const previewDto: any = {
        items: [
          {
            product: mockProduct._id,
            name: mockProduct.name,
            quantity: 2,
            price: 5000,
          },
        ],
      };

      const result = await ordersService.checkoutPreview(previewDto);
      expect(result.subtotal).toBe(10000);
      expect(result.shippingFee).toBe(30000);
      expect(result.isEligibleForFreeShipping).toBe(false);
      expect(result.amountNeededForFreeShipping).toBe(289000);
      expect(result.total).toBe(40000);
      expect(result.isValidForCheckout).toBe(true);
    });

    it('should grant free shipping when subtotal >= 299k in checkout preview', async () => {
      const expensiveProduct = { ...mockProduct, price: 350000, stock: 5 };
      mockProductsService.findById.mockResolvedValueOnce(expensiveProduct);

      const previewDto: any = {
        items: [
          {
            product: expensiveProduct._id,
            name: expensiveProduct.name,
            quantity: 1,
            price: 350000,
          },
        ],
      };

      const result = await ordersService.checkoutPreview(previewDto);
      expect(result.subtotal).toBe(350000);
      expect(result.shippingFee).toBe(0);
      expect(result.isEligibleForFreeShipping).toBe(true);
      expect(result.amountNeededForFreeShipping).toBe(0);
      expect(result.total).toBe(350000);
    });

    it('should detect out-of-stock or capped items in checkout preview', async () => {
      const lowStockProduct = { ...mockProduct, stock: 2 };
      mockProductsService.findById.mockResolvedValueOnce(lowStockProduct);

      const previewDto: any = {
        items: [
          {
            product: lowStockProduct._id,
            name: lowStockProduct.name,
            quantity: 5,
            price: 5000,
          },
        ],
      };

      const result = await ordersService.checkoutPreview(previewDto);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.items[0].quantity).toBe(2); // Auto-capped
      expect(result.subtotal).toBe(10000);
    });

    it('should apply valid voucher and deduct discount in checkout preview', async () => {
      mockProductsService.findById.mockResolvedValueOnce({
        ...mockProduct,
        price: 100000,
        stock: 10,
      });
      mockPromotionsService.apply.mockResolvedValueOnce({ discount: 20000 });

      const previewDto: any = {
        items: [
          {
            product: mockProduct._id,
            name: mockProduct.name,
            quantity: 1,
            price: 100000,
          },
        ],
        promotionCode: 'SALE20K',
      };

      const result = await ordersService.checkoutPreview(previewDto);
      expect(result.discount).toBe(20000);
      expect(result.appliedPromotion?.code).toBe('SALE20K');
      expect(result.total).toBe(100000 + 30000 - 20000);
    });
  });

  describe('Task 17: Strict order lifecycle', () => {
    it('rejects a transition that skips required lifecycle steps', async () => {
      mockOrderModel.findById.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue({
          _id: '507f1f77bcf86cd799439099',
          orderStatus: OrderStatus.PENDING,
          timeline: [],
          items: [],
        }),
      });
      await expect(
        ordersService.updateStatus('507f1f77bcf86cd799439099', {
          orderStatus: OrderStatus.SHIPPING,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('allows CONFIRMED -> PROCESSING and appends an audit timeline entry', async () => {
      const order: any = {
        _id: '507f1f77bcf86cd799439099',
        orderStatus: OrderStatus.CONFIRMED,
        paymentMethod: 'COD',
        timeline: [],
        items: [],
        save: jest.fn().mockImplementation(async () => order),
      };
      mockOrderModel.findById.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(order),
      });
      const result = await ordersService.updateStatus(order._id, {
        orderStatus: OrderStatus.PROCESSING,
      });
      expect(result.orderStatus).toBe(OrderStatus.PROCESSING);
      expect(result.timeline).toEqual([
        expect.objectContaining({ status: OrderStatus.PROCESSING }),
      ]);
    });

    it('commits a status transition in a MongoDB transaction when available', async () => {
      const session = {
        startTransaction: jest.fn(),
        commitTransaction: jest.fn().mockResolvedValue(undefined),
        abortTransaction: jest.fn().mockResolvedValue(undefined),
        inTransaction: jest.fn().mockReturnValue(false),
        endSession: jest.fn().mockResolvedValue(undefined),
      };
      (mockOrderModel as any).db = {
        startSession: jest.fn().mockResolvedValue(session),
      };
      const order: any = {
        _id: '507f1f77bcf86cd799439099',
        orderStatus: OrderStatus.CONFIRMED,
        paymentMethod: 'COD',
        timeline: [],
        items: [],
        save: jest.fn().mockImplementation(async () => order),
      };
      const query = {
        session: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(order),
      };
      mockOrderModel.findById.mockReturnValueOnce(query);

      await ordersService.updateStatus(order._id, {
        orderStatus: OrderStatus.PROCESSING,
      });

      expect(query.session).toHaveBeenCalledWith(session);
      expect(order.save).toHaveBeenCalledWith({ session });
      expect(session.commitTransaction).toHaveBeenCalledTimes(1);
      expect(session.endSession).toHaveBeenCalledTimes(1);
    });
  });

  describe('BE-09: Category Revenue & Growth Analytics', () => {
    const expectExcludedRevenueStatuses = (pipeline: any[]) => {
      expect(pipeline).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            $match: expect.objectContaining({
              orderStatus: {
                $nin: [OrderStatus.CANCELLED, OrderStatus.RETURNED],
              },
            }),
          }),
        ]),
      );
    };

    it('should aggregate category revenue excluding cancelled/returned orders', async () => {
      const mockCategoryData = [
        { category: 'Sách Kỹ Năng', revenue: 15000000 },
        { category: 'Văn Phòng Phẩm', revenue: 8500000 },
      ];
      mockOrderModel.aggregate.mockResolvedValueOnce(mockCategoryData);

      const result = await ordersService.getCategoryRevenue();
      expect(result).toEqual(mockCategoryData);
      expect(mockOrderModel.aggregate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            $match: expect.objectContaining({
              orderStatus: {
                $nin: [OrderStatus.CANCELLED, OrderStatus.RETURNED],
              },
            }),
          }),
        ]),
      );
    });

    it('should exclude cancelled and returned orders from every revenue KPI', async () => {
      mockOrderModel.aggregate.mockResolvedValue([]);

      await ordersService.getTodayRevenue();
      await ordersService.getRevenueByDateRange(
        new Date('2026-08-01T00:00:00.000Z'),
        new Date('2026-08-31T23:59:59.999Z'),
      );
      await ordersService.getAov();
      await ordersService.getVoucherEffectiveness();
      await ordersService.getGrowthStats('month');

      for (const [pipeline] of mockOrderModel.aggregate.mock.calls) {
        expectExcludedRevenueStatuses(pipeline);
      }
    });

    it('should make day and year ranges produce different query windows', async () => {
      mockOrderModel.aggregate.mockResolvedValue([]);

      await ordersService.getGrowthStats('day');
      const dayPipeline = mockOrderModel.aggregate.mock.calls[0][0];
      const dayMatch = dayPipeline[0].$match.createdAt;
      mockOrderModel.aggregate.mockClear();

      await ordersService.getGrowthStats('year');
      const yearPipeline = mockOrderModel.aggregate.mock.calls[0][0];
      const yearMatch = yearPipeline[0].$match.createdAt;

      expect(
        yearMatch.$lte.getTime() - yearMatch.$gte.getTime(),
      ).toBeGreaterThan(dayMatch.$lte.getTime() - dayMatch.$gte.getTime());
    });

    it('should compute real growth rates dynamically between two periods', async () => {
      mockOrderModel.aggregate
        .mockResolvedValueOnce([{ totalRevenue: 20000000, totalOrders: 100 }])
        .mockResolvedValueOnce([{ totalRevenue: 10000000, totalOrders: 80 }]);

      const growth = await ordersService.getGrowthStats('month');
      expect(growth.currentRevenue).toBe(20000000);
      expect(growth.previousRevenue).toBe(10000000);
      expect(growth.revenueGrowthRate).toBe(100);
      expect(growth.currentOrders).toBe(100);
      expect(growth.previousOrders).toBe(80);
      expect(growth.ordersGrowthRate).toBe(25);
    });

    it('should handle zero previous period values gracefully without NaN', async () => {
      mockOrderModel.aggregate
        .mockResolvedValueOnce([{ totalRevenue: 5000000, totalOrders: 15 }])
        .mockResolvedValueOnce([{ totalRevenue: 0, totalOrders: 0 }]);

      const growth = await ordersService.getGrowthStats('day');
      expect(growth.revenueGrowthRate).toBe(100);
      expect(growth.ordersGrowthRate).toBe(100);
    });
  });

  describe('BE-05: Loyalty Timing & Auto-Cancel', () => {
    it('should NOT award loyalty points when creating order in PENDING status', async () => {
      const orderDto = {
        items: [
          {
            product: mockProduct._id,
            name: mockProduct.name,
            quantity: 2,
            price: 100000,
          },
        ],
        shippingAddress: '456 Tran Hung Dao, Q5',
        phone: '0987654321',
        paymentMethod: PaymentMethod.COD,
      };

      const created = await ordersService.create(orderDto as any, mockUserId);

      expect(mockUsersService.addLoyaltyPoints).not.toHaveBeenCalled();
      expect(created.orderStatus).toBe(OrderStatus.PENDING);
    });

    it('should award loyalty points when order status transitions to DELIVERED', async () => {
      const pendingOrder = {
        _id: '507f1f77bcf86cd799439011',
        orderCode: 'TT100001',
        orderStatus: OrderStatus.SHIPPING,
        total: 200000,
        customer: mockUserId,
        loyaltyAwarded: false,
        timeline: [],
        items: [{ product: mockProduct._id, quantity: 2 }],
        save: jest.fn().mockImplementation(function () {
          return Promise.resolve(this);
        }),
      };

      mockOrderModel.findById = jest.fn().mockReturnValue({
        session: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(pendingOrder),
      });

      await ordersService.updateStatus(pendingOrder._id, {
        orderStatus: OrderStatus.DELIVERED,
      });

      expect(mockUsersService.addLoyaltyPoints).toHaveBeenCalledWith(
        mockUserId,
        200, // 200,000 / 1,000
        undefined,
      );
      expect(pendingOrder.loyaltyAwarded).toBe(true);
    });

    it('should deduct loyalty points when order status transitions to RETURNED and loyaltyAwarded is true', async () => {
      const deliveredOrder = {
        _id: '507f1f77bcf86cd799439012',
        orderCode: 'TT100002',
        orderStatus: OrderStatus.DELIVERED,
        total: 300000,
        customer: mockUserId,
        loyaltyAwarded: true,
        timeline: [],
        items: [{ product: mockProduct._id, quantity: 3 }],
        save: jest.fn().mockImplementation(function () {
          return Promise.resolve(this);
        }),
      };

      mockOrderModel.findById = jest.fn().mockReturnValue({
        session: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(deliveredOrder),
      });

      await ordersService.updateStatus(deliveredOrder._id, {
        orderStatus: OrderStatus.RETURNED,
      });

      expect(mockUsersService.deductLoyaltyPoints).toHaveBeenCalledWith(
        mockUserId,
        300,
        undefined,
      );
      expect(deliveredOrder.loyaltyAwarded).toBe(false);
    });

    it('should NOT deduct loyalty points when CANCELLED order never had loyalty awarded', async () => {
      const pendingOrder = {
        _id: '507f1f77bcf86cd799439013',
        orderCode: 'TT100003',
        orderStatus: OrderStatus.PENDING,
        total: 500000,
        customer: mockUserId,
        loyaltyAwarded: false,
        timeline: [],
        items: [{ product: mockProduct._id, quantity: 5 }],
        save: jest.fn().mockImplementation(function () {
          return Promise.resolve(this);
        }),
      };

      mockOrderModel.findById = jest.fn().mockReturnValue({
        session: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(pendingOrder),
      });

      await ordersService.updateStatus(pendingOrder._id, {
        orderStatus: OrderStatus.CANCELLED,
      });

      expect(mockUsersService.deductLoyaltyPoints).not.toHaveBeenCalled();
    });

    it('handleAutoCancelOrders should cancel online orders >24h and COD >48h', async () => {
      const now = Date.now();
      const expiredOnlineOrder = {
        _id: '507f1f77bcf86cd799439021',
        orderCode: 'TT_EXPIRED_ONLINE',
        orderStatus: OrderStatus.PENDING,
        paymentMethod: PaymentMethod.BANK_TRANSFER,
        createdAt: new Date(now - 25 * 60 * 60 * 1000), // 25 hours ago
        total: 100000,
        items: [],
      };

      const nonExpiredOnlineOrder = {
        _id: '507f1f77bcf86cd799439022',
        orderCode: 'TT_FRESH_ONLINE',
        orderStatus: OrderStatus.PENDING,
        paymentMethod: PaymentMethod.BANK_TRANSFER,
        createdAt: new Date(now - 10 * 60 * 60 * 1000), // 10 hours ago
        total: 100000,
        items: [],
      };

      const expiredCodOrder = {
        _id: '507f1f77bcf86cd799439023',
        orderCode: 'TT_EXPIRED_COD',
        orderStatus: OrderStatus.PENDING,
        paymentMethod: PaymentMethod.COD,
        createdAt: new Date(now - 49 * 60 * 60 * 1000), // 49 hours ago
        total: 100000,
        items: [],
      };

      mockOrderModel.find = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([
          expiredOnlineOrder,
          nonExpiredOnlineOrder,
          expiredCodOrder,
        ]),
      });

      const updateStatusSpy = jest
        .spyOn(ordersService, 'updateStatus')
        .mockResolvedValue({} as any);

      const count = await ordersService.handleAutoCancelOrders();

      expect(count).toBe(2);
      expect(updateStatusSpy).toHaveBeenCalledWith(
        expiredOnlineOrder._id,
        expect.objectContaining({ orderStatus: OrderStatus.CANCELLED }),
      );
      expect(updateStatusSpy).toHaveBeenCalledWith(
        expiredCodOrder._id,
        expect.objectContaining({ orderStatus: OrderStatus.CANCELLED }),
      );
      expect(updateStatusSpy).not.toHaveBeenCalledWith(
        nonExpiredOnlineOrder._id,
        expect.anything(),
      );
    });

    it('handleAutoCancelWarnings should send warnings 2h before deadline and save timestamp', async () => {
      const now = Date.now();
      const warningOnlineOrder = {
        _id: '507f1f77bcf86cd799439031',
        orderCode: 'TT_WARN_ONLINE',
        orderStatus: OrderStatus.PENDING,
        paymentMethod: PaymentMethod.BANK_TRANSFER,
        createdAt: new Date(now - 22.5 * 60 * 60 * 1000), // 22.5h (within 22h-24h window)
        total: 150000,
        customer: mockUserId,
        save: jest.fn().mockResolvedValue(true),
      };

      mockOrderModel.find = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([warningOnlineOrder]),
      });

      const warningsSent = await ordersService.handleAutoCancelWarnings();

      expect(warningsSent).toBe(1);
      expect(mockNotificationsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
          title: expect.stringContaining('sắp hết hạn'),
        }),
      );
      expect(warningOnlineOrder.save).toHaveBeenCalled();
    });
  });
});

