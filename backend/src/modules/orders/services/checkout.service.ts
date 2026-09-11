import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  Logger,
  Optional,
  ServiceUnavailableException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model } from 'mongoose';
import { createHash, randomBytes } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { Order, OrderDocument } from '../schemas/order.schema';
import { CreateOrderDto, CheckoutPreviewDto } from '../dto/order.dto';
import { ProductsService } from '../../products/products.service';
import { PromotionsService } from '../../promotions/promotions.service';
import { UsersService } from '../../users/users.service';
import { CartService } from '../../cart/cart.service';
import { OrderStatus, PaymentMethod } from '../../../common/enums';
import { OrderInventoryService } from './order-inventory.service';
import { OrderLoyaltyService } from './order-loyalty.service';
import { OrderNotificationService } from './order-notification.service';

const FREE_SHIPPING_THRESHOLD = 299000;
const SHIPPING_FEE = 30000;

@Injectable()
export class CheckoutService {
  private readonly logger = new Logger(CheckoutService.name);

  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    private readonly productsService: ProductsService,
    private readonly configService: ConfigService,
    private readonly promotionsService: PromotionsService,
    private readonly usersService: UsersService,
    private readonly orderInventoryService: OrderInventoryService,
    private readonly orderLoyaltyService: OrderLoyaltyService,
    private readonly orderNotificationService: OrderNotificationService,
    @Optional() private readonly cartService?: CartService,
  ) {}

  generateOrderCode(): string {
    const now = new Date();
    const y = now.getFullYear().toString().slice(-2);
    const m = (now.getMonth() + 1).toString().padStart(2, '0');
    const d = now.getDate().toString().padStart(2, '0');
    const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `TT${y}${m}${d}${rand}`;
  }

  hashSecret(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  getEnabledPaymentMethods(): PaymentMethod[] {
    const configured = this.configService
      .get<string>('ENABLED_PAYMENT_METHODS')
      ?.split(',')
      .map((value) => value.trim().toUpperCase())
      .filter((value): value is PaymentMethod =>
        Object.values(PaymentMethod).includes(value as PaymentMethod),
      );
    return configured?.length ? configured : [PaymentMethod.COD];
  }

  private isTransactionUnsupported(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error);
    return /Transaction numbers are only allowed|replica set|mongos|retryable writes|retryWrites|standalone/i.test(
      message,
    );
  }

  async checkoutPreview(dto: CheckoutPreviewDto, userId?: string) {
    const warnings: string[] = [];
    const verifiedItems: Array<{
      product: string;
      name: string;
      price: number;
      originalPrice: number;
      quantity: number;
      stock: number;
      image: string;
      subtotal: number;
    }> = [];

    for (const item of dto.items) {
      const product = await this.productsService.findById(item.product);
      if (
        !product ||
        (product as any).isDeleted === true ||
        ((product as any).status && (product as any).status !== 'ACTIVE')
      ) {
        warnings.push(
          `Sản phẩm "${item.name || item.product}" hiện không khả dụng.`,
        );
        continue;
      }

      const availableStock = (product as any).stock ?? 0;
      let effectiveQty = item.quantity;
      if (availableStock < item.quantity) {
        if (availableStock <= 0) {
          warnings.push(`Sản phẩm "${product.name}" đã hết hàng.`);
          continue;
        } else {
          effectiveQty = availableStock;
          warnings.push(
            `Sản phẩm "${product.name}" chỉ còn ${availableStock} trong kho. Đã tự động điều chỉnh số lượng.`,
          );
        }
      }

      const effectivePrice =
        (product as any).discountPrice > 0
          ? (product as any).discountPrice
          : (product as any).price;

      if (item.price && item.price !== effectivePrice) {
        warnings.push(`Giá sản phẩm "${product.name}" đã thay đổi.`);
      }

      verifiedItems.push({
        product: product._id.toString(),
        name: product.name,
        price: effectivePrice,
        originalPrice: (product as any).price,
        quantity: effectiveQty,
        stock: availableStock,
        image: (product as any).images?.[0] || item.image || '',
        subtotal: effectivePrice * effectiveQty,
      });
    }

    const subtotal = verifiedItems.reduce((sum, i) => sum + i.subtotal, 0);
    const isEligibleForFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
    const shippingFee =
      subtotal === 0 ? 0 : isEligibleForFreeShipping ? 0 : SHIPPING_FEE;
    const amountNeededForFreeShipping = Math.max(
      0,
      FREE_SHIPPING_THRESHOLD - subtotal,
    );

    let discount = 0;
    let appliedPromotion: any = null;
    if (dto.promotionCode && subtotal > 0) {
      try {
        const promoResult = await this.promotionsService.apply(
          { code: dto.promotionCode, orderTotal: subtotal },
          userId,
          false,
          dto.customerEmail,
          dto.phone,
        );
        discount = promoResult.discount || 0;
        appliedPromotion = {
          code: dto.promotionCode.toUpperCase(),
          discount,
        };
      } catch (err: any) {
        warnings.push(
          err.message || 'Mã giảm giá không hợp lệ hoặc không đủ điều kiện.',
        );
      }
    }

    const total = Math.max(0, subtotal + shippingFee - discount);

    return {
      items: verifiedItems,
      itemCount: verifiedItems.reduce((sum, i) => sum + i.quantity, 0),
      subtotal,
      shippingFee,
      freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
      isEligibleForFreeShipping,
      amountNeededForFreeShipping,
      discount,
      appliedPromotion,
      total,
      warnings,
      isValidForCheckout: verifiedItems.length > 0 && warnings.length === 0,
    };
  }

  async create(
    dto: CreateOrderDto,
    userId?: string,
    clientIp?: string,
  ): Promise<any> {
    return this.createAtomic(dto, userId, clientIp);
  }

  async createAtomic(
    dto: CreateOrderDto,
    userId?: string,
    clientIp?: string,
  ): Promise<any> {
    const paymentMethod = dto.paymentMethod || PaymentMethod.COD;
    if (!this.getEnabledPaymentMethods().includes(paymentMethod)) {
      throw new BadRequestException(
        'Phương thức thanh toán này chưa được kích hoạt. Vui lòng chọn thanh toán khi nhận hàng.',
      );
    }
    if (!userId && paymentMethod !== PaymentMethod.COD) {
      throw new BadRequestException(
        'Khách vãng lai chỉ có thể thanh toán khi nhận hàng. Vui lòng đăng nhập để dùng thanh toán trực tuyến.',
      );
    }

    const guestAccessToken = userId
      ? undefined
      : dto.idempotencyKey || randomBytes(32).toString('base64url');
    const idempotencyKeyHash = dto.idempotencyKey
      ? this.hashSecret(dto.idempotencyKey)
      : undefined;

    if (idempotencyKeyHash) {
      const existingOrder = await this.orderModel
        .findOne({
          customer: userId || null,
          idempotencyKeyHash,
        })
        .exec();
      if (existingOrder) {
        const payload = existingOrder.toObject
          ? existingOrder.toObject()
          : existingOrder;
        return {
          ...payload,
          guestAccessToken,
          replayed: true,
        };
      }
    }

    const guestProtection = userId
      ? undefined
      : await this.checkGuestCheckoutProtection(dto, clientIp);

    const productIds = dto.items.map((i) => i.product);
    const uniqueProductIds = [...new Set(productIds)];
    if (uniqueProductIds.length !== productIds.length) {
      throw new BadRequestException(
        'Đơn hàng chứa các sản phẩm trùng lặp. Vui lòng gộp số lượng.',
      );
    }

    const products = await this.productsService.findByIds(uniqueProductIds);
    const productMap = new Map(products.map((p: any) => [p._id.toString(), p]));

    const verifiedItems: Array<{
      product: string;
      name: string;
      price: number;
      quantity: number;
      image: string;
    }> = [];

    for (const item of dto.items) {
      const product: any = productMap.get(item.product);
      if (!product || product.isDeleted === true) {
        throw new NotFoundException(
          `Sản phẩm "${item.name || item.product}" không còn tồn tại`,
        );
      }
      if (product.status && product.status !== 'ACTIVE') {
        throw new BadRequestException(
          `Sản phẩm "${product.name}" hiện đang ngừng kinh doanh`,
        );
      }
      if (item.quantity <= 0) {
        throw new BadRequestException(
          `Số lượng đặt mua của sản phẩm "${product.name}" phải lớn hơn 0`,
        );
      }
      if (product.stock < item.quantity) {
        throw new ConflictException(
          `Sản phẩm "${product.name}" không đủ số lượng tồn kho (còn ${product.stock}, yêu cầu ${item.quantity})`,
        );
      }
      const effectivePrice =
        product.discountPrice > 0 ? product.discountPrice : product.price;

      verifiedItems.push({
        product: product._id.toString(),
        name: product.name,
        price: effectivePrice,
        quantity: item.quantity,
        image: product.images?.[0] || item.image || '',
      });
    }

    const subtotal = verifiedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
    const orderCode = this.generateOrderCode();

    const persist = async (session?: ClientSession): Promise<OrderDocument> => {
      let deductedItems: Array<{ product: string; quantity: number }> = [];
      let promotionConsumed = false;
      let loyaltyPointsSpent = 0;
      let loyaltyDiscount = 0;

      try {
        let discount = 0;
        if (dto.promotionCode) {
          const promoResult = await this.promotionsService.apply(
            { code: dto.promotionCode, orderTotal: subtotal },
            userId,
            true,
            dto.customerEmail,
            dto.phone,
            session,
          );
          discount = promoResult.discount;
          promotionConsumed = true;
        }

        // PRODUCT-01: Loyalty Point Spending
        if (dto.loyaltyPointsUsed && dto.loyaltyPointsUsed > 0) {
          const loyaltyRes =
            await this.orderLoyaltyService.validateAndSpendPoints(
              userId,
              dto.loyaltyPointsUsed,
              subtotal,
              session,
            );
          loyaltyPointsSpent = loyaltyRes.pointsSpent;
          loyaltyDiscount = loyaltyRes.discountAmount;
        }

        deductedItems = await this.orderInventoryService.deductOrderStock(
          verifiedItems,
          session,
          orderCode,
        );

        const order = new this.orderModel({
          orderCode,
          customer: userId || null,
          guestAccessTokenHash: guestAccessToken
            ? this.hashSecret(guestAccessToken)
            : undefined,
          idempotencyKeyHash,
          guestPhoneKey: guestProtection?.phoneKey,
          guestPendingSlot: guestProtection?.slot,
          items: verifiedItems,
          shippingAddress: dto.shippingAddress,
          phone: dto.phone,
          note: dto.note,
          paymentMethod,
          customerName: dto.customerName,
          customerEmail: dto.customerEmail?.trim().toLowerCase(),
          subtotal,
          shippingFee,
          discount,
          loyaltyPointsUsed: loyaltyPointsSpent,
          loyaltyDiscount,
          total: Math.max(
            0,
            subtotal + shippingFee - discount - loyaltyDiscount,
          ),
          promotionCode: dto.promotionCode?.toUpperCase(),
          orderSource: dto.orderSource || 'WEB',
          landingPageId: dto.landingPageId || undefined,
          timeline: [
            {
              status: OrderStatus.PENDING,
              note:
                dto.orderSource === 'LANDING_PAGE'
                  ? 'Đơn hàng được tạo từ Landing Page, chờ xác nhận.'
                  : 'Đơn hàng được tạo thành công, chờ xác nhận.',
              createdAt: new Date(),
            },
          ],
        });

        try {
          return await order.save(session ? { session } : undefined);
        } catch (error) {
          if (!userId && this.isGuestPendingSlotConflict(error)) {
            throw new ConflictException(
              'Một đơn hàng khác vừa được tạo cho số điện thoại này. Vui lòng thử lại với cùng yêu cầu đặt hàng.',
            );
          }
          throw error;
        }
      } catch (error) {
        if (!session) {
          if (loyaltyPointsSpent > 0 && userId) {
            await this.orderLoyaltyService.refundLoyaltyPoints(
              userId,
              loyaltyPointsSpent,
            );
          }
          await this.orderInventoryService.rollbackStock(deductedItems);
          if (promotionConsumed && dto.promotionCode) {
            await this.promotionsService
              .releaseUsage(
                dto.promotionCode,
                userId,
                dto.customerEmail,
                dto.phone,
              )
              .catch((rollbackError) =>
                this.logger.error(
                  'Promotion release rollback failed',
                  rollbackError,
                ),
              );
          }
        }
        throw error;
      }
    };

    let savedOrder: OrderDocument;
    const connection = (this.orderModel as any).db;
    if (connection?.startSession) {
      const session: ClientSession = await connection.startSession();
      try {
        let transactionResult: OrderDocument | undefined;
        await session.withTransaction(async () => {
          transactionResult = await persist(session);
        });
        if (!transactionResult) {
          throw new Error('Order transaction completed without a result');
        }
        savedOrder = transactionResult;
      } catch (error) {
        if (!this.isTransactionUnsupported(error)) throw error;
        this.logger.warn(
          'MongoDB transactions are unavailable; using compensated checkout mode.',
        );
        savedOrder = await persist();
      } finally {
        await session.endSession();
      }
    } else {
      savedOrder = await persist();
    }

    if (userId) {
      if (this.cartService) {
        await this.cartService
          .clearCart(userId)
          .catch((err) =>
            this.logger.error('Failed to clear cart after order creation', err),
          );
      }
    }

    let emailRecipient: string | undefined = savedOrder.customerEmail;
    if (!emailRecipient && userId) {
      const user = await this.usersService.findById(userId).catch(() => null);
      emailRecipient = user?.email;
    }

    await this.orderNotificationService.notifyOrderCreated(
      savedOrder,
      emailRecipient,
    );
    this.orderNotificationService
      .syncToGoogleSheet(savedOrder)
      .catch((err) => this.logger.error('Sheet sync failed', err));

    const result = savedOrder.toObject ? savedOrder.toObject() : savedOrder;
    return {
      ...result,
      guestAccessToken,
    };
  }

  private async checkGuestCheckoutProtection(
    dto: CreateOrderDto,
    clientIp?: string,
  ): Promise<{ phoneKey: string; slot: number }> {
    const phoneKey = this.normalizeGuestPhone(dto.phone);
    const configuredLimit = Number(
      this.configService.get<string>('GUEST_PENDING_ORDER_LIMIT') || 3,
    );
    const limit = Number.isInteger(configuredLimit)
      ? Math.min(10, Math.max(1, configuredLimit))
      : 3;
    const configuredThreshold = Number(
      this.configService.get<string>('GUEST_CAPTCHA_THRESHOLD') || 2,
    );
    const captchaThreshold = Number.isInteger(configuredThreshold)
      ? Math.min(limit, Math.max(0, configuredThreshold))
      : 2;

    const countQuery = this.orderModel.countDocuments({
      customer: null,
      orderStatus: OrderStatus.PENDING,
      $or: [{ guestPhoneKey: phoneKey }, { phone: dto.phone }],
    });
    const pendingCount = countQuery?.exec ? await countQuery.exec() : 0;

    if (pendingCount >= limit) {
      throw new HttpException(
        'Số điện thoại này đang có quá nhiều đơn chờ xác nhận. Vui lòng hoàn tất hoặc hủy đơn hiện tại trước khi đặt thêm.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    if (pendingCount >= captchaThreshold) {
      await this.verifyTurnstile(dto.captchaToken, clientIp);
    }

    const occupiedSlots = await this.orderModel
      .distinct('guestPendingSlot', {
        customer: null,
        orderStatus: OrderStatus.PENDING,
        guestPhoneKey: phoneKey,
      })
      .exec();
    const occupied = new Set(occupiedSlots);
    for (let slot = 0; slot < limit; slot++) {
      if (!occupied.has(slot)) return { phoneKey, slot };
    }
    throw new ConflictException(
      'Các đơn chờ xác nhận vừa thay đổi. Vui lòng thử lại.',
    );
  }

  private normalizeGuestPhone(phone: string): string {
    const digits = (phone || '').replace(/\D/g, '');
    return digits.startsWith('84') && digits.length === 11
      ? `0${digits.slice(2)}`
      : digits;
  }

  private async verifyTurnstile(
    token?: string,
    clientIp?: string,
  ): Promise<void> {
    const secret = this.configService.get<string>('TURNSTILE_SECRET_KEY');
    if (!secret) {
      throw new ServiceUnavailableException(
        'Xác minh chống spam chưa được cấu hình. Vui lòng liên hệ cửa hàng.',
      );
    }
    if (!token) {
      throw new BadRequestException(
        'Vui lòng hoàn tất xác minh chống spam trước khi tiếp tục.',
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      const body = new URLSearchParams({ secret, response: token });
      if (clientIp) body.set('remoteip', clientIp);
      const response = await fetch(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        { method: 'POST', body, signal: controller.signal },
      );
      if (!response.ok) {
        throw new ServiceUnavailableException(
          'Không thể xác minh chống spam. Vui lòng thử lại.',
        );
      }
      const result = (await response.json()) as {
        success?: boolean;
        hostname?: string;
      };
      const allowedHosts = (
        this.configService.get<string>('TURNSTILE_ALLOWED_HOSTNAMES') || ''
      )
        .split(',')
        .map((host) => host.trim().toLowerCase())
        .filter(Boolean);
      if (
        !result.success ||
        (allowedHosts.length > 0 &&
          (!result.hostname ||
            !allowedHosts.includes(result.hostname.toLowerCase())))
      ) {
        throw new BadRequestException(
          'Xác minh chống spam không hợp lệ hoặc đã hết hạn.',
        );
      }
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ServiceUnavailableException
      ) {
        throw error;
      }
      throw new ServiceUnavailableException(
        'Không thể xác minh chống spam. Vui lòng thử lại.',
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  private isGuestPendingSlotConflict(error: unknown): boolean {
    const candidate = error as { code?: number; keyPattern?: object };
    return (
      candidate?.code === 11000 &&
      Boolean(candidate.keyPattern) &&
      Object.prototype.hasOwnProperty.call(
        candidate.keyPattern,
        'guestPendingSlot',
      )
    );
  }
}
