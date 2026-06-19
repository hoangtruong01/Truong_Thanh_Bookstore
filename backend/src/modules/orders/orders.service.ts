import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from './schemas/order.schema';
import { CreateOrderDto, UpdateOrderStatusDto, OrderQueryDto } from './dto/order.dto';
import { ProductsService } from '../products/products.service';
import { PaginatedResult, paginate } from '../../common/dto/pagination.dto';
import { OrderStatus } from '../../common/enums';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    private productsService: ProductsService,
  ) {}

  private generateOrderCode(): string {
    const now = new Date();
    const y = now.getFullYear().toString().slice(-2);
    const m = (now.getMonth() + 1).toString().padStart(2, '0');
    const d = now.getDate().toString().padStart(2, '0');
    const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `TT${y}${m}${d}${rand}`;
  }

  async create(dto: CreateOrderDto, userId?: string): Promise<OrderDocument> {
    const subtotal = dto.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shippingFee = dto.shippingFee || (subtotal >= 299000 ? 0 : 30000);
    const discount = dto.discount || 0;
    const total = subtotal + shippingFee - discount;

    const order = new this.orderModel({
      orderCode: this.generateOrderCode(),
      customer: userId || null,
      items: dto.items,
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
    });

    const savedOrder = await order.save();

    // Deduct stock and increment sold
    for (const item of dto.items) {
      await this.productsService.updateStock(item.product, -item.quantity);
      await this.productsService.incrementSold(item.product, item.quantity);
    }

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
      this.orderModel.find(filter).populate('customer', 'fullName email').sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      this.orderModel.countDocuments(filter).exec(),
    ]);

    return paginate(data, total, page, limit);
  }

  async findById(id: string): Promise<OrderDocument> {
    const order = await this.orderModel.findById(id).populate('customer', 'fullName email phone').exec();
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async findByUser(userId: string, query: OrderQueryDto): Promise<PaginatedResult<OrderDocument>> {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;
    const filter = { customer: userId };

    const [data, total] = await Promise.all([
      this.orderModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      this.orderModel.countDocuments(filter).exec(),
    ]);

    return paginate(data, total, page, limit);
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto): Promise<OrderDocument> {
    const order = await this.orderModel.findById(id).exec();
    if (!order) throw new NotFoundException('Order not found');

    order.orderStatus = dto.orderStatus;

    // If cancelled, restore stock
    if (dto.orderStatus === OrderStatus.CANCELLED && order.orderStatus !== OrderStatus.CANCELLED) {
      for (const item of order.items) {
        await this.productsService.updateStock(item.product.toString(), item.quantity);
        await this.productsService.incrementSold(item.product.toString(), -item.quantity);
      }
    }

    // If completed, mark as paid
    if (dto.orderStatus === OrderStatus.COMPLETED) {
      order.paymentStatus = 'PAID' as any;
    }

    return order.save();
  }

  async cancel(id: string): Promise<OrderDocument> {
    return this.updateStatus(id, { orderStatus: OrderStatus.CANCELLED });
  }

  async count(filter: any = {}): Promise<number> {
    return this.orderModel.countDocuments(filter).exec();
  }

  async getTodayRevenue(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const result = await this.orderModel.aggregate([
      { $match: { createdAt: { $gte: today }, orderStatus: { $ne: OrderStatus.CANCELLED } } },
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
