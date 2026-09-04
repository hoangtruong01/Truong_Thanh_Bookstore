/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { LandingPageService } from './landing-page.service';
import { LandingPage } from './schemas/landing-page.schema';
import { Order } from '../orders/schemas/order.schema';
import { OrdersService } from '../orders/orders.service';
import { ProductsService } from '../products/products.service';
import { PaymentMethod } from '../../common/enums';

describe('LandingPageService (BE-03)', () => {
  let service: LandingPageService;
  let mockLandingPageModel: any;
  let mockOrderModel: any;
  let mockOrdersService: any;
  let mockProductsService: any;
  let mockConfigService: any;

  const mockLandingPageId = new Types.ObjectId().toString();
  const mockProductId = new Types.ObjectId().toString();

  const mockProduct = {
    _id: new Types.ObjectId(mockProductId),
    name: 'Sách Đắc Nhân Tâm',
    price: 100000,
    discountPrice: 80000,
    stock: 50,
    sold: 10,
    images: ['https://example.com/dac-nhan-tam.jpg'],
    isDeleted: false,
  };

  const mockLandingPage = {
    _id: new Types.ObjectId(mockLandingPageId),
    title: 'Landing Page Sách Hay',
    slug: 'sach-hay-giam-gia',
    price: 80000,
    originalPrice: 100000,
    productId: new Types.ObjectId(mockProductId),
    images: ['https://example.com/landing.jpg'],
    packages: [
      {
        name: 'Combo Tiết Kiệm',
        price: 75000,
        originalPrice: 100000,
        productId: new Types.ObjectId(mockProductId),
        isBestSeller: true,
      },
    ],
  };

  beforeEach(async () => {
    mockLandingPageModel = {
      find: jest.fn(),
      findOne: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
    };

    mockOrderModel = jest.fn();

    mockOrdersService = {
      create: jest.fn(),
      syncToGoogleSheet: jest.fn().mockResolvedValue(true),
    };

    mockProductsService = {
      findById: jest.fn(),
      findBySlug: jest.fn(),
      findAll: jest.fn(),
    };

    mockConfigService = {
      get: jest.fn().mockReturnValue('test-gemini-key'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LandingPageService,
        {
          provide: getModelToken(LandingPage.name),
          useValue: mockLandingPageModel,
        },
        {
          provide: getModelToken(Order.name),
          useValue: mockOrderModel,
        },
        {
          provide: OrdersService,
          useValue: mockOrdersService,
        },
        {
          provide: ProductsService,
          useValue: mockProductsService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<LandingPageService>(LandingPageService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('submitOrder (BE-03 Pipeline Integration)', () => {
    it('should route order through OrdersService.create with orderSource LANDING_PAGE and real productId', async () => {
      mockLandingPageModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockLandingPage),
      });
      mockProductsService.findById.mockResolvedValue(mockProduct);

      const createdMockOrder = {
        _id: new Types.ObjectId().toString(),
        orderCode: 'TT123456',
        total: 75000,
        orderSource: 'LANDING_PAGE',
      };
      mockOrdersService.create.mockResolvedValue(createdMockOrder);

      const dto = {
        landingPageId: mockLandingPageId,
        fullName: 'Nguyễn Văn A',
        phone: '0901234567',
        address: '123 Lê Lợi, Q.1, TP.HCM',
        packageName: 'Combo Tiết Kiệm',
        note: 'Giao giờ hành chính',
        idempotencyKey: 'idemp-key-landing-12345678',
      };

      const result = await service.submitOrder(dto);

      expect(mockLandingPageModel.findById).toHaveBeenCalledWith(
        mockLandingPageId,
      );
      expect(mockProductsService.findById).toHaveBeenCalledWith(mockProductId);
      expect(mockOrdersService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          items: [
            expect.objectContaining({
              product: mockProductId,
              price: 75000,
              quantity: 1,
            }),
          ],
          shippingAddress: '123 Lê Lợi, Q.1, TP.HCM',
          phone: '0901234567',
          customerName: 'Nguyễn Văn A',
          paymentMethod: PaymentMethod.COD,
          orderSource: 'LANDING_PAGE',
          landingPageId: mockLandingPageId,
          idempotencyKey: 'idemp-key-landing-12345678',
        }),
      );
      expect(
        (mockOrdersService.create.mock.calls[0][0] as any).customerEmail,
      ).toBeUndefined();
      expect(mockOrdersService.syncToGoogleSheet).toHaveBeenCalledWith(
        createdMockOrder,
      );
      expect(result).toEqual(createdMockOrder);
    });

    it('should throw BadRequestException if landingPageId is invalid', async () => {
      await expect(
        service.submitOrder({
          landingPageId: 'invalid-id',
          fullName: 'Test',
          phone: '0901234567',
          address: 'Hà Nội',
          packageName: 'Gói 1',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if landing page is not found', async () => {
      mockLandingPageModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.submitOrder({
          landingPageId: mockLandingPageId,
          fullName: 'Test',
          phone: '0901234567',
          address: 'Hà Nội',
          packageName: 'Gói 1',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if product is deleted or not found', async () => {
      mockLandingPageModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockLandingPage),
      });
      mockProductsService.findById.mockResolvedValue({
        ...mockProduct,
        isDeleted: true,
      });

      await expect(
        service.submitOrder({
          landingPageId: mockLandingPageId,
          fullName: 'Test',
          phone: '0901234567',
          address: 'Hà Nội',
          packageName: 'Combo Tiết Kiệm',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('generateSlug', () => {
    it('should convert Vietnamese text to clean slug', () => {
      const slug = service.generateSlug('Sách Đắc Nhân Tâm Giảm Giá 50%');
      expect(slug).toBe('sach-dac-nhan-tam-giam-gia-50');
    });
  });

  describe('generateLandingPage (BE-08 Schema Validation)', () => {
    const originalFetch = global.fetch;

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it('should validate valid Gemini JSON output', async () => {
      const validPayload = {
        description: 'Mô tả sách chuẩn SEO',
        badgeText: 'HOT',
        primaryColor: '#dc2626',
        backgroundColor: '#ffffff',
        textColor: '#1e293b',
        benefits: [{ title: 'Lợi ích 1', description: 'Chi tiết' }],
        packages: [{ name: 'Gói 1', price: 90000, isBestSeller: true }],
        testimonials: [{ authorName: 'Độc giả', content: 'Sách rất hay', rating: 5 }],
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: JSON.stringify(validPayload) }],
              },
            },
          ],
        }),
      } as any);

      const result = await service.generateLandingPage({
        title: 'Sách Hay',
        price: 90000,
        images: [],
      });

      expect(result.description).toBe('Mô tả sách chuẩn SEO');
      expect(result.packages[0].name).toBe('Gói 1');
    });

    it('should fallback to template if Gemini returns schema validation violations', async () => {
      const invalidPayload = {
        description: 12345, // Invalid type (should be string)
        packages: 'not-an-array', // Invalid type (should be array)
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: JSON.stringify(invalidPayload) }],
              },
            },
          ],
        }),
      } as any);

      const result = await service.generateLandingPage({
        title: 'Sách Fallback',
        price: 100000,
        images: [],
      });

      // Should fallback to default template with valid packages
      expect(Array.isArray(result.packages)).toBe(true);
      expect(result.packages.length).toBeGreaterThan(0);
    });
  });
});
