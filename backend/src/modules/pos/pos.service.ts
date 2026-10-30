import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection, Types, ClientSession } from 'mongoose';
import * as crypto from 'crypto';
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
import { UsersService } from '../users/users.service';
import {
  InventoryTransactionType,
  OrderSource,
  PaymentMethod,
  PaymentStatus,
  ProductStatus,
  StaffPermission,
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
    private readonly usersService: UsersService,
  ) {}

  /**
   * Tính SHA-256 fingerprint chuẩn hóa của đơn hàng POS để đối soát Idempotency Key (NEW-005)
   */
  private computeOrderPayloadHash(dto: CreatePOSOrderDto): string {
    const normalized = {
      customerPhone: dto.customerPhone?.trim() || '',
      customerType: dto.customerType || POSCustomerType.RETAIL,
      discountAmount: Number(dto.discountAmount || 0),
      discountType: dto.discountType || 'FIXED',
      paymentMethod: dto.paymentMethod || PaymentMethod.CASH,
      items: (dto.items || [])
        .map((it) => ({
          productId: String(it.productId),
          quantity: Number(it.quantity),
          unit: (it.unit || '').trim().toLowerCase(),
          discount: Number(it.discount || 0),
        }))
        .sort((a, b) => a.productId.localeCompare(b.productId)),
    };
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(normalized))
      .digest('hex');
  }

  /**
   * Tính SHA-256 fingerprint của yêu cầu hoàn trả POS (NEW-003, NEW-005)
   */
  private computeRefundPayloadHash(dto: RefundPOSOrderDto): string {
    const normalized = {
      reason: dto.reason.trim(),
      items: (dto.items || [])
        .map((it) => ({
          productId: String(it.productId),
          quantity: Number(it.quantity),
          condition: it.condition,
          unit: (it.unit || '').trim().toLowerCase(),
        }))
        .sort((a, b) => a.productId.localeCompare(b.productId)),
    };
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(normalized))
      .digest('hex');
  }

  /**
   * NEW-006: Sinh mã hóa đơn bán hàng POS duy nhất: HD + YYMMDD + -XXXX
   * - Sử dụng múi giờ Việt Nam (Asia/Ho_Chi_Minh - UTC+7) để bảo đảm đúng ngày thực tế.
   * - Sử dụng atomic increment trên MongoDB collection `counters` để chống tranh chấp khi nhiều thu ngân cùng bán.
   */
  private async generateInvoiceCode(session?: ClientSession): Promise<string> {
    const now = new Date();
    const vnDateStr = now.toLocaleDateString('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
    }); // Format: YYYY-MM-DD
    const [yyyy, mm, dd] = vnDateStr.split('-');
    const yy = yyyy.slice(-2);
    const datePrefix = `HD${yy}${mm}${dd}`;

    const counterKey = `pos_invoice_${datePrefix}`;
    const counterCollection = this.posOrderModel.db.collection('counters');

    const counterRes = await counterCollection.findOneAndUpdate(
      { _id: counterKey as any },
      { $inc: { seq: 1 } },
      { upsert: true, returnDocument: 'after' },
    );

    const seq = (counterRes as any)?.seq || 1;
    let code = `${datePrefix}-${String(seq).padStart(4, '0')}`;

    // Kiểm tra dự phòng chống trùng mã hóa đơn (nếu có dữ liệu tạo thủ công trước đó)
    let existsQuery = this.posOrderModel.findOne({ invoiceCode: code });
    if (session) existsQuery.session(session);
    let attempts = 0;
    while ((await existsQuery.exec()) && attempts < 5) {
      attempts++;
      const nextRes = await counterCollection.findOneAndUpdate(
        { _id: counterKey as any },
        { $inc: { seq: 1 } },
        { upsert: true, returnDocument: 'after' },
      );
      const nextSeq = (nextRes as any)?.seq || seq + attempts;
      code = `${datePrefix}-${String(nextSeq).padStart(4, '0')}`;
      existsQuery = this.posOrderModel.findOne({ invoiceCode: code });
      if (session) existsQuery.session(session);
    }

    return code;
  }

  /**
   * POS-01 & TT-021 & SPRINT 1 (NEW-001 -> NEW-006):
   * Tạo hóa đơn bán hàng quầy POS với:
   * - Kiểm tra quyền chiết khấu > 20% (NEW-001)
   * - Xác thực tỷ lệ quy đổi từ CSDL, không tin client (NEW-002)
   * - Phân bổ chiết khấu cấp đơn xuống dòng hàng (NEW-004)
   * - Khóa idempotency key theo nội dung (NEW-005)
   * - Sinh mã hóa đơn nguyên tử theo múi giờ VN (NEW-006)
   */
  async createPOSOrder(
    dto: CreatePOSOrderDto,
    cashier: {
      _id: string;
      fullName?: string;
      name?: string;
      role?: string;
      permissions?: string[];
    },
  ): Promise<POSOrderDocument> {
    const cashierId = new Types.ObjectId(cashier._id);
    const cashierName =
      cashier.fullName || cashier.name || 'Nhân viên thu ngân';

    const orderPayloadHash = this.computeOrderPayloadHash(dto);

    // 1. Chống gửi lại yêu cầu trùng lặp qua Idempotency Key (NEW-005)
    if (dto.idempotencyKey && dto.idempotencyKey.trim()) {
      const existing = await this.posOrderModel
        .findOne({ idempotencyKey: dto.idempotencyKey.trim() })
        .exec();
      if (existing) {
        if (existing.payloadHash && existing.payloadHash !== orderPayloadHash) {
          throw new ConflictException(
            `Idempotency key "${dto.idempotencyKey}" đã được sử dụng với nội dung đơn hàng khác biệt (Payload mismatch).`,
          );
        }
        this.logger.log(
          `Idempotent POS order replay for key: ${dto.idempotencyKey}`,
        );
        return existing;
      }
    }

    // 2. Kiểm tra danh sách sản phẩm, quy đổi đơn vị và tính toán giá trị
    const discreteUnits = [
      'cái',
      'cây',
      'cuốn',
      'quyển',
      'hộp',
      'bộ',
      'gói',
      'ram',
      'lốc',
      'tập',
      'viên',
      'tờ',
      'thùng',
      'túi',
    ];

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
      allocatedOrderDiscount: number;
      effectiveLineTotal: number;
      netUnitPrice: number;
      returnedQuantity: number;
    }> = [];

    let grossSubtotal = 0;
    let totalLineDiscounts = 0;
    let calculatedSubtotal = 0;
    const productTotalBaseQtyMap = new Map<string, number>();

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

      // Kiểm tra tính hợp lệ của số lượng mua
      const qtyNum = Number(itemDto.quantity);
      if (isNaN(qtyNum) || !isFinite(qtyNum) || qtyNum <= 0) {
        throw new BadRequestException(
          `Số lượng bán của sản phẩm "${product.name}" phải là số dương hợp lệ`,
        );
      }

      const baseUnit = (product.unit || 'cái').trim();
      const isDiscrete = discreteUnits.includes(baseUnit.toLowerCase());
      if (isDiscrete && !Number.isInteger(qtyNum)) {
        throw new BadRequestException(
          `Số lượng sản phẩm "${product.name}" tính theo ${baseUnit} phải là số nguyên dương`,
        );
      }

      // NEW-002: Tỷ lệ quy đổi đơn vị tính chỉ tin cậy từ CSDL
      let conversionRatio = 1;
      let finalUnit = baseUnit;
      let unitPrice =
        product.discountPrice > 0 ? product.discountPrice : product.price;

      const requestedUnit = itemDto.unit ? itemDto.unit.trim() : finalUnit;

      if (requestedUnit.toLowerCase() !== baseUnit.toLowerCase()) {
        const matchedConversion = product.unitConversions?.find(
          (c) => c.unit.toLowerCase() === requestedUnit.toLowerCase(),
        );

        if (!matchedConversion) {
          throw new BadRequestException(
            `Đơn vị "${requestedUnit}" chưa được cấu hình cho sản phẩm "${product.name}" trong hệ thống.`,
          );
        }

        if (
          itemDto.conversionRatio !== undefined &&
          itemDto.conversionRatio !== null &&
          Number(itemDto.conversionRatio) !== matchedConversion.ratio
        ) {
          throw new BadRequestException(
            `Tỷ lệ quy đổi đơn vị gửi lên (${itemDto.conversionRatio}) không khớp với cấu hình hệ thống (${matchedConversion.ratio}) của sản phẩm "${product.name}".`,
          );
        }

        conversionRatio = matchedConversion.ratio || 1;
        finalUnit = matchedConversion.unit;
        if (matchedConversion.price && matchedConversion.price > 0) {
          unitPrice = matchedConversion.price;
        } else {
          unitPrice = unitPrice * conversionRatio;
        }
      } else {
        conversionRatio = 1;
        finalUnit = baseUnit;
      }

      // Bảng giá bán sỉ nếu có
      const isWholesale =
        dto.customerType === POSCustomerType.WHOLESALE ||
        (product.wholesaleMinQuantity &&
          product.wholesaleMinQuantity > 1 &&
          qtyNum >= product.wholesaleMinQuantity);

      if (isWholesale && product.wholesalePrice && product.wholesalePrice > 0) {
        unitPrice = product.wholesalePrice * conversionRatio;
      }

      const baseQuantity = qtyNum * conversionRatio;

      // Theo dõi tổng số lượng cơ sở yêu cầu của từng sản phẩm để tránh bán vượt tồn khi đơn có nhiều dòng cùng sản phẩm
      const prevReq = productTotalBaseQtyMap.get(product._id.toString()) || 0;
      const totalReq = prevReq + baseQuantity;
      productTotalBaseQtyMap.set(product._id.toString(), totalReq);

      // Kiểm tra tồn kho trước khi vào transaction
      const inventory = await this.inventoryModel
        .findOne({ product: product._id })
        .exec();
      const currentStock = inventory?.currentStock ?? product.stock ?? 0;

      if (currentStock < totalReq) {
        throw new BadRequestException(
          `Sản phẩm "${product.name}" chỉ còn ${currentStock} ${baseUnit} trong kho, không đủ bán tổng cộng ${totalReq} ${baseUnit}`,
        );
      }

      // Giá vốn (cost price snapshot)
      const costPrice = inventory?.costPrice || 0;

      // NEW-001: Kiểm tra tính hợp lệ của chiết khấu dòng hàng
      const itemGrossTotal = unitPrice * qtyNum;
      grossSubtotal += itemGrossTotal;

      const rawLineDiscount =
        itemDto.discount !== undefined && itemDto.discount !== null
          ? Number(itemDto.discount)
          : 0;

      if (
        isNaN(rawLineDiscount) ||
        !isFinite(rawLineDiscount) ||
        rawLineDiscount < 0
      ) {
        throw new BadRequestException(
          `Mức chiết khấu dòng sản phẩm "${product.name}" không hợp lệ`,
        );
      }

      if (rawLineDiscount > itemGrossTotal) {
        throw new BadRequestException(
          `Chiết khấu dòng sản phẩm "${product.name}" (${rawLineDiscount}đ) không được vượt quá giá trị hàng (${itemGrossTotal}đ).`,
        );
      }

      const itemDiscount = rawLineDiscount;
      const lineTotal = itemGrossTotal - itemDiscount;

      totalLineDiscounts += itemDiscount;
      calculatedSubtotal += lineTotal;

      orderItems.push({
        product: product._id,
        sku: product.sku || '',
        name: product.name,
        unit: finalUnit,
        conversionRatio,
        quantity: qtyNum,
        baseQuantity,
        unitPrice,
        costPrice,
        discount: itemDiscount,
        lineTotal,
        allocatedOrderDiscount: 0,
        effectiveLineTotal: lineTotal,
        netUnitPrice: qtyNum > 0 ? lineTotal / qtyNum : 0,
        returnedQuantity: 0,
      });
    }

    // 3. Tính toán tổng chiết khấu đơn và kiểm tra phân quyền (NEW-001)
    let orderDiscount =
      dto.discountAmount !== undefined && dto.discountAmount !== null
        ? Number(dto.discountAmount)
        : 0;

    if (isNaN(orderDiscount) || !isFinite(orderDiscount) || orderDiscount < 0) {
      throw new BadRequestException('Mức chiết khấu đơn hàng không hợp lệ');
    }

    if (dto.discountType === 'PERCENT') {
      if (orderDiscount > 100) {
        throw new BadRequestException(
          'Tỷ lệ chiết khấu đơn không được vượt quá 100%',
        );
      }
      orderDiscount = Math.round((calculatedSubtotal * orderDiscount) / 100);
    }

    if (orderDiscount > calculatedSubtotal) {
      orderDiscount = calculatedSubtotal;
    }

    // NEW-001: Tổng mức giảm = chiết khấu từng dòng + chiết khấu cấp đơn
    const totalDiscountAmount = totalLineDiscounts + orderDiscount;
    const totalDiscountPercent =
      grossSubtotal > 0 ? (totalDiscountAmount / grossSubtotal) * 100 : 0;

    let approvedBy: Types.ObjectId | undefined = undefined;
    let approvedByName: string | undefined = undefined;

    const cashierHasOverridePerm =
      cashier.role === UserRole.ADMIN ||
      cashier.role === UserRole.SUPER_ADMIN ||
      (Array.isArray(cashier.permissions) &&
        cashier.permissions.includes(StaffPermission.POS_OVERRIDE_DISCOUNT));

    if (totalDiscountPercent > 20) {
      if (cashierHasOverridePerm) {
        approvedBy = cashierId;
        approvedByName = cashierName;
      } else {
        if (!dto.approvedById) {
          throw new ForbiddenException(
            `Tổng mức giảm giá đạt ${totalDiscountPercent.toFixed(1)}% (vượt mức cho phép 20%). Bắt buộc phải có Quản lý phê duyệt (approvedById). Nhập lý do không thể thay thế quyền phê duyệt.`,
          );
        }

        const approver = await this.usersService.findById(dto.approvedById);
        const isApproverAuthorized =
          approver &&
          approver.status &&
          (approver.role === UserRole.ADMIN ||
            approver.role === UserRole.SUPER_ADMIN ||
            (Array.isArray(approver.permissions) &&
              approver.permissions.includes(
                StaffPermission.POS_OVERRIDE_DISCOUNT,
              )));

        if (!isApproverAuthorized) {
          throw new ForbiddenException(
            'Người phê duyệt không hợp lệ hoặc không có quyền phê duyệt mức chiết khấu trên 20%.',
          );
        }

        approvedBy = approver._id;
        approvedByName = approver.fullName || 'Quản lý cửa hàng';
      }
    }

    // 4. NEW-004: Phân bổ giảm giá cấp đơn xuống từng dòng hàng theo tỷ lệ VND
    const finalAmount = Math.max(0, calculatedSubtotal - orderDiscount);

    if (calculatedSubtotal > 0 && orderDiscount > 0) {
      let allocatedAcc = 0;
      for (let i = 0; i < orderItems.length; i++) {
        const it = orderItems[i];
        let alloc = 0;
        if (i === orderItems.length - 1) {
          alloc = orderDiscount - allocatedAcc;
        } else {
          alloc = Math.round(
            (orderDiscount * it.lineTotal) / calculatedSubtotal,
          );
        }
        alloc = Math.min(alloc, it.lineTotal);
        allocatedAcc += alloc;
        it.allocatedOrderDiscount = alloc;
        it.effectiveLineTotal = it.lineTotal - alloc;
        it.netUnitPrice =
          it.quantity > 0 ? it.effectiveLineTotal / it.quantity : 0;
      }
    } else {
      for (const it of orderItems) {
        it.allocatedOrderDiscount = 0;
        it.effectiveLineTotal = it.lineTotal;
        it.netUnitPrice =
          it.quantity > 0 ? it.effectiveLineTotal / it.quantity : 0;
      }
    }

    let cashGiven = dto.cashGiven ?? finalAmount;
    let changeGiven = 0;
    if (dto.paymentMethod === PaymentMethod.CASH || !dto.paymentMethod) {
      if (cashGiven >= finalAmount) {
        changeGiven = cashGiven - finalAmount;
      } else {
        cashGiven = finalAmount;
      }
    }

    // 5. Thực thi giao dịch MongoDB Transaction nguyên tử
    const session = await this.connection.startSession();
    try {
      session.startTransaction();

      const invoiceCode = await this.generateInvoiceCode(session);

      // Trừ kho nguyên tử và ghi nhận lịch sử biến động kho (SALE)
      for (const item of orderItems) {
        const invBefore = await this.inventoryModel
          .findOne({ product: item.product })
          .session(session)
          .exec();
        const stockBefore = invBefore?.currentStock ?? 0;

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
            discountAmount: orderDiscount,
            discountType: dto.discountType || 'FIXED',
            discountReason: dto.discountReason || '',
            totalDiscountAmount,
            totalDiscountPercent,
            approvedBy,
            approvedByName,
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
            payloadHash: orderPayloadHash,
          },
        ],
        { session },
      );

      await session.commitTransaction();
      this.logger.log(
        `POS Order created successfully: ${invoiceCode} - Total: ${finalAmount}đ`,
      );
      return savedOrder;
    } catch (err: any) {
      await session.abortTransaction();
      // Xử lý race condition nếu 2 request cùng idempotencyKey đến đồng thời
      if (
        err?.code === 11000 &&
        dto.idempotencyKey &&
        err?.keyPattern?.idempotencyKey
      ) {
        const existing = await this.posOrderModel
          .findOne({ idempotencyKey: dto.idempotencyKey.trim() })
          .exec();
        if (existing) {
          if (
            existing.payloadHash &&
            existing.payloadHash !== orderPayloadHash
          ) {
            throw new ConflictException(
              `Idempotency key "${dto.idempotencyKey}" đã được sử dụng với nội dung đơn hàng khác biệt.`,
            );
          }
          return existing;
        }
      }
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
   * POS-07 & NEW-003, NEW-004:
   * Đổi và trả hàng tại cửa hàng theo phiếu bán gốc
   * - Kiểm tra số lượng trong MongoDB transaction có điều kiện
   * - Hỗ trợ idempotencyKey chống lặp lệnh hoàn trả
   * - Phân bổ giá trị hoàn tiền chuẩn xác theo giá sau chiết khấu (NEW-004)
   * - Không hoàn tiền vượt quá tổng giá trị đơn hàng finalAmount
   * - Phân biệt hàng tốt (GOOD - nhập lại kho) và hàng lỗi (DAMAGED - không nhập kho bán)
   */
  async refundPOSOrder(
    id: string,
    dto: RefundPOSOrderDto,
    actor: { _id: string; fullName?: string; name?: string; role?: string },
  ): Promise<POSOrderDocument> {
    const actorId = new Types.ObjectId(actor._id);
    const actorName = actor.fullName || actor.name || 'Quản lý quầy';

    const refundPayloadHash = this.computeRefundPayloadHash(dto);

    const session = await this.connection.startSession();
    try {
      session.startTransaction();

      // Đọc phiếu bán gốc bên trong Transaction để khóa tranh chấp đồng thời
      const order = await this.posOrderModel
        .findById(id)
        .session(session)
        .exec();
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

      // NEW-003 & NEW-005: Kiểm tra Idempotency Key của lệnh hoàn trả
      if (dto.idempotencyKey && dto.idempotencyKey.trim()) {
        const existingRefund = order.refundHistory.find(
          (r) => r.idempotencyKey === dto.idempotencyKey!.trim(),
        );
        if (existingRefund) {
          if (
            existingRefund.payloadHash &&
            existingRefund.payloadHash !== refundPayloadHash
          ) {
            throw new ConflictException(
              `Idempotency key hoàn trả "${dto.idempotencyKey}" đã được sử dụng với nội dung khác.`,
            );
          }
          await session.abortTransaction();
          this.logger.log(
            `Idempotent POS refund replay for key: ${dto.idempotencyKey}`,
          );
          return order;
        }
      }

      // Kiểm tra từng sản phẩm xin trả
      let totalRefundAmount = 0;
      const processedRefundItems: Array<{
        product: Types.ObjectId;
        sku: string;
        name: string;
        unit: string;
        quantity: number;
        baseQuantity: number;
        condition: POSItemCondition;
        refundAmount: number;
      }> = [];

      for (const refItem of dto.items) {
        const targetItem = order.items.find(
          (it) =>
            it.product.toString() === refItem.productId &&
            (!refItem.unit ||
              it.unit.toLowerCase() === refItem.unit.trim().toLowerCase()),
        );
        if (!targetItem) {
          throw new BadRequestException(
            `Sản phẩm ID ${refItem.productId}${refItem.unit ? ` (đơn vị: ${refItem.unit})` : ''} không có trong hóa đơn ${order.invoiceCode}`,
          );
        }

        const availableToReturn =
          targetItem.quantity - (targetItem.returnedQuantity || 0);
        if (refItem.quantity > availableToReturn) {
          throw new BadRequestException(
            `Sản phẩm "${targetItem.name}" chỉ còn có thể trả tối đa ${availableToReturn} ${targetItem.unit}`,
          );
        }

        // NEW-004: Tính tiền hoàn trả dựa trên giá trị thực sau phân bổ chiết khấu (effectiveLineTotal)
        const effectiveTotal =
          targetItem.effectiveLineTotal !== undefined
            ? targetItem.effectiveLineTotal
            : targetItem.lineTotal;
        const netUnit =
          targetItem.netUnitPrice !== undefined
            ? targetItem.netUnitPrice
            : effectiveTotal / (targetItem.quantity || 1);

        // Tính số tiền đã hoàn trả cho sản phẩm và đơn vị này trước đó
        let alreadyRefundedForItem = 0;
        for (const rh of order.refundHistory) {
          for (const it of rh.items) {
            if (
              it.product.toString() === targetItem.product.toString() &&
              (!it.unit ||
                it.unit.toLowerCase() === targetItem.unit.toLowerCase())
            ) {
              alreadyRefundedForItem += it.refundAmount || 0;
            }
          }
        }

        let refundItemAmount = 0;
        if (refItem.quantity === availableToReturn) {
          // Trả hết số lượng còn lại của sản phẩm này: hoàn số tiền thực còn lại
          refundItemAmount = Math.max(
            0,
            effectiveTotal - alreadyRefundedForItem,
          );
        } else {
          // Trả một phần: tính theo netUnitPrice
          refundItemAmount = Math.round(netUnit * refItem.quantity);
          const maxRemainingForItem = Math.max(
            0,
            effectiveTotal - alreadyRefundedForItem,
          );
          if (refundItemAmount > maxRemainingForItem) {
            refundItemAmount = maxRemainingForItem;
          }
        }

        totalRefundAmount += refundItemAmount;
        const baseQuantity =
          refItem.quantity * (targetItem.conversionRatio || 1);

        // Cập nhật returnedQuantity trên dòng hóa đơn
        targetItem.returnedQuantity =
          (targetItem.returnedQuantity || 0) + refItem.quantity;

        processedRefundItems.push({
          product: targetItem.product,
          sku: targetItem.sku,
          name: targetItem.name,
          unit: targetItem.unit,
          quantity: refItem.quantity,
          baseQuantity,
          condition: refItem.condition,
          refundAmount: refundItemAmount,
        });

        // Xử lý tồn kho
        if (refItem.condition === POSItemCondition.GOOD) {
          const invBefore = await this.inventoryModel
            .findOne({ product: targetItem.product })
            .session(session)
            .exec();
          const stockBefore = invBefore?.currentStock ?? 0;

          await this.productsService.updateStock(
            targetItem.product.toString(),
            baseQuantity,
            session,
          );
          await this.productsService.incrementSold(
            targetItem.product.toString(),
            -baseQuantity,
            session,
          );

          await this.transactionModel.create(
            [
              {
                product: targetItem.product,
                type: InventoryTransactionType.RETURN,
                quantity: baseQuantity,
                change: baseQuantity,
                stockBefore,
                stockAfter: stockBefore + baseQuantity,
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
                product: targetItem.product,
                type: InventoryTransactionType.DAMAGE,
                quantity: baseQuantity,
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

      // Khống chế tổng tiền hoàn qua các đợt không bao giờ vượt quá finalAmount của đơn gốc
      const maxPossibleRefund = Math.max(
        0,
        order.finalAmount - (order.totalRefundedAmount || 0),
      );
      if (totalRefundAmount > maxPossibleRefund) {
        totalRefundAmount = maxPossibleRefund;
      }

      order.totalRefundedAmount =
        (order.totalRefundedAmount || 0) + totalRefundAmount;

      const isFullyReturned = order.items.every(
        (it) => (it.returnedQuantity || 0) >= it.quantity,
      );
      order.status = isFullyReturned
        ? POSOrderStatus.RETURNED
        : POSOrderStatus.PARTIALLY_RETURNED;

      order.refundHistory.push({
        refundId: `RF-${Date.now()}`,
        refundedAt: new Date(),
        actor: actorId,
        actorName,
        items: processedRefundItems,
        totalRefundAmount,
        reason: dto.reason.trim(),
        idempotencyKey: dto.idempotencyKey?.trim() || undefined,
        payloadHash: refundPayloadHash,
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
   * NEW-009: Mặt nạ dữ liệu nhạy cảm (SĐT khách hàng) nếu người dùng không có quyền quản lý khách hàng
   */
  private maskPhone(phone?: string): string {
    if (!phone || phone.length < 6) return phone || '';
    const clean = phone.trim();
    if (clean.length <= 6) return '***';
    const start = clean.slice(0, 3);
    const end = clean.slice(-3);
    return `${start}****${end}`;
  }

  /**
   * Tra cứu danh sách hóa đơn POS có phân trang và bộ lọc (POS-04 / NEW-008 / NEW-009)
   */
  async findAll(
    query: POSOrderQueryDto,
    user?: {
      _id: string;
      role?: string;
      permissions?: string[];
    },
  ): Promise<PaginatedResult<any>> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 15));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};

    const isManager =
      user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN;
    const canViewAll =
      isManager ||
      user?.permissions?.includes(StaffPermission.POS_VIEW_ORDERS) ||
      user?.permissions?.includes(StaffPermission.MANAGE_ORDERS);

    // NEW-009: Nếu thu ngân không có quyền xem toàn bộ, chỉ hiển thị hóa đơn của chính mình
    if (!canViewAll && user?._id) {
      filter.cashier = new Types.ObjectId(user._id);
    } else if (query.cashierId && Types.ObjectId.isValid(query.cashierId)) {
      filter.cashier = new Types.ObjectId(query.cashierId);
    }

    if (query.search && query.search.trim()) {
      const q = query.search.trim();
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { invoiceCode: { $regex: escaped, $options: 'i' } },
        { customerPhone: { $regex: escaped, $options: 'i' } },
        { customerName: { $regex: escaped, $options: 'i' } },
      ];
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

    const canManageCustomers =
      isManager ||
      user?.permissions?.includes(StaffPermission.MANAGE_CUSTOMERS);

    // POS-08 & NEW-009: Ẩn giá vốn và che SĐT nhạy cảm theo phân quyền
    const sanitizedItems = items.map((doc) => {
      const obj = doc.toObject();
      if (!isManager && obj.items) {
        obj.items.forEach((it: any) => {
          delete it.costPrice;
        });
      }
      if (!canManageCustomers && obj.customerPhone) {
        obj.customerPhone = this.maskPhone(obj.customerPhone);
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
   * Xem chi tiết hóa đơn theo ID để xem lại hoặc in lại hóa đơn (POS-04 / NEW-008 / NEW-009)
   */
  async findById(
    id: string,
    user?: {
      _id: string;
      role?: string;
      permissions?: string[];
    },
  ): Promise<any> {
    const order = await this.posOrderModel.findById(id).exec();
    if (!order) {
      throw new NotFoundException(`Không tìm thấy hóa đơn POS ID: ${id}`);
    }

    const isManager =
      user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN;
    const canViewAll =
      isManager ||
      user?.permissions?.includes(StaffPermission.POS_VIEW_ORDERS) ||
      user?.permissions?.includes(StaffPermission.MANAGE_ORDERS);

    // NEW-009: Chống IDOR - Nhân viên không có quyền xem toàn bộ không được xem hóa đơn của nhân viên khác
    if (
      !canViewAll &&
      user?._id &&
      order.cashier.toString() !== user._id.toString()
    ) {
      throw new ForbiddenException(
        'Bạn không có quyền xem hóa đơn của nhân viên khác (IDOR Protection)',
      );
    }

    const canManageCustomers =
      isManager ||
      user?.permissions?.includes(StaffPermission.MANAGE_CUSTOMERS);

    const obj: any = order.toObject();
    if (!isManager && obj.items) {
      obj.items.forEach((it: any) => {
        delete it.costPrice;
      });
    }
    if (!canManageCustomers && obj.customerPhone) {
      obj.customerPhone = this.maskPhone(obj.customerPhone);
    }

    return obj;
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
   * Tìm kiếm sản phẩm nhanh cho POS bằng SKU, Barcode hoặc tên (POS-02 / NEW-007)
   * Nhận diện chính xác đơn vị bán tương ứng với mã vạch được quét
   */
  async searchProductsForPOS(keyword: string): Promise<any[]> {
    if (!keyword || !keyword.trim()) return [];
    const safeK = keyword.trim().substring(0, 100);
    const rawEscaped = safeK.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const kwLower = safeK.toLowerCase();

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

    // NEW-007: Xác định chính xác mã vạch quét khớp với SKU, Barcode gốc hay Barcode đơn vị quy đổi
    return products.map((p: any) => {
      let matchType: 'SKU' | 'BARCODE' | 'UNIT_CONVERSION' | 'NAME' = 'NAME';
      let matchedUnit = p.unit || 'cái';
      let matchedConversionRatio = 1;
      let matchedPrice = p.discountPrice > 0 ? p.discountPrice : p.price;
      let matchedBarcode = p.barcode || '';

      if (p.sku && p.sku.toLowerCase() === kwLower) {
        matchType = 'SKU';
        matchedBarcode = p.sku;
      } else if (p.barcode && p.barcode.toLowerCase() === kwLower) {
        matchType = 'BARCODE';
        matchedBarcode = p.barcode;
      } else if (Array.isArray(p.unitConversions)) {
        const matchedConv = p.unitConversions.find(
          (c: any) => c.barcode && c.barcode.toLowerCase() === kwLower,
        );
        if (matchedConv) {
          matchType = 'UNIT_CONVERSION';
          matchedUnit = matchedConv.unit;
          matchedConversionRatio = matchedConv.ratio || 1;
          matchedPrice =
            matchedConv.price && matchedConv.price > 0
              ? matchedConv.price
              : matchedPrice * matchedConversionRatio;
          matchedBarcode = matchedConv.barcode;
        }
      }

      return {
        ...p,
        matchType,
        matchedUnit,
        matchedConversionRatio,
        matchedPrice,
        matchedBarcode,
      };
    });
  }
}
