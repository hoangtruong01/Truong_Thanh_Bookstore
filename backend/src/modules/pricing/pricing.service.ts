import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
  Optional,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as crypto from 'crypto';
import {
  PricePolicy,
  PricePolicyDocument,
  PricePolicyScope,
  PricePolicyStatus,
} from './schemas/price-policy.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import {
  Inventory,
  InventoryDocument,
} from '../inventory/schemas/inventory.schema';
import {
  CreatePricePolicyDto,
  UpdatePricePolicyDto,
  PricePolicyQueryDto,
  CalculatePriceDto,
  CheckMarginDto,
} from './dto/price-policy.dto';
import { PaginatedResult, paginate } from '../../common/dto/pagination.dto';
import { StaffPermission, UserRole, ProductStatus } from '../../common/enums';

export interface PriceCalculationResult {
  valid: boolean;
  proposedPrice?: number;
  costPrice: number;
  marginPercent?: number;
  markupPercent?: number;
  message?: string;
}

export interface MarginCheckResult {
  requiresApproval: boolean;
  effectiveSellingPrice: number;
  costPrice: number;
  effectiveMarginPercent: number;
  minMarginFloor: number;
  maxDiscountPercent: number;
  appliedPolicyName?: string;
  reason?: string;
}

export interface CalculateItemPriceParams {
  productId: string;
  quantity: number;
  unit?: string;
  conversionRatio?: number;
  channel?: string; // 'POS' | 'WEB'
  customerTier?: string; // e.g. 'REGULAR', 'SILVER', 'GOLD', 'VIP', 'WHOLESALE_1'
  customerType?: string; // 'RETAIL' | 'WHOLESALE'
  requestedUnitPrice?: number;
  requestedDiscount?: number;
  clientCostPrice?: number; // Ignored: DB is the single source of truth (PRC-T04)
}

export interface CalculateItemPriceResult {
  productId: string;
  productName: string;
  sku: string;
  unit: string;
  conversionRatio: number;
  quantity: number;
  baseQuantity: number;
  baseSellingPrice: number;
  unitPrice: number;
  costPrice: number;
  discount: number;
  lineTotal: number;
  effectiveUnitPrice: number;
  grossMarginPercent: number;
  markupPercent: number;
  appliedPolicyId?: string;
  appliedPolicyName?: string;
  minMarginFloor: number;
  maxDiscountPercent: number;
  requiresApproval: boolean;
  reason?: string;
  allowVoucherStacking: boolean;
}

@Injectable()
export class PricingService {
  private readonly logger = new Logger(PricingService.name);

  constructor(
    @InjectModel(PricePolicy.name)
    private readonly policyModel: Model<PricePolicyDocument>,
    @Optional()
    @InjectModel(Product.name)
    private readonly productModel?: Model<ProductDocument>,
    @Optional()
    @InjectModel(Inventory.name)
    private readonly inventoryModel?: Model<InventoryDocument>,
  ) {}

