import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Types, Connection, ClientSession } from 'mongoose';
import { Warehouse, WarehouseDocument } from './schemas/warehouse.schema';
import {
  WarehouseStock,
  WarehouseStockDocument,
} from './schemas/warehouse-stock.schema';
import {
  StockTransfer,
  StockTransferDocument,
} from './schemas/stock-transfer.schema';
import {
  InventoryTransaction,
  InventoryTransactionDocument,
} from '../inventory/schemas/inventory.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import {
  CreateWarehouseDto,
  UpdateWarehouseDto,
  CreateStockTransferDto,
  ReceiveStockTransferDto,
  WarehouseQueryDto,
  StockTransferQueryDto,
} from './dto/warehouse.dto';
import {
  WarehouseType,
  StockTransferStatus,
  InventoryTransactionType,
} from '../../common/enums';
import { PaginatedResult, paginate } from '../../common/dto/pagination.dto';

@Injectable()
export class WarehousesService {
  private readonly logger = new Logger(WarehousesService.name);

  constructor(
    @InjectModel(Warehouse.name)
    private readonly warehouseModel: Model<WarehouseDocument>,
    @InjectModel(WarehouseStock.name)
    private readonly warehouseStockModel: Model<WarehouseStockDocument>,
    @InjectModel(StockTransfer.name)
    private readonly stockTransferModel: Model<StockTransferDocument>,
    @InjectModel(InventoryTransaction.name)
    private readonly transactionModel: Model<InventoryTransactionDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectConnection()
    private readonly connection: Connection,
  ) {}

  /**
   * Khởi tạo các kho mặc định nếu hệ thống chưa có kho nào.
   */
  async ensureDefaultWarehouses(): Promise<WarehouseDocument> {
    let defaultWarehouse = await this.warehouseModel
      .findOne({ isDefault: true })
      .exec();

    if (!defaultWarehouse) {
      defaultWarehouse = await this.warehouseModel.create({
        code: 'KHO-TONG',
        name: 'Kho Tổng Trường Thành',
        type: WarehouseType.MAIN,
        address: 'Kho Tổng Trung Tâm, TP.HCM',
        isDefault: true,
        isActive: true,
        description: 'Kho lưu trữ và phân phối chính của hệ thống',
      });

      // Tạo thêm kho bán lẻ tại quầy
      await this.warehouseModel.create({
        code: 'KHO-CUA-HANG',
        name: 'Kho Cửa Hàng Bán Lẻ',
        type: WarehouseType.STORE,
        address: 'Nhà sách Trường Thành - Quầy bán lẻ',
        isDefault: false,
        isActive: true,
        description: 'Kho trưng bày và phục vụ bán trực tiếp tại quầy POS',
      });

      this.logger.log('Đã tự động khởi tạo Kho Tổng và Kho Cửa Hàng mặc định.');
    }

    return defaultWarehouse;
  }

  // ==================== WAREHOUSE CRUD ====================

  async createWarehouse(
    dto: CreateWarehouseDto,
    _userId?: Types.ObjectId,
  ): Promise<WarehouseDocument> {
    const existing = await this.warehouseModel
      .findOne({ code: dto.code.trim().toUpperCase() })
      .exec();

    if (existing) {
      throw new ConflictException(
        `Mã kho '${dto.code}' đã tồn tại trên hệ thống.`,
      );
    }

    if (dto.isDefault) {
      await this.warehouseModel.updateMany({}, { isDefault: false }).exec();
    }

    const warehouse = new this.warehouseModel({
      ...dto,
      code: dto.code.trim().toUpperCase(),
      type: dto.type || WarehouseType.MAIN,
      isDefault: Boolean(dto.isDefault),
      isActive: dto.isActive !== undefined ? dto.isActive : true,
    });

    return warehouse.save();
  }

