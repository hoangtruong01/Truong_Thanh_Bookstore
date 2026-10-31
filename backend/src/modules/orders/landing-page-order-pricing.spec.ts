/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */
import { Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { OrderSource, PaymentMethod } from '../../common/enums';
import { CheckoutService } from './services/checkout.service';
import { CreateOrderDto } from './dto/order.dto';

describe('BUG-002: Landing Page Order Pricing Regression Suite', () => {
  let checkoutService: CheckoutService;
  let mockOrderModel: any;
  let mockLandingPageModel: any;
  let mockProductsService: any;
  let mockConfigService: ConfigService;
  let mockPromotionsService: any;
  let mockUsersService: any;
  let mockOrderInventoryService: any;
  let mockOrderLoyaltyService: any;
  let mockOrderNotificationService: any;

  const mockLandingPageId = new Types.ObjectId().toString();
  const mockProductId = new Types.ObjectId().toString();

  const mockProduct = {
    _id: new Types.ObjectId(mockProductId),
    name: 'Sách Đắc Nhân Tâm',
    price: 100000,
    discountPrice: 85000,
    stock: 50,
    sold: 10,
    images: ['https://example.com/dac-nhan-tam.jpg'],
    status: 'ACTIVE',
    isDeleted: false,
  };

  const mockLandingPage = {
    _id: new Types.ObjectId(mockLandingPageId),
    title: 'Landing Page Sách Hay',
    slug: 'sach-hay-giam-gia',
    status: true,
    price: 70000,
    productId: new Types.ObjectId(mockProductId),
    packages: [
      {
        name: 'Combo Siêu Tiết Kiệm',
        price: 60000, // Package discount price
        productId: new Types.ObjectId(mockProductId),
      },
    ],
  };

  beforeEach(() => {
    mockConfigService = new ConfigService({
      JWT_SECRET: 'test-jwt-secret-key-at-least-32-chars',
      ENABLED_PAYMENT_METHODS: 'COD',
      GUEST_CHECKOUT_PENDING_LIMIT: '5',
      GUEST_CAPTCHA_THRESHOLD: '5',
    });

    mockProductsService = {
      findByIds: jest.fn().mockResolvedValue([mockProduct]),
      findById: jest.fn().mockResolvedValue(mockProduct),
    };

    mockLandingPageModel = {
      findById: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockLandingPage),
      }),
    };

    mockOrderInventoryService = {
      deductOrderStock: jest.fn().mockResolvedValue([]),
      restoreOrderStock: jest.fn().mockResolvedValue(undefined),
      rollbackStock: jest.fn().mockResolvedValue(undefined),
    };

    mockPromotionsService = {
      apply: jest.fn(),
      releaseUsage: jest.fn(),
    };

    mockUsersService = {
      findById: jest.fn(),
    };

    mockOrderLoyaltyService = {
      validateAndSpendPoints: jest.fn(),
      refundLoyaltyPoints: jest.fn(),
    };

    mockOrderNotificationService = {
      notifyOrderCreated: jest.fn().mockResolvedValue(undefined),
      recordAuditLog: jest.fn().mockResolvedValue(undefined),
      syncToGoogleSheet: jest.fn().mockResolvedValue(undefined),
    };

    // Mock order constructor to act like mongoose model
    mockOrderModel = jest.fn().mockImplementation((doc) => ({
      ...doc,
      save: jest.fn().mockImplementation(async function () {
        return {
          ...this,
          toObject: () => ({ ...this }),
        };
      }),
    }));

    mockOrderModel.findOne = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(null),
    });

    mockOrderModel.countDocuments = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(0),
    });

    mockOrderModel.distinct = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue([]),
    });

    mockOrderModel.db = {};

    checkoutService = new CheckoutService(
      mockOrderModel,
      mockProductsService,
      mockConfigService,
      mockPromotionsService,
      mockUsersService,
      mockOrderInventoryService,
      mockOrderLoyaltyService,
      mockOrderNotificationService,
      undefined, // cartService
      mockLandingPageModel, // landingPageModel
    );
  });

  it('preserves landing page package promo price (60.000đ) instead of catalog discountPrice (85.000đ)', async () => {
    const dto: CreateOrderDto = {
      items: [
        {
          product: mockProductId,
          name: 'Sách Đắc Nhân Tâm (Combo Siêu Tiết Kiệm)',
          price: 60000,
          quantity: 1,
        },
      ],
      shippingAddress: '123 Nguyễn Trãi, Q.5',
      phone: '0901234567',
      paymentMethod: PaymentMethod.COD,
      orderSource: OrderSource.LANDING_PAGE,
      landingPageId: mockLandingPageId,
      idempotencyKey: 'pkg-promo-test-uuid-001',
    };

    const savedOrder = await checkoutService.create(dto);

    // Verify package promo price is accepted and preserved
    expect(savedOrder.items[0].price).toBe(60000);
    expect(savedOrder.items[0].name).toContain('Combo Siêu Tiết Kiệm');
    // Subtotal: 60,000 + 30,000 (shipping fee under 299k) = 90,000
    expect(savedOrder.subtotal).toBe(60000);
    expect(savedOrder.total).toBe(90000);
    expect(savedOrder.orderSource).toBe(OrderSource.LANDING_PAGE);
  });

  it('safely rejects spoofed price and falls back to catalog price when price does not match package configuration', async () => {
    const dto: CreateOrderDto = {
      items: [
        {
          product: mockProductId,
          name: 'Sách Đắc Nhân Tâm (Hack Price)',
          price: 5000, // Spoofed price, not in packages (60,000) or page (70,000)
          quantity: 1,
        },
      ],
      shippingAddress: '123 Nguyễn Trãi, Q.5',
      phone: '0901234567',
      paymentMethod: PaymentMethod.COD,
      orderSource: OrderSource.LANDING_PAGE,
      landingPageId: mockLandingPageId,
      idempotencyKey: 'hack-price-test-uuid-002',
    };

    const savedOrder = await checkoutService.create(dto);

    // Should fall back to catalog discountPrice (85.000đ) instead of fraudulent 5.000đ
    expect(savedOrder.items[0].price).toBe(85000);
    expect(savedOrder.subtotal).toBe(85000);
    expect(savedOrder.total).toBe(115000); // 85,000 + 30,000 shipping
  });

  it('uses catalog price for regular web orders without landingPageId', async () => {
    const dto: CreateOrderDto = {
      items: [
        {
          product: mockProductId,
          price: 50000, // Irrelevant client price
          quantity: 1,
        },
      ],
      shippingAddress: '123 Nguyễn Trãi, Q.5',
      phone: '0901234567',
      paymentMethod: PaymentMethod.COD,
      orderSource: OrderSource.WEB,
      idempotencyKey: 'standard-web-test-uuid-003',
    };

    const savedOrder = await checkoutService.create(dto);

    expect(savedOrder.items[0].price).toBe(85000); // discountPrice from catalog
    expect(savedOrder.subtotal).toBe(85000);
    expect(savedOrder.total).toBe(115000);
  });
});