  /**
   * PRC-01: Tính giá bán đề xuất dựa trên Giá vốn và Tỷ lệ Lãi (Margin % hoặc Markup %)
   * - Markup = (Price - Cost) / Cost * 100
   * - Margin = (Price - Cost) / Price * 100
   * - Price = Cost / (1 - Margin / 100)
   * - Price = Cost * (1 + Markup / 100)
   */
  calculatePrice(dto: CalculatePriceDto): PriceCalculationResult {
    const { costPrice, targetMarginPercent, markupPercent } = dto;

    if (!costPrice || costPrice <= 0) {
      return {
        valid: false,
        costPrice: costPrice || 0,
        message:
          'Thiếu giá vốn hoặc giá vốn không hợp lệ (<= 0) để tính tỷ lệ lãi',
      };
    }

    if (targetMarginPercent !== undefined && targetMarginPercent !== null) {
      if (targetMarginPercent >= 100) {
        throw new BadRequestException(
          'Biên lợi nhuận mục tiêu (Margin) không được lớn hơn hoặc bằng 100%',
        );
      }
      if (targetMarginPercent < 0) {
        throw new BadRequestException('Biên lợi nhuận mục tiêu không được âm');
      }

      // Giá đề xuất từ Margin: Price = Cost / (1 - Margin / 100)
      const proposedPrice = Math.round(
        costPrice / (1 - targetMarginPercent / 100),
      );
      const calculatedMarkup =
        proposedPrice > costPrice
          ? Math.round(((proposedPrice - costPrice) / costPrice) * 10000) / 100
          : 0;

      return {
        valid: true,
        proposedPrice,
        costPrice,
        marginPercent: targetMarginPercent,
        markupPercent: calculatedMarkup,
      };
    }

    if (markupPercent !== undefined && markupPercent !== null) {
      if (markupPercent < 0) {
        throw new BadRequestException('Markup không được âm');
      }

      // Giá đề xuất từ Markup: Price = Cost * (1 + Markup / 100)
      const proposedPrice = Math.round(costPrice * (1 + markupPercent / 100));
      const calculatedMargin =
        proposedPrice > 0
          ? Math.round(((proposedPrice - costPrice) / proposedPrice) * 10000) /
            100
          : 0;

      return {
        valid: true,
        proposedPrice,
        costPrice,
        marginPercent: calculatedMargin,
        markupPercent,
      };
    }

    throw new BadRequestException(
      'Vui lòng cung cấp targetMarginPercent hoặc markupPercent',
    );
  }

  /**
   * PRC-02 & PRC-03: Kiểm tra mức sàn lợi nhuận (Margin Floor) và hạn mức chiết khấu
   * Khi thu ngân/nhân viên bán hàng sửa giá dòng hoặc áp chiết khấu,
   * nếu Margin thực tế < minMarginFloor hoặc chiết khấu > maxDiscountPercent thì bắt buộc người quản lý phê duyệt.
   */
  async checkMargin(dto: CheckMarginDto): Promise<MarginCheckResult> {
    const {
      costPrice,
      sellingPrice,
      discountPercent = 0,
      productId,
      categoryId,
      channel,
      customerTier,
    } = dto;

    const effectiveSellingPrice = Math.round(
      sellingPrice * (1 - Math.max(0, discountPercent) / 100),
    );

    const policy = await this.findApplicablePolicy(
      productId,
      categoryId,
      channel,
      customerTier,
    );

    const minMarginFloor = policy?.minMarginFloor ?? 10; // Default sàn 10%
    const maxDiscountPercent = policy?.maxDiscountPercent ?? 20; // Default chiết khấu tối đa 20%

    if (!costPrice || costPrice <= 0) {
      return {
        requiresApproval: true, // FAIL-CLOSED: Thiếu costPrice bắt buộc phải phê duyệt, không tự động thông qua (PRC-T03)
        effectiveSellingPrice,
        costPrice: 0,
        effectiveMarginPercent: 0,
        minMarginFloor,
        maxDiscountPercent,
        appliedPolicyName: policy?.name,
        reason:
          'Sản phẩm chưa có giá vốn hợp lệ (<= 0) để xác định biên lợi nhuận, bắt buộc quản lý phê duyệt',
      };
    }

    const effectiveMargin =
      effectiveSellingPrice > 0
        ? Math.round(
            ((effectiveSellingPrice - costPrice) / effectiveSellingPrice) *
              10000,
          ) / 100
        : -100;

    const isBelowFloor = effectiveMargin < minMarginFloor;
    const isExceedingDiscount = discountPercent > maxDiscountPercent;

    const requiresApproval = isBelowFloor || isExceedingDiscount;
    let reason: string | undefined;

    if (isBelowFloor && isExceedingDiscount) {
      reason = `Biên lợi nhuận (${effectiveMargin}%) dưới sàn (${minMarginFloor}%) và chiết khấu (${discountPercent}%) vượt hạn mức (${maxDiscountPercent}%)`;
    } else if (isBelowFloor) {
      reason = `Biên lợi nhuận thực tế (${effectiveMargin}%) thấp hơn mức sàn cho phép (${minMarginFloor}%)`;
    } else if (isExceedingDiscount) {
      reason = `Mức chiết khấu (${discountPercent}%) vượt quá hạn mức tối đa (${maxDiscountPercent}%)`;
    }

    return {
      requiresApproval,
      effectiveSellingPrice,
      costPrice,
      effectiveMarginPercent: effectiveMargin,
      minMarginFloor,
      maxDiscountPercent,
      appliedPolicyName: policy?.name,
      reason,
    };
  }

