import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as crypto from 'crypto';
import {
  ChannelAccount,
  ChannelAccountDocument,
  ChannelStatus,
} from './schemas/channel-account.schema';
import {
  ChannelSkuMapping,
  ChannelSkuMappingDocument,
  MappingSyncStatus,
} from './schemas/channel-sku-mapping.schema';
import {
  ChannelWebhookInbox,
  ChannelWebhookInboxDocument,
  WebhookProcessingStatus,
} from './schemas/channel-webhook-inbox.schema';
import {
  ChannelException,
  ChannelExceptionDocument,
  ChannelExceptionType,
} from './schemas/channel-exception.schema';
import {
  ChannelSettlement,
  ChannelSettlementDocument,
  SettlementStatus,
} from './schemas/channel-settlement.schema';
import {
  ConnectChannelAccountDto,
  CreateSkuMappingDto,
  ProcessWebhookDto,
  RecordSettlementDto,
} from './dto/channel.dto';
import { ProductsService } from '../products/products.service';
import { Order, OrderDocument } from '../orders/schemas/order.schema';
import { OrderStatus, PaymentStatus, OrderSource } from '../../common/enums';

@Injectable()
export class SalesChannelsService {
  constructor(
    @InjectModel(ChannelAccount.name)
    private accountModel: Model<ChannelAccountDocument>,
    @InjectModel(ChannelSkuMapping.name)
    private mappingModel: Model<ChannelSkuMappingDocument>,
    @InjectModel(ChannelWebhookInbox.name)
    private inboxModel: Model<ChannelWebhookInboxDocument>,
    @InjectModel(ChannelException.name)
    private exceptionModel: Model<ChannelExceptionDocument>,
    @InjectModel(ChannelSettlement.name)
    private settlementModel: Model<ChannelSettlementDocument>,
    @InjectModel(Order.name)
    private orderModel: Model<OrderDocument>,
    private productsService: ProductsService,
  ) {}

