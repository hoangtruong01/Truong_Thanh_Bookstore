import { Injectable, NotFoundException, BadRequestException, Logger, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from './schemas/order.schema';
import * as PDFDocument from 'pdfkit';
import * as fs from 'fs';
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
import { NotificationsService } from '../notifications/notifications.service';

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
    private notificationsService: NotificationsService,
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

    // FIX-1.3: Deduct stock BEFORE saving order to prevent zombie orders
    // If any deductStock fails, no order is created (atomic behavior)
    const deductedItems: { product: string; quantity: number }[] = [];
    try {
      for (const item of verifiedItems) {
        await this.productsService.deductStock(item.product, item.quantity);
        deductedItems.push({ product: item.product, quantity: item.quantity });
        await this.productsService.incrementSold(item.product, item.quantity);
      }
    } catch (err) {
      // Rollback: restore stock for items that were already deducted
      for (const deducted of deductedItems) {
        await this.productsService.updateStock(deducted.product, deducted.quantity);
        await this.productsService.incrementSold(deducted.product, -deducted.quantity);
      }
      throw err; // Re-throw so the client gets the error
    }

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
      timeline: [
        {
          status: OrderStatus.PENDING,
          note: 'Đơn hàng được tạo thành công, chờ xác nhận.',
          createdAt: new Date(),
        },
      ],
    });

    const savedOrder = await order.save();

    // Sync to Google Sheet (async)
    this.syncToGoogleSheet(savedOrder).catch((err) => this.logger.error('Sheet sync failed', err));

    if (userId) {
      this.notificationsService.create({
        userId,
        title: 'Đặt hàng thành công',
        message: `Đơn hàng #${savedOrder.orderCode} trị giá ${savedOrder.total.toLocaleString('vi-VN')}đ đã được tiếp nhận và đang chờ xử lý.`,
        type: 'order',
        meta: { orderId: savedOrder._id.toString(), orderCode: savedOrder.orderCode },
      }).catch((err) => this.logger.error('Failed to create customer notification', err));
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

    if (!order.timeline) {
      order.timeline = [];
    }

    let timelineNote = `Trạng thái đơn hàng: ${dto.orderStatus}`;
    switch (dto.orderStatus) {
      case OrderStatus.PENDING:
        timelineNote = 'Đơn hàng đang chờ xử lý.';
        break;
      case OrderStatus.CONFIRMED:
        timelineNote = 'Cửa hàng đã xác nhận đơn hàng của bạn.';
        break;
      case OrderStatus.SHIPPING:
        timelineNote = 'Đơn hàng đang được vận chuyển đến địa chỉ nhận.';
        break;
      case OrderStatus.COMPLETED:
        timelineNote = 'Giao hàng thành công. Đơn hàng hoàn tất.';
        break;
      case OrderStatus.CANCELLED:
        timelineNote = 'Đơn hàng đã bị hủy bỏ.';
        break;
    }

    order.timeline.push({
      status: dto.orderStatus,
      note: timelineNote,
      createdAt: new Date(),
    });

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

    if (savedOrder.customer && savedOrder.orderStatus !== oldStatus) {
      const customerId = savedOrder.customer.toString();
      let statusText = '';
      switch (savedOrder.orderStatus) {
        case OrderStatus.CONFIRMED:
          statusText = 'đã được xác nhận và đang được chuẩn bị';
          break;
        case OrderStatus.SHIPPING:
          statusText = 'đang được giao đến bạn';
          break;
        case OrderStatus.COMPLETED:
          statusText = 'đã giao thành công. Cảm ơn bạn đã mua sắm!';
          break;
        case OrderStatus.CANCELLED:
          statusText = 'đã bị hủy';
          break;
      }
      if (statusText) {
        this.notificationsService.create({
          userId: customerId,
          title: `Cập nhật đơn hàng #${savedOrder.orderCode}`,
          message: `Đơn hàng #${savedOrder.orderCode} của bạn ${statusText}.`,
          type: 'order',
          meta: { orderId: savedOrder._id.toString(), orderCode: savedOrder.orderCode },
        }).catch((err) => this.logger.error('Failed to create customer notification for status change', err));
      }
    }

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
          total: { $sum: '$total' },
          subtotal: { $sum: '$subtotal' },
          discount: { $sum: '$discount' },
          count: { $sum: 1 },
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

  async getStatusDistribution() {
    return this.orderModel.aggregate([
      {
        $group: {
          _id: '$orderStatus',
          count: { $sum: 1 },
        },
      },
    ]);
  }

  async getAov() {
    const result = await this.orderModel.aggregate([
      {
        $match: {
          orderStatus: { $ne: OrderStatus.CANCELLED },
        },
      },
      {
        $group: {
          _id: null,
          avgValue: { $avg: '$total' },
        },
      },
    ]);
    return result[0]?.avgValue || 0;
  }

  async getVoucherEffectiveness() {
    return this.orderModel.aggregate([
      {
        $match: {
          promotionCode: { $exists: true, $ne: null },
          orderStatus: { $ne: OrderStatus.CANCELLED },
        },
      },
      {
        $group: {
          _id: '$promotionCode',
          count: { $sum: 1 },
          totalSavings: { $sum: '$discount' },
        },
      },
      { $sort: { count: -1 } },
    ]);
  }

  async generateInvoicePdf(order: any): Promise<any> {
    const doc = new PDFDocument({ margin: 50 });
    const winFont = 'C:\\Windows\\Fonts\\Arial.ttf';
    let fontName = 'Helvetica'; // safe fallback, always available in pdfkit
    if (fs.existsSync(winFont)) {
      doc.registerFont('Arial', winFont);
      fontName = 'Arial';
    }
    doc.font(fontName);

    // Header
    doc.fontSize(16).text('VĂN PHÒNG PHẨM TRƯỜNG THÀNH', { align: 'center' });
    doc.fontSize(10).text('Địa chỉ: Chợ Chanh - Nhân Hà, Ninh Bình, Việt Nam', { align: 'center' });
    doc.fontSize(10).text('Điện thoại: 0982938316 | Email: giaoductruongthanh@gmail.com', { align: 'center' });
    doc.moveDown(1);
    
    // Invoice Title
    doc.fontSize(14).text('HÓA ĐƠN BÁN HÀNG', { align: 'center', underline: true });
    doc.fontSize(10).text(`Mã đơn hàng: #${order.orderCode}`, { align: 'center' });
    doc.fontSize(10).text(`Ngày đặt: ${new Date(order.createdAt).toLocaleString('vi-VN')}`, { align: 'center' });
    doc.moveDown(1.5);

    // Customer Info
    doc.fontSize(11).text('THÔNG TIN KHÁCH HÀNG', { underline: true });
    doc.fontSize(10).text(`Họ và tên: ${order.customerName || 'Khách vãng lai'}`);
    doc.fontSize(10).text(`Số điện thoại: ${order.phone}`);
    doc.fontSize(10).text(`Email: ${order.customerEmail || 'N/A'}`);
    doc.fontSize(10).text(`Địa chỉ nhận hàng: ${order.shippingAddress}`);
    doc.moveDown(1.5);

    // Table Header
    doc.fontSize(11).text('DANH SÁCH SẢN PHẨM', { underline: true });
    doc.moveDown(0.5);

    const startX = 50;
    let startY = doc.y;

    doc.fontSize(9);
    doc.text('STT', startX, startY);
    doc.text('Tên sản phẩm', startX + 30, startY);
    doc.text('Đơn giá', startX + 280, startY, { width: 60, align: 'right' });
    doc.text('SL', startX + 350, startY, { width: 30, align: 'center' });
    doc.text('Thành tiền', startX + 390, startY, { width: 80, align: 'right' });
    
    doc.moveTo(startX, startY + 15).lineTo(500, startY + 15).stroke();
    
    startY += 20;
    
    order.items.forEach((item: any, index: number) => {
      doc.text((index + 1).toString(), startX, startY);
      doc.text(item.name, startX + 30, startY, { width: 240 });
      doc.text(item.price.toLocaleString('vi-VN') + 'đ', startX + 280, startY, { width: 60, align: 'right' });
      doc.text(item.quantity.toString(), startX + 350, startY, { width: 30, align: 'center' });
      doc.text((item.price * item.quantity).toLocaleString('vi-VN') + 'đ', startX + 390, startY, { width: 80, align: 'right' });
      
      const textHeight = doc.heightOfString(item.name, { width: 240 });
      startY += Math.max(15, textHeight) + 5;
    });

    doc.moveTo(startX, startY).lineTo(500, startY).stroke();
    startY += 10;

    // Summary Info
    doc.fontSize(10);
    doc.text('Cộng tiền hàng:', startX + 280, startY, { width: 100, align: 'left' });
    doc.text(order.subtotal.toLocaleString('vi-VN') + 'đ', startX + 390, startY, { width: 80, align: 'right' });
    
    startY += 15;
    doc.text('Phí vận chuyển:', startX + 280, startY, { width: 100, align: 'left' });
    doc.text((order.shippingFee === 0 ? 'Miễn phí' : order.shippingFee.toLocaleString('vi-VN') + 'đ'), startX + 390, startY, { width: 80, align: 'right' });

    if (order.discount > 0) {
      startY += 15;
      doc.text('Giảm giá:', startX + 280, startY, { width: 100, align: 'left' });
      doc.text('-' + order.discount.toLocaleString('vi-VN') + 'đ', startX + 390, startY, { width: 80, align: 'right' });
    }

    startY += 20;
    doc.fontSize(11).font(fontName);
    doc.text('TỔNG CỘNG:', startX + 280, startY, { width: 100, align: 'left' });
    doc.text(order.total.toLocaleString('vi-VN') + 'đ', startX + 390, startY, { width: 80, align: 'right' });

    doc.moveDown(2);
    doc.fontSize(10).text('Cảm ơn quý khách đã tin tưởng và mua sắm tại Trường Thành Bookstore!', { align: 'center' });

    return doc;
  }
}
