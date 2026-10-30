import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import * as ExcelJS from 'exceljs';
import {
  Inventory,
  InventoryDocument,
  InventoryTransaction,
  InventoryTransactionDocument,
} from './schemas/inventory.schema';
import {
  InventoryTransactionDto,
  AdjustInventoryDto,
  InventoryQueryDto,
  InventoryTransactionQueryDto,
} from './dto/inventory.dto';
import { ProductsService } from '../products/products.service';
import { InventoryStatus, InventoryTransactionType } from '../../common/enums';
import { PaginatedResult, paginate } from '../../common/dto/pagination.dto';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    @InjectModel(Inventory.name)
    private inventoryModel: Model<InventoryDocument>,
    @InjectModel(InventoryTransaction.name)
    private transactionModel: Model<InventoryTransactionDocument>,
    private productsService: ProductsService,
  ) {}

  private getStatus(currentStock: number, minStock: number): InventoryStatus {
    if (currentStock <= 0) return InventoryStatus.OUT_OF_STOCK;
    if (currentStock <= minStock) return InventoryStatus.LOW_STOCK;
    return InventoryStatus.IN_STOCK;
  }

  /**
   * TT-006 & TT-020: API GET danh sách kho thuần túy READ-ONLY, hỗ trợ phân trang & tìm kiếm phía server.
   * Không tự động ghi / insertMany dữ liệu trong hàm GET.
   */
  async findAll(
    query?: InventoryQueryDto,
  ): Promise<PaginatedResult<InventoryDocument>> {
    const page = Math.max(1, Number(query?.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query?.limit) || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};

    if (query?.status) {
      filter.status = query.status;
    }

    const productModel = this.inventoryModel.db.model('Product');

    // Tìm kiếm theo tên sản phẩm, SKU hoặc lọc theo danh mục
    if (query?.search || query?.category) {
      const productFilter: any = { isDeleted: false };
      if (query.search) {
        const searchRegex = new RegExp(
          query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
          'i',
        );
        productFilter.$or = [{ name: searchRegex }, { sku: searchRegex }];
      }
      if (query.category) {
        productFilter.category = query.category;
      }

      const matchingProducts = await productModel
        .find(productFilter)
        .select('_id')
        .lean()
        .exec();

      const matchingIds = matchingProducts.map((p) => p._id);
      filter.product = { $in: matchingIds };
    } else {
      // Khi không tìm kiếm cụ thể, loại trừ các sản phẩm đã xóa mềm
      const deletedProducts = await productModel
        .find({ isDeleted: true })
        .select('_id')
        .lean()
        .exec();
      if (deletedProducts.length > 0) {
        filter.product = { $nin: deletedProducts.map((p) => p._id) };
      }
    }

    const [items, total] = await Promise.all([
      this.inventoryModel
        .find(filter)
        .populate('product', 'name sku images price unit')
        .sort({ updatedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.inventoryModel.countDocuments(filter).exec(),
    ]);

    // Lọc ra các bản ghi mà product không bị null (do soft delete)
    const validItems = items.filter((item) => item.product !== null);

    return paginate(validItems, total, page, limit);
  }

  /**
   * TT-006: Endpoint/Công cụ đồng bộ riêng cho Admin khi cần tạo bản ghi kho còn thiếu.
   */
  async syncMissingInventories(): Promise<{
    createdCount: number;
    totalProducts: number;
    message: string;
  }> {
    const productModel = this.inventoryModel.db.model('Product');
    const products = await productModel.find({ isDeleted: false }).exec();

    const existingInventories = await this.inventoryModel.find().exec();
    const existingProductIds = new Set(
      existingInventories.map((inv) => inv.product.toString()),
    );

    const missingProducts = products.filter(
      (p) => !existingProductIds.has(p._id.toString()),
    );

    if (missingProducts.length === 0) {
      return {
        createdCount: 0,
        totalProducts: products.length,
        message: 'Tất cả sản phẩm đã có dữ liệu kho đồng bộ',
      };
    }

    const newInventories = missingProducts.map((p) => {
      const currentStock = p.stock || 0;
      let status = InventoryStatus.IN_STOCK;
      if (currentStock <= 0) {
        status = InventoryStatus.OUT_OF_STOCK;
      } else if (currentStock <= 10) {
        status = InventoryStatus.LOW_STOCK;
      }
      return {
        product: p._id,
        currentStock,
        minStock: 10,
        maxStock: 1000,
        status,
        lastUpdated: new Date(),
      };
    });

    await this.inventoryModel.insertMany(newInventories);

    // Ghi nhận lịch sử OPENING_BALANCE cho các sản phẩm có tồn kho ban đầu
    for (const p of missingProducts) {
      if ((p.stock || 0) > 0) {
        await this.transactionModel.create({
          product: p._id,
          type: InventoryTransactionType.OPENING_BALANCE,
          quantity: p.stock,
          change: p.stock,
          stockBefore: 0,
          stockAfter: p.stock,
          note: 'Đồng bộ tồn kho đầu kỳ từ công cụ quản trị',
        });
      }
    }

    return {
      createdCount: missingProducts.length,
      totalProducts: products.length,
      message: `Đã đồng bộ bổ sung ${missingProducts.length} bản ghi kho`,
    };
  }

  /**
   * TT-002: Công cụ đối soát số lượng giữa Product.stock, Inventory.currentStock và lịch sử giao dịch.
   */
  async reconcile(): Promise<{
    totalChecked: number;
    matchedCount: number;
    mismatchedCount: number;
    discrepancies: Array<{
      productId: string;
      productName: string;
      sku: string;
      productStock: number;
      inventoryStock: number;
      difference: number;
      reason: string;
    }>;
  }> {
    const productModel = this.inventoryModel.db.model('Product');
    const products = await productModel
      .find({ isDeleted: false })
      .select('name sku stock')
      .lean()
      .exec();

    const inventories = await this.inventoryModel.find().lean().exec();
    const inventoryMap = new Map<string, any>();
    for (const inv of inventories) {
      inventoryMap.set(inv.product.toString(), inv);
    }

    const discrepancies: any[] = [];
    let matchedCount = 0;
    const checkedProductIds = new Set<string>();

    for (const prod of products) {
      const prodItem = prod as any;
      const prodId = prodItem._id.toString();
      checkedProductIds.add(prodId);
      const pStock = prodItem.stock || 0;
      const invRecord = inventoryMap.get(prodId);

      if (!invRecord) {
        discrepancies.push({
          productId: prodId,
          productName: prodItem.name,
          sku: prodItem.sku,
          productStock: pStock,
          inventoryStock: 0,
          difference: pStock,
          reason: 'Thiếu bản ghi kho (Missing inventory record)',
        });
        continue;
      }

      const iStock = invRecord.currentStock ?? 0;
      if (pStock === iStock) {
        matchedCount++;
      } else {
        discrepancies.push({
          productId: prodId,
          productName: prodItem.name,
          sku: prodItem.sku,
          productStock: pStock,
          inventoryStock: iStock,
          difference: pStock - iStock,
          reason: 'Lệch số lượng tồn (Stock mismatch)',
        });
      }
    }

    // Kiểm tra bản ghi kho mồ côi (Inventory có product không tồn tại hoặc đã bị xóa)
    for (const inv of inventories) {
      const invProdId = inv.product.toString();
      if (!checkedProductIds.has(invProdId)) {
        discrepancies.push({
          productId: invProdId,
          productName: 'Sản phẩm đã bị xóa hoặc không tồn tại',
          sku: '-',
          productStock: 0,
          inventoryStock: inv.currentStock,
          difference: -inv.currentStock,
          reason: 'Bản ghi kho mồ côi (Orphan inventory record)',
        });
      }
    }

    return {
      totalChecked: products.length,
      matchedCount,
      mismatchedCount: discrepancies.length,
      discrepancies,
    };
  }

  /**
   * NEW-012: Đối soát số lượng tồn kho giữa Inventory.currentStock và sổ kho (tổng các biến động trong InventoryTransaction).
   */
  async reconcileStockWithLedger(productId?: string): Promise<{
    totalChecked: number;
    matchedCount: number;
    mismatchedCount: number;
    discrepancies: Array<{
      productId: string;
      productName: string;
      sku: string;
      currentStock: number;
      ledgerStock: number;
      difference: number;
      transactionCount: number;
      reason: string;
    }>;
  }> {
    const productModel = this.inventoryModel.db.model('Product');
    const filter: any = { isDeleted: false };
    if (productId && Types.ObjectId.isValid(productId)) {
      filter._id = new Types.ObjectId(productId);
    }

    const products = await productModel
      .find(filter)
      .select('name sku')
      .lean()
      .exec();

    const invFilter: any = {};
    if (productId && Types.ObjectId.isValid(productId)) {
      invFilter.product = new Types.ObjectId(productId);
    }
    const inventories = await this.inventoryModel.find(invFilter).lean().exec();
    const invMap = new Map<string, number>();
    for (const inv of inventories) {
      invMap.set(inv.product.toString(), inv.currentStock ?? 0);
    }

    const txMatch: any = {};
    if (productId && Types.ObjectId.isValid(productId)) {
      txMatch.product = new Types.ObjectId(productId);
    }

    const ledgerAggregation = await this.transactionModel.aggregate([
      { $match: txMatch },
      {
        $group: {
          _id: '$product',
          totalChange: { $sum: '$change' },
          count: { $sum: 1 },
        },
      },
    ]);

    const ledgerMap = new Map<string, { totalChange: number; count: number }>();
    for (const row of ledgerAggregation) {
      ledgerMap.set(row._id.toString(), {
        totalChange: row.totalChange,
        count: row.count,
      });
    }

    const discrepancies: any[] = [];
    let matchedCount = 0;

    for (const p of products) {
      const prodId = (p as any)._id.toString();
      const currentStock = invMap.get(prodId) ?? 0;
      const ledger = ledgerMap.get(prodId) || { totalChange: 0, count: 0 };
      const ledgerStock = ledger.totalChange;

      if (currentStock === ledgerStock) {
        matchedCount++;
      } else {
        discrepancies.push({
          productId: prodId,
          productName: (p as any).name,
          sku: (p as any).sku,
          currentStock,
          ledgerStock,
          difference: currentStock - ledgerStock,
          transactionCount: ledger.count,
          reason:
            ledger.count === 0
              ? 'Chưa có chứng từ sổ kho (Missing ledger transactions)'
              : 'Chênh lệch tồn kho và sổ kho (Ledger discrepancy)',
        });
      }
    }

    return {
      totalChecked: products.length,
      matchedCount,
      mismatchedCount: discrepancies.length,
      discrepancies,
    };
  }

  async getLowStock(): Promise<InventoryDocument[]> {
    return this.inventoryModel
      .find({
        $or: [
          { status: InventoryStatus.LOW_STOCK },
          { status: InventoryStatus.OUT_OF_STOCK },
        ],
      })
      .populate('product', 'name sku images price unit')
      .exec();
  }

  async importStock(
    dto: InventoryTransactionDto,
    userId?: string,
  ): Promise<InventoryDocument> {
    return this.applyMovement(dto, InventoryTransactionType.IMPORT, userId);
  }

  async exportStock(
    dto: InventoryTransactionDto,
    userId?: string,
  ): Promise<InventoryDocument> {
    return this.applyMovement(dto, InventoryTransactionType.SALE, userId);
  }

  /**
   * TT-001 & NEW-011: Điều chỉnh số lượng tồn kho theo số lượng thực tế sau kiểm kê (newStock).
   * - Tính delta = newStock - currentStock trực tiếp trong MongoDB session
   * - Cho phép tăng/giảm nhưng không cho âm
   * - Nếu delta === 0: không phát sinh biến động
   * - Optimistic locking: kiểm tra expectedCurrentStock ngay trong transaction session để chống tranh chấp
   */
  async adjustStock(
    dto: AdjustInventoryDto,
    userId?: string,
  ): Promise<InventoryDocument> {
    const productId = dto.product.toString();

    // 1. Trường hợp sử dụng newStock (chuẩn hóa kiểm kê thực tế theo TT-001 & NEW-011)
    if (dto.newStock !== undefined) {
      if (dto.newStock < 0) {
        throw new BadRequestException('Số lượng tồn kho thực tế không thể âm');
      }

      return this.applyMovement(
        {
          product: productId,
          quantity: 0, // Sẽ được tính delta động trong transaction
          note: dto.note || 'Điều chỉnh số lượng sau kiểm kê',
          reference: dto.reference || dto.idempotencyKey,
        },
        InventoryTransactionType.ADJUSTMENT,
        userId,
        1,
        {
          expectedCurrentStock: dto.expectedCurrentStock,
          targetNewStock: dto.newStock,
        },
      );
    }

    // 2. Trường hợp legacy (truyền quantity có dấu)
    if (dto.quantity !== undefined) {
      if (dto.quantity === 0) {
        throw new BadRequestException('Số lượng điều chỉnh phải khác 0');
      }
      return this.applyMovement(
        {
          product: productId,
          quantity: Math.abs(dto.quantity),
          note: dto.note,
          reference: dto.reference || dto.idempotencyKey,
        },
        InventoryTransactionType.ADJUSTMENT,
        userId,
        Math.sign(dto.quantity),
        {
          expectedCurrentStock: dto.expectedCurrentStock,
        },
      );
    }

    throw new BadRequestException(
      'Cần cung cấp newStock hoặc quantity để điều chỉnh kho',
    );
  }

  async returnStock(
    dto: InventoryTransactionDto,
    userId?: string,
  ): Promise<InventoryDocument> {
    return this.applyMovement(dto, InventoryTransactionType.RETURN, userId);
  }

  async damageStock(
    dto: InventoryTransactionDto,
    userId?: string,
  ): Promise<InventoryDocument> {
    return this.applyMovement(dto, InventoryTransactionType.DAMAGE, userId);
  }

  async createTransaction(
    dto: InventoryTransactionDto,
    userId?: string,
  ): Promise<InventoryDocument> {
    if (!dto.type) {
      throw new BadRequestException('Loại giao dịch kho là bắt buộc');
    }
    if (dto.type === InventoryTransactionType.ADJUSTMENT) {
      throw new BadRequestException(
        'Giao dịch ADJUSTMENT phải dùng endpoint /inventory/adjust với số lượng kiểm kê mới (newStock)',
      );
    }
    return this.applyMovement(dto, dto.type, userId);
  }

  private movementDelta(
    type: InventoryTransactionType,
    quantity: number,
    adjustmentSign = 1,
  ): number {
    if (
      type === InventoryTransactionType.IMPORT ||
      type === InventoryTransactionType.RETURN ||
      type === InventoryTransactionType.OPENING_BALANCE
    ) {
      return quantity;
    }
    if (
      type === InventoryTransactionType.SALE ||
      type === InventoryTransactionType.DAMAGE
    ) {
      return -quantity;
    }
    return quantity * adjustmentSign;
  }

  private isTransactionUnsupported(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error);
    return /Transaction numbers are only allowed|replica set|mongos|retryable writes|retryWrites|standalone/i.test(
      message,
    );
  }

  /**
   * Core logic áp dụng biến động kho với bảo vệ Idempotency (TT-005),
   * Optimistic Locking & Atomic checks (NEW-011),
   * MongoDB Transaction Enforcement in Production (NEW-012),
   * và Bình quân gia quyền di động (NEW-015).
   */
  private async applyMovement(
    dto: InventoryTransactionDto,
    type: InventoryTransactionType,
    userId?: string,
    adjustmentSign = 1,
    options?: {
      expectedCurrentStock?: number;
      targetNewStock?: number;
    },
  ): Promise<InventoryDocument> {
    let delta = this.movementDelta(type, dto.quantity, adjustmentSign);
    const productId = dto.product.toString();
    const referenceKey = dto.reference || dto.idempotencyKey;
    let fallbackMutated = false;

    const persist = async (
      session?: ClientSession,
    ): Promise<InventoryDocument> => {
      // TT-005: Kiểm tra Idempotency chặt chẽ
      if (referenceKey) {
        const existingQuery = this.transactionModel.findOne({
          reference: referenceKey,
        });
        if (session) existingQuery.session(session);
        const existing = await existingQuery.exec();

        if (existing) {
          // Kiểm tra xem giao dịch đã tồn tại có cùng nội dung không
          const isSamePayload =
            existing.product.toString() === productId &&
            existing.type === type &&
            (options?.targetNewStock !== undefined ||
              existing.change === delta);

          if (isSamePayload) {
            // Cùng key, cùng nội dung -> Idempotent replay an toàn
            const inventoryQuery = this.inventoryModel.findOne({
              product: productId,
            });
            if (session) inventoryQuery.session(session);
            const current = await inventoryQuery.exec();
            if (!current) {
              throw new NotFoundException('Inventory record not found');
            }
            return current;
          } else {
            // Cùng key nhưng khác nội dung -> 409 Conflict
            throw new ConflictException(
              `Mã tham chiếu (idempotencyKey) "${referenceKey}" đã được sử dụng cho một giao dịch khác.`,
            );
          }
        }
      }

      // NEW-011: Đọc và kiểm tra optimistic lock ngay TRONG transaction session
      const preInvQuery = this.inventoryModel.findOne({ product: productId });
      if (session) preInvQuery.session(session);
      const preInv = await preInvQuery.exec();
      if (!preInv) throw new NotFoundException('Inventory record not found');

      // Kiểm tra optimistic lock: số lượng tồn có bị thay đổi giữa lúc xem và lúc ghi không
      if (
        options?.expectedCurrentStock !== undefined &&
        preInv.currentStock !== options.expectedCurrentStock
      ) {
        throw new ConflictException(
          `Số lượng tồn kho hiện tại (${preInv.currentStock}) đã thay đổi so với số lượng bạn đang xem (${options.expectedCurrentStock}). Vui lòng tải lại trang để kiểm kê chính xác.`,
        );
      }

      // Nếu điều chỉnh theo newStock, tính delta chuẩn xác ngay tại thời điểm snapshot session
      if (options?.targetNewStock !== undefined) {
        delta = options.targetNewStock - preInv.currentStock;
        if (delta === 0) {
          return preInv;
        }
      }

      if (preInv.currentStock + delta < 0) {
        throw new BadRequestException(
          'Giao dịch bị từ chối vì tồn kho không thể âm',
        );
      }

      // Cập nhật tồn kho sản phẩm trong session transaction
      if (delta < 0) {
        await this.productsService.deductStock(
          productId,
          Math.abs(delta),
          session,
        );
      } else {
        await this.productsService.updateStock(productId, delta, session);
      }
      if (!session) fallbackMutated = true;

      const inventoryQuery = this.inventoryModel.findOne({
        product: productId,
      });
      if (session) inventoryQuery.session(session);
      const inventory = await inventoryQuery.exec();
      if (!inventory) throw new NotFoundException('Inventory record not found');
      if (inventory.currentStock < 0) {
        throw new BadRequestException(
          'Giao dịch bị từ chối vì tồn kho không thể âm',
        );
      }

      // NEW-015: Cập nhật giá vốn bình quân gia quyền di động (Moving Weighted Average Cost) khi IMPORT
      let txCostPrice = inventory.costPrice || 0;
      if (
        type === InventoryTransactionType.IMPORT &&
        dto.costPrice !== undefined &&
        dto.costPrice > 0
      ) {
        const stockBefore = inventory.currentStock - delta;
        const oldStock = Math.max(0, stockBefore);
        const oldCost = inventory.costPrice || 0;
        const importedQty = Math.abs(dto.quantity);
        const importedCost = dto.costPrice;

        let newCost = importedCost;
        if (oldStock > 0) {
          newCost = Math.round(
            (oldStock * oldCost + importedQty * importedCost) /
              (oldStock + importedQty),
          );
        }
        inventory.costPrice = newCost;
        if (session) {
          await inventory.save({ session });
        } else {
          await inventory.save();
        }
        txCostPrice = importedCost;
      }

      const payload = {
        product: new Types.ObjectId(productId),
        type,
        quantity: Math.abs(
          options?.targetNewStock !== undefined ? delta : dto.quantity,
        ),
        change: delta,
        stockBefore: inventory.currentStock - delta,
        stockAfter: inventory.currentStock,
        costPrice: txCostPrice,
        note: dto.note,
        reference: referenceKey,
        createdBy: userId ? new Types.ObjectId(userId) : undefined,
      };

      try {
        if (session) {
          await this.transactionModel.create([payload], { session });
        } else {
          await this.transactionModel.create(payload);
        }
      } catch (createErr: any) {
        // TT-005: Xử lý race condition khi 2 request cùng idempotencyKey gửi song song cùng mili-giây
        if (createErr?.code === 11000 && referenceKey) {
          this.logger.warn(
            `Phát hiện race condition duplicate key "${referenceKey}". Trả về kết quả giao dịch trước đó.`,
          );
          return inventory;
        }
        throw createErr;
      }
      return inventory;
    };

    const connection = (this.inventoryModel as any).db;
    if (!connection?.startSession) {
      // NEW-012: Không âm thầm fallback sang phương thức ghi thiếu nguyên tử trong production
      if (process.env.NODE_ENV === 'production') {
        this.logger.error(
          'CRITICAL: MongoDB client session is unavailable in production for inventory operations.',
        );
        throw new InternalServerErrorException(
          'Chế độ transaction bắt buộc trong môi trường production đối với nghiệp vụ tồn kho.',
        );
      }
      return persist();
    }

    const session: ClientSession = await connection.startSession();
    try {
      let result: InventoryDocument | undefined;
      await session.withTransaction(async () => {
        result = await persist(session);
      });
      if (!result) {
        throw new Error('Inventory transaction completed without a result');
      }
      return result;
    } catch (error) {
      if (!this.isTransactionUnsupported(error)) throw error;

      // NEW-012: Chặn fallback thiếu an toàn trong Production
      if (process.env.NODE_ENV === 'production') {
        this.logger.error(
          'CRITICAL: MongoDB transactions are required in production for inventory operations. Transaction unsupported by MongoDB deployment.',
          error instanceof Error ? error.stack : String(error),
        );
        throw new InternalServerErrorException(
          'Chế độ transaction bắt buộc trong môi trường production đối với nghiệp vụ tồn kho.',
        );
      }

      this.logger.warn(
        'MongoDB transactions unavailable; using compensated inventory mode.',
      );
      try {
        return await persist();
      } catch (persistError) {
        if (fallbackMutated && delta < 0) {
          await this.productsService
            .updateStock(productId, Math.abs(delta))
            .catch(() => undefined);
        } else if (fallbackMutated) {
          await this.productsService
            .deductStock(productId, delta)
            .catch(() => undefined);
        }
        throw persistError;
      }
    } finally {
      await session.endSession();
    }
  }

  /** Records a stock change already performed by the order workflow. */
  async recordExternalMovement(
    productId: string,
    type: InventoryTransactionType.SALE | InventoryTransactionType.RETURN,
    quantity: number,
    reference: string,
    orderId?: string,
    session?: ClientSession,
  ): Promise<void> {
    const existingQuery = this.transactionModel.findOne({
      reference,
      product: productId,
      type,
    });
    if (session) existingQuery.session(session);
    if (await existingQuery.exec()) return;

    const inventoryQuery = this.inventoryModel.findOne({ product: productId });
    if (session) inventoryQuery.session(session);
    const inventory = await inventoryQuery.exec();
    if (!inventory) throw new NotFoundException('Inventory record not found');
    const delta = type === InventoryTransactionType.SALE ? -quantity : quantity;
    const payload = {
      product: new Types.ObjectId(productId),
      type,
      quantity,
      change: delta,
      stockBefore: inventory.currentStock - delta,
      stockAfter: inventory.currentStock,
      note:
        type === InventoryTransactionType.SALE
          ? 'Xuất kho theo đơn hàng'
          : 'Hoàn kho từ đơn hàng',
      reference,
      order:
        orderId && Types.ObjectId.isValid(orderId)
          ? new Types.ObjectId(orderId)
          : undefined,
    };
    if (session) await this.transactionModel.create([payload], { session });
    else await this.transactionModel.create(payload);
  }

  async deleteTransactionsByReference(reference: string): Promise<void> {
    await this.transactionModel.deleteMany({ reference }).exec();
  }

  /**
   * Helper xây dựng bộ lọc lịch sử giao dịch dùng chung cho phân trang và xuất Excel (TT-004)
   */
  private async buildTransactionFilter(
    query?: InventoryTransactionQueryDto,
  ): Promise<Record<string, any>> {
    const filter: Record<string, any> = {};

    if (query?.productId && Types.ObjectId.isValid(query.productId)) {
      filter.product = new Types.ObjectId(query.productId);
    }

    if (query?.type) {
      filter.type = query.type;
    }

    if (query?.createdBy && Types.ObjectId.isValid(query.createdBy)) {
      filter.createdBy = new Types.ObjectId(query.createdBy);
    }

    if (query?.startDate || query?.endDate) {
      filter.createdAt = {};
      if (query.startDate) {
        const start = new Date(query.startDate);
        if (!isNaN(start.getTime())) {
          filter.createdAt.$gte = start;
        }
      }
      if (query.endDate) {
        const end = new Date(query.endDate);
        if (!isNaN(end.getTime())) {
          end.setHours(23, 59, 59, 999);
          filter.createdAt.$lte = end;
        }
      }
      if (Object.keys(filter.createdAt).length === 0) {
        delete filter.createdAt;
      }
    }

    // Lọc theo SKU hoặc từ khóa tìm kiếm
    if (query?.sku || query?.search) {
      const productModel = this.inventoryModel.db.model('Product');
      const searchTerm = (query.sku || query.search || '').trim();
      const regex = new RegExp(
        searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        'i',
      );

      const matchingProducts = await productModel
        .find({
          $or: [{ sku: regex }, { name: regex }],
        })
        .select('_id')
        .lean()
        .exec();

      const matchingIds = matchingProducts.map((p) => p._id);

      if (query.search) {
        filter.$or = [
          { product: { $in: matchingIds } },
          { note: regex },
          { reference: regex },
        ];
      } else {
        filter.product = { $in: matchingIds };
      }
    }

    return filter;
  }

  /**
   * TT-004: Lịch sử nhập xuất kho hỗ trợ phân trang & bộ lọc nâng cao
   */
  async getTransactions(
    query?: InventoryTransactionQueryDto,
  ): Promise<PaginatedResult<InventoryTransactionDocument>> {
    const page = Math.max(1, Number(query?.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query?.limit) || 20));
    const skip = (page - 1) * limit;

    const filter = await this.buildTransactionFilter(query);

    const [items, total] = await Promise.all([
      this.transactionModel
        .find(filter)
        .populate('product', 'name sku unit')
        .populate('createdBy', 'fullName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.transactionModel.countDocuments(filter).exec(),
    ]);

    return paginate(items, total, page, limit);
  }

  /**
   * TT-004: Xuất Excel lịch sử nhập xuất kho
   */
  async exportTransactionsToExcel(
    query?: InventoryTransactionQueryDto,
  ): Promise<Buffer> {
    const filter = await this.buildTransactionFilter(query);

    const transactions = await this.transactionModel
      .find(filter)
      .populate('product', 'name sku unit')
      .populate('createdBy', 'fullName')
      .sort({ createdAt: -1 })
      .limit(5000)
      .exec();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('LichSuKho');

    worksheet.columns = [
      { header: 'Thời gian', key: 'createdAt', width: 20 },
      { header: 'Tên sản phẩm', key: 'productName', width: 35 },
      { header: 'Mã SKU', key: 'sku', width: 15 },
      { header: 'Loại biến động', key: 'type', width: 18 },
      { header: 'Số lượng thay đổi', key: 'change', width: 18 },
      { header: 'Tồn trước', key: 'stockBefore', width: 12 },
      { header: 'Tồn sau', key: 'stockAfter', width: 12 },
      { header: 'Người thực hiện', key: 'createdBy', width: 22 },
      { header: 'Mã tham chiếu', key: 'reference', width: 20 },
      { header: 'Ghi chú', key: 'note', width: 30 },
    ];

    worksheet.getRow(1).font = { bold: true };

    for (const tx of transactions) {
      const prod: any = tx.product;
      const creator: any = tx.createdBy;
      worksheet.addRow({
        createdAt: tx.createdAt
          ? new Date(tx.createdAt).toLocaleString('vi-VN')
          : '',
        productName: prod?.name || 'Sản phẩm đã xóa',
        sku: prod?.sku || '-',
        type: tx.type,
        change: tx.change,
        stockBefore: tx.stockBefore,
        stockAfter: tx.stockAfter,
        createdBy: creator?.fullName || 'Hệ thống',
        reference: tx.reference || '',
        note: tx.note || '',
      });
    }

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  async getLowStockCount(): Promise<number> {
    return this.inventoryModel
      .countDocuments({
        $or: [
          { status: InventoryStatus.LOW_STOCK },
          { status: InventoryStatus.OUT_OF_STOCK },
        ],
      })
      .exec();
  }
}