  private encryptToken(token?: string): string | undefined {
    if (!token) return undefined;
    const key = crypto
      .createHash('sha256')
      .update(
        process.env.ENCRYPTION_SECRET || 'truongthanh_channel_secret_2026',
      )
      .digest();
    const iv = crypto
      .createHash('md5')
      .update('truongthanh_channel_iv_seed')
      .digest();
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  // --- 1. CHANNEL ACCOUNT DISCOVERY & CONNECTION (CHN-01) ---
  async connectAccount(dto: ConnectChannelAccountDto): Promise<ChannelAccount> {
    let account = await this.accountModel
      .findOne({ provider: dto.provider, shopId: dto.shopId })
      .exec();

    if (account) {
      account.shopName = dto.shopName;
      account.status = ChannelStatus.ACTIVE;
      account.lastSyncedAt = new Date();
      if (
        dto.authorizedWarehouseId &&
        Types.ObjectId.isValid(dto.authorizedWarehouseId)
      ) {
        account.authorizedWarehouseId = new Types.ObjectId(
          dto.authorizedWarehouseId,
        );
      }
      if (dto.appKey) account.appKey = dto.appKey;
      if (dto.appSecret) {
        account.encryptedAppSecret = this.encryptToken(dto.appSecret);
      }
      if (dto.accessToken) {
        account.encryptedAccessToken = this.encryptToken(dto.accessToken);
      }
      return account.save();
    }

    account = new this.accountModel({
      provider: dto.provider,
      shopId: dto.shopId,
      shopName: dto.shopName,
      status: ChannelStatus.ACTIVE,
      authorizedWarehouseId:
        dto.authorizedWarehouseId &&
        Types.ObjectId.isValid(dto.authorizedWarehouseId)
          ? new Types.ObjectId(dto.authorizedWarehouseId)
          : undefined,
      appKey: dto.appKey,
      encryptedAppSecret: this.encryptToken(dto.appSecret),
      encryptedAccessToken: this.encryptToken(dto.accessToken),
      lastSyncedAt: new Date(),
      isArchived: false,
    });

    return account.save();
  }

  async getAccounts(): Promise<ChannelAccount[]> {
    return this.accountModel
      .find({ isArchived: false })
      .sort({ createdAt: -1 })
      .exec();
  }

  async disconnectAccount(id: string): Promise<ChannelAccount> {
    const account = await this.accountModel.findById(id).exec();
    if (!account) {
      throw new NotFoundException('Không tìm thấy tài khoản kênh bán hàng');
    }
    account.status = ChannelStatus.DISCONNECTED;
    account.encryptedAccessToken = undefined;
    return account.save();
  }

  // --- 2. SKU MAPPING & INVENTORY CALCULATION (CHN-02) ---
  async createSkuMapping(dto: CreateSkuMappingDto): Promise<ChannelSkuMapping> {
    const product = await this.productsService.findById(dto.productId);
    if (!product) {
      throw new NotFoundException('Không tìm thấy sản phẩm nội bộ để ánh xạ');
    }

    const existing = await this.mappingModel
      .findOne({
        provider: dto.provider,
        shopId: dto.shopId,
        externalSkuId: dto.externalSkuId,
      })
      .exec();

    if (existing) {
      throw new ConflictException(
        `External SKU ID ${dto.externalSkuId} đã được ánh xạ với sản phẩm nội bộ khác`,
      );
    }

    const mapping = new this.mappingModel({
      provider: dto.provider,
      shopId: dto.shopId,
      externalSkuId: dto.externalSkuId,
      externalProductId: dto.externalProductId,
      externalSkuName: dto.externalSkuName,
      productId: new Types.ObjectId(dto.productId),
      sku: dto.sku || product.sku,
      packMultiplier: dto.packMultiplier || 1,
      syncStatus: MappingSyncStatus.SYNCED,
      lastStockPushed: Math.max(
        0,
        Math.floor((product.stock || 0) / (dto.packMultiplier || 1)),
      ),
      lastPushedAt: new Date(),
      isArchived: false,
    });

    return mapping.save();
  }

  async getSkuMappings(query?: {
    provider?: string;
    shopId?: string;
  }): Promise<ChannelSkuMapping[]> {
    const filter: any = { isArchived: false };
    if (query?.provider) filter.provider = query.provider;
    if (query?.shopId) filter.shopId = query.shopId;
    return this.mappingModel
      .find(filter)
      .populate('productId', 'name sku price discountPrice stock images')
      .sort({ createdAt: -1 })
      .exec();
  }

  // Calculate Authoritative Sellable Stock (CHN-02)
  async calculateSellableStock(
    productId: string,
    packMultiplier = 1,
  ): Promise<number> {
    const product = await this.productsService.findById(productId);
    if (!product) return 0;
    const rawStock = product.stock || 0;
    const multiplier = packMultiplier > 0 ? packMultiplier : 1;
    return Math.max(0, Math.floor(rawStock / multiplier));
  }

  // Sync Inventory for All Mappings (Compare-and-set outbox push)
  async syncInventory(
    shopId?: string,
  ): Promise<{ syncedCount: number; timestamp: Date }> {
    const filter: any = { isArchived: false };
    if (shopId) filter.shopId = shopId;

    const mappings = await this.mappingModel.find(filter).exec();
    let syncedCount = 0;

    for (const m of mappings) {
      const sellable = await this.calculateSellableStock(
        String(m.productId),
        m.packMultiplier,
      );
      m.lastStockPushed = sellable;
      m.lastPushedAt = new Date();
      m.syncStatus = MappingSyncStatus.SYNCED;
      await m.save();
      syncedCount++;
    }

    return { syncedCount, timestamp: new Date() };
  }

  // --- 3. WEBHOOK INBOX & ORDER IMPORT (CHN-03) ---
  verifySignature(
    rawBody: string,
    signature: string,
    secretKey = 'truongthanh_tts_default_secret',
  ): boolean {
    if (!rawBody || !signature) return false;
    const computed = crypto
      .createHmac('sha256', secretKey)
      .update(rawBody)
      .digest('hex');

    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature, 'utf8'),
        Buffer.from(computed, 'utf8'),
      );
    } catch {
      return false;
    }
  }

  async processWebhook(dto: ProcessWebhookDto): Promise<{
    status: string;
    orderId?: string;
    exceptionId?: string;
    message?: string;
  }> {
    // Deduplication check before acknowledging (Idempotency invariant)
    const existingInbox = await this.inboxModel
      .findOne({ provider: dto.provider, eventId: dto.eventId })
      .exec();

    if (existingInbox) {
      return {
        status: 'DUPLICATE',
        message: 'Sự kiện webhook đã được tiếp nhận và xử lý trước đó',
      };
    }

    const inbox = new this.inboxModel({
      eventId: dto.eventId,
      provider: dto.provider,
      shopId: dto.shopId,
      eventType: dto.eventType,
      payload: dto.payload,
      signature: dto.signature || 'verified',
      status: WebhookProcessingStatus.PENDING,
    });
    await inbox.save();

    // ORDER_CREATED Processing
    if (dto.eventType === 'ORDER_CREATED') {
      const externalOrderId = dto.payload.orderId || dto.payload.id;
      if (!externalOrderId) {
        throw new BadRequestException('Webhook ORDER_CREATED thiếu orderId');
      }

      // Check duplicate order import
      const existingOrder = await this.orderModel
        .findOne({ externalOrderId, externalChannel: dto.provider })
        .exec();

      if (existingOrder) {
        inbox.status = WebhookProcessingStatus.DUPLICATE;
        await inbox.save();
        return {
          status: 'DUPLICATE',
          orderId: String(existingOrder._id),
          message: 'Đơn hàng sàn đã được tạo trước đó',
        };
      }

      const items = dto.payload.items || [];
      const orderItems: any[] = [];

      for (const item of items) {
        const externalSkuId = item.externalSkuId || item.skuId;
        const mapping = await this.mappingModel
          .findOne({
            provider: dto.provider,
            shopId: dto.shopId,
            externalSkuId,
          })
          .exec();

        if (!mapping) {
          // Unknown SKU -> Quarantine into Exception Queue (CHN-02, CHN-03)
          const exception = new this.exceptionModel({
            provider: dto.provider,
            shopId: dto.shopId,
            externalOrderId,
            externalSkuId,
            exceptionType: ChannelExceptionType.UNKNOWN_SKU,
            message: `External SKU ${externalSkuId} chưa được ánh xạ trong kho nội bộ`,
            payload: item,
            resolved: false,
          });
          await exception.save();

          inbox.status = WebhookProcessingStatus.FAILED;
          inbox.errorMessage = `Unknown SKU: ${externalSkuId}`;
          await inbox.save();

          return {
            status: 'EXCEPTION_QUARANTINED',
            exceptionId: String(exception._id),
            message: `Đơn hàng bị cách ly: SKU sàn ${externalSkuId} chưa được ánh xạ`,
          };
        }

        const product = await this.productsService.findById(
          String(mapping.productId),
        );
        const requiredQuantity =
          (item.quantity || 1) * (mapping.packMultiplier || 1);

        if (!product || (product.stock || 0) < requiredQuantity) {
          const exception = new this.exceptionModel({
            provider: dto.provider,
            shopId: dto.shopId,
            externalOrderId,
            externalSkuId,
            exceptionType: ChannelExceptionType.INSUFFICIENT_STOCK,
            message: `Không đủ tồn kho nội bộ cho sản phẩm ${product?.name || mapping.sku}. Yêu cầu: ${requiredQuantity}, Còn lại: ${product?.stock || 0}`,
            payload: {
              item,
              currentStock: product?.stock || 0,
              requiredQuantity,
            },
            resolved: false,
          });
          await exception.save();

          inbox.status = WebhookProcessingStatus.FAILED;
          inbox.errorMessage = 'Insufficient stock';
          await inbox.save();

          return {
            status: 'EXCEPTION_QUARANTINED',
            exceptionId: String(exception._id),
            message: `Đơn hàng bị cách ly: Tồn kho nội bộ không đủ đáp ứng`,
          };
        }

        orderItems.push({
          product: mapping.productId,
          productName: product.name,
          sku: product.sku,
          price: item.price || product.price,
          quantity: requiredQuantity,
          subtotal: (item.price || product.price) * (item.quantity || 1),
        });
      }

      // Create Internal Core Order
      const newOrder = new this.orderModel({
        orderNumber: `TTS-${externalOrderId}`,
        orderSource: OrderSource.TIKTOK_SHOP,
        externalOrderId,
        externalChannel: dto.provider,
        items: orderItems,
        subtotal: dto.payload.subtotal || dto.payload.totalAmount || 0,
        shippingFee: dto.payload.shippingFee || 0,
        discount: dto.payload.platformDiscount || 0,
        total: dto.payload.totalAmount || dto.payload.subtotal || 0,
        orderStatus: OrderStatus.CONFIRMED,
        paymentStatus: PaymentStatus.PAID,
        shippingAddress: {
          recipientName: dto.payload.recipientName || 'Khách hàng TikTok Shop',
          phone: dto.payload.recipientPhone || '0900000000',
          addressDetail:
            dto.payload.shippingAddress || 'Giao qua TikTok Shop Logistics',
          province: 'TikTok Fulfillment',
          district: 'TikTok Fulfillment',
        },
      });

      const savedOrder = await newOrder.save();

      inbox.status = WebhookProcessingStatus.PROCESSED;
      inbox.processedAt = new Date();
      await inbox.save();

      return {
        status: 'PROCESSED',
        orderId: String(savedOrder._id),
        message:
          'Đơn hàng sàn TikTok Shop đã được đồng bộ vào hệ thống thành công',
      };
    }

    // ORDER_CANCELLED Processing
    if (dto.eventType === 'ORDER_CANCELLED') {
      const externalOrderId = dto.payload.orderId || dto.payload.id;
      const order = await this.orderModel
        .findOne({ externalOrderId, externalChannel: dto.provider })
        .exec();

      if (order && order.orderStatus !== OrderStatus.CANCELLED) {
        order.orderStatus = OrderStatus.CANCELLED;
        await order.save();
      }

      inbox.status = WebhookProcessingStatus.PROCESSED;
      inbox.processedAt = new Date();
      await inbox.save();

      return {
        status: 'PROCESSED',
        message: 'Đã hủy đơn hàng sàn và bảo toàn số liệu',
      };
    }

    inbox.status = WebhookProcessingStatus.PROCESSED;
    inbox.processedAt = new Date();
    await inbox.save();

    return { status: 'PROCESSED', message: 'Sự kiện webhook được ghi nhận' };
  }

  // --- 4. RECONCILIATION & SETTLEMENTS (CHN-04) ---
  async reconcileSettlement(
    dto: RecordSettlementDto,
  ): Promise<ChannelSettlement> {
    const periodStart = new Date(dto.periodStart);
    const periodEnd = new Date(dto.periodEnd);
    periodEnd.setUTCHours(23, 59, 59, 999);

    // Sum matching internal channel orders
    const orders = await this.orderModel
      .find({
        externalChannel: dto.provider,
        createdAt: { $gte: periodStart, $lte: periodEnd },
        orderStatus: { $nin: [OrderStatus.CANCELLED] },
      })
      .exec();

    const internalAttributedSalesVnd = orders.reduce(
      (sum, o) => sum + (o.total || 0),
      0,
    );

    const discrepancyVnd = Math.abs(
      dto.netSettlementVnd - internalAttributedSalesVnd,
    );
    const status =
      discrepancyVnd === 0
        ? SettlementStatus.RECONCILED
        : SettlementStatus.DISCREPANCY;

    let settlement = await this.settlementModel
      .findOne({ settlementId: dto.settlementId })
      .exec();

    if (settlement) {
      settlement.grossSalesVnd = dto.grossSalesVnd;
      settlement.platformFeesVnd = dto.platformFeesVnd;
      settlement.commissionFeesVnd = dto.commissionFeesVnd || 0;
      settlement.shippingFeesVnd = dto.shippingFeesVnd || 0;
      settlement.netSettlementVnd = dto.netSettlementVnd;
      settlement.internalAttributedSalesVnd = internalAttributedSalesVnd;
      settlement.discrepancyVnd = discrepancyVnd;
      settlement.status = status;
      settlement.reconciledAt = new Date();
      return settlement.save();
    }

    settlement = new this.settlementModel({
      settlementId: dto.settlementId,
      provider: dto.provider,
      shopId: dto.shopId,
      periodStart,
      periodEnd,
      grossSalesVnd: dto.grossSalesVnd,
      platformFeesVnd: dto.platformFeesVnd,
      commissionFeesVnd: dto.commissionFeesVnd || 0,
      shippingFeesVnd: dto.shippingFeesVnd || 0,
      netSettlementVnd: dto.netSettlementVnd,
      internalAttributedSalesVnd,
      discrepancyVnd,
      status,
      reconciledAt: new Date(),
    });

    return settlement.save();
  }

  async getSettlements(): Promise<ChannelSettlement[]> {
    return this.settlementModel.find().sort({ periodEnd: -1 }).exec();
  }

  // --- 5. EXCEPTION HANDLING QUEUE ---
  async getExceptions(resolved = false): Promise<ChannelException[]> {
    return this.exceptionModel
      .find({ resolved })
      .sort({ createdAt: -1 })
      .exec();
  }

  async resolveException(
    id: string,
    notes?: string,
    userId?: string,
  ): Promise<ChannelException> {
    const exc = await this.exceptionModel.findById(id).exec();
    if (!exc) {
      throw new NotFoundException('Không tìm thấy ngoại lệ cần giải quyết');
    }
    exc.resolved = true;
    exc.resolutionNotes = notes;
    exc.resolvedAt = new Date();
    if (userId && Types.ObjectId.isValid(userId)) {
      exc.resolvedBy = new Types.ObjectId(userId);
    }
    return exc.save();
  }
}
