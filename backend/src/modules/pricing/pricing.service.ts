import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  PricePolicy,
  PricePolicyDocument,
  PricePolicyScope,
  PricePolicyStatus,
} from './schemas/price-policy.schema';
import {
  CreatePricePolicyDto,
  UpdatePricePolicyDto,
  PricePolicyQueryDto,
  CalculatePriceDto,
  CheckMarginDto,
} from './dto/price-policy.dto';
import { PaginatedResult, paginate } from '../../common/dto/pagination.dto';

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

@Injectable()
export class PricingService {
  private readonly logger = new Logger(PricingService.name);

  constructor(
    @InjectModel(PricePolicy.name)
    private readonly policyModel: Model<PricePolicyDocument>,
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
        requiresApproval: false,
        effectiveSellingPrice,
        costPrice: 0,
        effectiveMarginPercent: 0,
        minMarginFloor,
        maxDiscountPercent,
        appliedPolicyName: policy?.name,
        reason: 'Sản phẩm chưa có giá vốn, cần đối soát giá',
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
