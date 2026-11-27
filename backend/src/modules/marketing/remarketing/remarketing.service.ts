import { Injectable, Logger, NotFoundException, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  RemarketingLog,
  RemarketingLogDocument,
  RemarketingType,
  RemarketingChannel,
} from './schemas/remarketing-log.schema';
import { Product, ProductDocument } from '../../products/schemas/product.schema';
import { User, UserDocument } from '../../users/schemas/user.schema';
import { Cart, CartDocument } from '../../cart/schemas/cart.schema';
import { NotificationsService } from '../../notifications/notifications.service';
import { OutboxService } from '../../outbox/outbox.service';
import { OutboxEventType } from '../../outbox/schemas/outbox-event.schema';

export interface RemarketingAnalyticsSummary {
  totalDispatched: number;
  byType: {
    restock: number;
    priceDrop: number;
    abandonedCart: number;
  };
  totalConverted: number;
  conversionRate: number;
}

@Injectable()
export class RemarketingService {
  private readonly logger = new Logger(RemarketingService.name);

  constructor(
    @InjectModel(RemarketingLog.name)
    private readonly logModel: Model<RemarketingLogDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Cart.name)
    private readonly cartModel: Model<CartDocument>,
    @Optional()
    private readonly notificationsService?: NotificationsService,
    @Optional()
    private readonly outboxService?: OutboxService,
  ) {}

  /**
   * Cảnh báo sản phẩm hết hàng nay đã có hàng trở lại (Wishlist Restock Alert)
   */
  async triggerRestockAlert(
    productId: string,
    newStock?: number,
  ): Promise<{ success: boolean; notifiedCount: number }> {
    if (!Types.ObjectId.isValid(productId)) {
      throw new NotFoundException(`ID sản phẩm không hợp lệ: ${productId}`);
    }

    const prodId = new Types.ObjectId(productId);
    const product = await this.productModel.findById(prodId).exec();
    if (!product) {
      throw new NotFoundException(`Không tìm thấy sản phẩm với ID: ${productId}`);
    }

    const currentStock = newStock ?? product.stock;
    if (currentStock <= 0) {
      return { success: true, notifiedCount: 0 };
    }

    // 1. Tìm tất cả khách hàng đã thêm sản phẩm vào Wishlist
    const usersWithWishlist = await this.userModel
      .find({
        wishlist: prodId,
        status: true,
      })
      .select('_id fullName email')
      .lean()
      .exec();

    if (!usersWithWishlist.length) {
      return { success: true, notifiedCount: 0 };
    }

    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    let notifiedCount = 0;

    for (const user of (usersWithWishlist as any[])) {
      // 2. Kiểm tra tần suất (Frequency cap): Không gửi thông báo restock cùng 1 sản phẩm quá 1 lần trong 24h
      const recentLog = await this.logModel.findOne({
        userId: user._id,
        type: RemarketingType.RESTOCK,
        targetId: productId,
        createdAt: { $gte: dayAgo },
      });

      if (recentLog) {
        continue;
      }

      const title = 'Sản phẩm yêu thích đã có hàng trở lại!';
      const message = `Sản phẩm "${product.name}" hiện đã có sẵn trong kho. Nhanh tay đặt hàng ngay kẻo hết!`;

      // 3. Tạo thông báo in-app
      if (this.notificationsService) {
        await this.notificationsService.create({
          userId: user._id.toString(),
          title,
          message,
          type: 'promotion',
          meta: {
            productId: product._id.toString(),
            productSlug: product.slug,
            type: 'restock',
            stock: currentStock,
          },
        }).catch((err) => this.logger.warn(`Failed to dispatch notification to user ${user._id}: ${err.message}`));
      }

      // 4. Ghi nhận log remarketing
      await this.logModel.create({
        userId: user._id,
        type: RemarketingType.RESTOCK,
        channel: RemarketingChannel.IN_APP_NOTIFICATION,
        targetId: productId,
        title,
        message,
        meta: { stock: currentStock },
      });

      notifiedCount++;
    }

    if (this.outboxService && notifiedCount > 0) {
      await this.outboxService.recordEvent(
        OutboxEventType.STOCK_ALERT,
        { productId, notifiedCount, stock: currentStock },
      ).catch((err: any) => this.logger.error('Failed to create outbox event', err));
    }

    this.logger.log(`Dispatched restock alert for product ${product.name} to ${notifiedCount} customers`);
    return { success: true, notifiedCount };
  }

  /**
   * Cảnh báo giảm giá cho sản phẩm trong Wishlist (Price Drop Alert)
   */
  async triggerPriceDropAlert(
    productId: string,
    oldPrice: number,
    newPrice: number,
  ): Promise<{ success: boolean; notifiedCount: number }> {
    if (!Types.ObjectId.isValid(productId)) {
      throw new NotFoundException(`ID sản phẩm không hợp lệ: ${productId}`);
    }

    if (newPrice >= oldPrice) {
      return { success: true, notifiedCount: 0 };
    }

    const prodId = new Types.ObjectId(productId);
    const product = await this.productModel.findById(prodId).exec();
    if (!product) {
      throw new NotFoundException(`Không tìm thấy sản phẩm với ID: ${productId}`);
    }

    const usersWithWishlist = await this.userModel
      .find({
        wishlist: prodId,
        status: true,
      })
      .select('_id fullName email')
      .lean()
      .exec();

    if (!usersWithWishlist.length) {
      return { success: true, notifiedCount: 0 };
    }

    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    let notifiedCount = 0;

    for (const user of (usersWithWishlist as any[])) {
      const recentLog = await this.logModel.findOne({
        userId: user._id,
        type: RemarketingType.PRICE_DROP,
        targetId: productId,
        createdAt: { $gte: twoDaysAgo },
      });

      if (recentLog) {
        continue;
      }

      const formattedNewPrice = new Intl.NumberFormat('vi-VN').format(newPrice);
      const title = 'Giảm giá sản phẩm trong danh sách yêu thích!';
      const message = `Sản phẩm "${product.name}" vừa giảm giá sốc chỉ còn ${formattedNewPrice} đ! Đặt ngay hôm nay!`;

      if (this.notificationsService) {
        await this.notificationsService.create({
          userId: user._id.toString(),
          title,
          message,
          type: 'promotion',
          meta: {
            productId: product._id.toString(),
            productSlug: product.slug,
            type: 'price_drop',
            oldPrice,
            newPrice,
          },
        }).catch((err) => this.logger.warn(`Failed to dispatch price drop alert: ${err.message}`));
      }

      await this.logModel.create({
        userId: user._id,
        type: RemarketingType.PRICE_DROP,
        channel: RemarketingChannel.IN_APP_NOTIFICATION,
        targetId: productId,
        title,
        message,
        meta: { oldPrice, newPrice },
      });

      notifiedCount++;
    }

    return { success: true, notifiedCount };
  }

  /**
   * Remarketing giỏ hàng bỏ quên có kiểm soát tần suất (Compliant Abandoned Cart Remarketing)
   */
  async triggerAbandonedCartRemarketing(
    minInactiveMinutes = 120,
    maxInactiveHours = 48,
  ): Promise<{ success: boolean; cartsScanned: number; notifiedCount: number }> {
    const minDate = new Date(Date.now() - minInactiveMinutes * 60 * 1000);
    const maxDate = new Date(Date.now() - maxInactiveHours * 60 * 60 * 1000);

    // 1. Tìm các giỏ hàng có hàng và không hoạt động trong khoảng [maxDate, minDate]
    const abandonedCarts = await this.cartModel
      .find({
        userId: { $ne: null },
        'items.0': { $exists: true },
        updatedAt: { $gte: maxDate, $lte: minDate },
      } as any)
      .lean()
      .exec();

    let notifiedCount = 0;
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    for (const cart of (abandonedCarts as any[])) {
      const userId = cart.userId?.toString();
      if (!userId) continue;

      // 2. Frequency cap nghiêm ngặt: Tối đa 1 thông điệp remarketing bỏ giỏ hàng mỗi 7 ngày
      const recentNotice = await this.logModel.findOne({
        userId: cart.userId,
        type: RemarketingType.ABANDONED_CART,
        createdAt: { $gte: weekAgo },
      });

      if (recentNotice) {
        continue;
      }

      const itemCount = cart.items?.length || 0;
      const title = 'Bạn còn sản phẩm đang chờ trong giỏ hàng!';
      const message = `Có ${itemCount} sản phẩm trong giỏ hàng đang chờ bạn. Hãy hoàn tất đơn hàng để nhận ưu đãi vận chuyển tốt nhất!`;

      if (this.notificationsService) {
        await this.notificationsService.create({
          userId,
          title,
          message,
          type: 'promotion',
          meta: {
            cartId: cart._id.toString(),
            type: 'abandoned_cart',
            itemCount,
          },
        }).catch((err) => this.logger.warn(`Failed to dispatch abandoned cart notice: ${err.message}`));
      }

      await this.logModel.create({
        userId: cart.userId,
        type: RemarketingType.ABANDONED_CART,
        channel: RemarketingChannel.IN_APP_NOTIFICATION,
        targetId: cart._id.toString(),
        title,
        message,
        meta: { itemCount },
      });

      notifiedCount++;
    }

    return {
      success: true,
      cartsScanned: abandonedCarts.length,
      notifiedCount,
    };
  }

  async getRemarketingAnalytics(): Promise<RemarketingAnalyticsSummary> {
    const [totalDispatched, restockCount, priceDropCount, abandonedCartCount, totalConverted] = await Promise.all([
      this.logModel.countDocuments(),
      this.logModel.countDocuments({ type: RemarketingType.RESTOCK }),
      this.logModel.countDocuments({ type: RemarketingType.PRICE_DROP }),
      this.logModel.countDocuments({ type: RemarketingType.ABANDONED_CART }),
      this.logModel.countDocuments({ converted: true }),
    ]);

    const cr = totalDispatched > 0 ? (totalConverted / totalDispatched) * 100 : 0;

    return {
      totalDispatched,
      byType: {
        restock: restockCount,
        priceDrop: priceDropCount,
        abandonedCart: abandonedCartCount,
      },
      totalConverted,
      conversionRate: Math.round(cr * 100) / 100,
    };
  }
}
