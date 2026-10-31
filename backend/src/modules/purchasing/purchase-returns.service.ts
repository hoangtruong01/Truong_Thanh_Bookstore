import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  Optional,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, ClientSession } from 'mongoose';
import {
  PurchaseReturn,
  PurchaseReturnDocument,
  PurchaseReturnStatus,
  CreditAdjustmentStatus,
} from './schemas/purchase-return.schema';
import {
  GoodsReceipt,
  GoodsReceiptDocument,
} from './schemas/goods-receipt.schema';
import {
  CreatePurchaseReturnDto,
  PurchaseReturnQueryDto,
  ConfirmCreditAdjustmentDto,
} from './dto/purchase-return.dto';
import { InventoryService } from '../inventory/inventory.service';
import { FinanceService } from '../finance/finance.service';
import { paginate, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class PurchaseReturnsService {
  private readonly logger = new Logger(PurchaseReturnsService.name);

  constructor(
    @InjectModel(PurchaseReturn.name)
    private readonly returnModel: Model<PurchaseReturnDocument>,
    @InjectModel(GoodsReceipt.name)
    private readonly receiptModel: Model<GoodsReceiptDocument>,
    private readonly inventoryService: InventoryService,
    @Optional()
    private readonly financeService?: FinanceService,
  ) {}

  /**
   * Sinh mã phiếu trả hàng duy nhất: PR + YYMMDD + -XXXX
   */
  async generateReturnCode(session?: ClientSession): Promise<string> {
    const now = new Date();
    const vnDateStr = now.toLocaleDateString('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
    });
    const [yyyy, mm, dd] = vnDateStr.split('-');
    const yy = yyyy.slice(-2);
    const datePrefix = `PR${yy}${mm}${dd}`;

    const counterKey = `purchase_return_code_${datePrefix}`;
    const counterCollection = this.returnModel.db.collection('counters');

    const counterRes = await counterCollection.findOneAndUpdate(
      { _id: counterKey as any },
      { $inc: { seq: 1 } },
      { upsert: true, returnDocument: 'after' },
    );

    const seq = (counterRes as any)?.seq || 1;
    let code = `${datePrefix}-${String(seq).padStart(4, '0')}`;

    let existsQuery = this.returnModel.findOne({
      returnCode: code,
      isDeleted: false,
    });
    if (session && typeof existsQuery?.session === 'function') {
      existsQuery.session(session);
    }
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
      existsQuery = this.returnModel.findOne({
        returnCode: code,
        isDeleted: false,
      });
      if (session && typeof existsQuery?.session === 'function') {
        existsQuery.session(session);
      }
    }

    return code;
  }

  /**
   * PUR-04: Tạo phiếu trả hàng cho nhà cung cấp
   * - Giảm tồn kho khả dụng
   * - Kiểm tra số lượng trả không vượt quá số nhận trong GRN
   * - Kiểm tra tồn kho hiện tại không bị âm
   * - Quản lý trạng thái bù trừ công nợ (Credit Adjustment)
   */
  async createReturn(
    dto: CreatePurchaseReturnDto,
    userId: string,
  ): Promise<PurchaseReturnDocument> {
    if (!Types.ObjectId.isValid(dto.goodsReceiptId)) {
      throw new BadRequestException('ID phiếu nhận hàng không hợp lệ');
    }

    // 1. Kiểm tra idempotencyKey
    if (dto.idempotencyKey) {
      const existing = await this.returnModel.findOne({
        idempotencyKey: dto.idempotencyKey,
        isDeleted: false,
      });
      if (existing) {
        this.logger.log(
          `Idempotent retry: Phiếu trả ${existing.returnCode} đã tồn tại cho key ${dto.idempotencyKey}`,
        );
        return existing;
      }
    }

    // 2. Tìm phiếu nhận hàng gốc
    const receipt = await this.receiptModel
      .findOne({ _id: dto.goodsReceiptId, isDeleted: false })
      .populate('supplier')
      .exec();

    if (!receipt) {
      throw new NotFoundException('Không tìm thấy phiếu nhận hàng tương ứng');
    }

    // 3. Lấy tất cả các phiếu trả hàng trước đó của GRN này để tính số đã trả
    const previousReturns = await this.returnModel
      .find({
        goodsReceipt: receipt._id,
        status: { $ne: PurchaseReturnStatus.CANCELLED },
        isDeleted: false,
      })
      .exec();

    const returnedQuantitiesByProduct = new Map<string, number>();
    for (const pr of previousReturns) {
      for (const item of pr.items) {
        const prodId = item.product.toString();
        const current = returnedQuantitiesByProduct.get(prodId) || 0;
        returnedQuantitiesByProduct.set(prodId, current + item.baseQuantity);
      }
    }

    const validatedItems: any[] = [];
    let totalAmount = 0;

    for (const itemDto of dto.items) {
      if (!Types.ObjectId.isValid(itemDto.productId)) {
        throw new BadRequestException(
          `ID sản phẩm ${itemDto.productId} không hợp lệ`,
        );
      }

      const receiptItem = receipt.items.find(
        (it) => it.product.toString() === itemDto.productId,
      );

      if (!receiptItem) {
        throw new BadRequestException(
          `Sản phẩm ID ${itemDto.productId} không có trong phiếu nhận hàng ${receipt.receiptCode}`,
        );
      }

      const conversionRatio = receiptItem.conversionRatio || 1;
      const baseQuantity = itemDto.returnedQuantity * conversionRatio;

      // Kiểm tra xem số lượng trả có vượt quá số nhận không
      const alreadyReturned =
        returnedQuantitiesByProduct.get(itemDto.productId) || 0;
      const eligibleQuantity = receiptItem.baseQuantity - alreadyReturned;

      if (baseQuantity > eligibleQuantity) {
        throw new BadRequestException(
          `Số lượng trả cho sản phẩm "${receiptItem.productName}" (${baseQuantity} cái) vượt quá số lượng còn lại có thể trả (${eligibleQuantity} cái)`,
        );
      }

      // Giá vốn mỗi đơn vị tính
      const unitCost = receiptItem.actualUnitPrice;
      const lineTotal = Math.round(itemDto.returnedQuantity * unitCost);
      totalAmount += lineTotal;

      validatedItems.push({
        product: receiptItem.product,
        productName: receiptItem.productName,
        sku: receiptItem.sku,
        unit: itemDto.unit || receiptItem.unit,
        conversionRatio,
        returnedQuantity: itemDto.returnedQuantity,
        baseQuantity,
        unitCost,
        lineTotal,
        condition: itemDto.condition || receiptItem.condition,
        reason: itemDto.reason,
      });
    }

    const returnCode = await this.generateReturnCode();

    const purchaseReturn = new this.returnModel({
      returnCode,
      goodsReceipt: receipt._id,
      supplier: receipt.supplier,
      items: validatedItems,
      totalAmount,
      status: PurchaseReturnStatus.POSTED,
      creditAdjustmentStatus: dto.applyCreditAdjustmentImmediately
        ? CreditAdjustmentStatus.APPLIED
        : CreditAdjustmentStatus.PENDING,
      returnedBy: new Types.ObjectId(userId),
      returnedAt: new Date(),
      idempotencyKey: dto.idempotencyKey,
      note: dto.note,
      isDeleted: false,
    });

    const savedReturn = await purchaseReturn.save();

    // 4. Giảm trừ tồn kho thực tế bằng adjustStock với số âm
    for (const vItem of validatedItems) {
      await this.inventoryService.adjustStock(
        {
          product: vItem.product.toString(),
          quantity: -vItem.baseQuantity,
          reference: returnCode,
          note: `Trả hàng nhà cung cấp theo phiếu ${returnCode} (GRN: ${receipt.receiptCode})`,
        },
        userId,
      );
    }

    // 5. Nếu quản lý chọn bù trừ công nợ ngay
    if (
      dto.applyCreditAdjustmentImmediately &&
      this.financeService &&
      totalAmount > 0
    ) {
      await this.financeService.applyPurchaseReturnCredit(
        receipt._id,
        totalAmount,
        returnCode,
        dto.note,
      );
    }

    return savedReturn;
  }

  /**
   * Xác nhận bù trừ công nợ sau khi NCC đồng ý credit / nhận hàng trả
   */
  async confirmCreditAdjustment(
    returnId: string,
    dto: ConfirmCreditAdjustmentDto,
    _userId: string,
  ): Promise<PurchaseReturnDocument> {
    if (!Types.ObjectId.isValid(returnId)) {
      throw new BadRequestException('ID phiếu trả hàng không hợp lệ');
    }

    const purchaseReturn = await this.returnModel
      .findOne({ _id: returnId, isDeleted: false })
      .exec();

    if (!purchaseReturn) {
      throw new NotFoundException('Không tìm thấy phiếu trả hàng');
    }

    if (
      purchaseReturn.creditAdjustmentStatus === CreditAdjustmentStatus.APPLIED
    ) {
      throw new BadRequestException(
        'Phiếu trả hàng này đã được bù trừ công nợ trước đó',
      );
    }

    const adjustmentAmount = dto.adjustmentAmount || purchaseReturn.totalAmount;

    if (this.financeService && adjustmentAmount > 0) {
      await this.financeService.applyPurchaseReturnCredit(
        purchaseReturn.goodsReceipt,
        adjustmentAmount,
        purchaseReturn.returnCode,
        dto.note,
      );
    }

    purchaseReturn.creditAdjustmentStatus = CreditAdjustmentStatus.APPLIED;
    if (dto.note) {
      purchaseReturn.note = `${purchaseReturn.note || ''} | ${dto.note}`.trim();
    }

    return await purchaseReturn.save();
  }

  /**
   * Lấy danh sách phiếu trả hàng (phân trang)
   */
  async findAll(
    query: PurchaseReturnQueryDto,
  ): Promise<PaginatedResult<PurchaseReturnDocument>> {
    const {
      page = 1,
      limit = 20,
      supplierId,
      goodsReceiptId,
      status,
      creditAdjustmentStatus,
      startDate,
      endDate,
      search,
    } = query;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = { isDeleted: false };

    if (supplierId && Types.ObjectId.isValid(supplierId)) {
      filter.supplier = new Types.ObjectId(supplierId);
    }

    if (goodsReceiptId && Types.ObjectId.isValid(goodsReceiptId)) {
      filter.goodsReceipt = new Types.ObjectId(goodsReceiptId);
    }

    if (status) filter.status = status;
    if (creditAdjustmentStatus) {
      filter.creditAdjustmentStatus = creditAdjustmentStatus;
    }

    if (search && search.trim()) {
      filter.$or = [
        { returnCode: new RegExp(search.trim(), 'i') },
        { note: new RegExp(search.trim(), 'i') },
      ];
    }

    if (startDate || endDate) {
      filter.returnedAt = {};
      if (startDate) filter.returnedAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.returnedAt.$lte = end;
      }
    }

    const [items, total] = await Promise.all([
      this.returnModel
        .find(filter)
        .sort({ returnedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('supplier', 'name code phone')
        .populate('goodsReceipt', 'receiptCode receivedAt')
        .populate('returnedBy', 'name email')
        .exec(),
      this.returnModel.countDocuments(filter).exec(),
    ]);

    return paginate(items, total, page, limit);
  }

  async findById(id: string): Promise<PurchaseReturnDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID phiếu trả hàng không hợp lệ');
    }

    const pr = await this.returnModel
      .findOne({ _id: id, isDeleted: false })
      .populate('supplier', 'name code phone')
      .populate('goodsReceipt', 'receiptCode receivedAt items')
      .populate('returnedBy', 'name email')
      .exec();

    if (!pr) {
      throw new NotFoundException('Không tìm thấy phiếu trả hàng');
    }

    return pr;
  }
}
