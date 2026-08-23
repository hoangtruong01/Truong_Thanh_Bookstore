import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cart, CartDocument } from './schemas/cart.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { AddToCartDto, UpdateCartItemDto, SyncCartDto } from './dto/cart.dto';
import { ProductStatus } from '../../common/enums';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name) private cartModel: Model<CartDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  private toObjectId(id: string | Types.ObjectId): Types.ObjectId {
    if (id instanceof Types.ObjectId) return id;
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`ID không hợp lệ: ${id}`);
    }
    return new Types.ObjectId(id);
  }

  private calculateSubtotal(items: any[]): number {
    return items.reduce((acc, item) => {
      const price = item.discountPrice > 0 ? item.discountPrice : item.price;
      return acc + price * item.quantity;
    }, 0);
  }

  async getCart(userId: string): Promise<CartDocument> {
    const userOid = this.toObjectId(userId);
    let cart = await this.cartModel
      .findOne({ user: userOid })
      .populate('items.product')
      .exec();

    if (!cart) {
      cart = await this.cartModel.create({
        user: userOid,
        items: [],
        subtotal: 0,
      });
    }

    return cart;
  }

  async addToCart(userId: string, dto: AddToCartDto): Promise<CartDocument> {
    const userOid = this.toObjectId(userId);
    const productOid = this.toObjectId(dto.productId);
    const product = await this.productModel.findById(productOid).exec();
    if (!product || product.status === ProductStatus.INACTIVE) {
      throw new NotFoundException('Sản phẩm không tồn tại hoặc đã ngừng kinh doanh');
    }

    if (product.stock < dto.quantity) {
      throw new BadRequestException(`Sản phẩm chỉ còn ${product.stock} sản phẩm trong kho`);
    }

    let cart = await this.cartModel.findOne({ user: userOid }).exec();
    if (!cart) {
      cart = new this.cartModel({
        user: userOid,
        items: [],
        subtotal: 0,
      });
    }

    const existingIndex = cart.items.findIndex(
      (item) => item.product.toString() === dto.productId,
    );

    const price = product.price;
    const discountPrice = product.discountPrice || 0;
    const image = product.images && product.images.length > 0 ? product.images[0] : '';

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
        product: productOid as any,
        name: product.name,
        price,
        discountPrice,
        image,
        quantity: dto.quantity,
      });
    }

    cart.subtotal = this.calculateSubtotal(cart.items);
    return cart.save();
  }

  async updateItemQuantity(
    userId: string,
    productId: string,
    dto: UpdateCartItemDto,
  ): Promise<CartDocument> {
    const userOid = this.toObjectId(userId);
    const productOid = this.toObjectId(productId);
    const product = await this.productModel.findById(productOid).exec();
    if (!product || product.status === ProductStatus.INACTIVE) {
      throw new NotFoundException('Sản phẩm không tồn tại hoặc đã ngừng kinh doanh');
    }

    if (product.stock < dto.quantity) {
      throw new BadRequestException(`Tồn kho chỉ còn ${product.stock} sản phẩm`);
    }

    const cart = await this.cartModel.findOne({ user: userOid }).exec();
    if (!cart) {
      throw new NotFoundException('Không tìm thấy giỏ hàng');
    }

    const itemIndex = cart.items.findIndex((item) => item.product.toString() === productId);
    if (itemIndex === -1) {
      throw new NotFoundException('Sản phẩm không có trong giỏ hàng');
    }

    cart.items[itemIndex].quantity = dto.quantity;
    cart.items[itemIndex].price = product.price;
    cart.items[itemIndex].discountPrice = product.discountPrice || 0;
    cart.subtotal = this.calculateSubtotal(cart.items);

    return cart.save();
  }

  async removeItem(userId: string, productId: string): Promise<CartDocument> {
    const userOid = this.toObjectId(userId);
    const cart = await this.cartModel.findOne({ user: userOid }).exec();
    if (!cart) {
      throw new NotFoundException('Không tìm thấy giỏ hàng');
    }

    cart.items = cart.items.filter((item) => item.product.toString() !== productId);
    cart.subtotal = this.calculateSubtotal(cart.items);

    return cart.save();
  }

  async clearCart(userId: string): Promise<CartDocument> {
    const userOid = this.toObjectId(userId);
    const cart = await this.cartModel.findOne({ user: userOid }).exec();
    if (!cart) {
      return this.cartModel.create({
        user: userOid,
        items: [],
        subtotal: 0,
      });
    }

    cart.items = [];
    cart.subtotal = 0;
    return cart.save();
  }

  async syncCart(userId: string, dto: SyncCartDto): Promise<CartDocument> {
    const userOid = this.toObjectId(userId);
    let cart = await this.cartModel.findOne({ user: userOid }).exec();
    if (!cart) {
      cart = new this.cartModel({
        user: userOid,
        items: [],
        subtotal: 0,
      });
    }

    for (const item of dto.items) {
      const product = await this.productModel.findById(item.productId).exec();
      if (!product || product.status === ProductStatus.INACTIVE || product.stock <= 0) {
        continue;
      }

      const cappedQuantity = Math.min(item.quantity, product.stock);
      const existingIdx = cart.items.findIndex(
        (ci) => ci.product.toString() === item.productId,
      );

      const price = product.price;
      const discountPrice = product.discountPrice || 0;
      const image = product.images && product.images.length > 0 ? product.images[0] : '';

      if (existingIdx > -1) {
        cart.items[existingIdx].quantity = cappedQuantity;
        cart.items[existingIdx].price = price;
        cart.items[existingIdx].discountPrice = discountPrice;
        cart.items[existingIdx].image = image;
      } else {
        cart.items.push({
          product: new Types.ObjectId(item.productId) as any,
          name: product.name,
          price,
          discountPrice,
          image,
          quantity: cappedQuantity,
        });
      }
    }

    cart.subtotal = this.calculateSubtotal(cart.items);
    return cart.save();
  }
}
