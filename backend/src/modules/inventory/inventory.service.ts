import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
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
    const productObjectId = new Types.ObjectId(dto.product);
    let inventory = await this.inventoryModel
      .findOne({ product: productObjectId })
      .exec();

    if (!inventory) {
      inventory = new this.inventoryModel({
        product: productObjectId,
        currentStock: dto.quantity,
      });
    } else {
      inventory.currentStock += dto.quantity;
    }

    inventory.status = this.getStatus(
      inventory.currentStock,
      inventory.minStock,
    );
    inventory.lastUpdated = new Date();
    await inventory.save();

    // Set product stock to match inventory currentStock
    await this.productsService.setStock(
      dto.product.toString(),
      inventory.currentStock,
    );

    // Log transaction
    await this.transactionModel.create({
      product: productObjectId,
      type: InventoryTransactionType.IMPORT,
      quantity: dto.quantity,
      note: dto.note,
      createdBy: userId,
    });

    return inventory;
  }

  async exportStock(
    dto: InventoryTransactionDto,
    userId?: string,
  ): Promise<InventoryDocument> {
    const productObjectId = new Types.ObjectId(dto.product);
    const inventory = await this.inventoryModel
      .findOne({ product: productObjectId })
      .exec();
    if (!inventory) throw new NotFoundException('Inventory record not found');

    inventory.currentStock = Math.max(0, inventory.currentStock - dto.quantity);
    inventory.status = this.getStatus(
      inventory.currentStock,
      inventory.minStock,
    );
    inventory.lastUpdated = new Date();
    await inventory.save();

    // Set product stock to match inventory currentStock
    await this.productsService.setStock(
      dto.product.toString(),
      inventory.currentStock,
    );

    await this.transactionModel.create({
      product: productObjectId,
      type: InventoryTransactionType.EXPORT,
      quantity: dto.quantity,
      note: dto.note,
      createdBy: userId,
    });

    return inventory;
  }

  async adjustStock(
    dto: AdjustInventoryDto,
    userId?: string,
  ): Promise<InventoryDocument> {
    const productObjectId = new Types.ObjectId(dto.product);
    let inventory = await this.inventoryModel
      .findOne({ product: productObjectId })
      .exec();

    if (!inventory) {
      inventory = new this.inventoryModel({
        product: productObjectId,
        currentStock: dto.quantity,
      });
    } else {
      inventory.currentStock = dto.quantity;
    }

    inventory.status = this.getStatus(
      inventory.currentStock,
      inventory.minStock,
    );
    inventory.lastUpdated = new Date();
    await inventory.save();

    // Set product stock to match inventory currentStock
    await this.productsService.setStock(
      dto.product.toString(),
      inventory.currentStock,
    );

    await this.transactionModel.create({
      product: productObjectId,
      type: InventoryTransactionType.ADJUST,
      quantity: dto.quantity,
      note: dto.note,
      createdBy: userId,
    });

    return inventory;
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