  /**
   * Tìm chính sách giá áp dụng phù hợp nhất theo độ ưu tiên
   * PRODUCT (50) > CATEGORY (40) > CHANNEL (30) > TIER (20) > GLOBAL (10)
   */
  async findApplicablePolicy(
    productId?: string,
    categoryId?: string,
    channel?: string,
    customerTier?: string,
  ): Promise<PricePolicyDocument | null> {
    const now = new Date();
    const conditions: any[] = [{ scope: PricePolicyScope.GLOBAL }];

    if (productId && Types.ObjectId.isValid(productId)) {
      conditions.push({
        scope: PricePolicyScope.PRODUCT,
        product: new Types.ObjectId(productId),
      });
    }

    if (categoryId && Types.ObjectId.isValid(categoryId)) {
      conditions.push({
        scope: PricePolicyScope.CATEGORY,
        category: new Types.ObjectId(categoryId),
      });
    }

    if (channel) {
      conditions.push({
        scope: PricePolicyScope.CHANNEL,
        channel,
      });
    }

    if (customerTier) {
      conditions.push({
        scope: PricePolicyScope.TIER,
        customerTier,
      });
    }

    const policies = await this.policyModel
      .find({
        isDeleted: false,
        status: PricePolicyStatus.ACTIVE,
        effectiveFrom: { $lte: now },
        $or: [
          { effectiveTo: { $exists: false } },
          { effectiveTo: null },
          { effectiveTo: { $gte: now } },
        ],
        $and: [{ $or: conditions }],
      })
      .sort({ priority: -1, createdAt: -1 })
      .exec();

    return policies.length > 0 ? policies[0] : null;
  }

