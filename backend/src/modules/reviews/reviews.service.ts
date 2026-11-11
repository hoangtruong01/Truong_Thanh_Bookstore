import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Review, ReviewDocument } from './schemas/review.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { Order, OrderDocument } from '../orders/schemas/order.schema';
import { OrderStatus, StaffPermission } from '../../common/enums';
import {
  CreateReviewDto,
  UpdateReviewDto,
  ModerateReviewDto,
  AdminReplyReviewDto,
  ReviewQueryDto,
} from './dto/review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
  ) {}

  /**
   * SEC-002: phòng thủ chiều sâu — dù DTO đã validate, service vẫn từ chối
   * mọi ảnh không phải URL http/https (javascript:, data:, vbscript:, ...).
   */
  private assertSafeImageUrls(images?: string[]): void {
    if (!images) return;
    for (const raw of images) {
      let ok = false;
      if (typeof raw === 'string') {
        try {
          const parsed = new URL(raw);
          ok = parsed.protocol === 'http:' || parsed.protocol === 'https:';
        } catch {
          ok = false;
        }
      }
      if (!ok) {
        throw new BadRequestException(
          'Ảnh đánh giá phải là URL http/https hợp lệ',
        );
      }
    }
  }

  async findByProduct(productId: string): Promise<ReviewDocument[]> {
    return this.reviewModel
      .find({
        product: new Types.ObjectId(productId),
        isVisible: { $ne: false },
      })
      .sort({ createdAt: -1 })
      .populate('user', 'fullName avatar')
      .exec();
  }

  async getRatingBreakdown(productId: string) {
    const reviews = await this.reviewModel
      .find({
        product: new Types.ObjectId(productId),
        isVisible: { $ne: false },
      })
      .exec();

    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let sum = 0;

    for (const r of reviews) {
      const star = Math.max(1, Math.min(5, Math.round(r.rating)));
      counts[star] = (counts[star] || 0) + 1;
      sum += r.rating;
    }

    const total = reviews.length;
    const average = total > 0 ? Math.round((sum / total) * 10) / 10 : 0;
    const percentages: Record<number, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    if (total > 0) {
      for (let star = 1; star <= 5; star++) {
        percentages[star] = Math.round((counts[star] / total) * 100);
      }
    }

    return {
      averageRating: average,
      totalReviews: total,
      breakdown: counts,
      percentages,
    };
  }

  async canUserReview(productId: string, userId: string) {
    const existing = await this.reviewModel
      .findOne({
        product: new Types.ObjectId(productId),
        user: new Types.ObjectId(userId),
      })
      .exec();

    const deliveredOrder = await this.orderModel
      .findOne({
        customer: new Types.ObjectId(userId),
        'items.product': new Types.ObjectId(productId),
        orderStatus: { $in: [OrderStatus.DELIVERED, 'COMPLETED' as any] },
      })
      .exec();

    const isVerified = !!deliveredOrder;
    const hasReviewed = !!existing;

    return {
      canReview: isVerified,
      isVerified,
      hasReviewed,
      existingReview: existing || null,
    };
  }

  async create(
    productId: string,
    userId: string,
    userName: string,
    dto: CreateReviewDto,
  ): Promise<ReviewDocument> {
    this.assertSafeImageUrls(dto.images);
    const product = await this.productModel.findById(productId).exec();
    if (!product) {
      throw new NotFoundException('Không tìm thấy sản phẩm');
    }

    // Verified Purchase rule: Must have delivered order containing this product
    const deliveredOrder = await this.orderModel
      .findOne({
        customer: new Types.ObjectId(userId),
        'items.product': new Types.ObjectId(productId),
        orderStatus: { $in: [OrderStatus.DELIVERED, 'COMPLETED' as any] },
      })
      .exec();

    if (!deliveredOrder) {
      throw new ForbiddenException(
        'Chỉ khách hàng đã mua và nhận hàng thành công mới có thể gửi đánh giá cho sản phẩm này!',
      );
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
      existing.isVerifiedPurchase = true;
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
        isVerifiedPurchase: true,
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
    this.assertSafeImageUrls(dto.images);
    const review = await this.reviewModel.findById(reviewId).exec();
    if (!review) {
      throw new NotFoundException('Không tìm thấy đánh giá');
    }

    // REVIEW-01: Verify review belongs to the specified product
    if (review.product && review.product.toString() !== productId) {
      throw new NotFoundException('Không tìm thấy đánh giá cho sản phẩm này');
    }

    if (review.user.toString() !== userId) {
      throw new ForbiddenException('Bạn không có quyền sửa đánh giá này');
    }

    if (dto.rating !== undefined) review.rating = dto.rating;
    if (dto.content !== undefined) review.content = dto.content;
    if (dto.images !== undefined) review.images = dto.images;

    const saved = await review.save();
    const targetProductId = review.product
      ? review.product.toString()
      : productId;
    await this.recalculateProductRating(targetProductId);
    return saved;
  }

  async delete(
    productId: string,
    reviewId: string,
    userId: string,
    userRole: string,
    userPermissions: string[] = [],
  ): Promise<{ success: boolean }> {
    const review = await this.reviewModel.findById(reviewId).exec();
    if (!review) {
      throw new NotFoundException('Không tìm thấy đánh giá');
    }

    // REVIEW-01: Verify review belongs to the specified product
    if (review.product && review.product.toString() !== productId) {
      throw new NotFoundException('Không tìm thấy đánh giá cho sản phẩm này');
    }

    // SEC-015: ADMIN/SUPER_ADMIN xóa được mọi đánh giá; STAFF chỉ khi có
    // quyền MANAGE_PRODUCTS (kiểm duyệt đánh giá); khách chỉ xóa đánh giá của mình.
    const isPrivileged = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
    const isModeratingStaff =
      userRole === 'STAFF' &&
      Array.isArray(userPermissions) &&
      userPermissions.includes(StaffPermission.MANAGE_PRODUCTS);
    if (
      review.user.toString() !== userId &&
      !isPrivileged &&
      !isModeratingStaff
    ) {
      throw new ForbiddenException('Bạn không có quyền xóa đánh giá này');
    }

    await this.reviewModel.findByIdAndDelete(reviewId).exec();
    const targetProductId = review.product
      ? review.product.toString()
      : productId;
    await this.recalculateProductRating(targetProductId);
    return { success: true };
  }

  async moderate(
    reviewId: string,
    dto: ModerateReviewDto,
  ): Promise<ReviewDocument> {
    const review = await this.reviewModel.findById(reviewId).exec();
    if (!review) {
      throw new NotFoundException('Không tìm thấy đánh giá');
    }

    review.isVisible = dto.isVisible;
    const saved = await review.save();
    await this.recalculateProductRating(review.product.toString());
    return saved;
  }

  async adminReply(
    reviewId: string,
    dto: AdminReplyReviewDto,
  ): Promise<ReviewDocument> {
    const review = await this.reviewModel.findById(reviewId).exec();
    if (!review) {
      throw new NotFoundException('Không tìm thấy đánh giá');
    }

    review.adminReply = dto.reply;
    review.adminReplyAt = new Date();
    return review.save();
  }

  async findAllAdmin(query: ReviewQueryDto = {}): Promise<{
    items: ReviewDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const filter: any = {};
    if (query.productId && Types.ObjectId.isValid(query.productId)) {
      filter.product = new Types.ObjectId(query.productId);
    }
    if (query.rating) {
      filter.rating = query.rating;
    }
    if (query.isVisible !== undefined) {
      filter.isVisible = query.isVisible;
    }
    if (query.search) {
      const safeSearch = query.search
        .substring(0, 200)
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(safeSearch, 'i');
      filter.$or = [{ name: searchRegex }, { content: searchRegex }];
    }

    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 10));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.reviewModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'fullName email avatar')
        .populate('product', 'name images sku slug')
        .exec(),
      this.reviewModel.countDocuments(filter).exec(),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async recalculateProductRating(productId: string): Promise<void> {
    const reviews = await this.reviewModel
      .find({
        product: new Types.ObjectId(productId),
        isVisible: { $ne: false },
      })
      .exec();

    if (reviews.length === 0) {
      await this.productModel
        .findByIdAndUpdate(productId, { rating: 0 })
        .exec();
      return;
    }

    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const avgRating = Math.round((sum / reviews.length) * 10) / 10;
    await this.productModel
      .findByIdAndUpdate(productId, { rating: avgRating })
      .exec();
  }
}
