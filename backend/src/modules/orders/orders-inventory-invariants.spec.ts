import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { OrdersService } from './orders.service';
import { OrderInventoryService } from './services/order-inventory.service';
import { OrderLifecycleService } from './services/order-lifecycle.service';
import { OrderLoyaltyService } from './services/order-loyalty.service';
import { OrderNotificationService } from './services/order-notification.service';
import { Order } from './schemas/order.schema';
import { Product } from '../products/schemas/product.schema';
import {
  Inventory,
  InventoryTransaction,
} from '../inventory/schemas/inventory.schema';
import { ProductsService } from '../products/products.service';
import { InventoryService } from '../inventory/inventory.service';
import { PromotionsService } from '../promotions/promotions.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../email/email.service';
import { UsersService } from '../users/users.service';
import { CartService } from '../cart/cart.service';
import { ConfigService } from '@nestjs/config';
import {
  OrderStatus,
  PaymentMethod,
  InventoryTransactionType,
  UserRole,
} from '../../common/enums';

describe('GIAO VIỆC 3 (T02/T03) — Đơn hàng, kiểm kê và cô lập hàng lỗi', () => {
  let ordersService: OrdersService;
  let orderLifecycleService: OrderLifecycleService;
  let orderInventoryService: OrderInventoryService;

  let currentStockA = 10;
  let currentStockB = 0;
  const prodAId = '507f1f77bcf86cd799439001';
  const prodBId = '507f1f77bcf86cd799439002';

  const mockProductA = {
    _id: prodAId,
    name: 'Tập vở học sinh 96 trang',
    price: 12000,
    discountPrice: 10000,
    status: 'ACTIVE',
    isDeleted: false,
    images: ['https://example.com/vo.jpg'],
  };

  const mockProductB = {
    _id: prodBId,
    name: 'Bút dạ quang pastel',
    price: 25000,
    discountPrice: 20000,
    status: 'ACTIVE',
    isDeleted: false,
    images: ['https://example.com/but.jpg'],
  };

  let mockProductsService: any;
  let mockInventoryService: any;
  let mockOrderModel: any;
  const createdOrders: any[] = [];

  beforeEach(async () => {
    currentStockA = 10;
    currentStockB = 0;
    createdOrders.length = 0;

    mockProductsService = {
      findById: jest.fn().mockImplementation((id: string) => {
        if (id === prodAId)
          return Promise.resolve({ ...mockProductA, stock: currentStockA });
        if (id === prodBId)
          return Promise.resolve({ ...mockProductB, stock: currentStockB });
        return Promise.resolve(null);
      }),
      findByIds: jest.fn().mockImplementation((ids: string[]) => {
        const res: any[] = [];
        if (ids.includes(prodAId))
          res.push({ ...mockProductA, stock: currentStockA });
        if (ids.includes(prodBId))
          res.push({ ...mockProductB, stock: currentStockB });
        return Promise.resolve(res);
      }),
      deductStock: jest
        .fn()
        .mockImplementation(async (id: string, qty: number) => {
          if (id === prodAId) {
            if (currentStockA >= qty) {
              currentStockA -= qty;
              return;
            }
            throw new BadRequestException(
              `Không đủ tồn kho cho sản phẩm ${prodAId}`,
            );
          }
          if (id === prodBId) {
            if (currentStockB >= qty) {
              currentStockB -= qty;
              return;
            }
            throw new BadRequestException(
              `Không đủ tồn kho cho sản phẩm ${prodBId}`,
            );
          }
        }),
      updateStock: jest
        .fn()
        .mockImplementation(async (id: string, qty: number) => {
          if (id === prodAId) currentStockA += qty;
          if (id === prodBId) currentStockB += qty;
        }),
      incrementSold: jest.fn().mockResolvedValue(undefined),
    };

    mockInventoryService = {
      recordExternalMovement: jest.fn().mockResolvedValue(undefined),
      deleteTransactionsByReference: jest.fn().mockResolvedValue(undefined),
    };

    mockOrderModel = jest.fn().mockImplementation(function (data) {
      this.data = data;
      this._id = new Types.ObjectId().toString();
      this.orderCode = data.orderCode;
      this.customer = data.customer;
      this.orderStatus = data.orderStatus || OrderStatus.PENDING;
      this.items = data.items;
      this.timeline = data.timeline || [];
      this.total = data.total;
      this.deliveredAt = data.deliveredAt;
      this.returnReason = data.returnReason;
      this.save = jest.fn().mockResolvedValue(this);
      createdOrders.push(this);
      return this;
    });

    mockOrderModel.findOne = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(null),
    });
    mockOrderModel.findById = jest.fn().mockImplementation((id: string) => ({
      session: jest.fn().mockReturnThis(),
      exec: jest
        .fn()
        .mockResolvedValue(createdOrders.find((o) => o._id === id) || null),
    }));
    mockOrderModel.countDocuments = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(0),
    });
    mockOrderModel.distinct = jest.fn().mockImplementation(() => ({
      exec: jest.fn().mockResolvedValue([]),
      then: (resolve: any) => Promise.resolve([]).then(resolve),
    }));
    mockOrderModel.db = {
      startSession: undefined, // Non-transaction mode triggers compensation rollback
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        OrderInventoryService,
        OrderLifecycleService,
        { provide: getModelToken(Order.name), useValue: mockOrderModel },
        { provide: getModelToken(Product.name), useValue: {} },
        { provide: getModelToken(Inventory.name), useValue: {} },
        { provide: getModelToken(InventoryTransaction.name), useValue: {} },
        { provide: ProductsService, useValue: mockProductsService },
        { provide: InventoryService, useValue: mockInventoryService },
        {
          provide: PromotionsService,
          useValue: {
            apply: jest.fn().mockResolvedValue({ discount: 0 }),
            releaseUsage: jest.fn(),
          },
        },
        {
          provide: NotificationsService,
          useValue: { create: jest.fn().mockResolvedValue({}) },
        },
        {
          provide: EmailService,
          useValue: {
            sendOrderConfirmationEmail: jest.fn(),
            sendOrderStatusEmail: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findById: jest.fn().mockResolvedValue(null),
            validateAndSpendPoints: jest
              .fn()
              .mockResolvedValue({ pointsSpent: 0, discountAmount: 0 }),
            refundLoyaltyPoints: jest.fn(),
          },
        },
        { provide: CartService, useValue: { clearCart: jest.fn() } },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue(null) },
        },
        {
          provide: OrderLoyaltyService,
          useValue: {
            validateAndSpendPoints: jest
              .fn()
              .mockResolvedValue({ pointsSpent: 0, discountAmount: 0 }),
            refundLoyaltyPoints: jest.fn().mockResolvedValue(undefined),
            deductAwardedPoints: jest.fn().mockResolvedValue(undefined),
            rollbackLoyaltyPoints: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: OrderNotificationService,
          useValue: {
            notifyStatusChange: jest.fn().mockResolvedValue(undefined),
            notifyStatusChanged: jest.fn().mockResolvedValue(undefined),
            recordAuditLog: jest.fn().mockResolvedValue(undefined),
            syncToGoogleSheet: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    ordersService = module.get<OrdersService>(OrdersService);
    orderLifecycleService = module.get<OrderLifecycleService>(
      OrderLifecycleService,
    );
    orderInventoryService = module.get<OrderInventoryService>(
      OrderInventoryService,
    );
  });

  // =========================================================================
  // 1. BẤT BIẾN NHIỀU DÒNG HÀNG (T02)
  // =========================================================================
  describe('1. Lỗi giữa hai dòng không làm lệch đơn/tồn/ledger (T02)', () => {
    it('khi dòng 1 đủ tồn nhưng dòng 2 hết tồn -> Toàn bộ đơn bị từ chối và dòng 1 được rollback nguyên vẹn', async () => {
      currentStockA = 10;
      currentStockB = 0; // Out of stock

      const payload: any = {
        customerName: 'Nguyễn Văn Kiểm Tra',
        phone: '0912345678',
        shippingAddress: 'Quận 1, TP.HCM',
        paymentMethod: PaymentMethod.COD,
        items: [
          { product: prodAId, quantity: 2 },
          { product: prodBId, quantity: 1 },
        ],
      };

      await expect(ordersService.create(payload)).rejects.toThrow(
        ConflictException,
      );

      // Tồn kho sản phẩm A phải nguyên vẹn là 10 (không bị trừ 2)
      expect(currentStockA).toBe(10);
      // Không có đơn hàng rác nào được lưu
      expect(createdOrders).toHaveLength(0);
    });

    it('khi dòng 1 trừ kho xong nhưng dòng 2 gặp lỗi bất ngờ -> rollbackStock được kích hoạt bồi hoàn', async () => {
      currentStockA = 10;

      // Mock findByIds cho thấy cả 2 còn hàng lúc validate
      mockProductsService.findByIds.mockResolvedValueOnce([
        { ...mockProductA, stock: 10 },
        { ...mockProductB, stock: 5 },
      ]);

      // Khi trừ kho thực tế: dòng 1 thành công, dòng 2 quăng lỗi
      mockProductsService.deductStock
        .mockImplementationOnce(async (id: string, qty: number) => {
          currentStockA -= qty; // dòng 1 trừ
        })
        .mockImplementationOnce(async () => {
          throw new BadRequestException(
            'Lỗi cơ sở dữ liệu khi trừ tồn kho dòng 2',
          );
        });

      const payload: any = {
        customerName: 'Trần Thị Thử Nghiệm',
        phone: '0987654321',
        shippingAddress: 'Bình Thạnh, TP.HCM',
        paymentMethod: PaymentMethod.COD,
        items: [
          { product: prodAId, quantity: 3 },
          { product: prodBId, quantity: 2 },
        ],
      };

      await expect(ordersService.create(payload)).rejects.toThrow(
        BadRequestException,
      );

      // Verify bồi hoàn: updateStock được gọi để hoàn lại 3 sản phẩm A
      expect(mockProductsService.updateStock).toHaveBeenCalledWith(prodAId, 3);
      expect(mockProductsService.incrementSold).toHaveBeenCalledWith(
        prodAId,
        -3,
      );
      expect(createdOrders).toHaveLength(0);
    });
  });

  // =========================================================================
  // 2. CÔ LẬP HÀNG LỖI/CHỜ KIỂM (T03)
  // =========================================================================
  describe('2. Hàng lỗi/chờ kiểm không góp vào tồn bán (T03)', () => {
    it('khách trả hàng vì lý do lỗi/rách mép -> Không tăng tồn bán lẻ, nhập vào kho cách ly (DAMAGE)', async () => {
      const orderDoc: any = new mockOrderModel({
        orderCode: 'ORD-DEFECTIVE-001',
        customer: 'cust_01',
        orderStatus: OrderStatus.DELIVERED,
        total: 100000,
        items: [{ product: prodAId, quantity: 2, price: 50000 }],
        timeline: [],
      });
      orderDoc.deliveredAt = new Date();

      createdOrders.push(orderDoc);

      // Khách yêu cầu trả hàng do lỗi rách mép
      await orderLifecycleService.requestReturn(
        orderDoc._id,
        { _id: 'cust_01', role: UserRole.CUSTOMER },
        { reason: 'Sách bị rách mép bìa và lỗi in ấn' },
      );

      expect(orderDoc.isDefectiveReturn).toBe(true);

      // Nhân viên duyệt yêu cầu
      await orderLifecycleService.approveReturn(orderDoc._id, {
        _id: 'staff_01',
        role: UserRole.STAFF,
      });

      // Kho tiếp nhận hàng hoàn
      await orderLifecycleService.confirmReturnReceived(
        orderDoc._id,
        { _id: 'staff_01', role: UserRole.STAFF },
        'Đã nhận sách rách nhập kho cách ly kiểm định',
      );

      expect(orderDoc.orderStatus).toBe(OrderStatus.RETURNED);

      // BẤT BIẾN T03: updateStock (tăng tồn bán) KHÔNG ĐƯỢC PHÉP ĐƯỢC GỌI!
      expect(mockProductsService.updateStock).not.toHaveBeenCalled();

      // Ghi nhận biến động hàng lỗi (DAMAGE) với change = 0 (cô lập)
      expect(mockInventoryService.recordExternalMovement).toHaveBeenCalledWith(
        prodAId,
        InventoryTransactionType.DAMAGE,
        2,
        expect.stringContaining('QUARANTINE'),
        orderDoc._id,
        undefined,
      );
    });

    it('khách trả hàng nguyên vẹn (đổi ý) -> Được phục hồi vào tồn bán lẻ bình thường (RETURN)', async () => {
      const orderDoc: any = new mockOrderModel({
        orderCode: 'ORD-SOUND-002',
        customer: 'cust_02',
        orderStatus: OrderStatus.DELIVERED,
        total: 50000,
        items: [{ product: prodAId, quantity: 1, price: 50000 }],
        timeline: [],
      });
      orderDoc.deliveredAt = new Date();
      createdOrders.push(orderDoc);

      // Khách yêu cầu trả do đổi ý
      await orderLifecycleService.requestReturn(
        orderDoc._id,
        { _id: 'cust_02', role: UserRole.CUSTOMER },
        { reason: 'Khách muốn đổi sang tập 200 trang' },
      );

      expect(orderDoc.isDefectiveReturn).toBe(false);

      // Duyệt và tiếp nhận
      await orderLifecycleService.approveReturn(orderDoc._id, {
        _id: 'staff_01',
        role: UserRole.STAFF,
      });
      await orderLifecycleService.confirmReturnReceived(
        orderDoc._id,
        { _id: 'staff_01', role: UserRole.STAFF },
        'Hàng còn nguyên bọc nilon, nhập lại kho bán',
      );

      // Hàng nguyên vẹn: updateStock ĐƯỢC GỌI để tăng tồn bán
      expect(mockProductsService.updateStock).toHaveBeenCalledWith(prodAId, 1);
      expect(mockInventoryService.recordExternalMovement).toHaveBeenCalledWith(
        prodAId,
        InventoryTransactionType.RETURN,
        1,
        expect.any(String),
        orderDoc._id,
        undefined,
      );
    });
  });
});
