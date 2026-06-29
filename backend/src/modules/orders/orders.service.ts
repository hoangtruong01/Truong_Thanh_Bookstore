import { Injectable, NotFoundException, BadRequestException, Logger, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from './schemas/order.schema';
import {
  CreateOrderDto,
  UpdateOrderStatusDto,
  OrderQueryDto,
} from './dto/order.dto';
import { ProductsService } from '../products/products.service';
import { PaginatedResult, paginate } from '../../common/dto/pagination.dto';
import { OrderStatus } from '../../common/enums';
import { ConfigService } from '@nestjs/config';
import { PromotionsService } from '../promotions/promotions.service';

// FIX-C03: Shipping fee threshold (must match frontend)
const FREE_SHIPPING_THRESHOLD = 299000;
const SHIPPING_FEE = 30000;

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    private productsService: ProductsService,
    private configService: ConfigService,
    private promotionsService: PromotionsService,
  ) {}

  private generateOrderCode(): string {
    const now = new Date();
    const y = now.getFullYear().toString().slice(-2);
    const m = (now.getMonth() + 1).toString().padStart(2, '0');
    const d = now.getDate().toString().padStart(2, '0');
    const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `TT${y}${m}${d}${rand}`;
  }

  async syncToGoogleSheet(order: any) {
    try {
      const webappUrl = this.configService.get<string>(
        'GOOGLE_SHEET_WEBAPP_URL',
      );
      if (!webappUrl) {
        return;
      }

      // Format items to readable string
      const itemsText = order.items
        ? order.items
            .map((item: any) => `${item.name} (x${item.quantity})`)
            .join(', ')
        : '';

      // Format Date in GMT+7
      const dateText = order.createdAt
        ? new Date(order.createdAt).toLocaleString('vi-VN', {
            timeZone: 'Asia/Ho_Chi_Minh',
          })
        : new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

      // Translate Status
      let statusLabel = order.orderStatus;
      switch (order.orderStatus) {
        case 'PENDING':
          statusLabel = 'Chờ xử lý';
          break;
        case 'CONFIRMED':
          statusLabel = 'Đã xác nhận';
          break;
        case 'SHIPPING':
          statusLabel = 'Đang giao';
          break;
        case 'COMPLETED':
          statusLabel = 'Hoàn thành';
          break;
        case 'CANCELLED':
          statusLabel = 'Hủy đơn';
          break;
      }

      const payload = {
        orderCode: order.orderCode,
        createdAt: dateText,
        customerName: order.customerName || 'Khách vãng lai',
        phone: order.phone || '',
        shippingAddress: order.shippingAddress || '',
        items: itemsText,
        total: order.total || 0,
        status: statusLabel,
        note: order.note || '',
      };

      const response = await fetch(webappUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text();
        this.logger.error(
          `Google Sheet Sync Error: Status ${response.status}, ${text}`,
        );
      } else {
        const data = await response.json();
        this.logger.log('Google Sheet Sync success');
      }
    } catch (error) {
      this.logger.error('Failed to sync order to Google Sheet:', error);
    }
  }

  async create(dto: CreateOrderDto, userId?: string): Promise<OrderDocument> {
    // FIX-C03: Fetch real prices from DB instead of trusting frontend
    const verifiedItems = [];
    for (const item of dto.items) {
      const product = await this.productsService.findById(item.product);
      if (!product) {
        throw new BadRequestException(`Sản phẩm "${item.name}" không tồn tại`);
      }
      // FIX-C04: Check stock availability before creating order
      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Sản phẩm "${product.name}" chỉ còn ${product.stock} sản phẩm trong kho`,
        );
      }
      // Use DB price, not frontend price
      const realPrice = product.discountPrice > 0 ? product.discountPrice : product.price;
      verifiedItems.push({
        product: item.product,
        name: product.name,
        price: realPrice,
        quantity: item.quantity,
        image: product.images?.[0] || item.image || '',
      });
    }

    const subtotal = verifiedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    // FIX-H03: Always compute shipping fee server-side (matching frontend 299K threshold)
    const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;

    let discount = 0;
    if (dto.promotionCode) {
      const promoResult = await this.promotionsService.apply(
        {
          code: dto.promotionCode,
          orderTotal: subtotal,
        },
        userId, // Pass userId for duplicate check
        true, // Increment usage count
      );
      discount = promoResult.discount;
    }

    const total = Math.max(0, subtotal + shippingFee - discount);

    const order = new this.orderModel({
      orderCode: this.generateOrderCode(),
      customer: userId || null,
      items: verifiedItems,
      shippingAddress: dto.shippingAddress,
      phone: dto.phone,
      note: dto.note,
      paymentMethod: dto.paymentMethod,
      customerName: dto.customerName,
      customerEmail: dto.customerEmail,
      subtotal,
      shippingFee,
      discount,
      total,
      promotionCode: dto.promotionCode ? dto.promotionCode.toUpperCase() : undefined,
    });

    const savedOrder = await order.save();

    // FIX-C04: Deduct stock with safe check
    for (const item of verifiedItems) {
      await this.productsService.deductStock(item.product, item.quantity);
      await this.productsService.incrementSold(item.product, item.quantity);
    }

    // Sync to Google Sheet (async)
    this.syncToGoogleSheet(savedOrder).catch((err) => this.logger.error('Sheet sync failed', err));

    return savedOrder;
  }

  async findAll(query: OrderQueryDto): Promise<PaginatedResult<OrderDocument>> {
    const { page = 1, limit = 10, status, search } = query;
    const filter: any = {};

    if (status) filter.orderStatus = status;
    if (search) {
      filter.$or = [
        { orderCode: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.orderModel
        .find(filter)
        .populate('customer', 'fullName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.orderModel.countDocuments(filter).exec(),
    ]);

    return paginate(data, total, page, limit);
  }

  async findById(id: string): Promise<OrderDocument> {
    const order = await this.orderModel
      .findById(id)
      .populate('customer', 'fullName email phone')
      .exec();
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async findByUser(
    userId: string,
    query: OrderQueryDto,
  ): Promise<PaginatedResult<OrderDocument>> {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;
    const filter = { customer: userId };

    const [data, total] = await Promise.all([
      this.orderModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.orderModel.countDocuments(filter).exec(),
    ]);

    return paginate(data, total, page, limit);
  }

  async updateStatus(
    id: string,
    dto: UpdateOrderStatusDto,
  ): Promise<OrderDocument> {
    const order = await this.orderModel.findById(id).exec();
    if (!order) throw new NotFoundException('Order not found');

    const oldStatus = order.orderStatus;
    order.orderStatus = dto.orderStatus;

    // If cancelled, restore stock
    if (
      dto.orderStatus === OrderStatus.CANCELLED &&
      oldStatus !== OrderStatus.CANCELLED
    ) {
      for (const item of order.items) {
        if (item.product) {
          await this.productsService.updateStock(
            item.product.toString(),
            item.quantity,
          );
          await this.productsService.incrementSold(
            item.product.toString(),
            -item.quantity,
          );
        }
      }
    }

    // If completed, mark as paid
    if (dto.orderStatus === OrderStatus.COMPLETED) {
      order.paymentStatus = 'PAID' as any;
    }

    const savedOrder = await order.save();

    // Sync to Google Sheet (async)
    this.syncToGoogleSheet(savedOrder).catch((err) => this.logger.error('Sheet sync failed', err));

    return savedOrder;
  }

  // FIX-C01: Cancel with ownership check
  async cancel(id: string, userId?: string): Promise<OrderDocument> {
    const order = await this.orderModel.findById(id).exec();
    if (!order) throw new NotFoundException('Order not found');

    // Only the order owner or admin/staff can cancel
    if (userId && order.customer && order.customer.toString() !== userId.toString()) {
      throw new ForbiddenException('Bạn không có quyền hủy đơn hàng này');
    }

    // Only allow cancelling PENDING orders
    if (order.orderStatus !== OrderStatus.PENDING) {
      throw new BadRequestException('Chỉ có thể hủy đơn hàng ở trạng thái Chờ xử lý');
    }

    return this.updateStatus(id, { orderStatus: OrderStatus.CANCELLED });
  }

  async count(filter: any = {}): Promise<number> {
    return this.orderModel.countDocuments(filter).exec();
  }

  async getTodayRevenue(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const result = await this.orderModel.aggregate([
      {
        $match: {
          createdAt: { $gte: today },
          orderStatus: { $ne: OrderStatus.CANCELLED },
        },
      },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]);
    return result[0]?.total || 0;
  }

  async getRevenueByDateRange(startDate: Date, endDate: Date): Promise<any[]> {
    return this.orderModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          orderStatus: { $ne: OrderStatus.CANCELLED },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  }

  async getRecent(limit = 10): Promise<OrderDocument[]> {
    return this.orderModel
      .find()
      .populate('customer', 'fullName email')
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }
}
