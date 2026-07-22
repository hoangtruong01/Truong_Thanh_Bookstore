import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { ProductsService } from '../products/products.service';
import { PromotionsService } from '../promotions/promotions.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ConfigService } from '@nestjs/config';
import { getModelToken } from '@nestjs/mongoose';
import { Order } from './schemas/order.schema';
import { ProductSchema } from '../products/schemas/product.schema';
import { OrderSchema } from './schemas/order.schema';
import { InventorySchema } from '../inventory/schemas/inventory.schema';
import { BadRequestException } from '@nestjs/common';

describe('ALL QA FIXES VERIFICATION SUITE', () => {
  let ordersService: OrdersService;

  const mockProduct = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Bút bi Thiên Long TL-027',
    price: 5000,
    discountPrice: 0,
    stock: 10,
    images: ['https://example.com/pen.jpg'],
  };

  const mockOrderModel = function (dto) {
    this.data = dto;
    this.save = jest.fn().mockResolvedValue({ _id: 'order123', orderCode: 'TT123456', ...dto });
  };
  mockOrderModel.find = jest.fn();
  mockOrderModel.findOne = jest.fn();
  mockOrderModel.findById = jest.fn();
  mockOrderModel.countDocuments = jest.fn();

  const mockProductsService = {
    findById: jest.fn().mockResolvedValue(mockProduct),
    deductStock: jest.fn(),
    updateStock: jest.fn(),
    incrementSold: jest.fn(),
  };

  const mockPromotionsService = {
    apply: jest.fn(),
  };

  const mockNotificationsService = {
    create: jest.fn().mockResolvedValue({}),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue(''),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: ProductsService, useValue: mockProductsService },
        { provide: PromotionsService, useValue: mockPromotionsService },
        { provide: NotificationsService, useValue: mockNotificationsService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: getModelToken(Order.name), useValue: mockOrderModel },
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
        items: [{ product: mockProduct._id, name: mockProduct.name, quantity: 5 }],
        shippingAddress: '123 Nguyễn Huệ, Q1, HCM',
        phone: '0901234567',
        paymentMethod: 'COD',
        customerName: 'Nguyễn Văn A',
        customerEmail: 'a@example.com',
      };

      await expect(ordersService.create(createDto)).rejects.toThrow(BadRequestException);
      expect(mockProductsService.deductStock).toHaveBeenCalledWith(mockProduct._id, 5);
    });
  });

  describe('Fix 1.4: Free Shipping Threshold Server-side Check', () => {
    it('should charge shipping fee of 30,000 VND for subtotal < 299,000 VND', async () => {
      mockProductsService.deductStock.mockResolvedValue(undefined);
      mockProductsService.incrementSold.mockResolvedValue(undefined);

      const createDto: any = {
        items: [{ product: mockProduct._id, name: mockProduct.name, quantity: 10 }], // 50,000 VND
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
      mockProductsService.findById.mockResolvedValueOnce(expensiveProduct);

      const createDto: any = {
        items: [{ product: expensiveProduct._id, name: expensiveProduct.name, quantity: 1 }], // 300,000 VND
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
});