  async findAll(
    query?: WarehouseQueryDto,
  ): Promise<PaginatedResult<WarehouseDocument>> {
    const page = Math.max(1, Number(query?.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query?.limit) || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};

    if (query?.type) {
      filter.type = query.type;
    }

    if (query?.isActive !== undefined) {
      filter.isActive = query.isActive;
    }

    if (query?.search) {
      const searchRegex = new RegExp(
        query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        'i',
      );
      filter.$or = [
        { code: searchRegex },
        { name: searchRegex },
        { address: searchRegex },
      ];
    }

    const [items, total] = await Promise.all([
      this.warehouseModel
        .find(filter)
        .populate('manager', 'fullName email')
        .sort({ isDefault: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.warehouseModel.countDocuments(filter).exec(),
    ]);

    return paginate(items, total, page, limit);
  }

  async findById(id: string | Types.ObjectId): Promise<WarehouseDocument> {
    const warehouse = await this.warehouseModel
      .findById(id)
      .populate('manager', 'fullName email')
      .exec();

    if (!warehouse) {
      throw new NotFoundException(`Không tìm thấy kho với ID: ${String(id)}`);
    }

    return warehouse;
  }

  async update(
    id: string | Types.ObjectId,
    dto: UpdateWarehouseDto,
  ): Promise<WarehouseDocument> {
    const warehouse = await this.findById(id);

    if (dto.isDefault && !warehouse.isDefault) {
      await this.warehouseModel
        .updateMany({ _id: { $ne: warehouse._id } }, { isDefault: false })
        .exec();
    }

    Object.assign(warehouse, dto);
    return warehouse.save();
  }

  // ==================== WAREHOUSE STOCK ====================

  async getWarehouseStock(
    warehouseId: string | Types.ObjectId,
    page = 1,
    limit = 20,
  ): Promise<PaginatedResult<WarehouseStockDocument>> {
    await this.findById(warehouseId);

    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.max(1, Math.min(100, Number(limit) || 20));
    const skip = (safePage - 1) * safeLimit;

    const filter = { warehouse: new Types.ObjectId(warehouseId.toString()) };

    const [items, total] = await Promise.all([
      this.warehouseStockModel
        .find(filter)
        .populate('product', 'name sku price costPrice images')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .exec(),
      this.warehouseStockModel.countDocuments(filter).exec(),
    ]);

    return paginate(items, total, safePage, safeLimit);
  }

  /**
   * Tính tổng tồn khả dụng bán được của sản phẩm.
   * Tự động loại trừ kho hàng lỗi (DAMAGED) và kho chờ kiểm (QUARANTINE).
   */
  async getSellableStock(productId: string | Types.ObjectId): Promise<{
    productId: string;
    totalSellable: number;
    breakdown: Array<{
      warehouseId: string;
      warehouseCode: string;
      warehouseName: string;
      type: WarehouseType;
      quantity: number;
      reservedQuantity: number;
      available: number;
    }>;
  }> {
    const pId = new Types.ObjectId(productId.toString());

    // Chỉ lấy các kho hợp lệ bán hàng
    const validWarehouses = await this.warehouseModel
      .find({
        isActive: true,
        type: {
          $in: [WarehouseType.MAIN, WarehouseType.STORE, WarehouseType.ONLINE],
        },
      })
      .select('_id code name type')
      .lean()
      .exec();

    const warehouseIds = validWarehouses.map((w) => w._id);

    const stocks = await this.warehouseStockModel
      .find({
        product: pId,
        warehouse: { $in: warehouseIds },
      })
      .lean()
      .exec();

    const stockMap = new Map(stocks.map((s) => [s.warehouse.toString(), s]));

    let totalSellable = 0;
    const breakdown = validWarehouses.map((w) => {
      const stock = stockMap.get(w._id.toString());
      const qty = stock?.quantity || 0;
      const reserved = stock?.reservedQuantity || 0;
      const available = Math.max(0, qty - reserved);
      totalSellable += available;

      return {
        warehouseId: w._id.toString(),
        warehouseCode: w.code,
        warehouseName: w.name,
        type: w.type,
        quantity: qty,
        reservedQuantity: reserved,
        available,
      };
    });

    return {
      productId: pId.toString(),
      totalSellable,
      breakdown,
    };
  }

  /**
   * Giữ chỗ tồn kho nguyên tử (Atomic Stock Reservation).
   * Chống Race condition và Overselling khi nhiều đơn hàng đặt cùng lúc.
   */
  async reserveStock(
    warehouseId: string | Types.ObjectId,
    productId: string | Types.ObjectId,
    quantity: number,
    session?: ClientSession,
  ): Promise<WarehouseStockDocument> {
    if (quantity <= 0) {
      throw new BadRequestException('Số lượng giữ chỗ phải lớn hơn 0.');
    }

    const wId = new Types.ObjectId(warehouseId.toString());
    const pId = new Types.ObjectId(productId.toString());

    const updated = await this.warehouseStockModel.findOneAndUpdate(
      {
        warehouse: wId,
        product: pId,
        $expr: {
          $gte: [{ $subtract: ['$quantity', '$reservedQuantity'] }, quantity],
        },
      },
      {
        $inc: { reservedQuantity: quantity },
      },
      { new: true, session },
    );

    if (!updated) {
      throw new BadRequestException(
        'Không đủ tồn kho khả dụng để thực hiện giữ chỗ.',
      );
    }

    return updated;
  }

  /**
   * Giải phóng số lượng đã giữ chỗ.
   */
  async releaseStock(
    warehouseId: string | Types.ObjectId,
    productId: string | Types.ObjectId,
    quantity: number,
    session?: ClientSession,
  ): Promise<WarehouseStockDocument> {
    const wId = new Types.ObjectId(warehouseId.toString());
    const pId = new Types.ObjectId(productId.toString());

    const updated = await this.warehouseStockModel.findOneAndUpdate(
      {
        warehouse: wId,
        product: pId,
      },
      {
        $inc: { reservedQuantity: -quantity },
      },
      { new: true, session },
    );

    if (!updated) {
      throw new NotFoundException(
        'Không tìm thấy bản ghi tồn kho để giải phóng.',
      );
    }

    return updated;
  }

  // ==================== STOCK TRANSFER WORKFLOW ====================

  /**
   * Lập phiếu chuyển kho (DRAFT).
   */
  async createTransfer(
    dto: CreateStockTransferDto,
    userId: Types.ObjectId,
  ): Promise<StockTransferDocument> {
    if (dto.fromWarehouse === dto.toWarehouse) {
      throw new BadRequestException(
        'Kho xuất và kho nhập không được trùng nhau.',
      );
    }

    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException(
        'Phiếu chuyển kho phải có ít nhất 1 mặt hàng.',
      );
    }

    const [fromWh, toWh] = await Promise.all([
      this.findById(dto.fromWarehouse),
      this.findById(dto.toWarehouse),
    ]);

    if (!fromWh.isActive || !toWh.isActive) {
      throw new BadRequestException(
        'Cả hai kho phải đang ở trạng thái hoạt động.',
      );
    }

    // Lấy thông tin các sản phẩm
    const productIds = dto.items.map((i) => new Types.ObjectId(i.product));
    const products = await this.productModel
      .find({ _id: { $in: productIds }, isDeleted: false })
      .select('_id name sku costPrice')
      .lean()
      .exec();

    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    const transferItems = dto.items.map((item) => {
      const prod = productMap.get(item.product.toString());
      if (!prod) {
        throw new NotFoundException(
          `Không tìm thấy sản phẩm có ID: ${item.product}`,
        );
      }

      return {
        product: prod._id,
        productName: prod.name,
        sku: prod.sku,
        requestedQty: Number(item.requestedQty),
        shippedQty: 0,
        receivedQty: 0,
        variance: 0,
        costPrice: (prod as any).costPrice || 0,
        note: item.note,
      };
    });

    // Sinh mã chuyển kho duy nhất
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const transferCode = `TRF-${dateStr}-${randomSuffix}`;

    const transfer = new this.stockTransferModel({
      transferCode,
      fromWarehouse: fromWh._id,
      toWarehouse: toWh._id,
      items: transferItems,
      status: StockTransferStatus.DRAFT,
      note: dto.note,
      createdBy: userId,
    });

    return transfer.save();
  }

  async findTransfers(
    query?: StockTransferQueryDto,
  ): Promise<PaginatedResult<StockTransferDocument>> {
    const page = Math.max(1, Number(query?.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query?.limit) || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};

    if (query?.status) {
      filter.status = query.status;
    }

    if (query?.fromWarehouse) {
      filter.fromWarehouse = new Types.ObjectId(query.fromWarehouse);
    }

    if (query?.toWarehouse) {
      filter.toWarehouse = new Types.ObjectId(query.toWarehouse);
    }

    if (query?.search) {
      const searchRegex = new RegExp(
        query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        'i',
      );
      filter.transferCode = searchRegex;
    }

    const [items, total] = await Promise.all([
      this.stockTransferModel
        .find(filter)
        .populate('fromWarehouse', 'code name type')
        .populate('toWarehouse', 'code name type')
        .populate('createdBy', 'fullName email')
        .populate('approvedBy', 'fullName email')
        .populate('shippedBy', 'fullName email')
        .populate('receivedBy', 'fullName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.stockTransferModel.countDocuments(filter).exec(),
    ]);

    return paginate(items, total, page, limit);
  }

  async findTransferById(
    id: string | Types.ObjectId,
  ): Promise<StockTransferDocument> {
    const transfer = await this.stockTransferModel
      .findById(id)
      .populate('fromWarehouse', 'code name type address')
      .populate('toWarehouse', 'code name type address')
      .populate('createdBy', 'fullName email')
      .populate('approvedBy', 'fullName email')
      .populate('shippedBy', 'fullName email')
      .populate('receivedBy', 'fullName email')
      .exec();

    if (!transfer) {
      throw new NotFoundException(
        `Không tìm thấy phiếu chuyển kho: ${String(id)}`,
      );
    }

    return transfer;
  }

  /**
   * Phê duyệt phiếu chuyển kho (APPROVED).
   */
  async approveTransfer(
    id: string | Types.ObjectId,
    userId: Types.ObjectId,
  ): Promise<StockTransferDocument> {
    const transfer = await this.findTransferById(id);

    if (transfer.status !== StockTransferStatus.DRAFT) {
      throw new BadRequestException(
        `Chỉ có thể phê duyệt phiếu chuyển kho đang ở trạng thái DRAFT (hiện tại: ${transfer.status}).`,
      );
    }

    transfer.status = StockTransferStatus.APPROVED;
    transfer.approvedBy = userId;
    return transfer.save();
  }

  /**
   * Xuất kho vận chuyển (IN_TRANSIT) — Thực hiện trong ACID Session.
   * Trừ tồn thực tế tại kho xuất và ghi nhận InventoryTransaction TRANSFER_OUT.
   */
  async shipTransfer(
    id: string | Types.ObjectId,
    userId: Types.ObjectId,
    externalSession?: ClientSession,
  ): Promise<StockTransferDocument> {
    const execute = async (session: ClientSession) => {
      const transfer = await this.stockTransferModel
        .findById(id)
        .session(session)
        .exec();

      if (!transfer) {
        throw new NotFoundException(
          `Không tìm thấy phiếu chuyển kho: ${String(id)}`,
        );
      }

      if (
        transfer.status !== StockTransferStatus.APPROVED &&
        transfer.status !== StockTransferStatus.DRAFT
      ) {
        throw new BadRequestException(
          `Không thể xuất kho khi phiếu ở trạng thái: ${transfer.status}`,
        );
      }

      // Trừ tồn kho tại kho xuất cho từng sản phẩm
      for (const item of transfer.items) {
        const qtyToShip = item.requestedQty;

        // Trừ tồn kho nguồn nguyên tử
        const updatedStock = await this.warehouseStockModel.findOneAndUpdate(
          {
            warehouse: transfer.fromWarehouse,
            product: item.product,
            quantity: { $gte: qtyToShip },
          },
          {
            $inc: { quantity: -qtyToShip },
          },
          { new: true, session },
        );

        if (!updatedStock) {
          throw new BadRequestException(
            `Kho xuất không đủ tồn cho sản phẩm '${item.sku}' (yêu cầu: ${qtyToShip}).`,
          );
        }

        item.shippedQty = qtyToShip;

        // Ghi nhận log sổ cái giao dịch kho
        await this.transactionModel.create(
          [
            {
              product: item.product,
              type: InventoryTransactionType.TRANSFER_OUT,
              quantity: qtyToShip,
              change: -qtyToShip,
              stockBefore: updatedStock.quantity + qtyToShip,
              stockAfter: updatedStock.quantity,
              costPrice: item.costPrice,
              note: `Xuất chuyển kho ${transfer.transferCode}`,
              reference: transfer.transferCode,
              createdBy: userId,
            },
          ],
          { session },
        );
      }

      transfer.status = StockTransferStatus.IN_TRANSIT;
      transfer.shippedAt = new Date();
      transfer.shippedBy = userId;

      return transfer.save({ session });
    };

    if (externalSession) {
      return execute(externalSession);
    }

    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const result = await execute(session);
      await session.commitTransaction();
      return result;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  /**
   * Nhận hàng tại kho đích (COMPLETED) — Thực hiện trong ACID Session.
   * Cộng tồn thực tế tại kho nhập, ghi nhận số lượng thiếu hụt (variance nếu có).
   */
  async receiveTransfer(
    id: string | Types.ObjectId,
    dto: ReceiveStockTransferDto,
    userId: Types.ObjectId,
    externalSession?: ClientSession,
  ): Promise<StockTransferDocument> {
    const execute = async (session: ClientSession) => {
      const transfer = await this.stockTransferModel
        .findById(id)
        .session(session)
        .exec();

      if (!transfer) {
        throw new NotFoundException(
          `Không tìm thấy phiếu chuyển kho: ${String(id)}`,
        );
      }

      if (transfer.status !== StockTransferStatus.IN_TRANSIT) {
        throw new BadRequestException(
          `Chỉ có thể nhận hàng khi phiếu chuyển kho đang ở trạng thái IN_TRANSIT (hiện tại: ${transfer.status}).`,
        );
      }

      const receivedMap = new Map(
        dto.items.map((i) => [i.product.toString(), i]),
      );

      for (const item of transfer.items) {
        const receivedItemDto = receivedMap.get(item.product.toString());
        const receivedQty =
          receivedItemDto !== undefined
            ? Number(receivedItemDto.receivedQty)
            : item.shippedQty;

        if (receivedQty < 0 || receivedQty > item.shippedQty) {
          throw new BadRequestException(
            `Số lượng nhận cho sản phẩm '${item.sku}' không hợp lệ (nhận: ${receivedQty}, xuất: ${item.shippedQty}).`,
          );
        }

        const variance = item.shippedQty - receivedQty;
        item.receivedQty = receivedQty;
        item.variance = variance;
        if (receivedItemDto?.note) {
          item.note = receivedItemDto.note;
        }

        // Cộng tồn kho đích nguyên tử
        const updatedStock = await this.warehouseStockModel.findOneAndUpdate(
          {
            warehouse: transfer.toWarehouse,
            product: item.product,
          },
          {
            $inc: { quantity: receivedQty },
          },
          { upsert: true, new: true, session },
        );

        // Ghi nhận log sổ cái giao dịch kho cho số thực nhận
        if (receivedQty > 0) {
          await this.transactionModel.create(
            [
              {
                product: item.product,
                type: InventoryTransactionType.TRANSFER_IN,
                quantity: receivedQty,
                change: receivedQty,
                stockBefore: updatedStock.quantity - receivedQty,
                stockAfter: updatedStock.quantity,
                costPrice: item.costPrice,
                note: `Nhập chuyển kho ${transfer.transferCode}`,
                reference: `${transfer.transferCode}-IN`,
                createdBy: userId,
              },
            ],
            { session },
          );
        }

        // Nếu có hao hụt trong vận chuyển (variance > 0), ghi nhận log DAMAGE/ADJUSTMENT
        if (variance > 0) {
          await this.transactionModel.create(
            [
              {
                product: item.product,
                type: InventoryTransactionType.DAMAGE,
                quantity: variance,
                change: -variance,
                stockBefore: item.shippedQty,
                stockAfter: receivedQty,
                costPrice: item.costPrice,
                note: `Hao hụt vận chuyển ${transfer.transferCode}: mất ${variance} ${item.sku}`,
                reference: `${transfer.transferCode}-VAR`,
                createdBy: userId,
              },
            ],
            { session },
          );
        }
      }

      transfer.status = StockTransferStatus.COMPLETED;
      transfer.receivedAt = new Date();
      transfer.receivedBy = userId;
      if (dto.note) {
        transfer.note = transfer.note
          ? `${transfer.note} | Nhận: ${dto.note}`
          : dto.note;
      }

      return transfer.save({ session });
    };

    if (externalSession) {
      return execute(externalSession);
    }

    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const result = await execute(session);
      await session.commitTransaction();
      return result;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  /**
   * Hủy phiếu chuyển kho (CANCELLED).
   * Nếu đã IN_TRANSIT, hoàn trả lại số lượng đã xuất về kho nguồn trong ACID session.
   */
  async cancelTransfer(
    id: string | Types.ObjectId,
    userId: Types.ObjectId,
    externalSession?: ClientSession,
  ): Promise<StockTransferDocument> {
    const execute = async (session: ClientSession) => {
      const transfer = await this.stockTransferModel
        .findById(id)
        .session(session)
        .exec();

      if (!transfer) {
        throw new NotFoundException(
          `Không tìm thấy phiếu chuyển kho: ${String(id)}`,
        );
      }

      if (transfer.status === StockTransferStatus.COMPLETED) {
        throw new ConflictException(
          'Không thể hủy phiếu chuyển kho đã hoàn tất nhập kho. Vui lòng lập phiếu chuyển kho ngược lại.',
        );
      }

      if (transfer.status === StockTransferStatus.CANCELLED) {
        return transfer;
      }

      // Nếu đang IN_TRANSIT thì phải hoàn lại số lượng đã xuất về kho nguồn
      if (transfer.status === StockTransferStatus.IN_TRANSIT) {
        for (const item of transfer.items) {
          if (item.shippedQty > 0) {
            const restoredStock =
              await this.warehouseStockModel.findOneAndUpdate(
                {
                  warehouse: transfer.fromWarehouse,
                  product: item.product,
                },
                {
                  $inc: { quantity: item.shippedQty },
                },
                { upsert: true, new: true, session },
              );

            await this.transactionModel.create(
              [
                {
                  product: item.product,
                  type: InventoryTransactionType.ADJUSTMENT,
                  quantity: item.shippedQty,
                  change: item.shippedQty,
                  stockBefore: restoredStock.quantity - item.shippedQty,
                  stockAfter: restoredStock.quantity,
                  costPrice: item.costPrice,
                  note: `Hoàn trả hủy phiếu chuyển kho ${transfer.transferCode}`,
                  reference: `${transfer.transferCode}-CANCEL`,
                  createdBy: userId,
                },
              ],
              { session },
            );
          }
        }
      }

      transfer.status = StockTransferStatus.CANCELLED;
      return transfer.save({ session });
    };

    if (externalSession) {
      return execute(externalSession);
    }

    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const result = await execute(session);
      await session.commitTransaction();
      return result;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }
}
