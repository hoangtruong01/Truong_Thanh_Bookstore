import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  Logger,
  Optional,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection, Types, ClientSession } from 'mongoose';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
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
  POSShift,
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
import { PricingService } from '../pricing/pricing.service';
import {
  CustomerReceivable,
  CustomerReceivableDocument,
  CustomerReceivableStatus,
} from '../finance/schemas/customer-receivable.schema';
import { CustomerCreditService } from '../finance/services/customer-credit.service';
import {
  CashAccount,
  CashAccountDocument,
  CashAccountType,
} from '../finance/schemas/cash-account.schema';
import {
  CashEntry,
  CashEntryDocument,
  CashEntryCategory,
  CashEntryDirection,
  CashEntryStatus,
} from '../finance/schemas/cash-entry.schema';
import { FinanceService } from '../finance/finance.service';
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
import { POSPaymentMovement } from './schemas/pos-order.schema';
import { ReconcilePOSQueryDto } from './dto/pos.dto';

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
    @Optional()
    private readonly pricingService?: PricingService,
    @Optional()
    @InjectModel(CustomerReceivable.name)
    private readonly receivableModel?: Model<CustomerReceivableDocument>,
    @Optional()
    private readonly customerCreditService?: CustomerCreditService,
    @Optional()
    @InjectModel(CashAccount.name)
    private readonly accountModel?: Model<CashAccountDocument>,
    @Optional()
    @InjectModel(CashEntry.name)
    private readonly entryModel?: Model<CashEntryDocument>,
    @Optional()
    private readonly financeService?: FinanceService,
  ) {}

  /**
   * SEC-006: Bộ đếm số lần xác thực phê duyệt thất bại (theo thu ngân và theo người duyệt).
   * Lưu in-memory theo từng tiến trình: đủ để chặn dò mật khẩu tại quầy; throttler của
   * controller (Redis) bổ sung giới hạn tần suất giữa các instance.
   */
  private readonly approvalFailures = new Map<
    string,
    { count: number; windowStart: number; lockedUntil: number }
  >();
  private static readonly APPROVAL_MAX_FAILURES = 5;
  private static readonly APPROVAL_WINDOW_MS = 15 * 60 * 1000;
  private static readonly APPROVAL_LOCK_MS = 15 * 60 * 1000;

  private assertApprovalNotLocked(keys: string[]): void {
    const now = Date.now();
    for (const key of keys) {
      const rec = this.approvalFailures.get(key);
      if (rec && rec.lockedUntil > now) {
        throw new ForbiddenException(
          'Xác thực phê duyệt tạm thời bị khóa do nhập sai nhiều lần. Vui lòng thử lại sau.',
        );
      }
    }
  }

  /** Ghi nhận 1 lần xác thực phê duyệt sai và trả về lỗi chung (không lộ nguyên nhân). */
  private approvalDenied(keys: string[]): ForbiddenException {
    const now = Date.now();
    // Dọn các bản ghi đã hết hạn để Map không phình vô hạn (key theo approvedById do client gửi)
    if (this.approvalFailures.size > 1000) {
      for (const [k, r] of this.approvalFailures) {
        if (
          r.lockedUntil <= now &&
          now - r.windowStart > PosService.APPROVAL_WINDOW_MS
        ) {
          this.approvalFailures.delete(k);
        }
      }
    }
    for (const key of keys) {
      let rec = this.approvalFailures.get(key);
      if (!rec || now - rec.windowStart > PosService.APPROVAL_WINDOW_MS) {
        rec = { count: 0, windowStart: now, lockedUntil: 0 };
      }
      rec.count += 1;
      if (rec.count >= PosService.APPROVAL_MAX_FAILURES) {
        rec.lockedUntil = now + PosService.APPROVAL_LOCK_MS;
        rec.count = 0;
        rec.windowStart = now;
      }
      this.approvalFailures.set(key, rec);
    }
    return new ForbiddenException('Xác thực phê duyệt không hợp lệ.');
  }

  private clearApprovalFailures(keys: string[]): void {
    for (const key of keys) {
      this.approvalFailures.delete(key);
    }
  }

  /**
   * SEC-024: Che dữ liệu giá vốn/biên lợi nhuận khỏi phản hồi của thu ngân.
   * Chỉ ADMIN/SUPER_ADMIN mới thấy costPrice, grossMarginPercent, markupPercent.
   */
  private sanitizeOrderForActor(order: any, actor?: { role?: string }): any {
    const isManager =
      actor?.role === UserRole.ADMIN || actor?.role === UserRole.SUPER_ADMIN;
    if (isManager || !order) return order;

    const obj: any =
      typeof order.toObject === 'function' ? order.toObject() : { ...order };
    if (Array.isArray(obj.items)) {
      obj.items = obj.items.map((it: any) => {
        const copy = { ...it };
        delete copy.costPrice;
        delete copy.grossMarginPercent;
        delete copy.markupPercent;
        return copy;
      });
    }
    return obj;
  }

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
      paidAmount: Number(dto.paidAmount || 0),
      splitPayments: (dto.splitPayments || []).map((sp) => ({
        method: sp.method,
        amount: Number(sp.amount),
        accountId: sp.accountId || '',
      })),
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
  ): Promise<any> {
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
        return this.sanitizeOrderForActor(existing, cashier);
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
      baseSellingPrice?: number;
      appliedPolicy?: Types.ObjectId;
      appliedPolicyName?: string;
      grossMarginPercent?: number;
      markupPercent?: number;
      approver?: Types.ObjectId;
      approvalReason?: string;
    }> = [];

    let grossSubtotal = 0;
    let totalLineDiscounts = 0;
    let calculatedSubtotal = 0;
    let marginApprovalRequired = false;
    let marginApprovalReason: string | undefined = undefined;
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

      let baseSellingPrice =
        (product.discountPrice > 0 ? product.discountPrice : product.price) *
        conversionRatio;
      let appliedPolicyId: Types.ObjectId | undefined = undefined;
      let appliedPolicyName: string | undefined = undefined;
      let grossMarginPercent = 0;
      let markupPercent = 0;

      // SEC-007: Đơn giá do client gửi không bao giờ được tin. Giá thực tế của dòng
      // luôn lấy từ CSDL (unitPrice). Nếu client gửi giá cao hơn mức giá niêm yết/giá
      // đang áp dụng thì từ chối (dấu hiệu né kiểm tra sàn biên lợi nhuận); nếu thấp hơn
      // thì bỏ qua (muốn giảm giá phải dùng trường discount + quy trình phê duyệt).
      if (
        itemDto.unitPrice !== undefined &&
        itemDto.unitPrice !== null &&
        Number(itemDto.unitPrice) > Math.max(unitPrice, baseSellingPrice)
      ) {
        throw new BadRequestException(
          `Đơn giá gửi lên của sản phẩm "${product.name}" vượt quá giá niêm yết trong hệ thống. Giá bán được tính hoàn toàn từ hệ thống.`,
        );
      }

      if (this.pricingService) {
        try {
          const priceCalc = await this.pricingService.calculateItemPrice({
            productId: product._id.toString(),
            quantity: qtyNum,
            unit: finalUnit,
            conversionRatio,
            channel: 'POS',
            customerType:
              dto.customerType === POSCustomerType.WHOLESALE
                ? 'WHOLESALE'
                : 'RETAIL',
            // SEC-007: kiểm tra sàn biên lợi nhuận/chiết khấu trên đúng giá thực tế sẽ thu (từ CSDL)
            requestedUnitPrice: unitPrice,
            requestedDiscount: itemDiscount,
          });

          if (
            priceCalc.appliedPolicyId &&
            Types.ObjectId.isValid(priceCalc.appliedPolicyId)
          ) {
            appliedPolicyId = new Types.ObjectId(priceCalc.appliedPolicyId);
          }
          appliedPolicyName = priceCalc.appliedPolicyName;
          grossMarginPercent = priceCalc.grossMarginPercent;
          markupPercent = priceCalc.markupPercent;
          baseSellingPrice = priceCalc.baseSellingPrice;

          if (priceCalc.requiresApproval) {
            marginApprovalRequired = true;
            marginApprovalReason = priceCalc.reason;
          }
        } catch (err: any) {
          if (
            err instanceof BadRequestException ||
            err instanceof NotFoundException
          ) {
            throw err;
          }
          this.logger.warn(
            `Pricing calculation error for product ${product.name}: ${err.message}`,
          );
        }
      } else {
        if (costPrice > 0 && lineTotal > 0) {
          grossMarginPercent =
            Math.round(
              ((lineTotal / qtyNum - costPrice) / (lineTotal / qtyNum)) * 10000,
            ) / 100;
          markupPercent =
            Math.round(((lineTotal / qtyNum - costPrice) / costPrice) * 10000) /
            100;
        }
      }

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
        baseSellingPrice,
        appliedPolicy: appliedPolicyId,
        appliedPolicyName,
        grossMarginPercent,
        markupPercent,
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
        (cashier.permissions.includes(StaffPermission.POS_OVERRIDE_DISCOUNT) ||
          cashier.permissions.includes(StaffPermission.MANAGE_PRICING)));

    if (totalDiscountPercent > 20 || marginApprovalRequired) {
      if (cashierHasOverridePerm) {
        approvedBy = cashierId;
        approvedByName = cashierName;
      } else {
        if (!dto.approvedById) {
          throw new ForbiddenException(
            marginApprovalRequired
              ? `Đơn hàng bán dưới sàn biên lợi nhuận hoặc thiếu giá vốn (${marginApprovalReason || 'Margin breach'}). Bắt buộc phải có Quản lý phê duyệt (approvedById).`
              : `Tổng mức giảm giá đạt ${totalDiscountPercent.toFixed(1)}% (vượt mức cho phép 20%). Bắt buộc phải có Quản lý phê duyệt (approvedById). Nhập lý do không thể thay thế quyền phê duyệt.`,
          );
        }

        if (!dto.managerPassword && !dto.approvalToken) {
          throw new ForbiddenException(
            'Phê duyệt mức chiết khấu > 20% hoặc vi phạm biên lợi nhuận bắt buộc phải có xác thực từ Quản lý (managerPassword hoặc approvalToken).',
          );
        }

        // SEC-006: Chặn dò mật khẩu/token Quản lý theo từng thu ngân và từng người duyệt
        const approvalKeys = [
          `cashier:${String(cashierId)}`,
          `approver:${String(dto.approvedById)}`,
        ];
        this.assertApprovalNotLocked(approvalKeys);

        const approver = await this.usersService.findByIdWithPassword(
          dto.approvedById,
        );

        // Thông báo lỗi chung để không lộ tài khoản nào tồn tại / là Quản lý (chống oracle)
        if (!approver || approver.status === false) {
          throw this.approvalDenied(approvalKeys);
        }

        const isApproverAuthorized =
          approver.role === UserRole.ADMIN ||
          approver.role === UserRole.SUPER_ADMIN ||
          (Array.isArray(approver.permissions) &&
            (approver.permissions.includes(
              StaffPermission.POS_OVERRIDE_DISCOUNT,
            ) ||
              approver.permissions.includes(StaffPermission.MANAGE_PRICING)));

        if (!isApproverAuthorized) {
          throw this.approvalDenied(approvalKeys);
        }

        if (dto.managerPassword) {
          // SEC-006: Chỉ so sánh bằng bcrypt, tuyệt đối không so sánh plaintext
          const isPasswordValid =
            typeof approver.password === 'string' &&
            approver.password.length > 0 &&
            (await bcrypt
              .compare(dto.managerPassword, approver.password)
              .catch(() => false));
          if (!isPasswordValid) {
            throw this.approvalDenied(approvalKeys);
          }
        } else if (dto.approvalToken) {
          // PRC-T11: Xác thực approvalToken gắn với orderPayloadHash để chống replay đơn khác
          const expectedPayloadBound = `approval:${String(approver._id)}:${orderPayloadHash}`;
          const hmacBound = crypto
            .createHmac(
              'sha256',
              process.env.JWT_SECRET || 'truongthanh-pricing-approval-secret',
            )
            .update(expectedPayloadBound)
            .digest('hex');

          const expectedPayloadLegacy = `approval:${String(approver._id)}:${String(cashierId)}:${Math.round(totalDiscountPercent)}`;
          const hmacLegacy = crypto
            .createHmac(
              'sha256',
              process.env.JWT_SECRET || 'pos-override-secret',
            )
            .update(expectedPayloadLegacy)
            .digest('hex');

          if (
            dto.approvalToken !== hmacBound &&
            dto.approvalToken !== hmacLegacy
          ) {
            throw this.approvalDenied(approvalKeys);
          }
        }

        this.clearApprovalFailures(approvalKeys);
        approvedBy = approver._id;
        approvedByName = approver.fullName || 'Quản lý cửa hàng';
      }
    }

    if (approvedBy) {
      for (const it of orderItems) {
        it.approver = approvedBy;
        it.approvalReason =
          marginApprovalReason ||
          dto.discountReason ||
          'Quản lý phê duyệt bán hàng';
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

    const isCreditSale = dto.paymentMethod === PaymentMethod.CREDIT;
    let creditCustomerId: Types.ObjectId | undefined = undefined;
    let paidAmount = 0;
    let unpaidDebt = 0;
    let creditDueDate = new Date();

    if (isCreditSale) {
      if (!dto.customerId || !Types.ObjectId.isValid(dto.customerId)) {
        throw new BadRequestException(
          'Bán chịu (CREDIT) bắt buộc phải chọn khách hàng hợp lệ (customerId).',
        );
      }
      creditCustomerId = new Types.ObjectId(dto.customerId);
      paidAmount = Math.max(0, Number(dto.paidAmount || 0));

      if (paidAmount >= finalAmount) {
        throw new BadRequestException(
          'Đơn hàng đã thanh toán đủ tiền, vui lòng chọn hình thức thanh toán Tiền mặt hoặc Chuyển khoản thay vì Bán chịu.',
        );
      }

      unpaidDebt = finalAmount - paidAmount;

      // AR-T01, AR-T02, AR-T04, AR-T05: Kiểm tra tính hợp lệ về tín dụng của khách hàng
      if (this.customerCreditService) {
        await this.customerCreditService.checkCreditEligibility(
          dto.customerId,
          unpaidDebt,
        );
      }

      if (dto.dueDate) {
        creditDueDate = new Date(dto.dueDate);
      } else {
        let termDays = 30;
        if (this.customerCreditService) {
          const profile = await this.customerCreditService
            .getProfile(dto.customerId)
            .catch(() => null);
          if (profile?.paymentTermDays) {
            termDays = profile.paymentTermDays;
          }
        }
        creditDueDate = new Date();
        creditDueDate.setDate(creditDueDate.getDate() + termDays);
      }
    }

    // 5. Thực thi giao dịch MongoDB Transaction nguyên tử
    const session = await this.connection.startSession();
    try {
      session.startTransaction();

      const invoiceCode = await this.generateInvoiceCode(session);

      // AR-T08: Khóa và tăng hạn mức nợ đang dùng nguyên tử
      let receivableDocId: Types.ObjectId | undefined = undefined;

      if (isCreditSale && unpaidDebt > 0) {
        if (this.customerCreditService && creditCustomerId) {
          await this.customerCreditService.reserveCreditExposureAtomic(
            creditCustomerId.toString(),
            unpaidDebt,
            session,
          );
        }

        if (this.receivableModel && creditCustomerId) {
          const [rec] = await this.receivableModel.create(
            [
              {
                customer: creditCustomerId,
                customerName: dto.customerName?.trim() || 'Khách bán sỉ/chịu',
                customerPhone: dto.customerPhone?.trim() || '',
                invoiceCode,
                totalAmount: finalAmount,
                paidAmount,
                remainingAmount: unpaidDebt,
                creditLimit: 0,
                dueDate: creditDueDate,
                status:
                  paidAmount > 0
                    ? CustomerReceivableStatus.PARTIALLY_PAID
                    : CustomerReceivableStatus.UNPAID,
                note: dto.note || `Bán chịu đơn hàng POS ${invoiceCode}`,
              },
            ],
            { session },
          );
          receivableDocId = rec._id;
        }
      }

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

      // POS-CASH-01: Ghi nhận các bút toán luân chuyển tiền (Payment Movements & CashEntry)
      const paymentMovements: POSPaymentMovement[] = [];

      // A. Nếu là Split Payment (POS-CASH-T04)
      if (dto.splitPayments && dto.splitPayments.length > 0) {
        const totalSplit = dto.splitPayments.reduce(
          (sum, p) => sum + Number(p.amount || 0),
          0,
        );
        if (totalSplit !== finalAmount) {
          throw new BadRequestException(
            `Tổng số tiền chia tách (${totalSplit.toLocaleString('vi-VN')} đ) không khớp với tổng tiền đơn hàng (${finalAmount.toLocaleString('vi-VN')} đ) (POS-CASH-T04).`,
          );
        }

        for (let idx = 0; idx < dto.splitPayments.length; idx++) {
          const comp = dto.splitPayments[idx];
          const compAmount = Number(comp.amount);
          if (compAmount <= 0) continue;

          let targetAccount: CashAccountDocument | null = null;
          if (comp.accountId && this.accountModel) {
            targetAccount = await this.accountModel
              .findOne({ _id: comp.accountId, isDeleted: false })
              .session(session)
              .exec();
          } else if (this.accountModel) {
            const expectedType =
              comp.method === PaymentMethod.BANK_TRANSFER
                ? CashAccountType.BANK_ACCOUNT
                : CashAccountType.CASH_DRAWER;
            targetAccount = await this.accountModel
              .findOne({ type: expectedType, isDeleted: false })
              .session(session)
              .exec();
          }

          let cashEntryDoc: CashEntryDocument | null = null;
          if (targetAccount && this.financeService) {
            const splitIdemp = dto.idempotencyKey
              ? `${dto.idempotencyKey}:split:${idx}`
              : undefined;
            cashEntryDoc = await this.financeService.createEntry(
              {
                account: targetAccount._id.toString(),
                direction: CashEntryDirection.IN,
                category: CashEntryCategory.POS_REVENUE,
                amount: compAmount,
                referenceType: 'POS_ORDER',
                referenceId: invoiceCode,
                partnerName: dto.customerName?.trim() || 'Khách lẻ tại quầy',
                note: `Bán lẻ tại quầy POS (Split ${comp.method}): ${invoiceCode}`,
                idempotencyKey: splitIdemp,
              },
              cashierId.toString(),
              session,
            );
          }

          paymentMovements.push({
            method: comp.method,
            amount: compAmount,
            account: targetAccount?._id,
            accountName:
              targetAccount?.name ||
              (comp.method === PaymentMethod.BANK_TRANSFER
                ? 'Tài khoản ngân hàng'
                : 'Quỹ tiền mặt'),
            cashEntry: cashEntryDoc?._id,
            entryCode: cashEntryDoc?.entryCode,
            reference: comp.reference,
            paidAt: new Date(),
          });
        }
      } else if (isCreditSale) {
        // B. Bán chịu công nợ (CREDIT):
        // POS-CASH-T03: Bán chịu không tăng CashAccount. Chỉ ghi nhận khi có tiền trả trước (paidAmount > 0).
        if (paidAmount > 0) {
          let targetAccount: CashAccountDocument | null = null;
          if (dto.accountId && this.accountModel) {
            targetAccount = await this.accountModel
              .findOne({ _id: dto.accountId, isDeleted: false })
              .session(session)
              .exec();
          } else if (this.accountModel) {
            targetAccount = await this.accountModel
              .findOne({ type: CashAccountType.CASH_DRAWER, isDeleted: false })
              .session(session)
              .exec();
          }

          let cashEntryDoc: CashEntryDocument | null = null;
          if (targetAccount && this.financeService) {
            const creditIdemp = dto.idempotencyKey
              ? `${dto.idempotencyKey}:deposit`
              : undefined;
            cashEntryDoc = await this.financeService.createEntry(
              {
                account: targetAccount._id.toString(),
                direction: CashEntryDirection.IN,
                category: CashEntryCategory.POS_REVENUE,
                amount: paidAmount,
                referenceType: 'POS_ORDER',
                referenceId: invoiceCode,
                partnerName: dto.customerName?.trim() || 'Khách bán sỉ/chịu',
                note: `Thu tiền cọc/trả trước đơn bán chịu POS: ${invoiceCode}`,
                idempotencyKey: creditIdemp,
              },
              cashierId.toString(),
              session,
            );
          }

          paymentMovements.push({
            method: PaymentMethod.CASH,
            amount: paidAmount,
            account: targetAccount?._id,
            accountName: targetAccount?.name || 'Quỹ tiền mặt',
            cashEntry: cashEntryDoc?._id,
            entryCode: cashEntryDoc?.entryCode,
            paidAt: new Date(),
          });
        }
      } else {
        // C. Thanh toán toàn bộ: CASH hoặc BANK_TRANSFER
        const pMethod = dto.paymentMethod || PaymentMethod.CASH;
        const expectedType =
          pMethod === PaymentMethod.BANK_TRANSFER
            ? CashAccountType.BANK_ACCOUNT
            : CashAccountType.CASH_DRAWER;

        let targetAccount: CashAccountDocument | null = null;
        if (dto.accountId && this.accountModel) {
          targetAccount = await this.accountModel
            .findOne({ _id: dto.accountId, isDeleted: false })
            .session(session)
            .exec();
        } else if (this.accountModel) {
          targetAccount = await this.accountModel
            .findOne({ type: expectedType, isDeleted: false })
            .session(session)
            .exec();
        }

        let cashEntryDoc: CashEntryDocument | null = null;
        if (targetAccount && this.financeService && finalAmount > 0) {
          const entryIdemp = dto.idempotencyKey
            ? `${dto.idempotencyKey}:${pMethod.toLowerCase()}`
            : undefined;
          cashEntryDoc = await this.financeService.createEntry(
            {
              account: targetAccount._id.toString(),
              direction: CashEntryDirection.IN,
              category: CashEntryCategory.POS_REVENUE,
              amount: finalAmount,
              referenceType: 'POS_ORDER',
              referenceId: invoiceCode,
              partnerName: dto.customerName?.trim() || 'Khách lẻ tại quầy',
              note: `Bán lẻ tại quầy POS (${pMethod}): ${invoiceCode}`,
              idempotencyKey: entryIdemp,
            },
            cashierId.toString(),
            session,
          );
        }

        paymentMovements.push({
          method: pMethod,
          amount: finalAmount,
          account: targetAccount?._id,
          accountName:
            targetAccount?.name ||
            (pMethod === PaymentMethod.BANK_TRANSFER
              ? 'Tài khoản ngân hàng'
              : 'Quỹ tiền mặt'),
          cashEntry: cashEntryDoc?._id,
          entryCode: cashEntryDoc?.entryCode,
          paidAt: new Date(),
        });
      }

      const paymentStatus = isCreditSale
        ? paidAmount > 0
          ? PaymentStatus.PARTIALLY_PAID
          : PaymentStatus.UNPAID
        : PaymentStatus.PAID;

      // Tạo bản ghi hóa đơn POSOrder
      const [savedOrder] = await this.posOrderModel.create(
        [
          {
            invoiceCode,
            orderSource: OrderSource.POS,
            cashier: cashierId,
            cashierName,
            customer: creditCustomerId,
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
            cashGiven: isCreditSale ? paidAmount : cashGiven,
            changeGiven: isCreditSale ? 0 : changeGiven,
            paidAmount: isCreditSale ? paidAmount : finalAmount,
            remainingDebt: isCreditSale ? unpaidDebt : 0,
            dueDate: isCreditSale ? creditDueDate : undefined,
            customerReceivable: receivableDocId,
            paymentMovements,
            paymentMethod: dto.paymentMethod || PaymentMethod.CASH,
            paymentStatus,
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

      if (receivableDocId && this.receivableModel) {
        await this.receivableModel.updateOne(
          { _id: receivableDocId },
          { $set: { posOrder: savedOrder._id } },
          { session },
        );
      }

      await session.commitTransaction();
      this.logger.log(
        `POS Order created successfully: ${invoiceCode} - Total: ${finalAmount}đ`,
      );
      return this.sanitizeOrderForActor(savedOrder, cashier);
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
          return this.sanitizeOrderForActor(existing, cashier);
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
    actor: {
      _id: string;
      fullName?: string;
      name?: string;
      role?: string;
      permissions?: string[];
    },
  ): Promise<any> {
    const actorId = new Types.ObjectId(actor._id);
    const actorName = actor.fullName || actor.name || 'Quản lý quầy';

    // POS-CASH-T10: Kiểm tra phân quyền nhân viên thực hiện hoàn trả POS
    const isAuthorized =
      actor.role === UserRole.ADMIN ||
      actor.role === UserRole.SUPER_ADMIN ||
      (Array.isArray(actor.permissions) &&
        actor.permissions.includes(StaffPermission.POS_REFUND));

    if (!isAuthorized) {
      throw new ForbiddenException(
        'Bạn không có quyền thực hiện hoàn trả hàng tại quầy POS (POS-CASH-T10).',
      );
    }

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
          return this.sanitizeOrderForActor(order, actor);
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

      // SEC-023: Gộp số lượng theo từng dòng hóa đơn trước khi kiểm tra, để việc tách
      // cùng một sản phẩm thành nhiều dòng trong yêu cầu không thể vượt số lượng đã bán.
      const requestedQtyPerLine = new Map<any, number>();
      for (const refItem of dto.items) {
        const line = order.items.find(
          (it) =>
            it.product.toString() === refItem.productId &&
            (!refItem.unit ||
              it.unit.toLowerCase() === refItem.unit.trim().toLowerCase()),
        );
        if (!line) continue; // báo lỗi "không có trong hóa đơn" ở vòng xử lý bên dưới
        requestedQtyPerLine.set(
          line,
          (requestedQtyPerLine.get(line) || 0) + Number(refItem.quantity),
        );
      }
      for (const [line, totalQty] of requestedQtyPerLine) {
        const remaining = line.quantity - (line.returnedQuantity || 0);
        if (totalQty > remaining) {
          throw new BadRequestException(
            `Sản phẩm "${line.name}" chỉ còn có thể trả tối đa ${remaining} ${line.unit}`,
          );
        }
      }

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
        // SEC-023: Cộng cả số tiền đã tính cho cùng dòng hàng ở các dòng trước trong CÙNG yêu cầu
        for (const pr of processedRefundItems) {
          if (
            pr.product.toString() === targetItem.product.toString() &&
            pr.unit.toLowerCase() === targetItem.unit.toLowerCase()
          ) {
            alreadyRefundedForItem += pr.refundAmount || 0;
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

      // AR-T09: Nếu đơn hàng có công nợ khách hàng (customerReceivable), giảm trừ công nợ & hoàn trả hạn mức
      let debtRelief = 0;
      if (order.customerReceivable && this.receivableModel) {
        const rec = await this.receivableModel
          .findById(order.customerReceivable)
          .session(session)
          .exec();
        if (rec && rec.status !== CustomerReceivableStatus.CANCELLED) {
          debtRelief = Math.min(rec.remainingAmount, totalRefundAmount);
          if (debtRelief > 0) {
            rec.remainingAmount -= debtRelief;
            if (rec.remainingAmount <= 0) {
              rec.status = isFullyReturned
                ? CustomerReceivableStatus.CANCELLED
                : CustomerReceivableStatus.PAID;
            }
            await rec.save({ session });
            if (this.customerCreditService && order.customer) {
              await this.customerCreditService.releaseCreditExposureAtomic(
                order.customer.toString(),
                debtRelief,
                session,
              );
            }
            order.remainingDebt = rec.remainingAmount;
          }
        }
      }

      // POS-CASH-01: Nếu hoàn tiền thực tế (vượt qua phần công nợ giảm trừ), tạo Phiếu Chi (CashEntry OUT)
      const cashRefund = Math.max(0, totalRefundAmount - debtRelief);
      if (cashRefund > 0 && this.financeService) {
        let refundAccount: CashAccountDocument | null = null;
        if (this.accountModel) {
          const originalMov = (order.paymentMovements || []).find(
            (m) => m.account,
          );
          if (originalMov?.account) {
            refundAccount = await this.accountModel
              .findOne({ _id: originalMov.account, isDeleted: false })
              .session(session)
              .exec();
          }
          if (!refundAccount) {
            refundAccount = await this.accountModel
              .findOne({ type: CashAccountType.CASH_DRAWER, isDeleted: false })
              .session(session)
              .exec();
          }
        }

        if (refundAccount) {
          const refundIdemp = dto.idempotencyKey
            ? `${dto.idempotencyKey}:refund`
            : undefined;
          await this.financeService.createEntry(
            {
              account: refundAccount._id.toString(),
              direction: CashEntryDirection.OUT,
              category: CashEntryCategory.REFUND,
              amount: cashRefund,
              referenceType: 'POS_ORDER',
              referenceId: order.invoiceCode,
              partnerName: order.customerName,
              note: `Hoàn tiền trả hàng POS: ${order.invoiceCode} - Lý do: ${dto.reason.trim()}`,
              idempotencyKey: refundIdemp,
            },
            actorId.toString(),
            session,
          );
        }
      }

      await order.save({ session });
      await session.commitTransaction();

      this.logger.log(
        `POS Order ${order.invoiceCode} refunded ${totalRefundAmount}đ. Status: ${order.status}`,
      );
      return this.sanitizeOrderForActor(order, actor);
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
   * POS-10 & NEW-014: Báo cáo hoạt động theo ca bán / ngày của nhân viên thu ngân
   * Chuẩn hóa theo múi giờ Việt Nam (Asia/Ho_Chi_Minh - UTC+7), hỗ trợ ca sáng/chiều/tối,
   * và tính chính xác đổi trả phát sinh trong ca/ngày (kể cả khi hoàn trả cho đơn ngày trước).
   */
  async getSessionReport(query: POSSessionReportQueryDto): Promise<{
    date: string;
    shift: string;
    startTime: string;
    endTime: string;
    totalOrders: number;
    totalRevenue: number;
    cashTotal: number;
    transferTotal: number;
    creditTotal?: number;
    refundedOrdersCount: number;
    totalRefundedAmount: number;
    itemsSoldCount: number;
    openingCash?: number;
    expectedCash?: number;
    actualCash?: number;
    variance?: number;
  }> {
    const vnOffsetMs = 7 * 60 * 60 * 1000;
    const nowVN = new Date(Date.now() + vnOffsetMs);
    const dateStr =
      query.date && /^\d{4}-\d{2}-\d{2}$/.test(query.date)
        ? query.date
        : nowVN.toISOString().slice(0, 10);

    const shift = query.shift || POSShift.ALL;
    let startHour = 0;
    let startMin = 0;
    let endHour = 23;
    let endMin = 59;
    let endSec = 59;
    let endMs = 999;

    if (query.startTime && /^\d{2}:\d{2}$/.test(query.startTime)) {
      const [h, m] = query.startTime.split(':').map(Number);
      startHour = h;
      startMin = m;
    } else if (shift === POSShift.MORNING) {
      startHour = 6;
      startMin = 0;
    } else if (shift === POSShift.AFTERNOON) {
      startHour = 12;
      startMin = 0;
    } else if (shift === POSShift.EVENING) {
      startHour = 18;
      startMin = 0;
    }

    if (query.endTime && /^\d{2}:\d{2}$/.test(query.endTime)) {
      const [h, m] = query.endTime.split(':').map(Number);
      endHour = h;
      endMin = m;
      endSec = 0;
      endMs = 0;
    } else if (shift === POSShift.MORNING) {
      endHour = 12;
      endMin = 0;
      endSec = 0;
      endMs = 0;
    } else if (shift === POSShift.AFTERNOON) {
      endHour = 18;
      endMin = 0;
      endSec = 0;
      endMs = 0;
    } else if (shift === POSShift.EVENING) {
      endHour = 23;
      endMin = 0;
      endSec = 0;
      endMs = 0;
    }

    const windowStart = new Date(
      `${dateStr}T${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}:00.000+07:00`,
    );
    const windowEnd = new Date(
      `${dateStr}T${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}:${String(endSec).padStart(2, '0')}.${String(endMs).padStart(3, '0')}+07:00`,
    );

    // 1. Tìm các đơn POS được tạo trong ca/ngày báo cáo
    const salesFilter: Record<string, any> = {
      createdAt: { $gte: windowStart, $lte: windowEnd },
    };
    if (query.cashierId && Types.ObjectId.isValid(query.cashierId)) {
      salesFilter.cashier = new Types.ObjectId(query.cashierId);
    }

    const ordersInWindow = await this.posOrderModel.find(salesFilter).exec();

    let grossRevenue = 0;
    let cashSales = 0;
    let transferSales = 0;
    let creditSales = 0;
    let itemsSoldCount = 0;
    let completedOrdersCount = 0;
    let sessionRefundedAmount = 0;
    let sessionRefundRecordsCount = 0;
    let cashRefunded = 0;
    let transferRefunded = 0;

    for (const ord of ordersInWindow) {
      if (ord.status !== POSOrderStatus.CANCELLED) {
        completedOrdersCount++;
        grossRevenue += ord.finalAmount;

        if (ord.paymentMovements && ord.paymentMovements.length > 0) {
          for (const mov of ord.paymentMovements) {
            if (mov.method === PaymentMethod.CASH) {
              cashSales += mov.amount;
            } else if (mov.method === PaymentMethod.BANK_TRANSFER) {
              transferSales += mov.amount;
            }
          }
          if (ord.remainingDebt && ord.remainingDebt > 0) {
            creditSales += ord.remainingDebt;
          }
        } else {
          if (ord.paymentMethod === PaymentMethod.CASH) {
            cashSales += ord.finalAmount;
          } else if (ord.paymentMethod === PaymentMethod.BANK_TRANSFER) {
            transferSales += ord.finalAmount;
          } else if (ord.paymentMethod === PaymentMethod.CREDIT) {
            cashSales += ord.paidAmount || 0;
            creditSales += ord.remainingDebt || 0;
          }
        }

        for (const it of ord.items || []) {
          const actualQty = (it.quantity || 0) - (it.returnedQuantity || 0);
          itemsSoldCount += Math.max(0, actualQty);
        }

        // Nếu đơn hàng trong ca có ghi nhận hoàn tiền nhưng không có mảng refundHistory chi tiết (legacy format)
        if (
          (!ord.refundHistory || ord.refundHistory.length === 0) &&
          ord.totalRefundedAmount &&
          ord.totalRefundedAmount > 0
        ) {
          sessionRefundedAmount += ord.totalRefundedAmount;
          sessionRefundRecordsCount++;
          if (ord.paymentMethod === PaymentMethod.CASH) {
            cashRefunded += ord.totalRefundedAmount;
          } else {
            transferRefunded += ord.totalRefundedAmount;
          }
        }
      }
    }

    // 2. Tìm tất cả các nghiệp vụ hoàn trả phát sinh trong ca/ngày báo cáo (NEW-014)
    // Kể cả khi đơn hàng gốc được tạo ở ngày trước đó
    const refundFilter: Record<string, any> = {
      'refundHistory.refundedAt': { $gte: windowStart, $lte: windowEnd },
    };
    if (query.cashierId && Types.ObjectId.isValid(query.cashierId)) {
      refundFilter['refundHistory.actor'] = new Types.ObjectId(query.cashierId);
    }

    const ordersWithRefunds = await this.posOrderModel
      .find(refundFilter)
      .exec();

    for (const ord of ordersWithRefunds) {
      if (ord.refundHistory && ord.refundHistory.length > 0) {
        for (const refRecord of ord.refundHistory) {
          const refTime = new Date(refRecord.refundedAt).getTime();
          const isInWindow =
            refTime >= windowStart.getTime() && refTime <= windowEnd.getTime();
          const matchesCashier =
            !query.cashierId || refRecord.actor?.toString() === query.cashierId;

          if (isInWindow && matchesCashier) {
            sessionRefundedAmount += refRecord.totalRefundAmount;
            sessionRefundRecordsCount++;

            if (ord.paymentMethod === PaymentMethod.CASH) {
              cashRefunded += refRecord.totalRefundAmount;
            } else {
              transferRefunded += refRecord.totalRefundAmount;
            }
          }
        }
      }
    }

    const netTotalRevenue = Math.max(0, grossRevenue - sessionRefundedAmount);
    const netCashTotal = Math.max(0, cashSales - cashRefunded);
    const netTransferTotal = Math.max(0, transferSales - transferRefunded);
    const openingCash = Math.max(0, Number(query.openingCash || 0));
    const expectedCash = openingCash + cashSales - cashRefunded;
    const actualCash =
      query.actualCash !== undefined ? Number(query.actualCash) : expectedCash;
    const variance = actualCash - expectedCash;

    return {
      date: dateStr,
      shift,
      startTime: windowStart.toISOString(),
      endTime: windowEnd.toISOString(),
      totalOrders: completedOrdersCount,
      totalRevenue: netTotalRevenue,
      cashTotal: netCashTotal,
      transferTotal: netTransferTotal,
      creditTotal: creditSales,
      refundedOrdersCount: sessionRefundRecordsCount,
      totalRefundedAmount: sessionRefundedAmount,
      itemsSoldCount,
      openingCash,
      expectedCash,
      actualCash,
      variance,
    };
  }

  /**
   * POS-CASH-T11: Đối soát giữa đơn hàng POS (POSOrder) và chứng từ sổ quỹ (CashEntry)
   * Kiểm tra không có đơn đã thanh toán thiếu movement hoặc movement không có reference hợp lệ
   */
  async reconcilePOSWithCashbook(query: ReconcilePOSQueryDto): Promise<{
    totalOrdersChecked: number;
    matchedCount: number;
    discrepancyCount: number;
    isBalanced: boolean;
    discrepancies: Array<{
      orderId: string;
      invoiceCode: string;
      createdAt: Date;
      orderFinalAmount: number;
      orderPaidAmount: number;
      cashbookInflow: number;
      cashbookOutflow: number;
      netCashbookAmount: number;
      difference: number;
      paymentMethod: string;
      status: string;
    }>;
  }> {
    const filter: Record<string, any> = {
      status: { $ne: POSOrderStatus.CANCELLED },
    };

    if (query.fromDate || query.toDate) {
      filter.createdAt = {};
      if (query.fromDate) filter.createdAt.$gte = new Date(query.fromDate);
      if (query.toDate) {
        const end = new Date(query.toDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const orders = await this.posOrderModel
      .find(filter)
      .sort({ createdAt: -1 })
      .exec();

    const invoiceCodes = orders.map((o) => o.invoiceCode);
    let entries: CashEntryDocument[] = [];
    if (this.entryModel) {
      entries = await this.entryModel
        .find({
          referenceType: 'POS_ORDER',
          referenceId: { $in: invoiceCodes },
          isDeleted: false,
          status: { $ne: CashEntryStatus.CANCELLED },
        })
        .exec();
    }

    const entriesByInvoice = new Map<string, CashEntryDocument[]>();
    for (const ent of entries) {
      if (ent.referenceId) {
        const list = entriesByInvoice.get(ent.referenceId) || [];
        list.push(ent);
        entriesByInvoice.set(ent.referenceId, list);
      }
    }

    const discrepancies: any[] = [];
    let matchedCount = 0;

    for (const ord of orders) {
      const ordEntries = entriesByInvoice.get(ord.invoiceCode) || [];

      // Tính tổng thu và chi trên sổ quỹ cho hóa đơn này
      const inflow = ordEntries
        .filter((e) => e.direction === CashEntryDirection.IN)
        .reduce((sum, e) => sum + e.amount, 0);
      const outflow = ordEntries
        .filter((e) => e.direction === CashEntryDirection.OUT)
        .reduce((sum, e) => sum + e.amount, 0);
      const netCashbook = inflow - outflow;

      // Số tiền thực thu dự kiến từ đơn:
      // Nếu là CREDIT: số tiền thực trả trước (paidAmount) - hoàn tiền
      // Nếu là CASH/BANK: finalAmount - hoàn tiền
      const expectedActualPaid =
        ord.paymentMethod === PaymentMethod.CREDIT
          ? Math.max(0, (ord.paidAmount || 0) - (ord.totalRefundedAmount || 0))
          : Math.max(0, ord.finalAmount - (ord.totalRefundedAmount || 0));

      const diff = expectedActualPaid - netCashbook;

      if (diff !== 0) {
        discrepancies.push({
          orderId: ord._id.toString(),
          invoiceCode: ord.invoiceCode,
          createdAt: ord.createdAt,
          orderFinalAmount: ord.finalAmount,
          orderPaidAmount: expectedActualPaid,
          cashbookInflow: inflow,
          cashbookOutflow: outflow,
          netCashbookAmount: netCashbook,
          difference: diff,
          paymentMethod: ord.paymentMethod,
          status: ord.status,
        });
      } else {
        matchedCount++;
      }
    }

    return {
      totalOrdersChecked: orders.length,
      matchedCount,
      discrepancyCount: discrepancies.length,
      isBalanced: discrepancies.length === 0,
      discrepancies,
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
