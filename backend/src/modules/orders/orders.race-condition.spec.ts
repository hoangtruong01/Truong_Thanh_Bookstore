/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { OrdersService } from './orders.service';
import { ProductsService } from '../products/products.service';
import { PromotionsService } from '../promotions/promotions.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../email/email.service';
import { UsersService } from '../users/users.service';
import { CartService } from '../cart/cart.service';
import { InventoryService } from '../inventory/inventory.service';
import { Order } from './schemas/order.schema';
import { OrderStatus, PaymentMethod } from '../../common/enums';

describe('QA-03: Inventory Race Condition & Concurrency Invariant Tests', () => {
  let ordersService: OrdersService;

  // Shared state simulation for atomic product stock
  let bookStock = 1;
  const bookProductId = '507f1f77bcf86cd799439011';
  const mockBookProduct = {
    _id: bookProductId,
    name: 'Nhà Giả Kim (Tái bản đặc biệt)',
    price: 150000,
    discountPrice: 120000,
    status: 'ACTIVE',
    isDeleted: false,
    images: ['https://example.com/alchemist.jpg'],
  };

  // Mock Products Service with simulated atomic MongoDB findOneAndUpdate behavior
  const mockProductsService = {
    findById: jest.fn().mockImplementation((id: string) => {
      if (id === bookProductId) {
        return Promise.resolve({ ...mockBookProduct, stock: bookStock });
      }
      return Promise.resolve(null);
    }),
    findByIds: jest.fn().mockImplementation((ids: string[]) => {
      if (ids.includes(bookProductId)) {
        return Promise.resolve([{ ...mockBookProduct, stock: bookStock }]);
      }
      return Promise.resolve([]);
    }),
    // Simulates MongoDB atomic { _id: id, stock: { $gte: quantity } } update
    deductStock: jest
      .fn()
      .mockImplementation(async (id: string, quantity: number) => {
        if (id === bookProductId) {
          if (bookStock >= quantity) {
            bookStock -= quantity;
            return;
          }
          throw new BadRequestException(
            `Không đủ tồn kho cho sản phẩm (ID: ${id})`,
          );
        }
      }),
    updateStock: jest
      .fn()
      .mockImplementation(async (id: string, quantity: number) => {
        if (id === bookProductId) {
          bookStock += quantity;
        }
      }),
    incrementSold: jest.fn().mockResolvedValue(undefined),
  };

  const createdOrders: any[] = [];
  const existingIdempotencyKeys = new Set<string>();

  const mockOrderModel = function (this: any, dto: any) {
    this.data = dto;
    this._id = `ord_${Math.random().toString(36).substring(2, 9)}`;
    this.orderCode = `TTB-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    this.orderStatus = OrderStatus.PENDING;
    this.total = dto.total;
    this.items = dto.items;
  };

  mockOrderModel.prototype.save = jest.fn().mockImplementation(function (
    this: any,
  ) {
    if (this.data?.idempotencyKeyHash) {
      if (existingIdempotencyKeys.has(this.data.idempotencyKeyHash)) {
        const err: any = new Error('Duplicate idempotency key');
        err.code = 11000;
        throw err;
      }
      existingIdempotencyKeys.add(this.data.idempotencyKeyHash);
    }
    createdOrders.push(this);
    return Promise.resolve(this);
  });

  (mockOrderModel as any).find = jest
    .fn()
    .mockReturnValue({ exec: jest.fn().mockResolvedValue([]) });
  (mockOrderModel as any).findOne = jest
    .fn()
    .mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
  (mockOrderModel as any).findById = jest
    .fn()
    .mockImplementation((id: string) => ({
      exec: jest
        .fn()
        .mockResolvedValue(
          createdOrders.find((o: any) => o._id === id) || null,
        ),
    }));
  (mockOrderModel as any).countDocuments = jest
    .fn()
    .mockReturnValue({ exec: jest.fn().mockResolvedValue(0) });
  (mockOrderModel as any).db = {
    startSession: undefined, // Non-transaction mode triggers application-level atomic fallback & rollback
  };

  const mockUsersService = {
    findById: jest.fn().mockResolvedValue(null),
    validateAndSpendPoints: jest
      .fn()
      .mockResolvedValue({ pointsSpent: 0, discountAmount: 0 }),
    refundLoyaltyPoints: jest.fn().mockResolvedValue(undefined),
  };

  const mockPromotionsService = {
    apply: jest.fn().mockResolvedValue({ discount: 0 }),
    releaseUsage: jest.fn().mockResolvedValue(undefined),
  };

  const mockNotificationsService = {
    create: jest.fn().mockResolvedValue({}),
  };

  const mockEmailService = {
    sendOrderConfirmationEmail: jest.fn().mockResolvedValue(true),
    sendOrderStatusEmail: jest.fn().mockResolvedValue(true),
  };

  const mockInventoryService = {
    recordExternalMovement: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    createdOrders.length = 0;
    existingIdempotencyKeys.clear();
    bookStock = 1;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: getModelToken(Order.name), useValue: mockOrderModel },
        { provide: ProductsService, useValue: mockProductsService },
        { provide: UsersService, useValue: mockUsersService },
        { provide: PromotionsService, useValue: mockPromotionsService },
        { provide: NotificationsService, useValue: mockNotificationsService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: ConfigService, useValue: { get: () => '' } },
        {
          provide: CartService,
          useValue: { clearCart: jest.fn().mockResolvedValue(undefined) },
        },
        { provide: InventoryService, useValue: mockInventoryService },
      ],
    }).compile();

    ordersService = module.get<OrdersService>(OrdersService);
  });

  // =========================================================================
  // KỊCH BẢN 1: 2 KHÁCH HÀNG TRANH CHẤP CUỐN SÁCH CUỐI CÙNG (STOCK = 1)
  // =========================================================================
  it('Kịch bản 1: Chỉ duy nhất 1 khách hàng mua được khi stock = 1, người kia nhận lỗi hết hàng', async () => {
    bookStock = 1;
    const initialStock = bookStock;

    const orderPayloadA: any = {
      customerName: 'Khách Hàng A',
      phone: '0901111111',
      shippingAddress: 'Quận 1, TP. Hồ Chí Minh',
      paymentMethod: PaymentMethod.COD,
      items: [{ product: bookProductId, quantity: 1 }],
      idempotencyKey: 'idemp-race-user-a',
    };

    const orderPayloadB: any = {
      customerName: 'Khách Hàng B',
      phone: '0902222222',
      shippingAddress: 'Hoàn Kiếm, Hà Nội',
      paymentMethod: PaymentMethod.COD,
      items: [{ product: bookProductId, quantity: 1 }],
      idempotencyKey: 'idemp-race-user-b',
    };

    // Bắn 2 request đồng thời tại cùng 1 tích tắc
    const results = await Promise.allSettled([
      ordersService.create(orderPayloadA),
      ordersService.create(orderPayloadB),
    ]);

    const successes = results.filter((r) => r.status === 'fulfilled');
    const failures = results.filter((r) => r.status === 'rejected');

    // TIÊU CHÍ NGHIỆM THU (Acceptance Criteria):
    // 1. Đúng 1 đơn thành công
    expect(successes.length).toBe(1);
    // 2. Đúng 1 đơn bị từ chối
    expect(failures.length).toBe(1);

    // 3. Khách hàng thất bại nhận thông báo lỗi rõ ràng
    const rejectedReason: any = failures[0].reason;
    expect(rejectedReason).toBeInstanceOf(Error);
    expect(rejectedReason.message).toMatch(/không đủ|hết hàng|tồn kho/i);

    // 4. Bảo toàn tồn kho tuyệt đối (Conservation Invariant)
    expect(bookStock).toBe(0);
    expect(bookStock).toBeGreaterThanOrEqual(0);
    expect(initialStock).toBe(successes.length + bookStock);
    expect(createdOrders.length).toBe(1);
  });

  // =========================================================================
  // KỊCH BẢN 2: THUNDERING HERD (10 REQUESTS ĐỒNG THỜI KHI STOCK = 3)
  // =========================================================================
  it('Kịch bản 2: Bão 10 request đồng thời khi stock = 3 -> Tạo đúng 3 đơn, 7 đơn lỗi, stock về đúng 0', async () => {
    bookStock = 3;
    const initialStock = bookStock;
    const totalRequests = 10;

    const concurrentRequests = Array.from(
      { length: totalRequests },
      (_, idx) => {
        const payload: any = {
          customerName: `Khách Hàng Flash Sale #${idx + 1}`,
          phone: `090333333${idx}`,
          shippingAddress: 'Địa chỉ nhận hàng',
          paymentMethod: PaymentMethod.COD,
          items: [{ product: bookProductId, quantity: 1 }],
          idempotencyKey: `idemp-flashsale-${idx + 1}`,
        };
        return ordersService.create(payload);
      },
    );

    const results = await Promise.allSettled(concurrentRequests);

    const successfulOrders = results.filter((r) => r.status === 'fulfilled');
    const rejectedOrders = results.filter((r) => r.status === 'rejected');

    // 1. Không bao giờ bán quá số lượng tồn kho (Zero Overselling)
    expect(successfulOrders.length).toBe(3);
    expect(successfulOrders.length).toBeLessThanOrEqual(initialStock);

    // 2. Toàn bộ 7 request còn lại bị reject với lỗi tồn kho
    expect(rejectedOrders.length).toBe(7);
    for (const rejected of rejectedOrders) {
      const err = rejected.reason;
      expect(err.message).toMatch(/không đủ|hết hàng|tồn kho/i);
    }

    // 3. Invariants: Tồn kho về 0, không âm, tổng đơn + tồn kho cuối = tồn kho đầu
    expect(bookStock).toBe(0);
    expect(bookStock).toBeGreaterThanOrEqual(0);
    expect(successfulOrders.length + bookStock).toBe(initialStock);
    expect(createdOrders.length).toBe(3);
  });

  // =========================================================================
  // KỊCH BẢN 3: ROLLBACK AN TOÀN KHI GẶP LỖI Ở BƯỚC SAU (ATOMICITY GUARANTEE)
  // =========================================================================
  it('Kịch bản 3: Tồn kho được hoàn trả nguyên vẹn nếu quá trình lưu đơn hàng bị lỗi', async () => {
    bookStock = 5;
    const initialStock = bookStock;

    // Giả lập lỗi ở bước lưu đơn hàng vào DB
    jest
      .spyOn(mockOrderModel.prototype, 'save')
      .mockRejectedValueOnce(new Error('Simulated Database Write Failure'));

    const payload: any = {
      customerName: 'Khách Lỗi DB',
      phone: '0904444444',
      shippingAddress: 'Hải Phòng',
      paymentMethod: PaymentMethod.COD,
      items: [{ product: bookProductId, quantity: 2 }],
    };

    await expect(ordersService.create(payload)).rejects.toThrow(
      'Simulated Database Write Failure',
    );

    // Xác minh rollback: tồn kho phải được cộng lại về đúng 5
    expect(bookStock).toBe(initialStock);
    expect(mockProductsService.updateStock).toHaveBeenCalledWith(
      bookProductId,
      2,
    );
  });

  // =========================================================================
  // KỊCH BẢN 4: IDEMPOTENCY KEY CONCURRENCY RACE
  // =========================================================================
  it('Kịch bản 4: Cùng 1 khách hàng bấm double submit với cùng idempotencyKey chỉ tạo đúng 1 đơn', async () => {
    bookStock = 5;
    const initialStock = bookStock;
    const sharedIdempotencyKey = 'shared-idempotency-key-001';

    const payloadA: any = {
      customerName: 'Khách Double Click',
      phone: '0905555555',
      shippingAddress: 'Đà Nẵng',
      paymentMethod: PaymentMethod.COD,
      items: [{ product: bookProductId, quantity: 1 }],
      idempotencyKey: sharedIdempotencyKey,
    };

    const payloadB: any = {
      customerName: 'Khách Double Click (Click đúp)',
      phone: '0905555555',
      shippingAddress: 'Đà Nẵng',
      paymentMethod: PaymentMethod.COD,
      items: [{ product: bookProductId, quantity: 1 }],
      idempotencyKey: sharedIdempotencyKey,
    };

    const results = await Promise.allSettled([
      ordersService.create(payloadA),
      ordersService.create(payloadB),
    ]);

    const successes = results.filter((r) => r.status === 'fulfilled');
    const failures = results.filter((r) => r.status === 'rejected');

    // Chỉ 1 request được chấp thuận tạo đơn
    expect(successes.length).toBe(1);
    expect(failures.length).toBe(1);

    // Tồn kho chỉ bị trừ 1 lần cho 1 đơn hàng duy nhất
    expect(bookStock).toBe(initialStock - 1);
    expect(createdOrders.length).toBe(1);
  });

  // =========================================================================
  // KỊCH BẢN 5: ĐƠN HÀNG NHIỀU SẢN PHẨM — ALL OR NOTHING
  // =========================================================================
  it('Kịch bản 5: Đơn hàng gồm 2 sản phẩm (1 còn, 1 hết) -> Toàn bộ đơn bị hủy và sản phẩm còn được rollback', async () => {
    bookStock = 2;
    const outOfStockProductId = '507f1f77bcf86cd799439099';

    mockProductsService.findByIds.mockResolvedValueOnce([
      { ...mockBookProduct, stock: bookStock },
      {
        _id: outOfStockProductId,
        name: 'Sách Hết Hàng',
        price: 80000,
        stock: 0,
        status: 'ACTIVE',
      },
    ]);

    const payload: any = {
      customerName: 'Khách Mua Đa Sản Phẩm',
      phone: '0906666666',
      shippingAddress: 'Cần Thơ',
      paymentMethod: PaymentMethod.COD,
      items: [
        { product: bookProductId, quantity: 1 },
        { product: outOfStockProductId, quantity: 1 },
      ],
    };

    // Phải từ chối đơn hàng
    await expect(ordersService.create(payload)).rejects.toThrow();

    // Tồn kho sản phẩm 1 phải được bảo toàn nguyên vẹn
    expect(bookStock).toBe(2);
    expect(createdOrders.length).toBe(0);
  });
});
