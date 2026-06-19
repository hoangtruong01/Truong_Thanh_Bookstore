import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Inventory, InventoryDocument,
  InventoryTransaction, InventoryTransactionDocument,
} from './schemas/inventory.schema';
import { InventoryTransactionDto, AdjustInventoryDto } from './dto/inventory.dto';
import { ProductsService } from '../products/products.service';
import { InventoryStatus, InventoryTransactionType } from '../../common/enums';

@Injectable()
export class InventoryService {
  constructor(
    @InjectModel(Inventory.name) private inventoryModel: Model<InventoryDocument>,
    @InjectModel(InventoryTransaction.name) private transactionModel: Model<InventoryTransactionDocument>,
    private productsService: ProductsService,
  ) {}

  private getStatus(currentStock: number, minStock: number): InventoryStatus {
    if (currentStock <= 0) return InventoryStatus.OUT_OF_STOCK;
    if (currentStock <= minStock) return InventoryStatus.LOW_STOCK;
    return InventoryStatus.IN_STOCK;
  }

  async findAll(): Promise<InventoryDocument[]> {
    return this.inventoryModel.find().populate('product', 'name sku images price').exec();
  }

  async getLowStock(): Promise<InventoryDocument[]> {
    return this.inventoryModel
      .find({ $or: [{ status: InventoryStatus.LOW_STOCK }, { status: InventoryStatus.OUT_OF_STOCK }] })
      .populate('product', 'name sku images price')
      .exec();
  }

  async importStock(dto: InventoryTransactionDto, userId?: string): Promise<InventoryDocument> {
    let inventory = await this.inventoryModel.findOne({ product: dto.product }).exec();

    if (!inventory) {
      inventory = new this.inventoryModel({
        product: dto.product,
        currentStock: dto.quantity,
      });
    } else {
      inventory.currentStock += dto.quantity;
    }

    inventory.status = this.getStatus(inventory.currentStock, inventory.minStock);
    inventory.lastUpdated = new Date();
    await inventory.save();

    // Update product stock
    await this.productsService.updateStock(dto.product, dto.quantity);

    // Log transaction
    await this.transactionModel.create({
      product: dto.product,
      type: InventoryTransactionType.IMPORT,
      quantity: dto.quantity,
      note: dto.note,
      createdBy: userId,
    });

    return inventory;
  }

  async exportStock(dto: InventoryTransactionDto, userId?: string): Promise<InventoryDocument> {
    const inventory = await this.inventoryModel.findOne({ product: dto.product }).exec();
    if (!inventory) throw new NotFoundException('Inventory record not found');

    inventory.currentStock = Math.max(0, inventory.currentStock - dto.quantity);
    inventory.status = this.getStatus(inventory.currentStock, inventory.minStock);
    inventory.lastUpdated = new Date();
    await inventory.save();

    await this.productsService.updateStock(dto.product, -dto.quantity);

    await this.transactionModel.create({
      product: dto.product,
      type: InventoryTransactionType.EXPORT,
      quantity: dto.quantity,
      note: dto.note,
      createdBy: userId,
    });

    return inventory;
  }

  async adjustStock(dto: AdjustInventoryDto, userId?: string): Promise<InventoryDocument> {
    let inventory = await this.inventoryModel.findOne({ product: dto.product }).exec();

    if (!inventory) {
      inventory = new this.inventoryModel({
        product: dto.product,
        currentStock: dto.quantity,
      });
    } else {
      const diff = dto.quantity - inventory.currentStock;
      await this.productsService.updateStock(dto.product, diff);
      inventory.currentStock = dto.quantity;
    }

    inventory.status = this.getStatus(inventory.currentStock, inventory.minStock);
    inventory.lastUpdated = new Date();
    await inventory.save();

    await this.transactionModel.create({
      product: dto.product,
      type: InventoryTransactionType.ADJUST,
      quantity: dto.quantity,
      note: dto.note,
      createdBy: userId,
    });

    return inventory;
  }

  async getTransactions(productId?: string): Promise<InventoryTransactionDocument[]> {
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
    return this.inventoryModel.countDocuments({
      $or: [{ status: InventoryStatus.LOW_STOCK }, { status: InventoryStatus.OUT_OF_STOCK }],
    }).exec();
  }
}
