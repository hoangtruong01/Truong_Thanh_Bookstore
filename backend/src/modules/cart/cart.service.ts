import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cart, CartDocument } from './schemas/cart.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import {
  Promotion,
  PromotionDocument,
} from '../promotions/schemas/promotion.schema';
import {
  AddToCartDto,
  UpdateCartItemDto,
  SyncCartDto,
  ApplyVoucherDto,
} from './dto/cart.dto';
import { ProductStatus, DiscountType } from '../../common/enums';

export const FREE_SHIPPING_THRESHOLD = 299000;
export const DEFAULT_SHIPPING_FEE = 30000;

export interface CartValidationResult {
  cart: CartDocument;
  warnings: string[];
  freeShippingThreshold: number;
  amountNeededForFreeShipping: number;
  isEligibleForFreeShipping: boolean;
  isValidForCheckout: boolean;
}

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name) private cartModel: Model<CartDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Promotion.name)
    private promotionModel: Model<PromotionDocument>,
  ) {}

  private toObjectId(id: string | Types.ObjectId): Types.ObjectId {
    if (id instanceof Types.ObjectId) return id;
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`ID không hợp lệ: ${id}`);
    }
    return new Types.ObjectId(id);
  }

  /**
   * Tính toán lại subtotal, shippingFee, discountAmount, totalPrice cho Cart
   */
  public calculateCartTotals(cart: CartDocument): void {
    const items = cart.items || [];
    const subtotal = items.reduce((sum: number, item: any) => {
      const price = item.discountPrice > 0 ? item.discountPrice : item.price;
      return sum + price * (item.quantity || 0);
    }, 0);

    cart.subtotal = subtotal;
    cart.shippingFee =
      subtotal === 0
        ? 0
        : subtotal >= FREE_SHIPPING_THRESHOLD
          ? 0
          : DEFAULT_SHIPPING_FEE;

    let discountAmount = 0;
    if (cart.appliedVoucher && cart.appliedVoucher.code) {
      const voucher = cart.appliedVoucher;
      if (subtotal < (voucher.minOrderValue || 0)) {
        voucher.discountAmount = 0;
      } else {
        if (String(voucher.discountType) === String(DiscountType.PERCENT)) {
          discountAmount = Math.round((subtotal * voucher.discountValue) / 100);
          if (voucher.maxDiscount && voucher.maxDiscount > 0) {
            discountAmount = Math.min(discountAmount, voucher.maxDiscount);
          }
        } else {
          discountAmount = voucher.discountValue;
        }
        discountAmount = Math.min(discountAmount, subtotal);
        voucher.discountAmount = discountAmount;
      }
    }
    cart.discountAmount = discountAmount;
    cart.totalPrice = Math.max(0, subtotal + cart.shippingFee - discountAmount);
  }

  /**
   * Lấy giỏ hàng chi tiết và tự động làm sạch / kiểm kho thời gian thực
   */
  async getCart(userId: string): Promise<CartDocument> {
    const userOid = this.toObjectId(userId);
    let cart = await this.cartModel
      .findOne({ user: userOid })
      .populate('items.product')
      .exec();

    if (!cart) {
      cart = new this.cartModel({
        user: userOid,
        items: [],
        subtotal: 0,
        shippingFee: 0,
        discountAmount: 0,
        totalPrice: 0,
      });
      return cart.save();
    }

    // Real-time product inventory & status validation
    let hasChanges = false;
    const sanitizedItems = [];

    for (const item of cart.items) {
      const prodId =
        typeof item.product === 'object' && item.product
          ? (item.product as any)._id
          : item.product;
      const product = await this.productModel.findById(prodId).exec();

      if (
        !product ||
        product.isDeleted ||
        product.status === ProductStatus.INACTIVE
      ) {
        hasChanges = true;
        continue; // Bỏ item đã bị xóa hoặc ngừng kinh doanh
      }

      if (product.stock <= 0) {
        hasChanges = true;
        continue; // Bỏ item đã hoàn toàn hết hàng
      }

      let quantity = item.quantity;
      if (quantity > product.stock) {
        quantity = product.stock;
        hasChanges = true;
      }

      const price = product.price;
      const discountPrice = product.discountPrice || 0;
      if (
        item.price !== price ||
        item.discountPrice !== discountPrice ||
        item.name !== product.name
      ) {
        hasChanges = true;
      }

      sanitizedItems.push({
        product: product._id as any,
        name: product.name,
        price,
        discountPrice,
        image:
          product.images && product.images.length > 0
            ? product.images[0]
            : item.image,
        quantity,
      });
    }

    cart.items = sanitizedItems;
    this.calculateCartTotals(cart);

    if (hasChanges || cart.isModified()) {
      await cart.save();
    }

    // Populate lại để trả về data đầy đủ
    return (await this.cartModel
      .findById(cart._id)
      .populate('items.product')
      .exec()) as CartDocument;
  }

  /**
   * Xác thực trạng thái giỏ hàng trước khi tiến hành Checkout
   */
  async validateCart(userId: string): Promise<CartValidationResult> {
    const cart = await this.getCart(userId);
    const warnings: string[] = [];

    for (const item of cart.items) {
      const prod = item.product as any;
      if (!prod || prod.isDeleted || prod.status === ProductStatus.INACTIVE) {
        warnings.push(`Sản phẩm "${item.name}" hiện không còn kinh doanh.`);
      } else if (prod.stock < item.quantity) {
        warnings.push(
          `Sản phẩm "${item.name}" chỉ còn ${prod.stock} trong kho.`,
        );
      }
    }

    const subtotal = cart.subtotal || 0;
    const amountNeededForFreeShipping = Math.max(
      0,
      FREE_SHIPPING_THRESHOLD - subtotal,
    );
    const isEligibleForFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
    const isValidForCheckout = cart.items.length > 0 && warnings.length === 0;

    return {
      cart,
      warnings,
      freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
      amountNeededForFreeShipping,
      isEligibleForFreeShipping,
      isValidForCheckout,
    };
  }

  /**
   * Thêm sản phẩm vào giỏ hàng
   */
  async addToCart(userId: string, dto: AddToCartDto): Promise<CartDocument> {
    const userOid = this.toObjectId(userId);
    const productOid = this.toObjectId(dto.productId);
    const product = await this.productModel.findById(productOid).exec();
    if (
      !product ||
      product.isDeleted ||
      product.status === ProductStatus.INACTIVE
    ) {
      throw new NotFoundException(
        'Sản phẩm không tồn tại hoặc đã ngừng kinh doanh',
      );
    }

    if (product.stock <= 0) {
      throw new BadRequestException('Sản phẩm hiện đã hết hàng trong kho');
    }

    if (product.stock < dto.quantity) {
      throw new BadRequestException(
        `Sản phẩm chỉ còn ${product.stock} sản phẩm trong kho`,
      );
    }

    let cart = await this.cartModel.findOne({ user: userOid }).exec();
    if (!cart) {
      cart = new this.cartModel({
        user: userOid,
        items: [],
        subtotal: 0,
        shippingFee: 0,
        discountAmount: 0,
        totalPrice: 0,
      });
    }

    const existingIndex = cart.items.findIndex(
      (item) => item.product.toString() === dto.productId,
    );

    const price = product.price;
    const discountPrice = product.discountPrice || 0;
    const image =
      product.images && product.images.length > 0 ? product.images[0] : '';

    if (existingIndex > -1) {
      const newQuantity = cart.items[existingIndex].quantity + dto.quantity;
      if (product.stock < newQuantity) {
        throw new BadRequestException(
          `Không thể thêm. Tổng số lượng trong giỏ (${newQuantity}) vượt quá tồn kho (${product.stock})`,
        );
      }
      cart.items[existingIndex].quantity = newQuantity;
      cart.items[existingIndex].price = price;
      cart.items[existingIndex].discountPrice = discountPrice;
      cart.items[existingIndex].image = image;
      cart.items[existingIndex].name = product.name;
    } else {
      cart.items.push({
        product: productOid,
        name: product.name,
        price,
        discountPrice,
        image,
        quantity: dto.quantity,
      });
    }

    this.calculateCartTotals(cart);
    await cart.save();
    return (await this.cartModel
      .findById(cart._id)
      .populate('items.product')
      .exec()) as CartDocument;
  }

  /**
   * Cập nhật số lượng của một sản phẩm trong giỏ
   */
  async updateItemQuantity(
    userId: string,
    productId: string,
    dto: UpdateCartItemDto,
  ): Promise<CartDocument> {
    const userOid = this.toObjectId(userId);
    const productOid = this.toObjectId(productId);
    const product = await this.productModel.findById(productOid).exec();
    if (
      !product ||
      product.isDeleted ||
      product.status === ProductStatus.INACTIVE
    ) {
      throw new NotFoundException(
        'Sản phẩm không tồn tại hoặc đã ngừng kinh doanh',
      );
    }

    if (product.stock < dto.quantity) {
      throw new BadRequestException(
        `Tồn kho chỉ còn ${product.stock} sản phẩm`,
      );
    }

    const cart = await this.cartModel.findOne({ user: userOid }).exec();
    if (!cart) {
      throw new NotFoundException('Không tìm thấy giỏ hàng');
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId,
    );
    if (itemIndex === -1) {
      throw new NotFoundException('Sản phẩm không có trong giỏ hàng');
    }

    cart.items[itemIndex].quantity = dto.quantity;
    cart.items[itemIndex].price = product.price;
    cart.items[itemIndex].discountPrice = product.discountPrice || 0;
    cart.items[itemIndex].name = product.name;

    this.calculateCartTotals(cart);
    await cart.save();
    return (await this.cartModel
      .findById(cart._id)
      .populate('items.product')
      .exec()) as CartDocument;
  }

  /**
   * Xóa một sản phẩm khỏi giỏ hàng
   */
  async removeItem(userId: string, productId: string): Promise<CartDocument> {
    const userOid = this.toObjectId(userId);
    const cart = await this.cartModel.findOne({ user: userOid }).exec();
    if (!cart) {
      throw new NotFoundException('Không tìm thấy giỏ hàng');
    }

    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId,
    );
    this.calculateCartTotals(cart);
    await cart.save();
    return (await this.cartModel
      .findById(cart._id)
      .populate('items.product')
      .exec()) as CartDocument;
  }

  /**
   * Làm trống toàn bộ giỏ hàng
   */
  async clearCart(userId: string): Promise<CartDocument> {
    const userOid = this.toObjectId(userId);
    let cart = await this.cartModel.findOne({ user: userOid }).exec();
    if (!cart) {
      cart = new this.cartModel({
        user: userOid,
        items: [],
        subtotal: 0,
        shippingFee: 0,
        discountAmount: 0,
        totalPrice: 0,
      });
      return cart.save();
    }

    cart.items = [];
    cart.appliedVoucher = undefined;
    this.calculateCartTotals(cart);
    return cart.save();
  }

  /**
   * Đồng bộ giỏ hàng offline của khách vào tài khoản khi đăng nhập
   */
  async syncCart(userId: string, dto: SyncCartDto): Promise<CartDocument> {
    const userOid = this.toObjectId(userId);
    let cart = await this.cartModel.findOne({ user: userOid }).exec();
    if (!cart) {
      cart = new this.cartModel({
        user: userOid,
        items: [],
        subtotal: 0,
        shippingFee: 0,
        discountAmount: 0,
        totalPrice: 0,
      });
    }

    for (const item of dto.items) {
      if (!Types.ObjectId.isValid(item.productId)) continue;
      const product = await this.productModel.findById(item.productId).exec();
      if (
        !product ||
        product.isDeleted ||
        product.status === ProductStatus.INACTIVE ||
        product.stock <= 0
      ) {
        continue;
      }

      const cappedQuantity = Math.min(item.quantity, product.stock);
      const existingIdx = cart.items.findIndex(
        (ci) => ci.product.toString() === item.productId,
      );

      const price = product.price;
      const discountPrice = product.discountPrice || 0;
      const image =
        product.images && product.images.length > 0 ? product.images[0] : '';

      if (existingIdx > -1) {
        cart.items[existingIdx].quantity = Math.min(
          product.stock,
          cart.items[existingIdx].quantity + cappedQuantity,
        );
        cart.items[existingIdx].price = price;
        cart.items[existingIdx].discountPrice = discountPrice;
        cart.items[existingIdx].image = image;
      } else {
        cart.items.push({
          product: new Types.ObjectId(item.productId),
          name: product.name,
          price,
          discountPrice,
          image,
          quantity: cappedQuantity,
        });
      }
    }

    this.calculateCartTotals(cart);
    await cart.save();
    return (await this.cartModel
      .findById(cart._id)
      .populate('items.product')
      .exec()) as CartDocument;
  }

  /**
   * Áp dụng mã giảm giá voucher vào giỏ hàng
   */
  async applyVoucher(
    userId: string,
    dto: ApplyVoucherDto,
  ): Promise<CartDocument> {
    const userOid = this.toObjectId(userId);
    const cart = await this.cartModel.findOne({ user: userOid }).exec();
    if (!cart || cart.items.length === 0) {
      throw new BadRequestException(
        'Giỏ hàng trống, không thể áp dụng mã giảm giá',
      );
    }

    const code = dto.code.trim().toUpperCase();
    const promotion = await this.promotionModel
      .findOne({ code, status: true })
      .exec();
    if (!promotion) {
      throw new NotFoundException(
        'Mã giảm giá không tồn tại hoặc đã hết hiệu lực',
      );
    }

    const now = new Date();
    if (promotion.startDate && now < new Date(promotion.startDate)) {
      throw new BadRequestException('Chương trình khuyến mãi chưa bắt đầu');
    }
    if (promotion.endDate && now > new Date(promotion.endDate)) {
      throw new BadRequestException('Mã giảm giá đã hết hạn sử dụng');
    }
    if (promotion.usageLimit && promotion.usedCount >= promotion.usageLimit) {
      throw new BadRequestException('Mã giảm giá đã hết lượt sử dụng');
    }

    this.calculateCartTotals(cart);
    if (promotion.minOrderValue && cart.subtotal < promotion.minOrderValue) {
      throw new BadRequestException(
        `Đơn hàng cần đạt tối thiểu ${promotion.minOrderValue.toLocaleString('vi-VN')}đ để sử dụng mã này`,
      );
    }

    cart.appliedVoucher = {
      code: promotion.code,
      name: promotion.name,
      discountType: promotion.discountType,
      discountValue: promotion.discountValue,
      discountAmount: 0,
      minOrderValue: promotion.minOrderValue || 0,
      maxDiscount: promotion.maxDiscount || 0,
    };

    this.calculateCartTotals(cart);
    await cart.save();
    return (await this.cartModel
      .findById(cart._id)
      .populate('items.product')
      .exec()) as CartDocument;
  }

  /**
   * Hủy mã giảm giá khỏi giỏ hàng
   */
  async removeVoucher(userId: string): Promise<CartDocument> {
    const userOid = this.toObjectId(userId);
    const cart = await this.cartModel.findOne({ user: userOid }).exec();
    if (!cart) {
      throw new NotFoundException('Không tìm thấy giỏ hàng');
    }

    cart.appliedVoucher = undefined;
    this.calculateCartTotals(cart);
    await cart.save();
    return (await this.cartModel
      .findById(cart._id)
      .populate('items.product')
      .exec()) as CartDocument;
  }
}
