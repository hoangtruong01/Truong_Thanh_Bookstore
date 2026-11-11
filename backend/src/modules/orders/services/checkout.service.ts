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
import { createHash, createHmac, randomBytes } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { Order, OrderDocument } from '../schemas/order.schema';
import {
  LandingPage,
  LandingPageDocument,
} from '../../landing-pages/schemas/landing-page.schema';
import { CreateOrderDto, CheckoutPreviewDto } from '../dto/order.dto';
import { ProductsService } from '../../products/products.service';
import { PromotionsService } from '../../promotions/promotions.service';
import { UsersService } from '../../users/users.service';
import { CartService } from '../../cart/cart.service';
import { OrderStatus, PaymentMethod, OrderSource } from '../../../common/enums';
import { OrderInventoryService } from './order-inventory.service';
import { InventoryService } from '../../inventory/inventory.service';
import { OrderLoyaltyService } from './order-loyalty.service';
import { OrderNotificationService } from './order-notification.service';
import { PricingService } from '../../pricing/pricing.service';
import { Types } from 'mongoose';
import {
  FREE_SHIPPING_THRESHOLD,
  SHIPPING_FEE,
  LOYALTY_MIN_REDEEM_POINTS,
  LOYALTY_POINT_VALUE,
  LOYALTY_MAX_REDEEM_PERCENT,
  computeShippingFee,
  computeMaxRedeemablePoints,
  computeMinSubtotalToRedeem,
} from '../checkout-policy';

export interface CheckoutPreviewUnavailableItem {
  product: string;
  name: string;
  reason: 'UNAVAILABLE' | 'OUT_OF_STOCK';
  stock: number;
  requestedQuantity: number;
}

/** Thông tin Loyalty trong preview (null với khách vãng lai). */
export interface CheckoutPreviewLoyalty {
  availablePoints: number;
  minRedeemPoints: number;
  pointValue: number;
  maxRedeemPercent: number;
  maxRedeemablePoints: number;
  minSubtotalToRedeem: number;
  canRedeem: boolean;
  requestedPoints: number;
  appliedPoints: number;
  error: string | null;
}

/** SEC-032: trường nội bộ của đơn hàng, không bao giờ được trả cho client. */
const ORDER_INTERNAL_FIELDS = [
  'guestAccessTokenHash',
  'idempotencyKeyHash',
  'idempotencyPayloadHash',
  'guestPhoneKey',
  'guestPendingSlot',
] as const;

/** SEC-004: dữ liệu giá vốn/biên lợi nhuận/phê duyệt trên từng dòng hàng. */
const ORDER_ITEM_COST_FIELDS = [
  'costPrice',
  'baseSellingPrice',
  'appliedPolicy',
  'appliedPolicyName',
  'grossMarginPercent',
  'markupPercent',
  'approver',
  'approvalReason',
] as const;

/**
 * Chuyển đơn hàng thành object thuần để trả cho khách (customer/guest):
 * loại bỏ hash nội bộ (SEC-032) và giá vốn/biên lợi nhuận/thông tin phê
 * duyệt trên từng dòng hàng (SEC-004). Không mutate đối tượng đầu vào.
 * Endpoint dành cho staff/admin không dùng hàm này.
 */