  /**
   * PRC-01: Engine tính giá máy chủ dùng chung cho POS và WEB
   * - Lấy giá vốn và cấu hình sản phẩm từ CSDL, hoàn toàn bỏ qua costPrice từ client (PRC-T04)
   * - Áp dụng thứ tự ưu tiên: PRODUCT (50) > CATEGORY (40) > CHANNEL (30) > TIER (20) > GLOBAL (10) (PRC-T06)
   * - Kiểm tra thời hạn hiệu lực của chính sách (PRC-T07, PRC-T08)
   * - Hỗ trợ giá sỉ, tier khách hàng, giá theo số lượng (PRC-T09, PRC-T13)
   * - Đánh giá sàn biên lợi nhuận (Fail-closed khi thiếu giá vốn) (PRC-T01, PRC-T02, PRC-T03)
   */
  async calculateItemPrice(
    params: CalculateItemPriceParams,
  ): Promise<CalculateItemPriceResult> {
    if (!params.productId || !Types.ObjectId.isValid(params.productId)) {
      throw new BadRequestException(
        `ID sản phẩm không hợp lệ: ${params.productId}`,
      );
    }

    if (!this.productModel) {
      throw new BadRequestException('ProductModel chưa được khởi tạo');
    }

    const product = await this.productModel.findById(params.productId).exec();
    if (!product || product.isDeleted) {
      throw new NotFoundException(
        `Sản phẩm không tồn tại hoặc đã bị xóa (ID: ${params.productId})`,
      );
    }

    if (product.status === ProductStatus.INACTIVE) {
      throw new BadRequestException(
        `Sản phẩm "${product.name}" đã ngừng kinh doanh`,
      );
    }

    const qty = Number(params.quantity);
    if (isNaN(qty) || !isFinite(qty) || qty <= 0) {
      throw new BadRequestException('Số lượng phải là số dương hợp lệ');
    }

    // 1. Lấy giá vốn từ CSDL (Inventory hoặc Product), hoàn toàn bỏ qua params.clientCostPrice (PRC-T04)
    let costPrice = 0;
    if (this.inventoryModel) {
      const inv = await this.inventoryModel
        .findOne({ product: product._id })
        .exec();
      costPrice = inv?.costPrice || (product as any).costPrice || 0;
    } else {
      costPrice = (product as any).costPrice || 0;
    }

    // 2. Quy đổi đơn vị và tính giá cơ sở từ CSDL
    const baseUnit = (product.unit || 'cái').trim();
    let conversionRatio = 1;
    let finalUnit = baseUnit;
    let baseUnitPrice =
      product.discountPrice > 0 ? product.discountPrice : product.price;

    const requestedUnit = params.unit ? params.unit.trim() : finalUnit;
    if (requestedUnit.toLowerCase() !== baseUnit.toLowerCase()) {
      const matched = product.unitConversions?.find(
        (c) => c.unit.toLowerCase() === requestedUnit.toLowerCase(),
      );
      if (!matched) {
        throw new BadRequestException(
          `Đơn vị "${requestedUnit}" chưa được cấu hình cho sản phẩm "${product.name}".`,
        );
      }
      if (
        params.conversionRatio !== undefined &&
        params.conversionRatio !== null &&
        Number(params.conversionRatio) !== matched.ratio
      ) {
        throw new BadRequestException(
          `Tỷ lệ quy đổi đơn vị gửi lên (${params.conversionRatio}) không khớp với cấu hình hệ thống (${matched.ratio}).`,
        );
      }
      conversionRatio = matched.ratio || 1;
      finalUnit = matched.unit;
      if (matched.price && matched.price > 0) {
        baseUnitPrice = matched.price;
      } else {
        baseUnitPrice = baseUnitPrice * conversionRatio;
      }
    }

    const baseQuantity = qty * conversionRatio;

    // 3. Tìm chính sách giá phù hợp theo độ ưu tiên (PRC-T06, PRC-T07, PRC-T08, PRC-T09)
    const policy = await this.findApplicablePolicy(
      product._id.toString(),
      product.category?.toString(),
      params.channel,
      params.customerTier,
    );

    let unitPrice = baseUnitPrice;

    // 4. Kiểm tra bậc giá theo số lượng (Volume Tiers - PRC-T13)
    let appliedTier: any = null;
    if (policy && policy.quantityTiers && policy.quantityTiers.length > 0) {
      const sortedTiers = [...policy.quantityTiers].sort(
        (a, b) => b.minQuantity - a.minQuantity,
      );
      appliedTier = sortedTiers.find(
        (t) => qty >= t.minQuantity && (!t.maxQuantity || qty <= t.maxQuantity),
      );
      if (appliedTier) {
        if (
          appliedTier.fixedPrice !== undefined &&
          appliedTier.fixedPrice > 0
        ) {
          unitPrice = appliedTier.fixedPrice * conversionRatio;
        } else if (
          appliedTier.discountPercent !== undefined &&
          appliedTier.discountPercent > 0
        ) {
          unitPrice = Math.round(
            baseUnitPrice * (1 - appliedTier.discountPercent / 100),
          );
        } else if (
          appliedTier.targetMarginPercent !== undefined &&
          appliedTier.targetMarginPercent < 100 &&
          costPrice > 0
        ) {
          unitPrice =
            Math.round(
              costPrice / (1 - appliedTier.targetMarginPercent / 100),
            ) * conversionRatio;
        }
      }
    }

    // 5. Nếu không khớp volume tier, xét chính sách giá ưu tiên hoặc giá sỉ theo sản phẩm
    if (!appliedTier) {
      if (
        policy &&
        (policy.fixedPrice !== undefined ||
          policy.discountPercent !== undefined ||
          policy.targetMarginPercent !== undefined)
      ) {
        if (policy.fixedPrice !== undefined && policy.fixedPrice > 0) {
          unitPrice = policy.fixedPrice * conversionRatio;
        } else if (
          policy.discountPercent !== undefined &&
          policy.discountPercent > 0
        ) {
          unitPrice = Math.round(
            baseUnitPrice * (1 - policy.discountPercent / 100),
          );
        } else if (
          policy.targetMarginPercent !== undefined &&
          policy.targetMarginPercent < 100 &&
          costPrice > 0
        ) {
          unitPrice =
            Math.round(costPrice / (1 - policy.targetMarginPercent / 100)) *
            conversionRatio;
        }
      } else {
        const isWholesale =
          params.customerType === 'WHOLESALE' ||
          params.customerTier?.toUpperCase().includes('WHOLESALE') ||
          (product.wholesaleMinQuantity &&
            product.wholesaleMinQuantity > 1 &&
            qty >= product.wholesaleMinQuantity);

        if (
          isWholesale &&
          product.wholesalePrice &&
          product.wholesalePrice > 0
        ) {
          unitPrice = product.wholesalePrice * conversionRatio;
        }
      }
    }

    // 6. Cho phép giá dòng do thu ngân yêu cầu (cashier override) nếu hợp lệ
    if (
      params.requestedUnitPrice !== undefined &&
      params.requestedUnitPrice !== null
    ) {
      unitPrice = Number(params.requestedUnitPrice);
    }

    // 7. Tính chiết khấu dòng hàng
    const requestedDiscount =
      params.requestedDiscount !== undefined &&
      params.requestedDiscount !== null
        ? Number(params.requestedDiscount)
        : 0;

    const lineGross = unitPrice * qty;
    if (requestedDiscount > lineGross) {
      throw new BadRequestException(
        `Chiết khấu dòng sản phẩm "${product.name}" (${requestedDiscount}đ) không được vượt quá giá trị hàng (${lineGross}đ).`,
      );
    }

    const discount = Math.max(0, requestedDiscount);
    const lineTotal = Math.max(0, lineGross - discount);
    const effectiveUnitPrice = qty > 0 ? lineTotal / qty : 0;

    // 8. Đánh giá sàn biên lợi nhuận (PRC-T01, PRC-T02, PRC-T03)
    const minMarginFloor = policy?.minMarginFloor ?? 10;
    const maxDiscountPercent = policy?.maxDiscountPercent ?? 20;
    const lineDiscountPercent =
      lineGross > 0 ? (discount / lineGross) * 100 : 0;

    let requiresApproval = false;
    let reason: string | undefined = undefined;
    let grossMarginPercent = 0;
    let markupPercent = 0;

    if (!costPrice || costPrice <= 0) {
      // FAIL-CLOSED: Không có giá vốn hợp lệ -> bắt buộc Quản lý phê duyệt (PRC-T03)
      requiresApproval = true;
      reason =
        'Sản phẩm chưa có giá vốn hợp lệ (<= 0) để xác định biên lợi nhuận, bắt buộc quản lý phê duyệt';
    } else {
      grossMarginPercent =
        effectiveUnitPrice > 0
          ? Math.round(
              ((effectiveUnitPrice - costPrice) / effectiveUnitPrice) * 10000,
            ) / 100
          : -100;

      markupPercent =
        Math.round(((effectiveUnitPrice - costPrice) / costPrice) * 10000) /
        100;

      const isBelowFloor = grossMarginPercent < minMarginFloor;
      const isExceedingDiscount = lineDiscountPercent > maxDiscountPercent;
      requiresApproval = isBelowFloor || isExceedingDiscount;

      if (isBelowFloor && isExceedingDiscount) {
        reason = `Biên lợi nhuận (${grossMarginPercent}%) dưới sàn (${minMarginFloor}%) và chiết khấu (${lineDiscountPercent.toFixed(1)}%) vượt hạn mức (${maxDiscountPercent}%)`;
      } else if (isBelowFloor) {
        reason = `Biên lợi nhuận thực tế (${grossMarginPercent}%) thấp hơn mức sàn cho phép (${minMarginFloor}%)`;
      } else if (isExceedingDiscount) {
        reason = `Mức chiết khấu (${lineDiscountPercent.toFixed(1)}%) vượt quá hạn mức tối đa (${maxDiscountPercent}%)`;
      }
    }

    return {
      productId: product._id.toString(),
      productName: product.name,
      sku: product.sku || '',
      unit: finalUnit,
      conversionRatio,
      quantity: qty,
      baseQuantity,
      baseSellingPrice:
        (product.discountPrice > 0 ? product.discountPrice : product.price) *
        conversionRatio,
      unitPrice,
      costPrice,
      discount,
      lineTotal,
      effectiveUnitPrice,
      grossMarginPercent,
      markupPercent,
      appliedPolicyId: policy?._id?.toString(),
      appliedPolicyName: policy?.name,
      minMarginFloor,
      maxDiscountPercent,
      requiresApproval,
      reason,
      allowVoucherStacking: policy?.allowVoucherStacking ?? false,
    };
  }

