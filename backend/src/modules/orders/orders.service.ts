import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
  Optional,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { createHash, timingSafeEqual } from 'crypto';
import { Order, OrderDocument } from './schemas/order.schema';
import * as PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as QRCode from 'qrcode';
import {
  CreateOrderDto,
  UpdateOrderStatusDto,
  OrderQueryDto,
  CheckoutPreviewDto,
  CancelOrderDto,
} from './dto/order.dto';
import { ProductsService } from '../products/products.service';
import { PaginatedResult, paginate } from '../../common/dto/pagination.dto';
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  StaffPermission,
  UserRole,
} from '../../common/enums';
import { ConfigService } from '@nestjs/config';
import { PromotionsService } from '../promotions/promotions.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../email/email.service';
import { UsersService } from '../users/users.service';
import { CartService } from '../cart/cart.service';
import { InventoryService } from '../inventory/inventory.service';
import {
  CheckoutService,
  OrderLifecycleService,
  OrderInventoryService,
  OrderLoyaltyService,
  OrderNotificationService,
} from './services';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  // Sub-services (BE-05 Architecture)
  public readonly checkoutService: CheckoutService;
  public readonly orderLifecycleService: OrderLifecycleService;
  public readonly orderInventoryService: OrderInventoryService;
  public readonly orderLoyaltyService: OrderLoyaltyService;
  public readonly orderNotificationService: OrderNotificationService;

  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    private productsService: ProductsService,
    private configService: ConfigService,
    private promotionsService: PromotionsService,
    private notificationsService: NotificationsService,
    private emailService: EmailService,
    private usersService: UsersService,
    @Optional() private cartService?: CartService,
    @Optional() private inventoryService?: InventoryService,
    @Optional() checkoutService?: CheckoutService,
    @Optional() orderLifecycleService?: OrderLifecycleService,
    @Optional() orderInventoryService?: OrderInventoryService,
    @Optional() orderLoyaltyService?: OrderLoyaltyService,
    @Optional() orderNotificationService?: OrderNotificationService,
  ) {
    // Fallback instantiation ensures 100% backward-compatibility for unit tests
    this.orderInventoryService =
      orderInventoryService ??
      new OrderInventoryService(this.productsService, this.inventoryService);

    this.orderLoyaltyService =
      orderLoyaltyService ??
      new OrderLoyaltyService(this.usersService, this.notificationsService);

    this.orderNotificationService =
      orderNotificationService ??
      new OrderNotificationService(
        this.notificationsService,
        this.emailService,
        this.configService,
      );

    this.checkoutService =
      checkoutService ??
      new CheckoutService(
        this.orderModel,
        this.productsService,
        this.configService,
        this.promotionsService,
        this.usersService,
        this.orderInventoryService,
        this.orderLoyaltyService,
        this.orderNotificationService,
        this.cartService,
      );

    this.orderLifecycleService =
      orderLifecycleService ??
      new OrderLifecycleService(
        this.orderModel,
        this.productsService,
        this.promotionsService,
        this.orderInventoryService,
        this.orderLoyaltyService,
        this.orderNotificationService,
      );
  }

  // --- Helper methods ---
  private generateOrderCode(): string {
    return this.checkoutService.generateOrderCode();
  }

  private hashSecret(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  private getRealizedRevenueMatch(): Record<string, unknown> {
    return {
      orderStatus: { $nin: [OrderStatus.CANCELLED, OrderStatus.RETURNED] },
      $or: [
        { paymentStatus: PaymentStatus.PAID },
        {
          orderStatus: {
            $in: [OrderStatus.DELIVERED, OrderStatus.COMPLETED],
          },
        },
      ],
    };
  }

  private getRevenueDateMatch(
    start: Date,
    end?: Date,
  ): Record<string, unknown> {
    const range = end ? { $gte: start, $lte: end } : { $gte: start };
    return {
      $or: [
        { revenueRecognizedAt: range },
        {
          revenueRecognizedAt: { $exists: false },
          createdAt: range,
        },
      ],
    };
  }

  private getEnabledPaymentMethods(): PaymentMethod[] {
    return this.checkoutService.getEnabledPaymentMethods();
  }

  // --- Delegation to OrderNotificationService ---
  async syncToGoogleSheet(order: any) {
    return this.orderNotificationService.syncToGoogleSheet(order);
  }

  // --- Delegation to CheckoutService ---
  async checkoutPreview(dto: CheckoutPreviewDto, userId?: string) {
    return this.checkoutService.checkoutPreview(dto, userId);
  }

  async create(
    dto: CreateOrderDto,
    userId?: string,
    clientIp?: string,
  ): Promise<any> {
    return this.checkoutService.create(dto, userId, clientIp);
  }

  private async createAtomic(
    dto: CreateOrderDto,
    userId?: string,
    clientIp?: string,
  ): Promise<any> {
    return this.checkoutService.createAtomic(dto, userId, clientIp);
  }

  // For backward-compatibility with tests inspecting guest checkout protection
  private checkGuestCheckoutProtection(dto: CreateOrderDto, clientIp?: string) {
    return (this.checkoutService as any).checkGuestCheckoutProtection(
      dto,
      clientIp,
    );
  }

  // --- Order Query APIs ---
  async findAll(query: OrderQueryDto): Promise<PaginatedResult<OrderDocument>> {
    const { page = 1, limit = 10, status, search } = query;
    const filter: any = {};

    if (status) filter.orderStatus = status;
    if (search) {
      const safeSearch = search
        .substring(0, 100)
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { orderCode: { $regex: safeSearch, $options: 'i' } },
        { customerName: { $regex: safeSearch, $options: 'i' } },
        { phone: { $regex: safeSearch, $options: 'i' } },
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

  async findById(
    id: string,
    userId?: string,
    userRole?: string,
  ): Promise<OrderDocument> {
    const order = await this.orderModel
      .findById(id)
      .populate('customer', 'fullName email phone')
      .exec();
    if (!order) throw new NotFoundException('Order not found');

    if (
      userId &&
      userRole !== UserRole.SUPER_ADMIN &&
      userRole !== UserRole.ADMIN &&
      userRole !== UserRole.STAFF &&
      userRole !== 'SUPER_ADMIN' &&
      userRole !== 'ADMIN' &&
      userRole !== 'STAFF' &&
      order.customer &&
      order.customer._id.toString() !== userId.toString()
    ) {
      throw new ForbiddenException(
        'Bạn không có quyền xem thông tin đơn hàng này',
      );
    }

    return order;
  }

  async findByIdForActor(
    id: string,
    actor: { _id: string; role: string; permissions?: string[] },
  ): Promise<OrderDocument> {
    const order = await this.findById(id);
    const actorRole = actor.role.toUpperCase();
    if (actorRole === 'SUPER_ADMIN' || actorRole === 'ADMIN') return order;
    if (
      actorRole === 'STAFF' &&
      actor.permissions?.includes(StaffPermission.MANAGE_ORDERS)
    ) {
      return order;
    }
    const customerId = order.customer
      ? ((order.customer as any)._id || order.customer).toString()
      : undefined;
    if (actorRole !== 'CUSTOMER' || customerId !== actor._id.toString()) {
      throw new ForbiddenException(
        'Bạn không có quyền xem thông tin đơn hàng này',
      );
    }
    return order;
  }

  async findGuestById(
    id: string,
    accessToken?: string,
  ): Promise<OrderDocument> {
    if (!accessToken) {
      throw new ForbiddenException('Thiếu mã truy cập đơn hàng');
    }
    const order = await this.orderModel
      .findById(id)
      .select('+guestAccessTokenHash')
      .exec();
    if (!order || order.customer || !order.guestAccessTokenHash) {
      throw new NotFoundException('Order not found');
    }
    const expected = Buffer.from(order.guestAccessTokenHash, 'hex');
    const actual = Buffer.from(this.hashSecret(accessToken), 'hex');
    if (
      expected.length !== actual.length ||
      !timingSafeEqual(expected, actual)
    ) {
      throw new ForbiddenException('Mã truy cập đơn hàng không hợp lệ');
    }
    order.guestAccessTokenHash = undefined;
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

  // --- Delegation to OrderLifecycleService ---
  async updateStatus(
    id: string,
    dto: UpdateOrderStatusDto,
    actor?: { _id: string; role?: string; permissions?: string[] },
  ): Promise<OrderDocument> {
    return this.orderLifecycleService.updateStatus(id, dto, actor);
  }

  private async updateStatusInternal(
    id: string,
    dto: UpdateOrderStatusDto,
    session?: any,
    afterCommit?: any,
  ): Promise<OrderDocument> {
    return this.orderLifecycleService.updateStatusInternal(
      id,
      dto,
      session,
      afterCommit,
    );
  }

  async cancel(
    id: string,
    reasonOrDto?: string | CancelOrderDto,
  ): Promise<OrderDocument> {
    return this.orderLifecycleService.cancel(id, reasonOrDto);
  }

  async cancelForActor(
    id: string,
    actor: { _id: string; role?: string; permissions?: string[] },
    reasonOrDto?: string | CancelOrderDto,
  ): Promise<OrderDocument> {
    return this.orderLifecycleService.cancelForActor(id, actor, reasonOrDto);
  }

  async cancelGuest(
    id: string,
    guestAccessToken?: string,
    reasonOrDto?: string | CancelOrderDto,
  ): Promise<OrderDocument> {
    return this.orderLifecycleService.cancelGuest(
      id,
      guestAccessToken,
      reasonOrDto,
    );
  }

  async requestReturn(
    id: string,
    actor: { _id: string; role?: string },
    dto: { reason: string },
  ): Promise<OrderDocument> {
    return this.orderLifecycleService.requestReturn(id, actor, dto);
  }

  async approveReturn(
    id: string,
    actor: { _id: string; role?: string; permissions?: string[] },
    note?: string,
  ): Promise<OrderDocument> {
    return this.orderLifecycleService.approveReturn(id, actor, note);
  }

  async rejectReturn(
    id: string,
    actor: { _id: string; role?: string; permissions?: string[] },
    dto: { reason: string },
  ): Promise<OrderDocument> {
    return this.orderLifecycleService.rejectReturn(id, actor, dto);
  }

  async processRefund(
    id: string,
    actor: { _id: string; role?: string; permissions?: string[] },
    dto?: { reason?: string; amount?: number },
  ): Promise<OrderDocument> {
    return this.orderLifecycleService.processRefund(id, actor, dto);
  }

  // --- Auto-Cancel Operations (BE-06 & BE-05) ---
  async handleAutoCancelOrders(): Promise<number> {
    return this.orderLifecycleService.handleAutoCancelOrders((id, dto) =>
      this.updateStatus(id, dto),
    );
  }

  async handleAutoCancelWarnings(): Promise<number> {
    return this.orderLifecycleService.handleAutoCancelWarnings();
  }

  // --- Reporting & Analytics ---
  async count(filter: any = {}): Promise<number> {
    return this.orderModel.countDocuments(filter).exec();
  }

  async getTodayRevenue(): Promise<number> {
    const now = new Date();
    const tzOffset = 7 * 60 * 60 * 1000;
    const vnTime = new Date(now.getTime() + tzOffset);
    vnTime.setUTCHours(0, 0, 0, 0);
    const startOfTodayVN = new Date(vnTime.getTime() - tzOffset);

    const result = await this.orderModel.aggregate([
      {
        $match: {
          ...this.getRealizedRevenueMatch(),
          $and: [this.getRevenueDateMatch(startOfTodayVN)],
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
          ...this.getRealizedRevenueMatch(),
          $and: [this.getRevenueDateMatch(startDate, endDate)],
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: { $ifNull: ['$revenueRecognizedAt', '$createdAt'] },
              timezone: 'Asia/Ho_Chi_Minh',
            },
          },
          total: { $sum: '$total' },
          subtotal: { $sum: '$subtotal' },
          discount: {
            $sum: {
              $add: [
                { $ifNull: ['$discount', 0] },
                { $ifNull: ['$loyaltyDiscount', 0] },
              ],
            },
          },
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
          ...this.getRealizedRevenueMatch(),
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
          ...this.getRealizedRevenueMatch(),
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

  async getCategoryRevenue(): Promise<{ category: string; revenue: number }[]> {
    const result = await this.orderModel.aggregate([
      {
        $match: {
          ...this.getRealizedRevenueMatch(),
        },
      },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productDoc',
        },
      },
      {
        $unwind: {
          path: '$productDoc',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'productDoc.category',
          foreignField: '_id',
          as: 'categoryDoc',
        },
      },
      {
        $unwind: {
          path: '$categoryDoc',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: {
            $ifNull: [
              '$items.categoryName',
              { $ifNull: ['$categoryDoc.name', 'Khác'] },
            ],
          },
          revenue: {
            $sum: { $multiply: ['$items.price', '$items.quantity'] },
          },
        },
      },
      {
        $project: {
          _id: 0,
          category: '$_id',
          revenue: '$revenue',
        },
      },
      { $sort: { revenue: -1 } },
    ]);

    return result;
  }

  async getGrowthStats(
    range: 'day' | 'week' | 'month' | 'year' = 'month',
  ): Promise<{
    currentRevenue: number;
    previousRevenue: number;
    revenueGrowthRate: number;
    currentOrders: number;
    previousOrders: number;
    ordersGrowthRate: number;
  }> {
    const now = new Date();
    let currentStart: Date;
    const currentEnd: Date = new Date(now);
    let prevStart: Date;
    let prevEnd: Date;

    if (range === 'day') {
      currentStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        0,
        0,
        0,
        0,
      );
      prevStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - 1,
        0,
        0,
        0,
        0,
      );
      prevEnd = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - 1,
        23,
        59,
        59,
        999,
      );
    } else if (range === 'week') {
      const durationMs = 7 * 24 * 60 * 60 * 1000;
      currentStart = new Date(now.getTime() - durationMs);
      prevStart = new Date(now.getTime() - 2 * durationMs);
      prevEnd = new Date(currentStart.getTime() - 1);
    } else if (range === 'year') {
      const durationMs = 365 * 24 * 60 * 60 * 1000;
      currentStart = new Date(now.getTime() - durationMs);
      prevStart = new Date(now.getTime() - 2 * durationMs);
      prevEnd = new Date(currentStart.getTime() - 1);
    } else {
      const durationMs = 30 * 24 * 60 * 60 * 1000;
      currentStart = new Date(now.getTime() - durationMs);
      prevStart = new Date(now.getTime() - 2 * durationMs);
      prevEnd = new Date(currentStart.getTime() - 1);
    }

    const [currentMetrics, prevMetrics] = await Promise.all([
      this.getMetricsBetween(currentStart, currentEnd),
      this.getMetricsBetween(prevStart, prevEnd),
    ]);

    const currentRevenue = currentMetrics.totalRevenue;
    const previousRevenue = prevMetrics.totalRevenue;
    const currentOrders = currentMetrics.totalOrders;
    const previousOrders = prevMetrics.totalOrders;

    const calcGrowth = (curr: number, prev: number): number => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return Math.round(((curr - prev) / prev) * 1000) / 10;
    };

    return {
      currentRevenue,
      previousRevenue,
      revenueGrowthRate: calcGrowth(currentRevenue, previousRevenue),
      currentOrders,
      previousOrders,
      ordersGrowthRate: calcGrowth(currentOrders, previousOrders),
    };
  }

  private async getMetricsBetween(
    start: Date,
    end: Date,
  ): Promise<{ totalRevenue: number; totalOrders: number }> {
    const result = await this.orderModel.aggregate([
      {
        $match: {
          ...this.getRealizedRevenueMatch(),
          $and: [this.getRevenueDateMatch(start, end)],
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total' },
          totalOrders: { $sum: 1 },
        },
      },
    ]);

    return {
      totalRevenue: result[0]?.totalRevenue || 0,
      totalOrders: result[0]?.totalOrders || 0,
    };
  }

  async generateInvoicePdf(order: any): Promise<any> {
    const doc = new PDFDocument({ margin: 50 });
    const winFont = 'C:\\Windows\\Fonts\\Arial.ttf';
    let fontName = 'Helvetica';
    if (fs.existsSync(winFont)) {
      doc.registerFont('Arial', winFont);
      fontName = 'Arial';
    }

    // Header
    doc
      .font(fontName)
      .fontSize(20)
      .text('NHÀ SÁCH TRƯỜNG THÀNH', 50, 50, { align: 'center' });
    doc
      .fontSize(10)
      .text('HÓA ĐƠN BÁN HÀNG', { align: 'center', underline: true });
    doc.moveDown();

    // Order Meta Info
    doc
      .fontSize(10)
      .text(`Mã đơn hàng: #${order.orderCode}`)
      .text(
        `Ngày đặt: ${new Date(order.createdAt).toLocaleDateString('vi-VN')}`,
      )
      .text(`Khách hàng: ${order.customerName || 'N/A'}`)
      .text(`Điện thoại: ${order.phone || 'N/A'}`)
      .text(`Địa chỉ giao hàng: ${order.shippingAddress || 'N/A'}`)
      .text(`Phương thức thanh toán: ${order.paymentMethod || 'COD'}`);

    // Generate and insert Order QR Code
    try {
      const qrData = `ORDER:${order.orderCode}|TOTAL:${order.total}|CUSTOMER:${order.phone || ''}`;
      const qrDataUrl = await QRCode.toDataURL(qrData, {
        margin: 1,
        width: 80,
      });
      const qrBase64 = qrDataUrl.replace(/^data:image\/png;base64,/, '');
      const qrBuffer = Buffer.from(qrBase64, 'base64');
      doc.image(qrBuffer, 460, 70, { width: 75, height: 75 });
      doc.fontSize(8).text('Quét mã tra cứu', 460, 150, {
        width: 75,
        align: 'center',
      });
    } catch (qrErr) {
      this.logger.warn(
        `Failed to generate QR for invoice #${order.orderCode}`,
        qrErr,
      );
    }

    doc.moveDown();

    // Table Header
    const tableTop = 220;
    doc
      .font(fontName)
      .fontSize(10)
      .text('STT', 50, tableTop, { bold: true } as any)
      .text('Tên sản phẩm', 80, tableTop, { bold: true } as any)
      .text('Số lượng', 300, tableTop, { align: 'right', bold: true } as any)
      .text('Đơn giá', 380, tableTop, { align: 'right', bold: true } as any)
      .text('Thành tiền', 460, tableTop, { align: 'right', bold: true } as any);

    doc.rect(50, tableTop + 15, 500, 1).fill('#cccccc');

    // Table Items
    let y = tableTop + 25;
    order.items?.forEach((item: any, index: number) => {
      doc
        .fontSize(9)
        .text((index + 1).toString(), 50, y)
        .text(item.name || 'Sản phẩm', 80, y, { width: 200 })
        .text(item.quantity.toString(), 300, y, { align: 'right' })
        .text(`${item.price.toLocaleString('vi-VN')} đ`, 380, y, {
          align: 'right',
        })
        .text(
          `${(item.price * item.quantity).toLocaleString('vi-VN')} đ`,
          460,
          y,
          { align: 'right' },
        );
      y += 20;
    });

    // Summary calculation
    y += 10;
    doc.rect(50, y, 500, 1).fill('#cccccc');
    y += 10;

    doc
      .fontSize(10)
      .text('Tạm tính:', 350, y)
      .text(`${(order.subtotal || 0).toLocaleString('vi-VN')} đ`, 460, y, {
        align: 'right',
      });
    y += 18;

    doc
      .text('Phí vận chuyển:', 350, y)
      .text(`${(order.shippingFee || 0).toLocaleString('vi-VN')} đ`, 460, y, {
        align: 'right',
      });
    y += 18;

    if (order.discount && order.discount > 0) {
      doc
        .text(`Giảm giá (${order.promotionCode || 'Khuyến mãi'}):`, 300, y)
        .text(`-${order.discount.toLocaleString('vi-VN')} đ`, 460, y, {
          align: 'right',
        });
      y += 18;
    }

    if (order.loyaltyDiscount && order.loyaltyDiscount > 0) {
      doc
        .text(`Điểm thưởng (${order.loyaltyPointsUsed || 0} điểm):`, 300, y)
        .text(`-${order.loyaltyDiscount.toLocaleString('vi-VN')} đ`, 460, y, {
          align: 'right',
        });
      y += 18;
    }

    doc
      .fontSize(11)
      .text('TỔNG THANH TOÁN:', 320, y, { bold: true } as any)
      .text(`${order.total.toLocaleString('vi-VN')} đ`, 460, y, {
        align: 'right',
        bold: true,
      } as any);

    // Footer note
    doc
      .fontSize(9)
      .text('Cảm ơn quý khách đã mua sắm tại Nhà Sách Trường Thành!', 50, 700, {
        align: 'center',
        italic: true,
      } as any);

    doc.end();
    return doc;
  }
}
