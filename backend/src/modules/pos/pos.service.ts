import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection, Types, ClientSession } from 'mongoose';
import {
  POSOrder,
  POSOrderDocument,
  POSOrderStatus,
  POSCustomerType,
  POSItemCondition,
} from './schemas/pos-order.schema';
import {
  CreatePOSOrderDto,
  RefundPOSOrderDto,
  POSOrderQueryDto,
  POSSessionReportQueryDto,
} from './dto/pos.dto';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import {
  Inventory,
  InventoryDocument,
  InventoryTransaction,
  InventoryTransactionDocument,
} from '../inventory/schemas/inventory.schema';
import { ProductsService } from '../products/products.service';
import { InventoryService } from '../inventory/inventory.service';
import {
  InventoryTransactionType,
  OrderSource,
  PaymentMethod,
  PaymentStatus,
  ProductStatus,
  UserRole,
} from '../../common/enums';
import { PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class PosService {
  private readonly logger = new Logger(PosService.name);

  constructor(
    @InjectModel(POSOrder.name)
    private readonly posOrderModel: Model<POSOrderDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(Inventory.name)
    private readonly inventoryModel: Model<InventoryDocument>,
    @InjectModel(InventoryTransaction.name)
    private readonly transactionModel: Model<InventoryTransactionDocument>,
    @InjectConnection()
    private readonly connection: Connection,
    private readonly productsService: ProductsService,
    private readonly inventoryService: InventoryService,
  ) {}

  /**
   * Sinh mã hóa đơn bán hàng POS duy nhất: HD + YYMMDD + -XXXX
   * Ví dụ: HD261030-0001
   */
  private async generateInvoiceCode(session?: ClientSession): Promise<string> {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const datePrefix = `HD${yy}${mm}${dd}`;

    const query = this.posOrderModel.countDocuments({
      invoiceCode: { $regex: `^${datePrefix}` },
    });
    if (session) query.session(session);
    const countToday = await query.exec();

    let seq = countToday + 1;
    let code = `${datePrefix}-${String(seq).padStart(4, '0')}`;

    // Kiểm tra chống trùng mã hóa đơn
    let existsQuery = this.posOrderModel.findOne({ invoiceCode: code });
    if (session) existsQuery.session(session);
    while (await existsQuery.exec()) {
      seq++;
      code = `${datePrefix}-${String(seq).padStart(4, '0')}`;
      existsQuery = this.posOrderModel.findOne({ invoiceCode: code });
      if (session) existsQuery.session(session);
    }

    return code;
  }

  /**
   * POS-01 & TT-021: Tạo hóa đơn bán hàng quầy POS với giao dịch trừ kho nguyên tử
   */
  async createPOSOrder(
    dto: CreatePOSOrderDto,
    cashier: { _id: string; fullName?: string; name?: string; role?: string },
  ): Promise<POSOrderDocument> {
    const cashierId = new Types.ObjectId(cashier._id);
    const cashierName =
      cashier.fullName || cashier.name || 'Nhân viên thu ngân';

    // 1. Chống gửi lại yêu cầu trùng lặp qua Idempotency Key (TT-005)
    if (dto.idempotencyKey && dto.idempotencyKey.trim()) {
      const existing = await this.posOrderModel
        .findOne({ idempotencyKey: dto.idempotencyKey.trim() })
        .exec();
      if (existing) {
        this.logger.log(
          `Idempotent POS order replay for key: ${dto.idempotencyKey}`,
        );
        return existing;
      }
    }

    // 2. Kiểm tra danh sách sản phẩm và tính toán giá trị
    const orderItems: Array<{
      product: Types.ObjectId;
      sku: string;
      name: string;
      unit: string;
      conversionRatio: number;
      quantity: number;
      baseQuantity: number;
      unitPrice: number;
      costPrice: number;
      discount: number;
      lineTotal: number;
      returnedQuantity: number;
    }> = [];

    let calculatedSubtotal = 0;

    for (const itemDto of dto.items) {
      if (!Types.ObjectId.isValid(itemDto.productId)) {
        throw new BadRequestException(
          `ID sản phẩm không hợp lệ: ${itemDto.productId}`,
        );
      }

      const product = await this.productModel
        .findById(itemDto.productId)
        .exec();
      if (!product || product.isDeleted) {
        throw new NotFoundException(
          `Sản phẩm không tồn tại hoặc đã bị xóa (ID: ${itemDto.productId})`,
        );
      }

      if (product.status === ProductStatus.INACTIVE) {
        throw new BadRequestException(
          `Sản phẩm "${product.name}" đã ngừng kinh doanh, không thể bán tại quầy`,
        );
      }

      // POS-05: Quy đổi đơn vị tính
      let conversionRatio = 1;
      let finalUnit = product.unit || 'cái';
      let unitPrice =
        product.discountPrice > 0 ? product.discountPrice : product.price;

      if (
        itemDto.unit &&
        itemDto.unit.trim().toLowerCase() !==
          (product.unit || 'cái').toLowerCase()
      ) {
        const matchedConversion = product.unitConversions?.find(
          (c) => c.unit.toLowerCase() === itemDto.unit!.trim().toLowerCase(),
        );
        if (matchedConversion) {
          conversionRatio = matchedConversion.ratio || 1;
          finalUnit = matchedConversion.unit;
          if (matchedConversion.price && matchedConversion.price > 0) {
            unitPrice = matchedConversion.price;
          } else {
            unitPrice = unitPrice * conversionRatio;
          }
        } else {
          conversionRatio = itemDto.conversionRatio || 1;
          finalUnit = itemDto.unit.trim();
        }
      }

      // POS-06: Bảng giá bán sỉ
      const isWholesale =
        dto.customerType === POSCustomerType.WHOLESALE ||
        (product.wholesaleMinQuantity &&
          product.wholesaleMinQuantity > 1 &&
          itemDto.quantity >= product.wholesaleMinQuantity);

      if (isWholesale && product.wholesalePrice && product.wholesalePrice > 0) {
        unitPrice = product.wholesalePrice * conversionRatio;
      }

      const baseQuantity = itemDto.quantity * conversionRatio;

      // Kiểm tra tồn kho trước khi vào transaction
      const inventory = await this.inventoryModel
        .findOne({ product: product._id })
        .exec();
      const currentStock = inventory?.currentStock ?? product.stock ?? 0;

      if (currentStock < baseQuantity) {
        throw new BadRequestException(
          `Sản phẩm "${product.name}" chỉ còn ${currentStock} ${product.unit || 'cái'} trong kho, không đủ bán ${baseQuantity} ${product.unit || 'cái'}`,
        );
      }

      // Giá vốn (cost price snapshot)
      const costPrice = inventory?.costPrice || 0;
      const itemDiscount = itemDto.discount ? Math.max(0, itemDto.discount) : 0;
      const lineTotal = Math.max(
        0,
        unitPrice * itemDto.quantity - itemDiscount,
      );

      calculatedSubtotal += lineTotal;

      orderItems.push({
        product: product._id,
        sku: product.sku || '',
        name: product.name,
        unit: finalUnit,
        conversionRatio,
        quantity: itemDto.quantity,
        baseQuantity,
        unitPrice,
        costPrice,
        discount: itemDiscount,
        lineTotal,
        returnedQuantity: 0,
      });
    }

    // 3. Tính toán tổng chiết khấu đơn và số tiền thanh toán
    let discountAmount = dto.discountAmount
      ? Math.max(0, dto.discountAmount)
      : 0;
    if (dto.discountType === 'PERCENT') {
      discountAmount = Math.round((calculatedSubtotal * discountAmount) / 100);
    }
    if (discountAmount > calculatedSubtotal) {
      discountAmount = calculatedSubtotal;
    }

    // POS-08: Giảm giá vượt 20% yêu cầu quyền quản lý (ADMIN/SUPER_ADMIN)
    if (discountAmount > calculatedSubtotal * 0.2) {
      const isManager =
        cashier.role === UserRole.ADMIN ||
        cashier.role === UserRole.SUPER_ADMIN;
      if (
        !isManager &&
        (!dto.discountReason || dto.discountReason.trim().length < 5)
      ) {
        throw new ForbiddenException(
          'Chiết khấu đơn hàng trên 20% cần có lý do phê duyệt của Quản lý cửa hàng',
        );
      }
    }

    const finalAmount = Math.max(0, calculatedSubtotal - discountAmount);

    let cashGiven = dto.cashGiven ?? finalAmount;
    let changeGiven = 0;
    if (dto.paymentMethod === PaymentMethod.CASH || !dto.paymentMethod) {
      if (cashGiven >= finalAmount) {
        changeGiven = cashGiven - finalAmount;
      } else {
        cashGiven = finalAmount;
      }
    }

    // 4. Thực thi giao dịch MongoDB Transaction nguyên tử
    const session = await this.connection.startSession();
    try {
      session.startTransaction();

      const invoiceCode = await this.generateInvoiceCode(session);

      // Trừ kho nguyên tử và ghi nhận lịch sử biến động kho (SALE)
      for (const item of orderItems) {
        // Lấy tồn hiện tại trước khi trừ
        const invBefore = await this.inventoryModel
          .findOne({ product: item.product })
          .session(session)
          .exec();
        const stockBefore = invBefore?.currentStock ?? 0;

        // Trừ tồn sản phẩm và kho
        await this.productsService.deductStock(
          item.product.toString(),
          item.baseQuantity,
          session,
        );
        await this.productsService.incrementSold(
          item.product.toString(),
          item.baseQuantity,
          session,
        );

        // Ghi lịch sử xuất kho liên kết mã hóa đơn POS (TT-021)
        await this.transactionModel.create(
          [
            {
              product: item.product,
              type: InventoryTransactionType.SALE,
              quantity: item.baseQuantity,
              change: -item.baseQuantity,
              stockBefore,
              stockAfter: stockBefore - item.baseQuantity,
              note: `Bán lẻ tại quầy POS: ${invoiceCode} (${item.quantity} ${item.unit})`,
              reference: invoiceCode,
              createdBy: cashierId,
            },
          ],
          { session },
        );
      }

      // Tạo bản ghi hóa đơn POSOrder
      const [savedOrder] = await this.posOrderModel.create(
        [
          {
            invoiceCode,
            orderSource: OrderSource.POS,
            cashier: cashierId,
            cashierName,
            customerName: dto.customerName?.trim() || 'Khách lẻ tại quầy',
            customerPhone: dto.customerPhone?.trim() || '',
            customerType: dto.customerType || POSCustomerType.RETAIL,
            items: orderItems,
            subtotal: calculatedSubtotal,
            discountAmount,
            discountType: dto.discountType || 'FIXED',
            discountReason: dto.discountReason || '',
            finalAmount,
            cashGiven,
            changeGiven,
            paymentMethod: dto.paymentMethod || PaymentMethod.CASH,
            paymentStatus: PaymentStatus.PAID,
            status: POSOrderStatus.COMPLETED,
            refundHistory: [],
            totalRefundedAmount: 0,
            note: dto.note || '',
            idempotencyKey: dto.idempotencyKey?.trim() || undefined,
          },
        ],
        { session },
      );

      await session.commitTransaction();
      this.logger.log(
        `POS Order created successfully: ${invoiceCode} - Total: ${finalAmount}đ`,
      );
      return savedOrder;
    } catch (err) {
      await session.abortTransaction();
      this.logger.error(
        'Failed to create POS Order, transaction aborted:',
        err,
      );
      throw err;
    } finally {
      await session.endSession();
    }
  }

  /**
   * POS-07: Đổi và trả hàng tại cửa hàng theo phiếu bán gốc
   */
  async refundPOSOrder(
    id: string,
    dto: RefundPOSOrderDto,
    actor: { _id: string; fullName?: string; name?: string; role?: string },
  ): Promise<POSOrderDocument> {
    const actorId = new Types.ObjectId(actor._id);
    const actorName = actor.fullName || actor.name || 'Quản lý quầy';

    const order = await this.posOrderModel.findById(id).exec();
    if (!order) {
      throw new NotFoundException(`Không tìm thấy hóa đơn POS với ID: ${id}`);
    }

    if (
      order.status === POSOrderStatus.RETURNED ||
      order.status === POSOrderStatus.CANCELLED
    ) {
      throw new BadRequestException(
        'Hóa đơn này đã hoàn trả toàn bộ hoặc đã bị hủy trước đó',
      );
    }

    // Kiểm tra từng sản phẩm xin trả
    let totalRefundAmount = 0;
    const processedRefundItems: Array<{
      product: Types.ObjectId;
      sku: string;
      name: string;
      quantity: number;
      baseQuantity: number;
      condition: POSItemCondition;
      refundAmount: number;
    }> = [];

    for (const refItem of dto.items) {
      const targetItem = order.items.find(
        (it) => it.product.toString() === refItem.productId,
      );
      if (!targetItem) {
        throw new BadRequestException(
          `Sản phẩm ID ${refItem.productId} không có trong hóa đơn ${order.invoiceCode}`,
        );
      }

      const availableToReturn =
        targetItem.quantity - (targetItem.returnedQuantity || 0);
      if (refItem.quantity > availableToReturn) {
        throw new BadRequestException(
          `Sản phẩm "${targetItem.name}" chỉ còn có thể trả tối đa ${availableToReturn} ${targetItem.unit}`,
        );
      }

      const itemUnitPriceActual =
        targetItem.lineTotal / (targetItem.quantity || 1);
      const refundItemAmount = Math.round(
        itemUnitPriceActual * refItem.quantity,
      );
      totalRefundAmount += refundItemAmount;

      const baseQuantity = refItem.quantity * (targetItem.conversionRatio || 1);

      processedRefundItems.push({
        product: targetItem.product,
        sku: targetItem.sku,
        name: targetItem.name,
        quantity: refItem.quantity,
        baseQuantity,
        condition: refItem.condition,
        refundAmount: refundItemAmount,
      });
    }

    // Thực thi hoàn trả trong Transaction
    const session = await this.connection.startSession();
    try {
      session.startTransaction();

      for (const ref of processedRefundItems) {
        // Cập nhật số lượng đã trả trên dòng hóa đơn
        const orderItem = order.items.find(
          (it) => it.product.toString() === ref.product.toString(),
        )!;
        orderItem.returnedQuantity =
          (orderItem.returnedQuantity || 0) + ref.quantity;

        // Nếu hàng còn tốt: Tái nhập kho bán lại được
        if (ref.condition === POSItemCondition.GOOD) {
          const invBefore = await this.inventoryModel
            .findOne({ product: ref.product })
            .session(session)
            .exec();
          const stockBefore = invBefore?.currentStock ?? 0;

          await this.productsService.updateStock(
            ref.product.toString(),
            ref.baseQuantity,
            session,
          );
          await this.productsService.incrementSold(
            ref.product.toString(),
            -ref.baseQuantity,
            session,
          );

          await this.transactionModel.create(
            [
              {
                product: ref.product,
                type: InventoryTransactionType.RETURN,
                quantity: ref.baseQuantity,
                change: ref.baseQuantity,
                stockBefore,
                stockAfter: stockBefore + ref.baseQuantity,
                note: `Khách trả hàng tại quầy: ${dto.reason} (${order.invoiceCode})`,
                reference: order.invoiceCode,
                createdBy: actorId,
              },
            ],
            { session },
          );
        } else {
          // Hàng lỗi/hỏng: Không nhập lại kho bán được
          await this.transactionModel.create(
            [
              {
                product: ref.product,
                type: InventoryTransactionType.DAMAGE,
                quantity: ref.baseQuantity,
                change: 0,
                stockBefore: 0,
                stockAfter: 0,
                note: `Hàng trả bị hỏng tại quầy (không đưa vào kho bán): ${dto.reason} (${order.invoiceCode})`,
                reference: order.invoiceCode,
                createdBy: actorId,
              },
            ],
            { session },
          );
        }
      }

      // Kiểm tra xem đơn đã trả hết chưa
      const isFullyReturned = order.items.every(
        (it) => (it.returnedQuantity || 0) >= it.quantity,
      );
      order.status = isFullyReturned
        ? POSOrderStatus.RETURNED
        : POSOrderStatus.PARTIALLY_RETURNED;

      order.totalRefundedAmount =
        (order.totalRefundedAmount || 0) + totalRefundAmount;

      order.refundHistory.push({
        refundId: `RF-${Date.now()}`,
        refundedAt: new Date(),
        actor: actorId,
        actorName,
        items: processedRefundItems,
        totalRefundAmount,
        reason: dto.reason.trim(),
      });

      await order.save({ session });
      await session.commitTransaction();

      this.logger.log(
        `POS Order ${order.invoiceCode} refunded ${totalRefundAmount}đ. Status: ${order.status}`,
      );
      return order;
    } catch (err) {
      await session.abortTransaction();
      this.logger.error('Failed to process POS refund:', err);
      throw err;
    } finally {
      await session.endSession();
    }
  }

  /**
   * Tra cứu danh sách hóa đơn POS có phân trang và bộ lọc (POS-04)
   */
  async findAll(
    query: POSOrderQueryDto,
    userRole?: string,
  ): Promise<PaginatedResult<POSOrderDocument>> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 15));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};

    if (query.search && query.search.trim()) {
      const q = query.search.trim();
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { invoiceCode: { $regex: escaped, $options: 'i' } },
        { customerPhone: { $regex: escaped, $options: 'i' } },
        { customerName: { $regex: escaped, $options: 'i' } },
      ];
    }

    if (query.cashierId && Types.ObjectId.isValid(query.cashierId)) {
      filter.cashier = new Types.ObjectId(query.cashierId);
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.paymentMethod) {
      filter.paymentMethod = query.paymentMethod;
    }

    if (query.startDate || query.endDate) {
      const dateFilter: Record<string, Date> = {};
      if (query.startDate) {
        dateFilter.$gte = new Date(`${query.startDate}T00:00:00.000Z`);
      }
      if (query.endDate) {
        dateFilter.$lte = new Date(`${query.endDate}T23:59:59.999Z`);
      }
      filter.createdAt = dateFilter;
    }

    const [items, total] = await Promise.all([
      this.posOrderModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.posOrderModel.countDocuments(filter).exec(),
    ]);

    // POS-08: Ẩn giá vốn (costPrice) đối với nhân viên thu ngân thông thường
    const isManager =
      userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN;

    const sanitizedItems = items.map((doc) => {
      const obj = doc.toObject();
      if (!isManager && obj.items) {
        obj.items.forEach((it: any) => {
          delete it.costPrice;
        });
      }
      return obj;
    });

    return {
      data: sanitizedItems as any,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Xem chi tiết hóa đơn theo ID để xem lại hoặc in lại hóa đơn (POS-04)
   */
  async findById(id: string, userRole?: string): Promise<POSOrderDocument> {
    const order = await this.posOrderModel.findById(id).exec();
    if (!order) {
      throw new NotFoundException(`Không tìm thấy hóa đơn POS ID: ${id}`);
    }

    const isManager =
      userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN;

    if (!isManager) {
      const obj: any = order.toObject();
      if (obj.items) {
        obj.items.forEach((it: any) => {
          delete it.costPrice;
        });
      }
      return obj;
    }

    return order;
  }

  /**
   * POS-10: Báo cáo hoạt động theo ca bán / ngày của nhân viên thu ngân
   */
  async getSessionReport(query: POSSessionReportQueryDto): Promise<{
    date: string;
    totalOrders: number;
    totalRevenue: number;
    cashTotal: number;
    transferTotal: number;
    refundedOrdersCount: number;
    totalRefundedAmount: number;
    itemsSoldCount: number;
  }> {
    let startOfDay: Date;
    let endOfDay: Date;
    if (query.date && /^\d{4}-\d{2}-\d{2}$/.test(query.date)) {
      startOfDay = new Date(`${query.date}T00:00:00.000Z`);
      endOfDay = new Date(`${query.date}T23:59:59.999Z`);
    } else {
      const targetDate = query.date ? new Date(query.date) : new Date();
      startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);
    }

    const filter: Record<string, any> = {
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    };

    if (query.cashierId && Types.ObjectId.isValid(query.cashierId)) {
      filter.cashier = new Types.ObjectId(query.cashierId);
    }

    const orders = await this.posOrderModel.find(filter).exec();

    let totalRevenue = 0;
    let cashTotal = 0;
    let transferTotal = 0;
    let totalRefundedAmount = 0;
    let refundedOrdersCount = 0;
    let itemsSoldCount = 0;

    for (const ord of orders) {
      if (ord.status !== POSOrderStatus.CANCELLED) {
        const netAmount = ord.finalAmount - (ord.totalRefundedAmount || 0);
        totalRevenue += netAmount;

        if (ord.paymentMethod === PaymentMethod.CASH) {
          cashTotal += netAmount;
        } else {
          transferTotal += netAmount;
        }

        if (ord.totalRefundedAmount && ord.totalRefundedAmount > 0) {
          totalRefundedAmount += ord.totalRefundedAmount;
          refundedOrdersCount++;
        }

        for (const it of ord.items) {
          const actualQty = it.quantity - (it.returnedQuantity || 0);
          itemsSoldCount += Math.max(0, actualQty);
        }
      }
    }

    return {
      date: startOfDay.toISOString().slice(0, 10),
      totalOrders: orders.length,
      totalRevenue,
      cashTotal,
      transferTotal,
      refundedOrdersCount,
      totalRefundedAmount,
      itemsSoldCount,
    };
  }

  /**
   * Tìm kiếm sản phẩm nhanh cho POS bằng SKU, Barcode hoặc tên (POS-02)
   */
  async searchProductsForPOS(keyword: string): Promise<any[]> {
    if (!keyword || !keyword.trim()) return [];
    const safeK = keyword.trim().substring(0, 100);
    const rawEscaped = safeK.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const products = await this.productModel
      .find({
        isDeleted: false,
        status: ProductStatus.ACTIVE,
        $or: [
          { sku: { $regex: `^${rawEscaped}$`, $options: 'i' } },
          { barcode: { $regex: `^${rawEscaped}$`, $options: 'i' } },
          {
            'unitConversions.barcode': {
              $regex: `^${rawEscaped}$`,
              $options: 'i',
            },
          },
          { name: { $regex: rawEscaped, $options: 'i' } },
        ],
      })
      .select(
        '_id name sku barcode price discountPrice wholesalePrice wholesaleMinQuantity stock unit unitConversions images',
      )
      .limit(20)
      .lean()
      .exec();

    return products;
  }
}