  /**
   * PRC-T11: Sinh mã token phê duyệt ràng buộc mã đơn/payload fingerprint
   * Không thể sao chép dùng lại cho đơn hàng hoặc sản phẩm khác.
   */
  generateApprovalToken(params: {
    approverId: string;
    orderFingerprint: string;
  }): string {
    const secret =
      process.env.JWT_SECRET || 'truongthanh-pricing-approval-secret';
    return crypto
      .createHmac('sha256', secret)
      .update(`approval:${params.approverId}:${params.orderFingerprint}`)
      .digest('hex');
  }

  /**
   * PRC-T11 & PRC-T12: Xác thực quyền và tính hợp lệ của phê duyệt Quản lý
   */
  verifyApproval(params: {
    approver: {
      _id: any;
      role?: string;
      permissions?: string[];
      status?: boolean;
    };
    orderFingerprint: string;
    approvalToken?: string;
  }): boolean {
    if (params.approver.status === false) {
      throw new ForbiddenException(
        'Người phê duyệt không hợp lệ hoặc tài khoản Quản lý đã bị khóa.',
      );
    }

    const isApproverAuthorized =
      params.approver.role === UserRole.ADMIN ||
      params.approver.role === UserRole.SUPER_ADMIN ||
      (Array.isArray(params.approver.permissions) &&
        (params.approver.permissions.includes(
          StaffPermission.POS_OVERRIDE_DISCOUNT,
        ) ||
          params.approver.permissions.includes(
            StaffPermission.MANAGE_PRICING,
          )));

    if (!isApproverAuthorized) {
      throw new ForbiddenException(
        'Người phê duyệt không hợp lệ hoặc không có quyền phê duyệt biên lợi nhuận/chiết khấu.',
      );
    }

    if (!params.approvalToken) {
      throw new ForbiddenException('Thiếu mã token phê duyệt của Quản lý.');
    }

    const expected = this.generateApprovalToken({
      approverId: String(params.approver._id),
      orderFingerprint: params.orderFingerprint,
    });

    if (params.approvalToken !== expected) {
      throw new ForbiddenException(
        'Mã token phê duyệt không hợp lệ hoặc không khớp với nội dung đơn hàng này.',
      );
    }

    return true;
  }

