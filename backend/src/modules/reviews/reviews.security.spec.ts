/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Types } from 'mongoose';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ReviewsService } from './reviews.service';
import { Review } from './schemas/review.schema';
import { Product } from '../products/schemas/product.schema';
import { Order } from '../orders/schemas/order.schema';
import { CreateReviewDto, UpdateReviewDto } from './dto/review.dto';
import { StaffPermission } from '../../common/enums';

describe('Reviews security (SEC-002, SEC-015)', () => {
  const productId = new Types.ObjectId().toString();
  const ownerId = new Types.ObjectId().toString();
  const otherId = new Types.ObjectId().toString();
  const reviewId = new Types.ObjectId().toString();

  describe('SEC-002: review images DTO', () => {
    const build = (cls: any, images: unknown): object =>
      plainToInstance(cls, { rating: 5, content: 'Tốt lắm', images });

    it.each([
      'javascript:alert(1)',
      'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==',
      'vbscript:msgbox(1)',
      'ftp://example.com/a.jpg',
      '/relative/path.jpg',
    ])('CreateReviewDto rejects %s', async (bad) => {
      const errors = await validate(build(CreateReviewDto, [bad]));
      expect(errors.some((e) => e.property === 'images')).toBe(true);
    });

    it('UpdateReviewDto rejects javascript: URL', async () => {
      const errors = await validate(
        build(UpdateReviewDto, ['javascript:alert(1)']),
      );
      expect(errors.some((e) => e.property === 'images')).toBe(true);
    });

    it('rejects more than 5 images', async () => {
      const many = Array.from(
        { length: 6 },
        (_, i) => `https://cdn.example.com/${i}.jpg`,
      );
      const errors = await validate(build(CreateReviewDto, many));
      expect(errors.some((e) => e.property === 'images')).toBe(true);
    });

    it('rejects over-long URL', async () => {
      const long = `https://cdn.example.com/${'a'.repeat(2100)}.jpg`;
      const errors = await validate(build(CreateReviewDto, [long]));
      expect(errors.some((e) => e.property === 'images')).toBe(true);
    });

    it('accepts valid http/https URLs and missing images', async () => {
      expect(
        await validate(
          build(CreateReviewDto, [
            'https://cdn.example.com/a.jpg',
            'http://localhost:3000/uploads/b.png',
          ]),
        ),
      ).toHaveLength(0);
      expect(await validate(build(CreateReviewDto, undefined))).toHaveLength(0);
    });
  });

  describe('service', () => {
    let service: ReviewsService;
    let reviewModel: any;
    let productModel: any;
    let orderModel: any;

    beforeEach(async () => {
      reviewModel = {
        find: jest.fn(),
        findOne: jest.fn(),
        findById: jest.fn(),
        create: jest.fn(),
        findByIdAndDelete: jest.fn(),
      };
      productModel = { findById: jest.fn(), findByIdAndUpdate: jest.fn() };
      orderModel = { findOne: jest.fn() };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ReviewsService,
          { provide: getModelToken(Review.name), useValue: reviewModel },
          { provide: getModelToken(Product.name), useValue: productModel },
          { provide: getModelToken(Order.name), useValue: orderModel },
        ],
      }).compile();
      service = module.get(ReviewsService);
    });

    describe('SEC-002: service rejects non-http(s) images', () => {
      it('create() rejects javascript: before touching the database', async () => {
        await expect(
          service.create(productId, ownerId, 'A', {
            rating: 5,
            content: 'ok',
            images: ['javascript:alert(1)'],
          }),
        ).rejects.toThrow(BadRequestException);
        expect(productModel.findById).not.toHaveBeenCalled();
        expect(reviewModel.create).not.toHaveBeenCalled();
      });

      it('update() rejects data: URL before touching the database', async () => {
        await expect(
          service.update(productId, reviewId, ownerId, {
            images: ['data:text/html,<script>alert(1)</script>'],
          }),
        ).rejects.toThrow(BadRequestException);
        expect(reviewModel.findById).not.toHaveBeenCalled();
      });
    });

    describe('SEC-015: delete permission', () => {
      const mockFoundReview = () => {
        reviewModel.findById.mockReturnValue({
          exec: jest.fn().mockResolvedValue({
            _id: reviewId,
            product: new Types.ObjectId(productId),
            user: new Types.ObjectId(ownerId),
          }),
        });
        reviewModel.findByIdAndDelete.mockReturnValue({
          exec: jest.fn().mockResolvedValue({}),
        });
        reviewModel.find.mockReturnValue({
          exec: jest.fn().mockResolvedValue([]),
        });
        productModel.findByIdAndUpdate.mockReturnValue({
          exec: jest.fn().mockResolvedValue({}),
        });
      };

      it('STAFF without MANAGE_PRODUCTS cannot delete another user review (403)', async () => {
        mockFoundReview();
        await expect(
          service.delete(productId, reviewId, otherId, 'STAFF', [
            StaffPermission.VIEW_REPORTS,
          ]),
        ).rejects.toThrow(ForbiddenException);
        expect(reviewModel.findByIdAndDelete).not.toHaveBeenCalled();
      });

      it('STAFF with no permissions list cannot delete (403)', async () => {
        mockFoundReview();
        await expect(
          service.delete(productId, reviewId, otherId, 'STAFF'),
        ).rejects.toThrow(ForbiddenException);
      });

      it('STAFF with MANAGE_PRODUCTS can delete', async () => {
        mockFoundReview();
        await expect(
          service.delete(productId, reviewId, otherId, 'STAFF', [
            StaffPermission.MANAGE_PRODUCTS,
          ]),
        ).resolves.toEqual({ success: true });
        expect(reviewModel.findByIdAndDelete).toHaveBeenCalledWith(reviewId);
      });

      it.each(['ADMIN', 'SUPER_ADMIN'])('%s can delete', async (role) => {
        mockFoundReview();
        await expect(
          service.delete(productId, reviewId, otherId, role),
        ).resolves.toEqual({ success: true });
      });

      it('owner customer can delete own review; other customer cannot', async () => {
        mockFoundReview();
        await expect(
          service.delete(productId, reviewId, ownerId, 'CUSTOMER'),
        ).resolves.toEqual({ success: true });

        reviewModel.findByIdAndDelete.mockClear();
        await expect(
          service.delete(productId, reviewId, otherId, 'CUSTOMER'),
        ).rejects.toThrow(ForbiddenException);
        expect(reviewModel.findByIdAndDelete).not.toHaveBeenCalled();
      });
    });
  });
});
