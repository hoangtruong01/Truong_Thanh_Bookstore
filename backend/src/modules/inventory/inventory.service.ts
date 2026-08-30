import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import {
  Inventory,
  InventoryDocument,
  InventoryTransaction,
  InventoryTransactionDocument,
} from './schemas/inventory.schema';
import {
  InventoryTransactionDto,
  AdjustInventoryDto,
} from './dto/inventory.dto';
import { ProductsService } from '../products/products.service';
import { InventoryStatus, InventoryTransactionType } from '../../common/enums';

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

  async findAll(): Promise<InventoryDocument[]> {
    try {
      const productModel = this.inventoryModel.db.model('Product');
      const products = await productModel.find({ isDeleted: false }).exec();

      const existingInventories = await this.inventoryModel.find().exec();
      const existingProductIds = new Set(
        existingInventories.map((inv) => inv.product.toString()),
      );

      const missingProducts = products.filter(
        (p) => !existingProductIds.has(p._id.toString()),
      );

      if (missingProducts.length > 0) {
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
      }
    } catch (err) {
      this.logger.error('Failed to sync missing product inventory records:', err);
    }
    const items = await this.inventoryModel
      .find()
      .populate('product', 'name sku images price')
      .exec();
    return items.filter((item) => item.product !== null);
  }

  async getLowStock(): Promise<InventoryDocument[]> {
    return this.inventoryModel
      .find({
        $or: [
          { status: InventoryStatus.LOW_STOCK },
          { status: InventoryStatus.OUT_OF_STOCK },
        ],
      })
      .populate('product', 'name sku images price')
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

  async adjustStock(
    dto: AdjustInventoryDto,
    userId?: string,
  ): Promise<InventoryDocument> {
    if (dto.quantity === 0) {
      throw new BadRequestException('Số lượng điều chỉnh phải khác 0');
    }
    return this.applyMovement(
      { ...dto, quantity: Math.abs(dto.quantity) },
      InventoryTransactionType.ADJUSTMENT,
      userId,
      Math.sign(dto.quantity),
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
        'Giao dịch ADJUSTMENT phải dùng endpoint /inventory/adjust với số lượng có dấu',
      );
    }
    return this.applyMovement(dto, dto.type, userId);
  }

  private movementDelta(
    type: InventoryTransactionType,
    quantity: number,
    adjustmentSign = 1,
  ): number {
    if (type === InventoryTransactionType.IMPORT || type === InventoryTransactionType.RETURN) {
      return quantity;
    }
    if (type === InventoryTransactionType.SALE || type === InventoryTransactionType.DAMAGE) {
      return -quantity;
    }
    return quantity * adjustmentSign;
  }

  private isTransactionUnsupported(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error);
    return /Transaction numbers are only allowed|replica set|mongos|retryable writes|retryWrites|standalone/i.test(message);
  }

  private async applyMovement(
    dto: InventoryTransactionDto,
    type: InventoryTransactionType,
    userId?: string,
    adjustmentSign = 1,
  ): Promise<InventoryDocument> {
    const delta = this.movementDelta(type, dto.quantity, adjustmentSign);
    const productId = dto.product.toString();
    let fallbackMutated = false;

    const persist = async (session?: ClientSession): Promise<InventoryDocument> => {
      if (dto.reference) {
        const existingQuery = this.transactionModel.findOne({
          reference: dto.reference,
          product: new Types.ObjectId(productId),
          type,
        });
        if (session) existingQuery.session(session);
        const existing = await existingQuery.exec();
        if (existing) {
          const inventoryQuery = this.inventoryModel.findOne({ product: productId });
          if (session) inventoryQuery.session(session);
          const current = await inventoryQuery.exec();
          if (!current) throw new NotFoundException('Inventory record not found');
          return current;
        }
      }

      if (delta < 0) {
        await this.productsService.deductStock(productId, Math.abs(delta), session);
      } else {
        await this.productsService.updateStock(productId, delta, session);
      }
      if (!session) fallbackMutated = true;

      const inventoryQuery = this.inventoryModel.findOne({ product: productId });
      if (session) inventoryQuery.session(session);
      const inventory = await inventoryQuery.exec();
      if (!inventory) throw new NotFoundException('Inventory record not found');
      if (inventory.currentStock < 0) {
        throw new BadRequestException('Giao dịch bị từ chối vì tồn kho không thể âm');
      }

      const payload = {
        product: new Types.ObjectId(productId),
        type,
        quantity: Math.abs(dto.quantity),
        change: delta,
        stockBefore: inventory.currentStock - delta,
        stockAfter: inventory.currentStock,
        note: dto.note,
        reference: dto.reference,
        createdBy: userId ? new Types.ObjectId(userId) : undefined,
      };
      if (session) {
        await this.transactionModel.create([payload], { session });
      } else {
        await this.transactionModel.create(payload);
      }
      return inventory;
    };

    const connection = (this.inventoryModel as any).db;
    if (!connection?.startSession) return persist();
    const session: ClientSession = await connection.startSession();
    try {
      let result: InventoryDocument | undefined;
      await session.withTransaction(async () => {
        result = await persist(session);
      });
      if (!result) throw new Error('Inventory transaction completed without a result');
      return result;
    } catch (error) {
      if (!this.isTransactionUnsupported(error)) throw error;
      this.logger.warn('MongoDB transactions unavailable; using compensated inventory mode.');
      try {
        return await persist();
      } catch (persistError) {
        if (fallbackMutated && delta < 0) {
          await this.productsService.updateStock(productId, Math.abs(delta)).catch(() => undefined);
        } else if (fallbackMutated) {
          await this.productsService.deductStock(productId, delta).catch(() => undefined);
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
    const existingQuery = this.transactionModel.findOne({ reference, product: productId, type });
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
      note: type === InventoryTransactionType.SALE ? 'Xuất kho theo đơn hàng' : 'Hoàn kho từ đơn hàng',
      reference,
      order: orderId ? new Types.ObjectId(orderId) : undefined,
    };
    if (session) await this.transactionModel.create([payload], { session });
    else await this.transactionModel.create(payload);
  }

  async deleteTransactionsByReference(reference: string): Promise<void> {
    await this.transactionModel.deleteMany({ reference }).exec();
  }

  async getTransactions(
    productId?: string,
  ): Promise<InventoryTransactionDocument[]> {
    const filter: any = {};
    if (productId) filter.product = productId;
    return this.transactionModel
      .find(filter)
      .populate('product', 'name sku')
      .populate('createdBy', 'fullName')
      .sort({ createdAt: -1 })
      .limit(50)
      .exec();
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
