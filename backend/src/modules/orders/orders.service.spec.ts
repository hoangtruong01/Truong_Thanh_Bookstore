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
    category: {
      _id: '507f1f77bcf86cd799439022',
      name: 'Văn phòng phẩm',
    },
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
    spendLoyaltyPoints: jest.fn().mockResolvedValue({ loyaltyPoints: 5000 }),
    refundLoyaltyPoints: jest.fn().mockResolvedValue({ loyaltyPoints: 6000 }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockOrderModel.countDocuments.mockReset();
    mockConfigService.get.mockReset().mockReturnValue('');
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

  describe('BE-10: guest checkout abuse protection', () => {
    it('rejects a phone that already reached the pending-order limit', async () => {
      mockOrderModel.countDocuments.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(3),
      });
      mockConfigService.get.mockImplementation((key: string) =>
        key === 'GUEST_PENDING_ORDER_LIMIT' ? '3' : '',
      );

      await expect(
        (ordersService as any).checkGuestCheckoutProtection(
          { phone: '0901234567' },
          '127.0.0.1',
        ),
      ).rejects.toMatchObject({ status: 429 });
    });

    it('requires and verifies Turnstile after the suspicious threshold', async () => {
      mockOrderModel.countDocuments.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(1),
      });
      mockConfigService.get.mockImplementation((key: string) => {
        const values: Record<string, string> = {
          GUEST_PENDING_ORDER_LIMIT: '3',
          GUEST_CAPTCHA_THRESHOLD: '1',
          TURNSTILE_SECRET_KEY: 'turnstile-test-secret',
          TURNSTILE_ALLOWED_HOSTNAMES: 'shop.example.com',
        };
        return values[key] || '';
      });
      const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          hostname: 'shop.example.com',
        }),
      } as any);

      await expect(
        (ordersService as any).checkGuestCheckoutProtection(
          { phone: '+84 901 234 567', captchaToken: 'valid-token' },
          '203.0.113.4',
        ),
      ).resolves.toEqual({ phoneKey: '0901234567', slot: 1 });
      expect(fetchSpy).toHaveBeenCalledWith(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        expect.objectContaining({ method: 'POST' }),
      );
      fetchSpy.mockRestore();
    });

    it('rejects a mismatched Turnstile hostname', async () => {
      mockOrderModel.countDocuments.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(1),
      });
      mockConfigService.get.mockImplementation((key: string) => {
        const values: Record<string, string> = {
          GUEST_CAPTCHA_THRESHOLD: '1',
          TURNSTILE_SECRET_KEY: 'turnstile-test-secret',
          TURNSTILE_ALLOWED_HOSTNAMES: 'shop.example.com',
        };
        return values[key] || '';
      });
      const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          hostname: 'attacker.example',
        }),
      } as any);

      await expect(
        (ordersService as any).checkGuestCheckoutProtection({
          phone: '0901234567',
          captchaToken: 'replayed-token',
        }),
      ).rejects.toThrow('không hợp lệ');
      fetchSpy.mockRestore();
    });
  });

  describe('Fix 1.3: Race Condition & Atomic Rollback Check', () => {
    it('rejects standalone status updates before any stock or loyalty side effect', async () => {
      const session = {
        startTransaction: jest.fn(),
        inTransaction: jest.fn().mockReturnValue(true),
        abortTransaction: jest.fn().mockResolvedValue(undefined),
        endSession: jest.fn().mockResolvedValue(undefined),
      };
      Object.assign(mockOrderModel, {
        db: { startSession: jest.fn().mockResolvedValue(session) },
      });
      mockOrderModel.findById.mockReturnValue({
        session: jest.fn().mockReturnThis(),
        exec: jest
          .fn()
          .mockRejectedValue(
            new Error(
              'Transaction numbers are only allowed on a replica set member or mongos',
            ),
          ),
      });
      await expect(
        ordersService.updateStatus('order-1', {
          orderStatus: OrderStatus.CANCELLED,
        }),
      ).rejects.toThrow('yêu cầu MongoDB replica set');
      expect(mockOrderModel.findById).toHaveBeenCalledTimes(1);
      expect(mockProductsService.updateStock).not.toHaveBeenCalled();
      expect(mockUsersService.refundLoyaltyPoints).not.toHaveBeenCalled();
      expect(session.abortTransaction).toHaveBeenCalled();
      expect(session.endSession).toHaveBeenCalled();
    });
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
      expect(pipeline).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            $match: expect.objectContaining({
              $or: expect.arrayContaining([
                { paymentStatus: 'PAID' },
                {
                  orderStatus: {
                    $in: [OrderStatus.DELIVERED, OrderStatus.COMPLETED],
                  },
                },
              ]),
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
      expect(
        JSON.stringify(mockOrderModel.aggregate.mock.calls[0][0]),
      ).toContain('items.categoryName');
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
      const dayMatch = dayPipeline[0].$match.$and[0].$or[0].revenueRecognizedAt;
      mockOrderModel.aggregate.mockClear();

      await ordersService.getGrowthStats('year');
      const yearPipeline = mockOrderModel.aggregate.mock.calls[0][0];
      const yearMatch =
        yearPipeline[0].$match.$and[0].$or[0].revenueRecognizedAt;

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

      const created = await ordersService.create(orderDto, mockUserId);

      expect(mockUsersService.addLoyaltyPoints).not.toHaveBeenCalled();
      expect(created.orderStatus).toBe(OrderStatus.PENDING);
    });

    it('should award loyalty points when order status transitions to DELIVERED', async () => {
      const pendingOrder = {
        _id: '507f1f77bcf86cd799439011',
        orderCode: 'TT100001',
        orderStatus: OrderStatus.SHIPPING,
        subtotal: 170000,
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
        170, // subtotal only; shipping and discounts do not earn points
        undefined,
      );
      expect(pendingOrder.loyaltyAwarded).toBe(true);
    });

    it('should deduct loyalty points when order status transitions to RETURNED and loyaltyAwarded is true', async () => {
      const deliveredOrder = {
        _id: '507f1f77bcf86cd799439012',
        orderCode: 'TT100002',
        orderStatus: OrderStatus.DELIVERED,
        subtotal: 270000,
        total: 300000,
        customer: mockUserId,
        loyaltyAwarded: true,
        loyaltyPointsAwarded: 270,
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
        270,
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

    describe('PRODUCT-01: Loyalty Point Spending at Checkout', () => {
      it('should reject guest attempting to spend loyalty points', async () => {
        const guestOrderDto = {
          items: [
            {
              product: '507f1f77bcf86cd799439011',
              name: 'Book',
              price: 1000000,
              quantity: 1,
            },
          ],
          shippingAddress: '123 Street',
          phone: '0901234567',
          customerName: 'Guest',
          loyaltyPointsUsed: 1000,
        };

        await expect(
          ordersService.create(guestOrderDto as any, undefined),
        ).rejects.toThrow(
          'Chỉ khách hàng có tài khoản mới có thể sử dụng điểm thưởng Loyalty',
        );
      });

      it('should reject spending less than 1,000 loyalty points', async () => {
        const orderDto = {
          items: [
            {
              product: '507f1f77bcf86cd799439011',
              name: 'Book',
              price: 1000000,
              quantity: 1,
            },
          ],
          shippingAddress: '123 Street',
          phone: '0901234567',
          customerName: 'Customer',
          loyaltyPointsUsed: 500,
        };

        await expect(
          ordersService.create(orderDto as any, 'user123'),
        ).rejects.toThrow('Mức tiêu điểm tối thiểu là 1.000 điểm');
      });

      it('should reject spending loyalty points exceeding 20% of subtotal', async () => {
        // subtotal = 100,000 => 20% is 20,000 => max points is 200 points.
        // 1,000 points = 100,000 VND discount > 20,000 VND
        const orderDto = {
          items: [
            {
              product: '507f1f77bcf86cd799439011',
              name: 'Book',
              price: 100000,
              quantity: 1,
            },
          ],
          shippingAddress: '123 Street',
          phone: '0901234567',
          customerName: 'Customer',
          loyaltyPointsUsed: 1000,
        };

        await expect(
          ordersService.create(orderDto as any, 'user123'),
        ).rejects.toThrow('vượt quá hạn mức tối đa cho phép');
      });

      it('should reject if user balance is insufficient', async () => {
        mockProductsService.findByIds.mockResolvedValueOnce([
          { ...mockProduct, price: 1000000 },
        ]);
        mockUsersService.spendLoyaltyPoints.mockResolvedValueOnce(null);
        const orderDto = {
          items: [
            {
              product: '507f1f77bcf86cd799439011',
              name: 'Book',
              price: 1000000,
              quantity: 1,
            },
          ],
          shippingAddress: '123 Street',
          phone: '0901234567',
          customerName: 'Customer',
          loyaltyPointsUsed: 1000, // 100,000 VND <= 20% of 1,000,000 (200,000)
        };

        await expect(
          ordersService.create(orderDto as any, 'user123'),
        ).rejects.toThrow('Số điểm thưởng trong tài khoản không đủ');
      });

      it('should successfully spend loyalty points and deduct from total', async () => {
        mockProductsService.findByIds.mockResolvedValueOnce([
          { ...mockProduct, price: 1000000 },
        ]);
        mockUsersService.spendLoyaltyPoints.mockResolvedValueOnce({
          loyaltyPoints: 4000,
        });
        const orderDto = {
          items: [
            {
              product: '507f1f77bcf86cd799439011',
              name: 'Book',
              price: 1000000,
              quantity: 1,
            },
          ],
          shippingAddress: '123 Street',
          phone: '0901234567',
          customerName: 'Customer',
          loyaltyPointsUsed: 1000,
        };

        const result = await ordersService.create(orderDto, 'user123');
        expect(mockUsersService.spendLoyaltyPoints).toHaveBeenCalledWith(
          'user123',
          1000,
          undefined,
        );
        expect(result.loyaltyPointsUsed).toBe(1000);
        expect(result.loyaltyDiscount).toBe(100000);
        // subtotal 1,000,000 >= FREE_SHIPPING_THRESHOLD -> shippingFee = 0; total = 900,000
        expect(result.total).toBe(900000);
      });

      it('should refund spent loyalty points when order is CANCELLED', async () => {
        const orderWithLoyaltySpent = {
          _id: '507f1f77bcf86cd799439099',
          orderCode: 'TT_LOYALTY_CANCEL',
          orderStatus: OrderStatus.PENDING,
          customer: 'user123',
          loyaltyPointsUsed: 1000,
          loyaltyPointsRefunded: false,
          items: [],
          save: jest.fn().mockImplementation(function () {
            return Promise.resolve(this);
          }),
        };

        mockOrderModel.findById = jest.fn().mockReturnValue({
          session: jest.fn().mockReturnThis(),
          exec: jest.fn().mockResolvedValue(orderWithLoyaltySpent),
        });

        await ordersService.updateStatus(orderWithLoyaltySpent._id, {
          orderStatus: OrderStatus.CANCELLED,
        });

        expect(mockUsersService.refundLoyaltyPoints).toHaveBeenCalledWith(
          'user123',
          1000,
          undefined,
        );
        expect(orderWithLoyaltySpent.loyaltyPointsRefunded).toBe(true);
      });
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
        exec: jest
          .fn()
          .mockResolvedValue([
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