  /**
   * PRC-T14: Kiểm tra quy tắc cộng dồn voucher và chiết khấu sỉ (Không double discount)
   */
  validatePromotionStacking(params: {
    isWholesale?: boolean;
    hasWholesaleItems?: boolean;
    allowVoucherStacking?: boolean;
    promotionCode?: string;
  }): void {
    if (
      (params.isWholesale || params.hasWholesaleItems) &&
      !params.allowVoucherStacking &&
      params.promotionCode
    ) {
      throw new BadRequestException(
        'Mã giảm giá/voucher không áp dụng đồng thời với chính sách bán sỉ (Không cộng dồn chiết khấu).',
      );
    }
  }

  /**
   * Tạo chính sách giá mới
   */
  async create(
    dto: CreatePricePolicyDto,
    userId: string,
  ): Promise<PricePolicyDocument> {
    // Tự động gán priority chuẩn nếu không truyền
    let priority = dto.priority;
    if (priority === undefined || priority === null) {
      switch (dto.scope) {
        case PricePolicyScope.PRODUCT:
          priority = 50;
          break;
        case PricePolicyScope.CATEGORY:
          priority = 40;
          break;
        case PricePolicyScope.CHANNEL:
          priority = 30;
          break;
        case PricePolicyScope.TIER:
          priority = 20;
          break;
        case PricePolicyScope.GLOBAL:
        default:
          priority = 10;
          break;
      }
    }

    // Nếu chỉ có targetMarginPercent, tự tính markupPercent tương ứng
    let markupPercent = dto.markupPercent;
    if (
      markupPercent === undefined &&
      dto.targetMarginPercent !== undefined &&
      dto.targetMarginPercent < 100
    ) {
      markupPercent =
        Math.round(
          (dto.targetMarginPercent / (100 - dto.targetMarginPercent)) * 10000,
        ) / 100;
    }

    const policy = new this.policyModel({
      ...dto,
      priority,
      markupPercent,
      category: dto.category ? new Types.ObjectId(dto.category) : undefined,
      product: dto.product ? new Types.ObjectId(dto.product) : undefined,
      effectiveFrom: dto.effectiveFrom
        ? new Date(dto.effectiveFrom)
        : new Date(),
      effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : undefined,
      createdBy: new Types.ObjectId(userId),
      isDeleted: false,
    });

    return policy.save();
  }

