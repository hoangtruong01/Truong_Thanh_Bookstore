import { Injectable, NotFoundException, BadRequestException, Logger, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model } from 'mongoose';
import { createHash, randomBytes, timingSafeEqual } from 'crypto';
import { Order, OrderDocument } from './schemas/order.schema';
import * as PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as QRCode from 'qrcode';
import {
  CreateOrderDto,
  UpdateOrderStatusDto,
  OrderQueryDto,
} from './dto/order.dto';
import { ProductsService } from '../products/products.service';
import { PaginatedResult, paginate } from '../../common/dto/pagination.dto';
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  StaffPermission,
} from '../../common/enums';
import { ConfigService } from '@nestjs/config';
import { PromotionsService } from '../promotions/promotions.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../email/email.service';
import { UsersService } from '../users/users.service';

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
    private emailService: EmailService,
    private usersService: UsersService,
  ) {}

  private generateOrderCode(): string {
    const now = new Date();
    const y = now.getFullYear().toString().slice(-2);
    const m = (now.getMonth() + 1).toString().padStart(2, '0');
    const d = now.getDate().toString().padStart(2, '0');
    const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `TT${y}${m}${d}${rand}`;
  }

  private hashSecret(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  private isTransactionUnsupported(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error);
    return /Transaction numbers are only allowed|replica set|mongos/i.test(message);
  }

  private getEnabledPaymentMethods(): PaymentMethod[] {
    const configured = this.configService
      .get<string>('ENABLED_PAYMENT_METHODS')
      ?.split(',')
      .map((value) => value.trim().toUpperCase())
      .filter((value): value is PaymentMethod =>
        Object.values(PaymentMethod).includes(value as PaymentMethod),
      );
    return configured?.length ? configured : [PaymentMethod.COD];
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

  async create(dto: CreateOrderDto, userId?: string): Promise<any> {
    return this.createAtomic(dto, userId);
  }

  private async createAtomic(dto: CreateOrderDto, userId?: string): Promise<any> {
    const paymentMethod = dto.paymentMethod || PaymentMethod.COD;
    if (!this.getEnabledPaymentMethods().includes(paymentMethod)) {
      throw new BadRequestException(
        'Phương thức thanh toán này chưa được kích hoạt. Vui lòng chọn thanh toán khi nhận hàng.',
      );
    }

    const guestAccessToken = userId
      ? undefined
      : dto.idempotencyKey || randomBytes(32).toString('base64url');
    const idempotencyKeyHash = dto.idempotencyKey
      ? this.hashSecret(dto.idempotencyKey)
      : undefined;

    if (idempotencyKeyHash) {
      const existingQuery = this.orderModel.findOne({
        idempotencyKeyHash,
        ...(userId ? { customer: userId } : { customer: null, phone: dto.phone }),
      });
      if (existingQuery?.exec) {
        const existing = await existingQuery.exec();
        if (existing) {
          const existingResult = existing.toObject
            ? existing.toObject()
            : existing;
          return guestAccessToken
            ? { ...existingResult, guestAccessToken }
            : existingResult;
        }
      }
    }

    const verifiedItems: Array<{
      product: string;
      name: string;
      price: number;
      quantity: number;
      image: string;
    }> = [];
    for (const item of dto.items) {
      const product = await this.productsService.findById(item.product);
      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Sản phẩm "${product.name}" chỉ còn ${product.stock} sản phẩm trong kho`,
        );
      }
      verifiedItems.push({
        product: item.product,
        name: product.name,
        price:
          product.discountPrice > 0 ? product.discountPrice : product.price,
        quantity: item.quantity,
        image: product.images?.[0] || item.image || '',
      });
    }

    const subtotal = verifiedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const shippingFee =
      subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;

    const persist = async (session?: ClientSession): Promise<OrderDocument> => {
      const deductedItems: Array<{ product: string; quantity: number }> = [];
      let promotionConsumed = false;
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

        for (const item of verifiedItems) {
          if (session) {
            await this.productsService.deductStock(
              item.product,
              item.quantity,
              session,
            );
            await this.productsService.incrementSold(
              item.product,
              item.quantity,
              session,
            );
          } else {
            await this.productsService.deductStock(item.product, item.quantity);
            await this.productsService.incrementSold(item.product, item.quantity);
          }
          deductedItems.push({ product: item.product, quantity: item.quantity });
        }

        const order = new this.orderModel({
          orderCode: this.generateOrderCode(),
          customer: userId || null,
          guestAccessTokenHash: guestAccessToken
            ? this.hashSecret(guestAccessToken)
            : undefined,
          idempotencyKeyHash,
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
          total: Math.max(0, subtotal + shippingFee - discount),
          promotionCode: dto.promotionCode?.toUpperCase(),
          timeline: [
            {
              status: OrderStatus.PENDING,
              note: 'Đơn hàng được tạo thành công, chờ xác nhận.',
              createdAt: new Date(),
            },
          ],
        });
        return await order.save(session ? { session } : undefined);
      } catch (error) {
        if (!session) {
          for (const deducted of deductedItems.reverse()) {
            await this.productsService
              .updateStock(deducted.product, deducted.quantity)
              .catch((rollbackError) =>
                this.logger.error('Stock rollback failed', rollbackError),
              );
            await this.productsService
              .incrementSold(deducted.product, -deducted.quantity)
              .catch((rollbackError) =>
                this.logger.error('Sold counter rollback failed', rollbackError),
              );
          }
          if (promotionConsumed && dto.promotionCode) {
            await this.promotionsService
              .releaseUsage(dto.promotionCode)
              .catch((rollbackError) =>
                this.logger.error('Promotion rollback failed', rollbackError),
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
      const points = Math.floor(savedOrder.total / 1000);
      if (points > 0) {
        await this.usersService.addLoyaltyPoints(userId, points).catch((error) =>
          this.logger.error('Failed to add loyalty points', error),
        );
      }
      this.notificationsService.create({
        userId,
        title: 'Đặt hàng thành công',
        message: `Đơn hàng #${savedOrder.orderCode} đã được tiếp nhận.`,
        type: 'order',
        meta: {
          orderId: savedOrder._id.toString(),
          orderCode: savedOrder.orderCode,
        },
      }).catch((error) =>
        this.logger.error('Failed to create order notification', error),
      );
    }

    this.syncToGoogleSheet(savedOrder).catch((error) =>
      this.logger.error('Sheet sync failed', error),
    );

    let emailRecipient: string | undefined = savedOrder.customerEmail;
    if (!emailRecipient && userId) {
      const user = await this.usersService.findById(userId).catch(() => null);
      emailRecipient = user?.email;
    }
    if (emailRecipient) {
      this.emailService
        .sendOrderConfirmationEmail(emailRecipient, savedOrder)
        .catch((error) =>
          this.logger.error('Failed to send confirmation email', error),
        );
    }

    const result = savedOrder.toObject ? savedOrder.toObject() : savedOrder;
    return guestAccessToken ? { ...result, guestAccessToken } : result;
  }

  /** @deprecated Kept temporarily for safe comparison during migration. */
  private async createLegacy(dto: CreateOrderDto, userId?: string): Promise<OrderDocument> {
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
        dto.customerEmail,
        dto.phone,
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

    // Award loyalty points
    if (userId) {
      const points = Math.floor(savedOrder.total / 1000);
      if (points > 0) {
        await this.usersService.addLoyaltyPoints(userId, points).catch((err) =>
          this.logger.error(`Failed to add loyalty points for user ${userId}:`, err)
        );
      }
    }

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

    // Send confirmation email (async)
    let emailRecipient = savedOrder.customerEmail;
    if (!emailRecipient && userId) {
      try {
        const user = await this.orderModel.db.model('User').findById(userId).exec();
        if (user) {
          emailRecipient = user.email;
        }
      } catch (err) {
        this.logger.error('Failed to fetch user email for confirmation:', err);
      }
    }

    if (emailRecipient) {
      this.emailService.sendOrderConfirmationEmail(emailRecipient, savedOrder).catch((err) => {
        this.logger.error(`Failed to send order confirmation email to ${emailRecipient}:`, err);
      });
    }

    return savedOrder;
  }

  async findAll(query: OrderQueryDto): Promise<PaginatedResult<OrderDocument>> {
    const { page = 1, limit = 10, status, search } = query;
    const filter: any = {};

    if (status) filter.orderStatus = status;
    if (search) {
      const safeSearch = search.substring(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

  async findById(id: string, userId?: string, userRole?: string): Promise<OrderDocument> {
    const order = await this.orderModel
      .findById(id)
      .populate('customer', 'fullName email phone')
      .exec();
    if (!order) throw new NotFoundException('Order not found');

    if (
      userId &&
      userRole !== 'ADMIN' &&
      userRole !== 'STAFF' &&
      order.customer &&
      order.customer._id.toString() !== userId.toString()
    ) {
      throw new ForbiddenException('Bạn không có quyền xem thông tin đơn hàng này');
    }

    return order;
  }

  async findByIdForActor(
    id: string,
    actor: { _id: string; role: string; permissions?: string[] },
  ): Promise<OrderDocument> {
    const order = await this.findById(id);
    if (actor.role === 'ADMIN') return order;
    if (
      actor.role === 'STAFF' &&
      actor.permissions?.includes(StaffPermission.MANAGE_ORDERS)
    ) {
      return order;
    }
    const customerId = order.customer
      ? ((order.customer as any)._id || order.customer).toString()
      : undefined;
    if (actor.role !== 'CUSTOMER' || customerId !== actor._id.toString()) {
      throw new ForbiddenException('Bạn không có quyền xem thông tin đơn hàng này');
    }
    return order;
  }

  async findGuestById(id: string, accessToken?: string): Promise<OrderDocument> {
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

  async updateStatus(
    id: string,
    dto: UpdateOrderStatusDto,
  ): Promise<OrderDocument> {
    const order = await this.orderModel.findById(id).exec();
    if (!order) throw new NotFoundException('Order not found');

    const oldStatus = order.orderStatus;
    const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.SHIPPING, OrderStatus.CANCELLED],
      [OrderStatus.SHIPPING]: [OrderStatus.COMPLETED],
      [OrderStatus.COMPLETED]: [],
      [OrderStatus.CANCELLED]: [],
    };
    if (!allowedTransitions[oldStatus]?.includes(dto.orderStatus)) {
      throw new BadRequestException(
        `Không thể chuyển trạng thái từ ${oldStatus} sang ${dto.orderStatus}`,
      );
    }
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

      // Deduct loyalty points if order was placed by a registered user
      if (order.customer) {
        const points = Math.floor(order.total / 1000);
        if (points > 0) {
          await this.usersService.deductLoyaltyPoints(
            order.customer.toString(),
            points,
          ).catch((err) =>
            this.logger.error(`Failed to deduct loyalty points for user ${order.customer}:`, err)
          );
        }
      }
    }

    // If completed, mark as paid
    if (
      dto.orderStatus === OrderStatus.COMPLETED &&
      order.paymentMethod === PaymentMethod.COD
    ) {
      order.paymentStatus = PaymentStatus.PAID;
    }

    const savedOrder = await order.save();

    // Sync to Google Sheet (async)
    this.syncToGoogleSheet(savedOrder).catch((err) => this.logger.error('Sheet sync failed', err));

    if (savedOrder.customer && savedOrder.orderStatus !== oldStatus) {
      const customerId = savedOrder.customer.toString();
      
      // Ensure customer is populated to get email
      if (typeof savedOrder.customer === 'object' && !(savedOrder.customer as any).email) {
        await savedOrder.populate('customer', 'fullName email');
      }
      
      const customerObj = savedOrder.customer as any;
      const customerEmail = customerObj.email || savedOrder.customerEmail;

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

        // Send email notification (async)
        if (customerEmail) {
          this.emailService.sendOrderStatusEmail(customerEmail, savedOrder, statusText).catch((err) => {
            this.logger.error(`Failed to send order status email to ${customerEmail}:`, err);
          });
        }
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

  async cancelForActor(
    id: string,
    actor: { _id: string; role: string; permissions?: string[] },
  ): Promise<OrderDocument> {
    const order = await this.orderModel.findById(id).exec();
    if (!order) throw new NotFoundException('Order not found');

    const isAdmin = actor.role === 'ADMIN';
    const isAuthorizedStaff =
      actor.role === 'STAFF' &&
      actor.permissions?.includes(StaffPermission.MANAGE_ORDERS);
    const isOwner =
      actor.role === 'CUSTOMER' &&
      !!order.customer &&
      order.customer.toString() === actor._id.toString();
    if (!isAdmin && !isAuthorizedStaff && !isOwner) {
      throw new ForbiddenException('Bạn không có quyền hủy đơn hàng này');
    }
    if (order.orderStatus !== OrderStatus.PENDING) {
      throw new BadRequestException(
        'Chỉ có thể hủy đơn hàng ở trạng thái Chờ xử lý',
      );
    }
    return this.updateStatus(id, { orderStatus: OrderStatus.CANCELLED });
  }

  async cancelGuest(id: string, accessToken?: string): Promise<OrderDocument> {
    const order = await this.findGuestById(id, accessToken);
    if (order.orderStatus !== OrderStatus.PENDING) {
      throw new BadRequestException(
        'Chỉ có thể hủy đơn hàng ở trạng thái Chờ xử lý',
      );
    }
    return this.updateStatus(id, { orderStatus: OrderStatus.CANCELLED });
  }

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
          createdAt: { $gte: startOfTodayVN },
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
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Asia/Ho_Chi_Minh' } },
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

    // Generate QR Code data URL dynamically
    let qrDataUrl = '';
    try {
      const orderIdStr = order._id ? order._id.toString() : '';
      const qrText = `${this.configService.get('FRONTEND_URL') || 'http://localhost:5173'}/my-orders/${orderIdStr}`;
      qrDataUrl = await QRCode.toDataURL(qrText, { margin: 1, width: 100 });
    } catch (err) {
      this.logger.error('Failed to generate QR Code for invoice:', err);
    }

    // Summary Info
    doc.fontSize(10);
    
    // Draw QR code if generated
    if (qrDataUrl) {
      doc.image(qrDataUrl, startX, startY, { width: 80 });
      doc.fontSize(7).text('Quét tra cứu đơn hàng', startX, startY + 85, { width: 80, align: 'center' });
    }

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

    doc.moveDown(3);
    doc.fontSize(10).text('Cảm ơn quý khách đã tin tưởng và mua sắm tại Trường Thành Bookstore!', { align: 'center' });

    return doc;
  }
}
