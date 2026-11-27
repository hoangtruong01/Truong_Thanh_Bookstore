import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product, ProductDocument } from '../../products/schemas/product.schema';
import { Order, OrderDocument } from '../../orders/schemas/order.schema';
import { User, UserDocument } from '../../users/schemas/user.schema';
import { OrderStatus, ProductStatus } from '../../../common/enums';

export interface ProductRecommendationCard {
  _id: string;
  name: string;
  slug: string;
  sku: string;
  price: number;
  discountPrice?: number;
  stock: number;
  images: string[];
  rating: number;
  sold: number;
  category?: any;
  recommendationReason?: string;
}

@Injectable()
export class RecommendationsService {
  private readonly logger = new Logger(RecommendationsService.name);

  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  /**
   * Gợi ý "Thường Mua Cùng" (Frequently Bought Together)
   * Sử dụng thuật toán phân tích giỏ hàng (Market Basket Analysis) từ lịch sử đơn hàng thực tế
   */
  async getFrequentlyBoughtTogether(
    productId: string,
    limit = 4,
  ): Promise<ProductRecommendationCard[]> {
    if (!Types.ObjectId.isValid(productId)) {
      return [];
    }

    const targetId = new Types.ObjectId(productId);
    const targetProduct = await this.productModel.findById(targetId).exec();
    if (!targetProduct) {
      return [];
    }

    // 1. Tìm các đơn hàng gần nhất có chứa sản phẩm mục tiêu
    const recentOrders = await this.orderModel
      .find({
        'items.product': targetId,
        orderStatus: { $nin: [OrderStatus.CANCELLED, OrderStatus.RETURNED] },
      } as any)
      .sort({ createdAt: -1 })
      .limit(200)
      .select('items')
      .lean()
      .exec();

    // 2. Đếm tần suất xuất hiện của các sản phẩm mua kèm
    const frequencyMap = new Map<string, number>();

    for (const order of (recentOrders as any[])) {
      if (!order.items || !Array.isArray(order.items)) continue;
      for (const item of order.items) {
        const itemProdId = item.product?.toString();
        if (itemProdId && itemProdId !== productId) {
          frequencyMap.set(itemProdId, (frequencyMap.get(itemProdId) || 0) + 1);
        }
      }
    }

    // Sắp xếp các sản phẩm có tần suất mua cùng cao nhất
    const sortedIds = Array.from(frequencyMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => new Types.ObjectId(id))
      .slice(0, limit);

    let recommendations: any[] = [];

    if (sortedIds.length > 0) {
      recommendations = await this.productModel
        .find({
          _id: { $in: sortedIds },
          isDeleted: false,
          status: ProductStatus.ACTIVE,
          stock: { $gt: 0 },
        } as any)
        .select('name slug sku price discountPrice stock images rating sold category')
        .populate('category', 'name slug')
        .lean()
        .exec();
    }

    // 3. Nếu chưa đủ limit, bù thêm các sản phẩm cùng danh mục bán chạy nhất
    if (recommendations.length < limit && targetProduct.category) {
      const existingIds = [targetId, ...recommendations.map((r) => r._id)];
      const fillers = await this.productModel
        .find({
          category: targetProduct.category,
          _id: { $nin: existingIds },
          isDeleted: false,
          status: ProductStatus.ACTIVE,
          stock: { $gt: 0 },
        } as any)
        .sort({ sold: -1, rating: -1 })
        .limit(limit - recommendations.length)
        .select('name slug sku price discountPrice stock images rating sold category')
        .populate('category', 'name slug')
        .lean()
        .exec();

      recommendations = [...recommendations, ...fillers];
    }

    return recommendations.map((item) => ({
      _id: item._id.toString(),
      name: item.name,
      slug: item.slug,
      sku: item.sku,
      price: item.price,
      discountPrice: item.discountPrice,
      stock: item.stock,
      images: item.images || [],
      rating: item.rating || 0,
      sold: item.sold || 0,
      category: item.category,
      recommendationReason: frequencyMap.has(item._id.toString())
        ? 'Khách hàng thường mua cùng sản phẩm này'
        : 'Cùng danh mục được ưa chuộng',
    }));
  }

