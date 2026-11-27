import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { RecommendationsService } from './recommendations.service';
import { Product } from '../../products/schemas/product.schema';
import { Order } from '../../orders/schemas/order.schema';
import { User } from '../../users/schemas/user.schema';
import { ProductStatus } from '../../../common/enums';

describe('RecommendationsService (Release R4 - OPT-01)', () => {
  let service: RecommendationsService;
  let mockProductModel: any;
  let mockOrderModel: any;
  let mockUserModel: any;

  const targetProductId = new Types.ObjectId();
  const relatedProductId = new Types.ObjectId();
  const categoryId = new Types.ObjectId();

  const mockTargetProduct = {
    _id: targetProductId,
    name: 'Sổ Tay Kẻ Ngang A5',
    category: categoryId,
    stock: 50,
  };

  const mockRelatedProduct = {
    _id: relatedProductId,
    name: 'Bút Bi Thiên Long Gel',
    slug: 'but-bi-thien-long-gel',
    sku: 'BUT-TL-GEL',
    price: 15000,
    stock: 100,
    images: ['image1.jpg'],
    rating: 5,
    sold: 120,
    category: { _id: categoryId, name: 'Bút Viết' },
  };

  const createQueryMock = (data: any[]) => ({
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(data),
  });

  beforeEach(async () => {
    mockProductModel = {
      findById: jest.fn(),
      find: jest.fn(),
    };

    mockOrderModel = {
      find: jest.fn(),
    };

    mockUserModel = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecommendationsService,
        {
          provide: getModelToken(Product.name),
          useValue: mockProductModel,
        },
        {
          provide: getModelToken(Order.name),
          useValue: mockOrderModel,
        },
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    service = module.get<RecommendationsService>(RecommendationsService);
  });

  describe('getFrequentlyBoughtTogether()', () => {
    it('should recommend products based on order co-occurrence frequency', async () => {
      mockProductModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockTargetProduct),
      });

      const mockOrders = [
        {
          items: [
            { product: targetProductId },
            { product: relatedProductId },
          ],
        },
      ];

      mockOrderModel.find.mockReturnValue(createQueryMock(mockOrders));
      mockProductModel.find.mockReturnValue(createQueryMock([mockRelatedProduct]));

      const results = await service.getFrequentlyBoughtTogether(targetProductId.toString(), 1);

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Bút Bi Thiên Long Gel');
      expect(results[0].recommendationReason).toContain('thường mua cùng');
    });

    it('should return empty list when target product is not found', async () => {
      mockProductModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const results = await service.getFrequentlyBoughtTogether(targetProductId.toString());
      expect(results).toEqual([]);
    });
  });

  describe('getRelatedProducts()', () => {
    it('should return products in the same category excluding current product', async () => {
      mockProductModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockTargetProduct),
      });

      mockProductModel.find.mockReturnValue(createQueryMock([mockRelatedProduct]));

      const results = await service.getRelatedProducts(targetProductId.toString(), 4);

      expect(results).toHaveLength(1);
      expect(results[0]._id).toBe(relatedProductId.toString());
      expect(mockProductModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          category: categoryId,
          _id: { $ne: targetProductId },
          status: ProductStatus.ACTIVE,
        }),
      );
    });
  });

  describe('getPersonalized()', () => {
    it('should recommend products based on user wishlist preferences', async () => {
      const mockUserId = new Types.ObjectId().toString();

      mockUserModel.findById.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue({ wishlist: [targetProductId] }),
      });

      mockProductModel.find.mockImplementation((query: any) => {
        if (query._id && query._id.$in) {
          return {
            select: jest.fn().mockReturnThis(),
            lean: jest.fn().mockReturnThis(),
            exec: jest.fn().mockResolvedValue([{ _id: targetProductId, category: categoryId }]),
          };
        }
        return createQueryMock([mockRelatedProduct]);
      });

      const results = await service.getPersonalized(mockUserId, 1);

      expect(results).toHaveLength(1);
      expect(results[0].recommendationReason).toContain('sở thích');
    });

    it('should fallback to trending products if no user or wishlist empty', async () => {
      mockProductModel.find.mockReturnValue(createQueryMock([mockRelatedProduct]));

      const results = await service.getPersonalized(undefined, 1);

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Bút Bi Thiên Long Gel');
    });
  });
});
