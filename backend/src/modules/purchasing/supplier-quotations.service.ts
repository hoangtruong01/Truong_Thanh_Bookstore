import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, ClientSession } from 'mongoose';
import {
  SupplierQuotation,
  SupplierQuotationDocument,
} from './schemas/supplier-quotation.schema';
import {
  PurchaseOrder,
  PurchaseOrderDocument,
} from './schemas/purchase-order.schema';
import {
  Supplier,
  SupplierDocument,
} from '../suppliers/schemas/supplier.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { QuotationStatus } from '../../common/enums';
import {
  CreateSupplierQuotationDto,
  QuotationQueryDto,
  CompareSuppliersQueryDto,
  CreatePOFromQuotationDto,
} from './dto/supplier-quotation.dto';
import { PurchaseOrdersService } from './purchase-orders.service';
import { paginate, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class SupplierQuotationsService {
  private readonly logger = new Logger(SupplierQuotationsService.name);

  constructor(
    @InjectModel(SupplierQuotation.name)
    private readonly quotationModel: Model<SupplierQuotationDocument>,
    @InjectModel(PurchaseOrder.name)
    private readonly poModel: Model<PurchaseOrderDocument>,
    @InjectModel(Supplier.name)
    private readonly supplierModel: Model<SupplierDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    private readonly poService: PurchaseOrdersService,
  ) {}

  /**
   * Sinh mã Báo giá duy nhất: QUO-YYMMDD-XXXX
   */
  async generateQuotationCode(session?: ClientSession): Promise<string> {
    const now = new Date();
    const vnDateStr = now.toLocaleDateString('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
    });
    const [yyyy, mm, dd] = vnDateStr.split('-');
    const yy = yyyy.slice(-2);
    const datePrefix = `QUO${yy}${mm}${dd}`;

    const counterKey = `quo_code_${datePrefix}`;
    const counterCollection = this.quotationModel.db.collection('counters');

    const counterRes = await counterCollection.findOneAndUpdate(
      { _id: counterKey as any },
      { $inc: { seq: 1 } },
      { upsert: true, returnDocument: 'after' },
    );

    const seq = (counterRes as any)?.seq || 1;
    let code = `${datePrefix}-${String(seq).padStart(4, '0')}`;

    let attempts = 0;
    while (attempts < 5) {
      const query = this.quotationModel.findOne({
        quotationCode: code,
        isDeleted: false,
      });
      if (session) {
        query.session(session);
      }
      const existing = await query.exec();
      if (!existing) {
        break;
      }
      attempts++;
      const nextRes = await counterCollection.findOneAndUpdate(
        { _id: counterKey as any },
        { $inc: { seq: 1 } },
        { upsert: true, returnDocument: 'after' },
      );
      const nextSeq = (nextRes as any)?.seq || seq + attempts;
      code = `${datePrefix}-${String(nextSeq).padStart(4, '0')}`;
    }

    return code;
  }

  /**
   * PUR-02: Tạo báo giá nhà cung cấp mới
   */
  async create(
    dto: CreateSupplierQuotationDto,
    userId: string,
    session?: ClientSession,
  ): Promise<SupplierQuotationDocument> {
    const supplier = await this.supplierModel.findOne({
      _id: new Types.ObjectId(dto.supplier),
      isDeleted: false,
    });
    if (!supplier) {
      throw new NotFoundException('Nhà cung cấp không tồn tại');
    }

    const validFrom = new Date(dto.validFrom);
    const validUntil = new Date(dto.validUntil);
    if (validUntil < validFrom) {
      throw new BadRequestException(
        'Ngày kết thúc hiệu lực phải lớn hơn hoặc bằng ngày bắt đầu',
      );
    }

    const items = [];
    for (const itemDto of dto.items) {
      const product = await this.productModel.findOne({
        _id: new Types.ObjectId(itemDto.product),
        isDeleted: false,
      });
      if (!product) {
        throw new NotFoundException(
          `Sản phẩm ID "${itemDto.product}" không tồn tại`,
        );
      }

      // Sắp xếp bậc giá tăng dần theo số lượng
      const sortedTiers = (itemDto.priceTiers || []).sort(
        (a, b) => a.minQuantity - b.minQuantity,
      );

      items.push({
        product: product._id,
        productName: itemDto.productName || product.name,
        sku: itemDto.sku || product.sku,
        unit: itemDto.unit || (product as any).unit || 'cái',
        moq: itemDto.moq || 1,
        leadTimeDays: itemDto.leadTimeDays ?? 1,
        baseUnitPrice: itemDto.baseUnitPrice,
        priceTiers: sortedTiers,
      });
    }

    const quotationCode = await this.generateQuotationCode(session);

    const quotation = new this.quotationModel({
      quotationCode,
      supplier: supplier._id,
      status: QuotationStatus.DRAFT,
      validFrom,
      validUntil,
      paymentTerms: dto.paymentTerms || 'NET30',
      defectRate: dto.defectRate ?? 0,
      onTimeDeliveryRate: dto.onTimeDeliveryRate ?? 1,
      items,
      notes: dto.notes,
      createdBy: new Types.ObjectId(userId),
    });

    if (session) {
      return (await quotation.save({ session })) as SupplierQuotationDocument;
    }
    return (await quotation.save()) as SupplierQuotationDocument;
  }

  /**
   * Lấy danh sách báo giá có phân trang & lọc
   */
  async findAll(
    query: QuotationQueryDto,
  ): Promise<PaginatedResult<SupplierQuotationDocument>> {
    const filter: Record<string, any> = { isDeleted: false };

    if (query.supplier && Types.ObjectId.isValid(query.supplier)) {
      filter.supplier = new Types.ObjectId(query.supplier);
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.search) {
      filter.$or = [
        { quotationCode: { $regex: query.search, $options: 'i' } },
        { notes: { $regex: query.search, $options: 'i' } },
      ];
    }

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.quotationModel
        .find(filter)
        .populate('supplier', 'code name phone email')
        .populate('createdBy', 'name email')
        .populate('approvedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.quotationModel.countDocuments(filter).exec(),
    ]);

    return paginate(items, total, page, limit);
  }

  /**
   * Lấy chi tiết báo giá theo ID
   */
  async findById(id: string): Promise<SupplierQuotationDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID báo giá không hợp lệ');
    }

    const quotation = await this.quotationModel
      .findOne({ _id: new Types.ObjectId(id), isDeleted: false })
      .populate('supplier', 'code name phone email address taxCode')
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email')
      .exec();

    if (!quotation) {
      throw new NotFoundException('Không tìm thấy báo giá');
    }

    // Tự động kiểm tra quá hạn
    if (
      quotation.status === QuotationStatus.APPROVED &&
      new Date(quotation.validUntil) < new Date()
    ) {
      quotation.status = QuotationStatus.EXPIRED;
      await quotation.save();
    }

    return quotation;
  }

  /**
   * Duyệt báo giá (APPROVED)
   */
  async approve(
    id: string,
    userId: string,
  ): Promise<SupplierQuotationDocument> {
    const quotation = await this.findById(id);

    if (
      quotation.status !== QuotationStatus.DRAFT &&
      quotation.status !== QuotationStatus.SUBMITTED
    ) {
      throw new BadRequestException(
        `Không thể duyệt báo giá đang ở trạng thái "${quotation.status}"`,
      );
    }

    if (new Date(quotation.validUntil) < new Date()) {
      throw new BadRequestException(
        'Không thể duyệt báo giá đã hết hạn hiệu lực',
      );
    }

    quotation.status = QuotationStatus.APPROVED;
    quotation.approvedBy = new Types.ObjectId(userId);
    quotation.approvedAt = new Date();

    return await quotation.save();
  }

  /**
   * Từ chối báo giá (REJECTED)
   */
  async reject(
    id: string,
    userId: string,
    reason?: string,
  ): Promise<SupplierQuotationDocument> {
    const quotation = await this.findById(id);

    if (
      quotation.status !== QuotationStatus.DRAFT &&
      quotation.status !== QuotationStatus.SUBMITTED
    ) {
      throw new BadRequestException(
        `Không thể từ chối báo giá ở trạng thái "${quotation.status}"`,
      );
    }

    quotation.status = QuotationStatus.REJECTED;
    if (reason) {
      quotation.notes = quotation.notes
        ? `${quotation.notes} | Lý do từ chối: ${reason}`
        : `Lý do từ chối: ${reason}`;
    }

    return await quotation.save();
  }

  /**
   * PUR-02: Lịch sử giá theo thời gian cho một sản phẩm (Supplier Price History)
   */
  async getPriceHistory(productId: string): Promise<{
    product: any;
    quotationHistory: any[];
    purchaseHistory: any[];
  }> {
    if (!Types.ObjectId.isValid(productId)) {
      throw new BadRequestException('ID sản phẩm không hợp lệ');
    }

    const prodObjId = new Types.ObjectId(productId);
    const product = await this.productModel.findOne({
      _id: prodObjId,
      isDeleted: false,
    });
    if (!product) {
      throw new NotFoundException('Không tìm thấy sản phẩm');
    }

    // 1. Lấy lịch sử báo giá
    const quotations = await this.quotationModel
      .find({
        'items.product': prodObjId,
        isDeleted: false,
      })
      .populate('supplier', 'code name phone')
      .sort({ createdAt: -1 })
      .lean();

    const quotationHistory = quotations.map((quo: any) => {
      const item = quo.items.find(
        (it: any) => it.product?.toString() === productId,
      );
      return {
        quotationId: quo._id,
        quotationCode: quo.quotationCode,
        supplier: quo.supplier,
        status: quo.status,
        validFrom: quo.validFrom,
        validUntil: quo.validUntil,
        baseUnitPrice: item?.baseUnitPrice,
        moq: item?.moq,
        leadTimeDays: item?.leadTimeDays,
        priceTiers: item?.priceTiers || [],
        paymentTerms: quo.paymentTerms,
        createdAt: quo.createdAt,
      };
    });

    // 2. Lấy lịch sử đặt mua thực tế từ các PO
    const purchaseOrders = await this.poModel
      .find({
        'items.product': prodObjId,
        isDeleted: false,
      })
      .populate('supplier', 'code name phone')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const purchaseHistory = purchaseOrders.map((po: any) => {
      const item = po.items.find(
        (it: any) => it.product?.toString() === productId,
      );
      return {
        poId: po._id,
        poCode: po.poCode,
        supplier: po.supplier,
        status: po.status,
        orderedQuantity: item?.orderedQuantity,
        actualUnitPrice: item?.expectedUnitPrice,
        lineTotal: item?.lineTotal,
        createdAt: po.createdAt,
      };
    });

    return {
      product: {
        _id: product._id,
        name: product.name,
        sku: product.sku,
        costPrice: (product as any).costPrice ?? product.price,
      },
      quotationHistory,
      purchaseHistory,
    };
  }

  /**
   * PUR-02: So sánh NCC và Đề xuất nguồn hàng tối ưu (Purchase Recommendation Engine)
   */
  async compareSuppliers(query: CompareSuppliersQueryDto): Promise<{
    product: any;
    requestedQuantity: number;
    totalSuppliersCompared: number;
    suppliers: any[];
    recommendations: {
      bestOverall: any;
      bestPrice: any;
      fastestDelivery: any;
      highestQuality: any;
    };
  }> {
    if (!Types.ObjectId.isValid(query.productId)) {
      throw new BadRequestException('ID sản phẩm không hợp lệ');
    }

    const prodObjId = new Types.ObjectId(query.productId);
    const product = await this.productModel.findOne({
      _id: prodObjId,
      isDeleted: false,
    });
    if (!product) {
      throw new NotFoundException('Không tìm thấy sản phẩm');
    }

    const now = new Date();

    // Tìm các báo giá còn hiệu lực và đã được duyệt (APPROVED)
    const quotations = await this.quotationModel
      .find({
        'items.product': prodObjId,
        status: QuotationStatus.APPROVED,
        validUntil: { $gte: now },
        isDeleted: false,
      })
      .populate('supplier', 'code name phone email address')
      .lean();

    if (quotations.length === 0) {
      return {
        product: {
          _id: product._id,
          name: product.name,
          sku: product.sku,
        },
        requestedQuantity: query.quantity,
        totalSuppliersCompared: 0,
        suppliers: [],
        recommendations: {
          bestOverall: null,
          bestPrice: null,
          fastestDelivery: null,
          highestQuality: null,
        },
      };
    }

    // Đánh giá từng NCC
    const evaluations = quotations.map((quo: any) => {
      const item = quo.items.find(
        (it: any) => it.product?.toString() === query.productId,
      );

      // 1. Xác định đơn giá hiệu dụng theo bậc số lượng
      let effectiveUnitPrice = item.baseUnitPrice;
      let appliedTier: any = null;

      if (item.priceTiers && item.priceTiers.length > 0) {
        // Sắp xếp bậc số lượng giảm dần để tìm bậc cao nhất thoả mãn
        const sortedTiers = [...item.priceTiers].sort(
          (a, b) => b.minQuantity - a.minQuantity,
        );
        for (const tier of sortedTiers) {
          if (query.quantity >= tier.minQuantity) {
            effectiveUnitPrice = tier.unitPrice;
            appliedTier = tier;
            break;
          }
        }
      }

      const totalCost = effectiveUnitPrice * query.quantity;
      const isMoqSatisfied = query.quantity >= item.moq;

      // 2. Cảnh báo nghiệp vụ
      const warnings: string[] = [];
      if (!isMoqSatisfied) {
        warnings.push(
          `Số lượng đặt mua (${query.quantity}) thấp hơn MOQ tối thiểu (${item.moq}) của NCC`,
        );
      }
      if (quo.defectRate > 0.03) {
        warnings.push(
          `Tỷ lệ hàng lỗi cao (${(quo.defectRate * 100).toFixed(1)}%)`,
        );
      }
      if (quo.onTimeDeliveryRate < 0.9) {
        warnings.push(
          `Tỷ lệ giao đúng hẹn thấp (${(quo.onTimeDeliveryRate * 100).toFixed(1)}%)`,
        );
      }
      if (item.leadTimeDays > 7) {
        warnings.push(`Thời gian giao hàng dài (${item.leadTimeDays} ngày)`);
      }

      return {
        quotationId: quo._id,
        quotationCode: quo.quotationCode,
        supplier: quo.supplier,
        paymentTerms: quo.paymentTerms,
        defectRate: quo.defectRate,
        onTimeDeliveryRate: quo.onTimeDeliveryRate,
        leadTimeDays: item.leadTimeDays,
        moq: item.moq,
        isMoqSatisfied,
        baseUnitPrice: item.baseUnitPrice,
        effectiveUnitPrice,
        totalCost,
        appliedTier,
        warnings,
        score: 0, // Sẽ tính chuẩn hoá bên dưới
      };
    });

    // 3. Tính điểm tối ưu hoá đa tiêu chí (Multi-Attribute Optimization Scoring)
    const minCost = Math.min(...evaluations.map((e) => e.totalCost));
    const minLeadTime = Math.min(...evaluations.map((e) => e.leadTimeDays));

    evaluations.forEach((evalItem) => {
      // Tiêu chí 1: Điểm giá (Tối đa 45 điểm) - Giá càng gần minCost điểm càng cao
      const priceScore = (minCost / evalItem.totalCost) * 45;

      // Tiêu chí 2: Giao hàng đúng hẹn (Tối đa 25 điểm)
      const onTimeScore = evalItem.onTimeDeliveryRate * 25;

      // Tiêu chí 3: Chất lượng / Tỷ lệ không lỗi (Tối đa 20 điểm)
      const qualityScore = (1 - Math.min(evalItem.defectRate, 1)) * 20;

      // Tiêu chí 4: Thời gian giao hàng (Tối đa 10 điểm)
      const leadTimeRatio =
        evalItem.leadTimeDays === 0
          ? 1
          : minLeadTime / Math.max(evalItem.leadTimeDays, 1);
      const leadTimeScore = leadTimeRatio * 10;

      // Tổng điểm thô (0 - 100)
      let totalScore = priceScore + onTimeScore + qualityScore + leadTimeScore;

      // Phạt điểm nếu không đạt MOQ hoặc tỷ lệ lỗi nghiêm trọng (>5%)
      if (!evalItem.isMoqSatisfied) {
        totalScore -= 30; // Trừ 30 điểm vi phạm MOQ
      }
      if (evalItem.defectRate > 0.05) {
        totalScore -= 20; // Trừ 20 điểm rủi ro lỗi nặng
      }

      evalItem.score = Math.max(0, Math.round(totalScore * 10) / 10);
    });

    // Sắp xếp theo điểm tổng thể giảm dần
    evaluations.sort((a, b) => b.score - a.score);

    // Xác định các danh hiệu đặc biệt
    const validMoqEvals = evaluations.filter((e) => e.isMoqSatisfied);
    const candidateList =
      validMoqEvals.length > 0 ? validMoqEvals : evaluations;

    const bestOverall = evaluations[0];
    const bestPrice = [...candidateList].sort(
      (a, b) => a.effectiveUnitPrice - b.effectiveUnitPrice,
    )[0];
    const fastestDelivery = [...candidateList].sort(
      (a, b) => a.leadTimeDays - b.leadTimeDays,
    )[0];
    const highestQuality = [...candidateList].sort(
      (a, b) =>
        a.defectRate - b.defectRate ||
        b.onTimeDeliveryRate - a.onTimeDeliveryRate,
    )[0];

    return {
      product: {
        _id: product._id,
        name: product.name,
        sku: product.sku,
      },
      requestedQuantity: query.quantity,
      totalSuppliersCompared: evaluations.length,
      suppliers: evaluations,
      recommendations: {
        bestOverall: bestOverall
          ? {
              quotationCode: bestOverall.quotationCode,
              supplierName: bestOverall.supplier?.name,
              score: bestOverall.score,
              effectiveUnitPrice: bestOverall.effectiveUnitPrice,
              totalCost: bestOverall.totalCost,
            }
          : null,
        bestPrice: bestPrice
          ? {
              quotationCode: bestPrice.quotationCode,
              supplierName: bestPrice.supplier?.name,
              effectiveUnitPrice: bestPrice.effectiveUnitPrice,
              totalCost: bestPrice.totalCost,
            }
          : null,
        fastestDelivery: fastestDelivery
          ? {
              quotationCode: fastestDelivery.quotationCode,
              supplierName: fastestDelivery.supplier?.name,
              leadTimeDays: fastestDelivery.leadTimeDays,
            }
          : null,
        highestQuality: highestQuality
          ? {
              quotationCode: highestQuality.quotationCode,
              supplierName: highestQuality.supplier?.name,
              defectRate: highestQuality.defectRate,
              onTimeDeliveryRate: highestQuality.onTimeDeliveryRate,
            }
          : null,
      },
    };
  }

  /**
   * PUR-02: Tạo Đơn đặt hàng PO từ Báo giá đã duyệt
   * Snapshot đơn giá vào PO — Không bị ảnh hưởng nếu báo giá thay đổi sau này!
   */
  async createPOFromQuotation(
    dto: CreatePOFromQuotationDto,
    userId: string,
    session?: ClientSession,
  ): Promise<PurchaseOrderDocument> {
    const quotation = await this.findById(dto.quotationId);

    if (quotation.status !== QuotationStatus.APPROVED) {
      throw new BadRequestException(
        `Chỉ có thể tạo đơn PO từ báo giá đã được DUYỆT (Hiện tại: ${quotation.status})`,
      );
    }

    if (new Date(quotation.validUntil) < new Date()) {
      throw new BadRequestException(
        'Báo giá này đã hết hạn hiệu lực, không thể tạo đơn đặt hàng',
      );
    }

    const poItems = [];
    for (const reqItem of dto.items) {
      const qItem = quotation.items.find(
        (it) => it.product.toString() === reqItem.product,
      );
      if (!qItem) {
        throw new BadRequestException(
          `Sản phẩm ID "${reqItem.product}" không nằm trong báo giá ${quotation.quotationCode}`,
        );
      }

      if (reqItem.orderedQuantity < qItem.moq) {
        throw new BadRequestException(
          `Số lượng đặt mua cho sản phẩm "${qItem.productName}" (${reqItem.orderedQuantity}) không đạt MOQ tối thiểu (${qItem.moq}) của báo giá`,
        );
      }

      // Xác định đơn giá theo bậc số lượng
      let snapshotUnitPrice = qItem.baseUnitPrice;
      if (qItem.priceTiers && qItem.priceTiers.length > 0) {
        const sortedTiers = [...qItem.priceTiers].sort(
          (a, b) => b.minQuantity - a.minQuantity,
        );
        for (const tier of sortedTiers) {
          if (reqItem.orderedQuantity >= tier.minQuantity) {
            snapshotUnitPrice = tier.unitPrice;
            break;
          }
        }
      }

      poItems.push({
        product: reqItem.product,
        unit: qItem.unit,
        orderedQuantity: reqItem.orderedQuantity,
        expectedUnitPrice: snapshotUnitPrice,
      });
    }

    // Tạo PO thông qua PurchaseOrdersService
    const po = await this.poService.create(
      {
        supplier: quotation.supplier._id.toString(),
        items: poItems,
        expectedDeliveryDate: dto.expectedDeliveryDate
          ? new Date(dto.expectedDeliveryDate)
          : undefined,
        note: dto.note
          ? `${dto.note} [Báo giá tham chiếu: ${quotation.quotationCode}]`
          : `[Tạo từ báo giá: ${quotation.quotationCode}]`,
      },
      userId,
      session,
    );

    return po;
  }
}