  /**
   * Gợi ý sản phẩm tương tự (Related Products)
   */
  async getRelatedProducts(productId: string, limit = 4): Promise<ProductRecommendationCard[]> {
    if (!Types.ObjectId.isValid(productId)) {
      return [];
    }

    const targetId = new Types.ObjectId(productId);
    const targetProduct = await this.productModel.findById(targetId).exec();
    if (!targetProduct) {
      return [];
    }

    const query: any = {
      _id: { $ne: targetId },
      isDeleted: false,
      status: ProductStatus.ACTIVE,
      stock: { $gt: 0 },
    };

    if (targetProduct.category) {
      query.category = targetProduct.category;
    }

    const items = await this.productModel
      .find(query)
      .sort({ rating: -1, sold: -1 })
      .limit(limit)
      .select('name slug sku price discountPrice stock images rating sold category')
      .populate('category', 'name slug')
      .lean()
      .exec();

    return items.map((item) => ({
      _id: item._id.toString(),
      name: item.name,
      slug: item.slug,
      sku: item.sku,
      price: item.price,
      discountPrice: item.discountPrice,
      stock: item.stock,
      images: item.images || [],
      rating: item.rating || 0,
      sold: item.sold || 0,
      category: item.category,
      recommendationReason: 'Sản phẩm tương tự cùng danh mục',
    }));
  }

  /**
   * Gợi ý cá nhân hóa cho người dùng (Personalized For You)
   */
  async getPersonalized(userId?: string, limit = 8): Promise<ProductRecommendationCard[]> {
    let preferredCategories: Types.ObjectId[] = [];

    if (userId && Types.ObjectId.isValid(userId)) {
      const user = await this.userModel.findById(userId).select('wishlist').lean().exec();
      if (user?.wishlist?.length) {
        const wishlistedProducts = await this.productModel
          .find({ _id: { $in: user.wishlist } } as any)
          .select('category')
          .lean()
          .exec();

        preferredCategories = (wishlistedProducts as any[])
          .map((p) => p.category)
          .filter(Boolean) as Types.ObjectId[];
      }
    }

    const query: any = {
      isDeleted: false,
      status: ProductStatus.ACTIVE,
      stock: { $gt: 0 },
    };

    if (preferredCategories.length > 0) {
      query.category = { $in: preferredCategories };
    }

    let items = await this.productModel
      .find(query)
      .sort({ sold: -1, rating: -1 })
      .limit(limit)
      .select('name slug sku price discountPrice stock images rating sold category')
      .populate('category', 'name slug')
      .lean()
      .exec();

    // Fallback nếu người dùng chưa có sở thích hoặc danh mục không đủ sản phẩm
    if (items.length < limit) {
      const fallbackQuery: any = {
        _id: { $nin: items.map((i) => i._id) },
        isDeleted: false,
        status: ProductStatus.ACTIVE,
        stock: { $gt: 0 },
      };

      const fallbacks = await this.productModel
        .find(fallbackQuery)
        .sort({ isFeatured: -1, sold: -1, rating: -1 })
        .limit(limit - items.length)
        .select('name slug sku price discountPrice stock images rating sold category')
        .populate('category', 'name slug')
        .lean()
        .exec();

      items = [...items, ...fallbacks];
    }

    return items.map((item) => ({
      _id: item._id.toString(),
      name: item.name,
      slug: item.slug,
      sku: item.sku,
      price: item.price,
      discountPrice: item.discountPrice,
      stock: item.stock,
      images: item.images || [],
      rating: item.rating || 0,
      sold: item.sold || 0,
      category: item.category,
      recommendationReason: preferredCategories.length > 0
        ? 'Dành riêng cho bạn dựa trên sở thích'
        : 'Sản phẩm nổi bật thịnh hành',
    }));
  }
}