export function toCustomerOrderView<T = any>(order: any): T {
  if (!order || typeof order !== 'object') return order as T;
  // Luôn copy nông để không mutate đối tượng gốc (kể cả khi toObject trả
  // về cùng tham chiếu).
  const plain: Record<string, any> = {
    ...(typeof order.toObject === 'function' ? order.toObject() : order),
  };
  for (const field of ORDER_INTERNAL_FIELDS) delete plain[field];
  if (Array.isArray(plain.items)) {
    plain.items = plain.items.map((rawItem: any) => {
      if (!rawItem || typeof rawItem !== 'object') return rawItem;
      const item: Record<string, any> =
        typeof rawItem.toObject === 'function'
          ? rawItem.toObject()
          : { ...rawItem };
      for (const field of ORDER_ITEM_COST_FIELDS) delete item[field];
      return item;
    });
  }
  return plain as T;
}

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
    @Optional()
    @InjectModel(LandingPage.name)
    private readonly landingPageModel?: Model<LandingPageDocument>,
    @Optional() private readonly inventoryService?: InventoryService,
    @Optional() private readonly pricingService?: PricingService,
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

  deriveGuestAccessToken(idempotencyKey: string): string {
    const serverSecret =
      this.configService.get<string>('JWT_SECRET') ||
      'truongthanh-guest-token-hmac-secret';
    return createHmac('sha256', serverSecret)
      .update(`guest_order_access:${idempotencyKey}`)
      .digest('base64url');
  }

  computeOrderPayloadHash(dto: CreateOrderDto): string {
    const sortedItems = [...(dto.items || [])]
      .map((item) => ({
        product: String(item.product),
        quantity: Number(item.quantity),
      }))
      .sort((a, b) => a.product.localeCompare(b.product));

    const fingerprint = JSON.stringify({
      items: sortedItems,
      shippingAddress: (dto.shippingAddress || '').trim().toLowerCase(),
      phone: (dto.phone || '').trim(),
      paymentMethod: dto.paymentMethod || PaymentMethod.COD,
      promotionCode: (dto.promotionCode || '').trim().toUpperCase(),
      loyaltyPointsUsed: Number(dto.loyaltyPointsUsed || 0),
    });

    return createHash('sha256').update(fingerprint).digest('hex');
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

  /**
   * SEC-001: giá landing page chỉ được chấp nhận khi trang đang bật VÀ giá
   * client gửi khớp đúng giá do admin cấu hình cho CHÍNH sản phẩm đó (gói có
   * productId riêng, hoặc giá trang gắn với productId của trang). Trang không
   * gắn sản phẩm không được áp giá cho sản phẩm bất kỳ. Mọi trường hợp khác
   * trả null để caller dùng giá DB.
   */
  private resolveLandingPrice(
    landingPage: any,
    product: any,
    item: { price?: number; name?: string },
  ): { price: number; name: string } | null {
    if (!landingPage || !landingPage.status) return null;
    if (typeof item.price !== 'number' || !Number.isFinite(item.price)) {
      return null;
    }
    const productId = product._id.toString();
    const pageProductId = landingPage.productId?.toString();

    const matchingPkg = landingPage.packages?.find((pkg: any) => {
      const boundProductId = (
        pkg.productId ?? landingPage.productId
      )?.toString();
      return (
        boundProductId === productId &&
        typeof pkg.price === 'number' &&
        pkg.price === item.price
      );
    });
    if (matchingPkg) {
      return {
        price: matchingPkg.price,
        name: item.name || `${product.name} (${matchingPkg.name})`,
      };
    }

    if (
      landingPage.price > 0 &&
      pageProductId === productId &&
      landingPage.price === item.price
    ) {
      return { price: landingPage.price, name: item.name || product.name };
    }
    return null;
  }

  async checkoutPreview(dto: CheckoutPreviewDto, userId?: string) {
    let landingPage: any = null;
    if (dto.landingPageId && this.landingPageModel) {
      landingPage = await this.landingPageModel
        .findById(dto.landingPageId)
        .exec();
    }
    const warnings: string[] = [];
    const verifiedItems: Array<{
      product: string;
      name: string;
      price: number;
      originalPrice: number;
      quantity: number;
      requestedQuantity: number;
      stock: number;
      image: string;
      subtotal: number;
    }> = [];
    // Dòng bị loại khỏi `items` (không khả dụng / hết hàng) để client đánh dấu
    // có cấu trúc thay vì chỉ dựa vào text trong `warnings`.
    const unavailableItems: CheckoutPreviewUnavailableItem[] = [];

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
        unavailableItems.push({
          product: String(item.product),
          name: (product as any)?.name || item.name || String(item.product),
          reason: 'UNAVAILABLE',
          stock: 0,
          requestedQuantity: item.quantity,
        });
        continue;
      }

      const availableStock = (product as any).stock ?? 0;
      let effectiveQty = item.quantity;
      if (availableStock < item.quantity) {
        if (availableStock <= 0) {
          warnings.push(`Sản phẩm "${product.name}" đã hết hàng.`);
          unavailableItems.push({
            product: product._id.toString(),
            name: product.name,
            reason: 'OUT_OF_STOCK',
            stock: 0,
            requestedQuantity: item.quantity,
          });
          continue;
        } else {
          effectiveQty = availableStock;
          warnings.push(
            `Sản phẩm "${product.name}" chỉ còn ${availableStock} trong kho. Đã tự động điều chỉnh số lượng.`,
          );
        }
      }

      let effectivePrice =
        (product as any).discountPrice > 0
          ? (product as any).discountPrice
          : (product as any).price;
      let effectiveName = product.name;

      const landingMatch = this.resolveLandingPrice(landingPage, product, item);
      if (landingMatch) {
        effectivePrice = landingMatch.price;
        effectiveName = landingMatch.name;
      }

      if (item.price && item.price !== effectivePrice) {
        warnings.push(`Giá sản phẩm "${product.name}" đã thay đổi.`);
      }

      verifiedItems.push({
        product: product._id.toString(),
        name: effectiveName,
        price: effectivePrice,
        originalPrice: (product as any).price,
        quantity: effectiveQty,
        requestedQuantity: item.quantity,
        stock: availableStock,
        image: (product as any).images?.[0] || item.image || '',
        subtotal: effectivePrice * effectiveQty,
      });
    }

    const subtotal = verifiedItems.reduce((sum, i) => sum + i.subtotal, 0);
    const isEligibleForFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
    const shippingFee = computeShippingFee(subtotal);
    const amountNeededForFreeShipping = Math.max(
      0,
      FREE_SHIPPING_THRESHOLD - subtotal,
    );
    // 0..100, chỉ đạt 100 khi thực sự được freeship (floor để 298.999đ không hiện 100%).
    const freeShippingProgress =
      subtotal <= 0
        ? 0
        : isEligibleForFreeShipping
          ? 100
          : Math.min(
              99,
              Math.floor((subtotal / FREE_SHIPPING_THRESHOLD) * 100),
            );

    let discount = 0;
    let appliedPromotion: any = null;
    let promotionError: string | null = null;
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
        promotionError =
          err?.message || 'Mã giảm giá không hợp lệ hoặc không đủ điều kiện.';
        warnings.push(promotionError as string);
      }
    }

    // Loyalty: cùng quy tắc với lúc tạo đơn (OrderLoyaltyService). Yêu cầu
    // không hợp lệ thì không giảm (không clamp) để tổng preview khớp với create.
    const requestedPoints =
      dto.loyaltyPointsUsed && dto.loyaltyPointsUsed > 0
        ? dto.loyaltyPointsUsed
        : 0;
    let loyaltyDiscount = 0;
    let loyalty: CheckoutPreviewLoyalty | null = null;
    if (!userId) {
      if (requestedPoints > 0) {
        warnings.push(
          'Chỉ khách hàng có tài khoản mới có thể sử dụng điểm thưởng Loyalty.',
        );
      }
    } else {
      const availablePoints = await this.getLoyaltyBalance(userId);
      const maxRedeemablePoints = computeMaxRedeemablePoints(
        subtotal,
        availablePoints,
      );
      let loyaltyError: string | null = null;
      if (requestedPoints > 0) {
        if (requestedPoints < LOYALTY_MIN_REDEEM_POINTS) {
          loyaltyError = 'Mức tiêu điểm tối thiểu là 1.000 điểm.';
        } else if (requestedPoints > availablePoints) {
          loyaltyError = 'Vượt quá số điểm hiện có.';
        } else if (requestedPoints > maxRedeemablePoints) {
          loyaltyError =
            'Số điểm thưởng sử dụng vượt quá hạn mức tối đa (20% giá trị đơn hàng).';
        } else {
          loyaltyDiscount = requestedPoints * LOYALTY_POINT_VALUE;
        }
        if (loyaltyError) warnings.push(loyaltyError);
      }
      loyalty = {
        availablePoints,
        minRedeemPoints: LOYALTY_MIN_REDEEM_POINTS,
        pointValue: LOYALTY_POINT_VALUE,
        maxRedeemPercent: LOYALTY_MAX_REDEEM_PERCENT,
        maxRedeemablePoints,
        minSubtotalToRedeem: computeMinSubtotalToRedeem(),
        canRedeem: maxRedeemablePoints >= LOYALTY_MIN_REDEEM_POINTS,
        requestedPoints,
        appliedPoints: loyaltyDiscount > 0 ? requestedPoints : 0,
        error: loyaltyError,
      };
    }

    const total = Math.max(
      0,
      subtotal + shippingFee - discount - loyaltyDiscount,
    );

    return {
      items: verifiedItems,
      unavailableItems,
      itemCount: verifiedItems.reduce((sum, i) => sum + i.quantity, 0),
      subtotal,
      shippingFee,
      standardShippingFee: SHIPPING_FEE,
      freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
      isEligibleForFreeShipping,
      amountNeededForFreeShipping,
      remainingForFreeShipping: amountNeededForFreeShipping,
      freeShippingProgress,
      promotionDiscount: discount,
      discount,
      appliedPromotion,
      promotionError,
      loyaltyDiscount,
      loyalty,
      total,
      warnings,
      isValidForCheckout: verifiedItems.length > 0 && warnings.length === 0,
    };
  }

  /** Số dư điểm hiện tại; lỗi đọc user thì coi như 0 (preview không được fail). */
  private async getLoyaltyBalance(userId: string): Promise<number> {
    try {
      const user: any = await this.usersService.findById(userId);
      const points = Number(user?.loyaltyPoints ?? 0);
      return Number.isFinite(points) && points > 0 ? Math.floor(points) : 0;
    } catch (err) {
      this.logger.warn(
        `Không đọc được điểm Loyalty cho preview: ${err instanceof Error ? err.message : String(err)}`,
      );
      return 0;
    }
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
      : dto.idempotencyKey
        ? this.deriveGuestAccessToken(dto.idempotencyKey)
        : randomBytes(32).toString('base64url');
    const idempotencyKeyHash = dto.idempotencyKey
      ? this.hashSecret(dto.idempotencyKey)
      : undefined;

    if (idempotencyKeyHash) {
      const existingOrder = await this.orderModel
        .findOne({
          customer: userId || null,
          idempotencyKeyHash,
        })
        .select(
          '+idempotencyKeyHash +guestAccessTokenHash +idempotencyPayloadHash',
        )
        .exec();
      if (existingOrder) {
        // BE-03: Detect same idempotency key with different payload
        const currentPayloadHash = this.computeOrderPayloadHash(dto);
        const storedPayloadHash = (existingOrder as any).idempotencyPayloadHash;

        if (storedPayloadHash && storedPayloadHash !== currentPayloadHash) {
          throw new ConflictException(
            'Idempotency key đã được sử dụng cho một đơn hàng khác với nội dung khác',
          );
        } else if (!storedPayloadHash) {
          // Backwards-compatibility fallback check
          const itemsMismatch =
            existingOrder.items.length !== dto.items.length ||
            existingOrder.phone !== dto.phone ||
            existingOrder.shippingAddress !== dto.shippingAddress;
          if (itemsMismatch) {
            throw new ConflictException(
              'Idempotency key đã được sử dụng cho một đơn hàng khác',
            );
          }
        }

        // SEC-032: bản replay được select +hash để so khớp, nhưng không được
        // trả các hash đó (cũng như giá vốn) ra response.
        const payload = toCustomerOrderView(existingOrder);

        // BE-03: Return guest credential that matches existing order's stored hash
        let replayGuestToken: string | undefined;
        if (!userId && dto.idempotencyKey) {
          const derived = this.deriveGuestAccessToken(dto.idempotencyKey);
          if (
            (existingOrder as any).guestAccessTokenHash ===
            this.hashSecret(derived)
          ) {
            replayGuestToken = derived;
          }
        }

        return {
          ...payload,
          guestAccessToken: replayGuestToken,
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

    let landingPage: any = null;
    if (
      dto.orderSource === OrderSource.LANDING_PAGE &&
      dto.landingPageId &&
      this.landingPageModel
    ) {
      landingPage = await this.landingPageModel
        .findById(dto.landingPageId)
        .exec();
    }

    // SEC-001: nguồn đơn do client gửi không được tin. LANDING_PAGE chỉ được
    // ghi nhận khi landing page tồn tại và đang bật; POS không thể tạo từ
    // endpoint công khai. Các trường hợp còn lại quy về WEB.
    const landingPageVerified = Boolean(landingPage && landingPage.status);
    const effectiveOrderSource: OrderSource =
      dto.orderSource === OrderSource.LANDING_PAGE
        ? landingPageVerified
          ? OrderSource.LANDING_PAGE
          : OrderSource.WEB
        : dto.orderSource === OrderSource.MOBILE
          ? OrderSource.MOBILE
          : OrderSource.WEB;

    const products = await this.productsService.findByIds(uniqueProductIds);
    const productMap = new Map(products.map((p: any) => [p._id.toString(), p]));
    const costMap =
      this.inventoryService &&
      typeof this.inventoryService.getCostPrices === 'function'
        ? await this.inventoryService.getCostPrices(uniqueProductIds)
        : new Map<string, number>();

    const verifiedItems: Array<{
      product: string;
      name: string;
      price: number;
      quantity: number;
      costPrice: number;
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
      let effectivePrice =
        product.discountPrice > 0 ? product.discountPrice : product.price;
      let effectiveName = product.name;

      const landingMatch = this.resolveLandingPrice(landingPage, product, item);
      if (landingMatch) {
        effectivePrice = landingMatch.price;
        effectiveName = landingMatch.name;
      }

      const itemCostPrice =
        costMap.get(product._id.toString()) || product.costPrice || 0;
      let baseSellingPrice = product.price;
      let appliedPolicyId: Types.ObjectId | undefined = undefined;
      let appliedPolicyName: string | undefined = undefined;
      let grossMarginPercent = 0;
      let markupPercent = 0;

      if (this.pricingService) {
        try {
          const calc = await this.pricingService.calculateItemPrice({
            productId: product._id.toString(),
            quantity: item.quantity,
            channel: 'WEB',
            requestedUnitPrice: effectivePrice,
          });
          if (
            calc.appliedPolicyId &&
            Types.ObjectId.isValid(calc.appliedPolicyId)
          ) {
            appliedPolicyId = new Types.ObjectId(calc.appliedPolicyId);
          }
          appliedPolicyName = calc.appliedPolicyName;
          grossMarginPercent = calc.grossMarginPercent;
          markupPercent = calc.markupPercent;
          baseSellingPrice = calc.baseSellingPrice;
        } catch {
          if (itemCostPrice > 0 && effectivePrice > 0) {
            grossMarginPercent =
              Math.round(
                ((effectivePrice - itemCostPrice) / effectivePrice) * 10000,
              ) / 100;
            markupPercent =
              Math.round(
                ((effectivePrice - itemCostPrice) / itemCostPrice) * 10000,
              ) / 100;
          }
        }
      } else if (itemCostPrice > 0 && effectivePrice > 0) {
        grossMarginPercent =
          Math.round(
            ((effectivePrice - itemCostPrice) / effectivePrice) * 10000,
          ) / 100;
        markupPercent =
          Math.round(
            ((effectivePrice - itemCostPrice) / itemCostPrice) * 10000,
          ) / 100;
      }

      verifiedItems.push({
        product: product._id.toString(),
        name: effectiveName,
        price: effectivePrice,
        quantity: item.quantity,
        costPrice: itemCostPrice,
        image: product.images?.[0] || item.image || '',
        baseSellingPrice,
        appliedPolicy: appliedPolicyId,
        appliedPolicyName,
        grossMarginPercent,
        markupPercent,
      } as any);
    }

    const subtotal = verifiedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const shippingFee = computeShippingFee(subtotal);
    const orderCode = this.generateOrderCode();

    const persist = async (session?: ClientSession): Promise<OrderDocument> => {
      let deductedItems: Array<{ product: string; quantity: number }> = [];
      let promotionConsumed = false;
      let loyaltyPointsSpent = 0;
      let loyaltyDiscount = 0;

      try {
        let discount = 0;
        if (dto.promotionCode) {
          if (this.pricingService) {
            this.pricingService.validatePromotionStacking({
              isWholesale: false,
              promotionCode: dto.promotionCode,
            });
          }
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
          idempotencyPayloadHash: idempotencyKeyHash
            ? this.computeOrderPayloadHash(dto)
            : undefined,
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
          orderSource: effectiveOrderSource,
          landingPageId:
            effectiveOrderSource === OrderSource.LANDING_PAGE
              ? dto.landingPageId
              : undefined,
          timeline: [
            {
              status: OrderStatus.PENDING,
              note:
                effectiveOrderSource === OrderSource.LANDING_PAGE
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
          await this.orderInventoryService.rollbackStock(
            deductedItems,
            orderCode,
          );
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

    // SEC-004/SEC-032: không trả hash nội bộ và dữ liệu giá vốn cho khách.
    const result = toCustomerOrderView(savedOrder);
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
