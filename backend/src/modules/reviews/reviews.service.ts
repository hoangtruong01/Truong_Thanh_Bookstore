import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Review, ReviewDocument } from './schemas/review.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { CreateReviewDto, UpdateReviewDto, ModerateReviewDto } from './dto/review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  async findByProduct(productId: string): Promise<ReviewDocument[]> {
    return this.reviewModel
      .find({
        product: new Types.ObjectId(productId),
        isVisible: { $ne: false },
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  async create(
    productId: string,
    userId: string,
    userName: string,
    dto: CreateReviewDto,
  ): Promise<ReviewDocument> {
    const product = await this.productModel.findById(productId).exec();
    if (!product) {
      throw new NotFoundException('Không tìm thấy sản phẩm');
    }

    const existing = await this.reviewModel
      .findOne({
        product: new Types.ObjectId(productId),
        user: new Types.ObjectId(userId),
      })
      .exec();

    let savedReview: ReviewDocument;
    if (existing) {
      existing.rating = dto.rating;
      existing.content = dto.content;
      existing.name = userName;
      if (dto.images) existing.images = dto.images;
      savedReview = await existing.save();
    } else {
      savedReview = await this.reviewModel.create({
        product: new Types.ObjectId(productId),
        user: new Types.ObjectId(userId),
        name: userName,
        rating: dto.rating,
        content: dto.content,
        images: dto.images || [],
        isVisible: true,
      });
    }

    await this.recalculateProductRating(productId);
    return savedReview;
  }

  async update(
    productId: string,
    reviewId: string,
    userId: string,
    dto: UpdateReviewDto,
  ): Promise<ReviewDocument> {
    const review = await this.reviewModel.findById(reviewId).exec();
    if (!review) {
      throw new NotFoundException('Không tìm thấy đánh giá');
    }

    if (review.user.toString() !== userId) {
      throw new ForbiddenException('Bạn không có quyền sửa đánh giá này');
    }

    if (dto.rating !== undefined) review.rating = dto.rating;
    if (dto.content !== undefined) review.content = dto.content;
    if (dto.images !== undefined) review.images = dto.images;

    const saved = await review.save();
    await this.recalculateProductRating(productId);
    return saved;
  }

  async delete(
    productId: string,
    reviewId: string,
    userId: string,
    userRole: string,
  ): Promise<{ success: boolean }> {
    const review = await this.reviewModel.findById(reviewId).exec();
    if (!review) {
      throw new NotFoundException('Không tìm thấy đánh giá');
    }

    if (
      review.user.toString() !== userId &&
      userRole !== 'ADMIN' &&
      userRole !== 'STAFF' &&
      userRole !== 'SUPER_ADMIN'
    ) {
      throw new ForbiddenException('Bạn không có quyền xóa đánh giá này');
    }

    await this.reviewModel.findByIdAndDelete(reviewId).exec();
    await this.recalculateProductRating(productId);
    return { success: true };
  }

  async moderate(reviewId: string, dto: ModerateReviewDto): Promise<ReviewDocument> {
    const review = await this.reviewModel.findById(reviewId).exec();
    if (!review) {
      throw new NotFoundException('Không tìm thấy đánh giá');
    }

    review.isVisible = dto.isVisible;
    const saved = await review.save();
    await this.recalculateProductRating(review.product.toString());
    return saved;
  }

  async findAllAdmin(productId?: string): Promise<ReviewDocument[]> {
    const filter: any = {};
    if (productId) {
      filter.product = new Types.ObjectId(productId);
    }
    return this.reviewModel.find(filter).sort({ createdAt: -1 }).populate('user', 'fullName email').exec();
  }

  async recalculateProductRating(productId: string): Promise<void> {
    const reviews = await this.reviewModel
      .find({
        product: new Types.ObjectId(productId),
        isVisible: { $ne: false },
      })
      .exec();

    if (reviews.length === 0) {
      await this.productModel.findByIdAndUpdate(productId, { rating: 5 }).exec();
      return;
    }

    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const avgRating = Math.round((sum / reviews.length) * 10) / 10;
    await this.productModel.findByIdAndUpdate(productId, { rating: avgRating }).exec();
  }
}
