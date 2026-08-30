import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { Types } from 'mongoose';
import { ReviewsService } from './reviews.service';
import { Review } from './schemas/review.schema';
import { Product } from '../products/schemas/product.schema';
import { Order } from '../orders/schemas/order.schema';
import { OrderStatus } from '../../common/enums';

describe('ReviewsService', () => {
  let service: ReviewsService;
  let mockReviewModel: any;
  let mockProductModel: any;
  let mockOrderModel: any;

  const mockProductId = new Types.ObjectId().toString();
  const mockUserId = new Types.ObjectId().toString();
  const mockReviewId = new Types.ObjectId().toString();

  beforeEach(async () => {
    mockReviewModel = {
      find: jest.fn(),
      findOne: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      findByIdAndDelete: jest.fn(),
      countDocuments: jest.fn(),
    };

    mockProductModel = {
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
    };

    mockOrderModel = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        { provide: getModelToken(Review.name), useValue: mockReviewModel },
        { provide: getModelToken(Product.name), useValue: mockProductModel },
        { provide: getModelToken(Order.name), useValue: mockOrderModel },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByProduct', () => {
    it('should return visible reviews for a product with populated user info', async () => {
      const mockReviews = [
        { _id: mockReviewId, rating: 5, content: 'Tuyệt vời', isVisible: true },
      ];

      mockReviewModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockReviews),
          }),
        }),
      });

      const result = await service.findByProduct(mockProductId);
      expect(result).toEqual(mockReviews);
      expect(mockReviewModel.find).toHaveBeenCalledWith({
        product: new Types.ObjectId(mockProductId),
        isVisible: { $ne: false },
      });
    });
  });

  describe('getRatingBreakdown', () => {
    it('should calculate star breakdown and percentages correctly', async () => {
      const mockReviews = [
        { rating: 5 },
        { rating: 5 },
        { rating: 4 },
        { rating: 3 },
      ];

      mockReviewModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockReviews),
      });

      const result = await service.getRatingBreakdown(mockProductId);
      expect(result.totalReviews).toBe(4);
      expect(result.averageRating).toBe(4.3);
      expect(result.breakdown[5]).toBe(2);
      expect(result.breakdown[4]).toBe(1);
      expect(result.breakdown[3]).toBe(1);
      expect(result.percentages[5]).toBe(50);
      expect(result.percentages[4]).toBe(25);
    });

    it('should return default 5.0 and zero counts when no reviews exist', async () => {
      mockReviewModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      });

      const result = await service.getRatingBreakdown(mockProductId);
      expect(result.totalReviews).toBe(0);
      expect(result.averageRating).toBe(5);
    });
  });

  describe('canUserReview', () => {
    it('should return canReview: true when user has a delivered order', async () => {
      mockReviewModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      mockOrderModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ _id: 'order1', orderStatus: OrderStatus.DELIVERED }),
      });

      const result = await service.canUserReview(mockProductId, mockUserId);
      expect(result.canReview).toBe(true);
      expect(result.isVerified).toBe(true);
      expect(result.hasReviewed).toBe(false);
    });

    it('should return canReview: false when user has NOT purchased the product', async () => {
      mockReviewModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      mockOrderModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await service.canUserReview(mockProductId, mockUserId);
      expect(result.canReview).toBe(false);
      expect(result.isVerified).toBe(false);
    });
  });

  describe('create', () => {
    it('should throw NotFoundException if product is not found', async () => {
      mockProductModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.create(mockProductId, mockUserId, 'Nguyễn Văn A', {
          rating: 5,
          content: 'Sách rất hay',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user has not purchased/received product', async () => {
      mockProductModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ _id: mockProductId }),
      });

      mockOrderModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.create(mockProductId, mockUserId, 'Nguyễn Văn A', {
          rating: 5,
          content: 'Sách rất hay',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should create new verified review and recalculate product rating', async () => {
      mockProductModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ _id: mockProductId, rating: 0 }),
      });

      mockOrderModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ _id: 'order1', orderStatus: OrderStatus.DELIVERED }),
      });

      mockReviewModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const createdReview = {
        _id: mockReviewId,
        rating: 5,
        content: 'Rất hài lòng',
        isVerifiedPurchase: true,
      };
      mockReviewModel.create.mockResolvedValue(createdReview);

      mockReviewModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([createdReview]),
      });

      mockProductModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue({}),
      });

      const result = await service.create(mockProductId, mockUserId, 'Nguyễn Văn A', {
        rating: 5,
        content: 'Rất hài lòng',
      });

      expect(result).toEqual(createdReview);
      expect(mockProductModel.findByIdAndUpdate).toHaveBeenCalledWith(mockProductId, { rating: 5 });
    });
  });

  describe('update & delete', () => {
    it('should throw ForbiddenException when updating another user review', async () => {
      mockReviewModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          _id: mockReviewId,
          user: new Types.ObjectId(), // Different user
        }),
      });

      await expect(
        service.update(mockProductId, mockReviewId, mockUserId, { content: 'Sửa nội dung' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow admin/staff to delete any review', async () => {
      mockReviewModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          _id: mockReviewId,
          user: new Types.ObjectId(), // Different user
        }),
      });

      mockReviewModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue({}),
      });

      mockReviewModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      });

      mockProductModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue({}),
      });

      const result = await service.delete(mockProductId, mockReviewId, mockUserId, 'ADMIN');
      expect(result).toEqual({ success: true });
      expect(mockReviewModel.findByIdAndDelete).toHaveBeenCalledWith(mockReviewId);
    });
  });

  describe('moderate & adminReply', () => {
    it('should toggle visibility in moderate', async () => {
      const mockReview = {
        _id: mockReviewId,
        product: new Types.ObjectId(mockProductId),
        isVisible: true,
        save: jest.fn().mockResolvedValue({ _id: mockReviewId, isVisible: false }),
      };

      mockReviewModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockReview),
      });

      mockReviewModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      });

      mockProductModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue({}),
      });

      const result = await service.moderate(mockReviewId, { isVisible: false });
      expect(result.isVisible).toBe(false);
      expect(mockReview.save).toHaveBeenCalled();
    });

    it('should save admin reply and timestamp', async () => {
      const mockReview = {
        _id: mockReviewId,
        adminReply: null,
        adminReplyAt: null,
        save: jest.fn().mockImplementation(function () {
          return Promise.resolve(this);
        }),
      };

      mockReviewModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockReview),
      });

      const result = await service.adminReply(mockReviewId, {
        reply: 'Cảm ơn bạn đã phản hồi!',
      });

      expect(result.adminReply).toBe('Cảm ơn bạn đã phản hồi!');
      expect(result.adminReplyAt).toBeInstanceOf(Date);
    });
  });

  describe('findAllAdmin', () => {
    it('should return paginated reviews for admin with filter options', async () => {
      const mockItems = [{ _id: mockReviewId, rating: 5 }];
      mockReviewModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              populate: jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                  exec: jest.fn().mockResolvedValue(mockItems),
                }),
              }),
            }),
          }),
        }),
      });

      mockReviewModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(1),
      });

      const result = await service.findAllAdmin({ page: 1, limit: 10, rating: 5 });
      expect(result.items).toEqual(mockItems);
      expect(result.total).toBe(1);
      expect(result.totalPages).toBe(1);
    });
  });
});
