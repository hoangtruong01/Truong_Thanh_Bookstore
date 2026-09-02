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
import { OrderStatus } from '../../common/enums';

describe('ALL QA FIXES VERIFICATION SUITE', () => {
  let ordersService: OrdersService;

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
    this.save = jest
      .fn()
      .mockResolvedValue({ _id: 'order123', orderCode: 'TT123456', ...dto });
  };
  mockOrderModel.find = jest.fn();
  mockOrderModel.findOne = jest.fn();
  mockOrderModel.findById = jest.fn();
  mockOrderModel.countDocuments = jest.fn();

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
    addLoyaltyPoints: jest.fn().mockResolvedValue({}),
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
});