  /**
   * Lấy danh sách chính sách giá (phân trang, tìm kiếm)
   */
  async findAll(
    query: PricePolicyQueryDto,
  ): Promise<PaginatedResult<PricePolicyDocument>> {
    const { page = 1, limit = 20, scope, status, search } = query;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = { isDeleted: false };

    if (scope) {
      filter.scope = scope;
    }

    if (status) {
      filter.status = status;
    }

    if (search && search.trim()) {
      filter.name = new RegExp(search.trim(), 'i');
    }

    const [items, total] = await Promise.all([
      this.policyModel
        .find(filter)
        .sort({ priority: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('category', 'name')
        .populate('product', 'name sku unit')
        .populate('createdBy', 'name email')
        .exec(),
      this.policyModel.countDocuments(filter).exec(),
    ]);

    return paginate(items, total, page, limit);
  }

  /**
   * Xem chi tiết chính sách giá
   */
  async findById(id: string): Promise<PricePolicyDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID chính sách giá không hợp lệ');
    }

    const policy = await this.policyModel
      .findOne({ _id: id, isDeleted: false })
      .populate('category', 'name')
      .populate('product', 'name sku unit')
      .populate('createdBy', 'name email')
      .exec();

    if (!policy) {
      throw new NotFoundException('Không tìm thấy chính sách giá');
    }

    return policy;
  }

  /**
   * Cập nhật chính sách giá
   */
  async update(
    id: string,
    dto: UpdatePricePolicyDto,
  ): Promise<PricePolicyDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID chính sách giá không hợp lệ');
    }

    const updateData: any = { ...dto };
    if (dto.effectiveFrom) {
      updateData.effectiveFrom = new Date(dto.effectiveFrom);
    }
    if (dto.effectiveTo) {
      updateData.effectiveTo = new Date(dto.effectiveTo);
    }

    const policy = await this.policyModel
      .findOneAndUpdate({ _id: id, isDeleted: false }, updateData, {
        new: true,
      })
      .exec();

    if (!policy) {
      throw new NotFoundException('Không tìm thấy chính sách giá để cập nhật');
    }

    return policy;
  }

  /**
   * Xóa mềm chính sách giá
   */
  async remove(id: string): Promise<{ success: boolean; message: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID chính sách giá không hợp lệ');
    }

    const policy = await this.policyModel
      .findOneAndUpdate({ _id: id, isDeleted: false }, { isDeleted: true })
      .exec();

    if (!policy) {
      throw new NotFoundException('Không tìm thấy chính sách giá để xóa');
    }

    return { success: true, message: 'Đã xóa chính sách giá thành công' };
  }
}
