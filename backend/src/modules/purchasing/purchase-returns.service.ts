import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  Optional,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Types, ClientSession, Connection } from 'mongoose';
import {
  PurchaseReturn,
  PurchaseReturnDocument,
  PurchaseReturnStatus,
  CreditAdjustmentStatus,
} from './schemas/purchase-return.schema';
import {
  GoodsReceipt,
  GoodsReceiptDocument,
  ItemCondition,
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
    @InjectConnection()
    private readonly connection: Connection,
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
   * PUR-04 & PUR-RET-01: Tạo phiếu trả hàng cho nhà cung cấp
   * - Giảm tồn kho khả dụng (trừ hàng REJECTED chưa từng vào kho)
   * - Kiểm tra số lượng trả không vượt quá số nhận trong GRN
   * - Chống trả vượt lượng khi có nhiều dòng trùng productId
   * - Giá trị tính theo snapshot giá vốn GRN (bỏ qua giá client gửi)
   * - Quản lý trạng thái bù trừ công nợ (Credit Adjustment) và hoàn tiền (Supplier Credit)
   * - Toàn bộ hoạt động thực hiện trong cùng MongoDB Transaction
   */
  async createReturn(
    dto: CreatePurchaseReturnDto,
    userId: string,
  ): Promise<PurchaseReturnDocument> {
    if (!Types.ObjectId.isValid(dto.goodsReceiptId)) {
      throw new BadRequestException('ID phiếu nhận hàng không hợp lệ');
    }

    // 1. Kiểm tra idempotencyKey trước
    if (dto.idempotencyKey && dto.idempotencyKey.trim()) {
      const existing = await this.returnModel
        .findOne({
          idempotencyKey: dto.idempotencyKey.trim(),
          isDeleted: false,
        })
        .exec();
      if (existing) {
        this.logger.log(
          `Idempotent retry: Phiếu trả ${existing.returnCode} đã tồn tại cho key ${dto.idempotencyKey}`,
        );
        return existing;
      }
    }

    // 2. Tìm phiếu nhận hàng gốc
    const receiptQuery = this.receiptModel
      .findOne({ _id: dto.goodsReceiptId, isDeleted: false })
      .populate('supplier');
    const receipt =
      typeof receiptQuery?.exec === 'function'
        ? await receiptQuery.exec()
        : await receiptQuery;

    if (!receipt) {
      throw new NotFoundException('Không tìm thấy phiếu nhận hàng tương ứng');
    }

    // 3. Lấy tất cả các phiếu trả hàng trước đó của GRN này để tính số đã trả
    const previousReturnsQuery = this.returnModel.find({
      goodsReceipt: receipt._id,
      status: { $ne: PurchaseReturnStatus.CANCELLED },
      isDeleted: false,
    });
    const previousReturns =
      typeof previousReturnsQuery?.exec === 'function'
        ? await previousReturnsQuery.exec()
        : await previousReturnsQuery;

    const returnedQuantitiesByProduct = new Map<string, number>();
    if (Array.isArray(previousReturns)) {
      for (const pr of previousReturns) {
        for (const item of pr.items) {
          const prodId = item.product.toString();
          const current = returnedQuantitiesByProduct.get(prodId) || 0;
          returnedQuantitiesByProduct.set(prodId, current + item.baseQuantity);
        }
      }
    }

    // 4. Cộng dồn số lượng yêu cầu theo productId để chống bypass trùng dòng (PUR-RET-T03)
    const requestedQuantitiesByProduct = new Map<string, number>();
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
      const lineBaseQty = itemDto.returnedQuantity * conversionRatio;
      const currentReq =
        requestedQuantitiesByProduct.get(itemDto.productId) || 0;
      requestedQuantitiesByProduct.set(
        itemDto.productId,
        currentReq + lineBaseQty,
      );
    }

    // Kiểm tra tổng số lượng yêu cầu trả so với số lượng còn được trả
    for (const [
      prodId,
      totalRequestedBaseQty,
    ] of requestedQuantitiesByProduct.entries()) {
      const receiptItem = receipt.items.find(
        (it) => it.product.toString() === prodId,
      )!;
      const alreadyReturned = returnedQuantitiesByProduct.get(prodId) || 0;
      const eligibleQuantity = receiptItem.baseQuantity - alreadyReturned;

      if (totalRequestedBaseQty > eligibleQuantity) {
        throw new BadRequestException(
          `Tổng số lượng trả cho sản phẩm "${receiptItem.productName}" (${totalRequestedBaseQty} cái) vượt quá số lượng còn lại có thể trả (${eligibleQuantity} cái)`,
        );
      }
    }

    // 5. Tính toán chi tiết các dòng trả theo snapshot giá vốn GRN (PUR-RET-01.2)
    const validatedItems: any[] = [];
    let totalAmount = 0;

    for (const itemDto of dto.items) {
      const receiptItem = receipt.items.find(
        (it) => it.product.toString() === itemDto.productId,
      )!;
      const conversionRatio = receiptItem.conversionRatio || 1;
      const baseQuantity = itemDto.returnedQuantity * conversionRatio;

      // Giá vốn mỗi đơn vị tính lấy từ snapshot GRN, bỏ qua giá client gửi
      const unitCost = receiptItem.actualUnitPrice;
      const lineTotal = Math.round(itemDto.returnedQuantity * unitCost);
      totalAmount += lineTotal;

      // Hàng REJECTED trong GRN (acceptedQuantity === 0 hoặc condition === DAMAGED khi kiểm tra hàng)
      // chưa từng vào tồn khả dụng -> không trừ tồn khả dụng lần nữa (PUR-RET-T04)
      const isRejectedItem =
        receiptItem.acceptedQuantity === 0 ||
        (receiptItem.rejectedQuantity > 0 &&
          itemDto.condition === ItemCondition.DAMAGED);

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
        isRejectedItem,
      });
    }

    // 6. Thực thi trong MongoDB Transaction
    let session: ClientSession | null = null;
    let isTransactionActive = false;

    if (this.connection && typeof this.connection.startSession === 'function') {
      try {
        session = await this.connection.startSession();
        session.startTransaction();
        isTransactionActive = true;
      } catch {
        session = null;
        isTransactionActive = false;
      }
    }

    try {
      const returnCode = await this.generateReturnCode(session || undefined);

      const purchaseReturn = new this.returnModel({
        returnCode,
        goodsReceipt: receipt._id,
        supplier: receipt.supplier,
        items: validatedItems,
        totalAmount,
        adjustedDebtAmount: 0,
        refundDueAmount: 0,
        refundedAmount: 0,
        status: PurchaseReturnStatus.POSTED,
        creditAdjustmentStatus: CreditAdjustmentStatus.PENDING,
        returnedBy: new Types.ObjectId(userId),
        returnedAt: new Date(),
        idempotencyKey: dto.idempotencyKey?.trim() || undefined,
        note: dto.note,
        isDeleted: false,
      });

      let savedReturn: PurchaseReturnDocument;
      if (session) {
        savedReturn = await purchaseReturn.save({ session });
      } else {
        savedReturn = await purchaseReturn.save();
      }

      // 7. Giảm trừ tồn kho thực tế (chỉ trừ những mặt hàng đã nhập kho khả dụng)
      for (const vItem of validatedItems) {
        if (!vItem.isRejectedItem) {
          const adjustStockDto = {
            product: vItem.product.toString(),
            quantity: -vItem.baseQuantity,
            reference: returnCode,
            note: `Trả hàng nhà cung cấp theo phiếu ${returnCode} (GRN: ${receipt.receiptCode})`,
          };
          if (session) {
            await this.inventoryService.adjustStock(
              adjustStockDto,
              userId,
              session,
            );
          } else {
            await this.inventoryService.adjustStock(adjustStockDto, userId);
          }
        }
      }

      // 8. Nếu quản lý chọn bù trừ công nợ ngay
      if (
        dto.applyCreditAdjustmentImmediately &&
        this.financeService &&
        totalAmount > 0
      ) {
        const creditResult = session
          ? await this.financeService.applyPurchaseReturnCredit(
              receipt._id,
              totalAmount,
              returnCode,
              dto.note,
              session,
            )
          : await this.financeService.applyPurchaseReturnCredit(
              receipt._id,
              totalAmount,
              returnCode,
              dto.note,
            );

        if (creditResult) {
          savedReturn.creditAdjustmentStatus = CreditAdjustmentStatus.APPLIED;
          savedReturn.adjustedDebtAmount = creditResult.adjustedDebtAmount;
          savedReturn.refundDueAmount = creditResult.refundDueAmount;
          if (session) {
            await savedReturn.save({ session });
          } else {
            await savedReturn.save();
          }
        }
      }

      if (isTransactionActive && session) {
        await session.commitTransaction();
      }

      return savedReturn;
    } catch (err: any) {
      if (isTransactionActive && session) {
        await session.abortTransaction();
      }

      if (err?.code === 11000 && dto.idempotencyKey) {
        const existing = await this.returnModel
          .findOne({
            idempotencyKey: dto.idempotencyKey.trim(),
            isDeleted: false,
          })
          .exec();
        if (existing) {
          return existing;
        }
      }

      throw err;
    } finally {
      if (isTransactionActive && session) {
        await session.endSession();
      }
    }
  }

  /**
   * Xác nhận bù trừ công nợ sau khi NCC đồng ý credit / nhận hàng trả (Atomic & Conditional update)
   */
  async confirmCreditAdjustment(
    returnId: string,
    dto: ConfirmCreditAdjustmentDto,
    _userId: string,
  ): Promise<PurchaseReturnDocument> {
    if (!Types.ObjectId.isValid(returnId)) {
      throw new BadRequestException('ID phiếu trả hàng không hợp lệ');
    }

    const pr = await this.returnModel
      .findOne({ _id: returnId, isDeleted: false })
      .exec();

    if (!pr) {
      throw new NotFoundException('Không tìm thấy phiếu trả hàng');
    }

    if (pr.creditAdjustmentStatus === CreditAdjustmentStatus.APPLIED) {
      throw new BadRequestException(
        'Phiếu trả hàng này đã được bù trừ công nợ trước đó',
      );
    }

    let session: ClientSession | null = null;
    let isTransactionActive = false;

    if (this.connection && typeof this.connection.startSession === 'function') {
      try {
        session = await this.connection.startSession();
        session.startTransaction();
        isTransactionActive = true;
      } catch {
        session = null;
        isTransactionActive = false;
      }
    }

    try {
      // Conditional transition: Chỉ 1 request chuyển thành công từ PENDING -> APPLIED
      const updateQuery = this.returnModel.findOneAndUpdate(
        {
          _id: pr._id,
          creditAdjustmentStatus: CreditAdjustmentStatus.PENDING,
          isDeleted: false,
        },
        {
          $set: {
            creditAdjustmentStatus: CreditAdjustmentStatus.APPLIED,
          },
        },
        { new: true },
      );
      if (session && typeof updateQuery?.session === 'function') {
        updateQuery.session(session);
      }
      const updatedPr =
        typeof updateQuery?.exec === 'function'
          ? await updateQuery.exec()
          : await updateQuery;

      if (!updatedPr) {
        throw new BadRequestException(
          'Phiếu trả hàng này đã được bù trừ công nợ hoặc đang được xử lý bởi giao dịch khác',
        );
      }

      const adjustmentAmount = dto.adjustmentAmount || pr.totalAmount;

      if (this.financeService && adjustmentAmount > 0) {
        const creditResult = session
          ? await this.financeService.applyPurchaseReturnCredit(
              pr.goodsReceipt,
              adjustmentAmount,
              pr.returnCode,
              dto.note,
              session,
            )
          : await this.financeService.applyPurchaseReturnCredit(
              pr.goodsReceipt,
              adjustmentAmount,
              pr.returnCode,
              dto.note,
            );

        if (creditResult) {
          updatedPr.adjustedDebtAmount = creditResult.adjustedDebtAmount;
          updatedPr.refundDueAmount = creditResult.refundDueAmount;
        }
      }

      if (dto.note) {
        updatedPr.note = `${updatedPr.note || ''} | ${dto.note}`.trim();
      }

      if (session) {
        await updatedPr.save({ session });
      } else {
        await updatedPr.save();
      }

      if (isTransactionActive && session) {
        await session.commitTransaction();
      }

      return updatedPr;
    } catch (err) {
      if (isTransactionActive && session) {
        await session.abortTransaction();
      }
      throw err;
    } finally {
      if (isTransactionActive && session) {
        await session.endSession();
      }
    }
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
