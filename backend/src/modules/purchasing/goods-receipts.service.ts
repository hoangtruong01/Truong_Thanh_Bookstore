import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Types, Connection, ClientSession } from 'mongoose';
import {
  GoodsReceipt,
  GoodsReceiptDocument,
  ItemCondition,
} from './schemas/goods-receipt.schema';
import {
  PurchaseOrder,
  PurchaseOrderDocument,
  PurchaseOrderStatus,
} from './schemas/purchase-order.schema';
import {
  CreateGoodsReceiptDto,
  GoodsReceiptQueryDto,
} from './dto/goods-receipt.dto';
import { InventoryService } from '../inventory/inventory.service';
import { SuppliersService } from '../suppliers/suppliers.service';
import { paginate, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class GoodsReceiptsService {
  private readonly logger = new Logger(GoodsReceiptsService.name);

  constructor(
    @InjectModel(GoodsReceipt.name)
    private readonly receiptModel: Model<GoodsReceiptDocument>,
    @InjectModel(PurchaseOrder.name)
    private readonly poModel: Model<PurchaseOrderDocument>,
    @InjectConnection()
    private readonly connection: Connection,
    private readonly inventoryService: InventoryService,
    private readonly suppliersService: SuppliersService,
  ) {}

  /**
   * Sinh mã phiếu nhận hàng duy nhất: GR + YYMMDD + -XXXX
   */
  async generateReceiptCode(session?: ClientSession): Promise<string> {
    const now = new Date();
    const vnDateStr = now.toLocaleDateString('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
    });
    const [yyyy, mm, dd] = vnDateStr.split('-');
    const yy = yyyy.slice(-2);
    const datePrefix = `GR${yy}${mm}${dd}`;

    const counterKey = `goods_receipt_code_${datePrefix}`;
    const counterCollection = this.receiptModel.db.collection('counters');

    const counterRes = await counterCollection.findOneAndUpdate(
      { _id: counterKey as any },
      { $inc: { seq: 1 } },
      { upsert: true, returnDocument: 'after' },
    );

    const seq = (counterRes as any)?.seq || 1;
    let code = `${datePrefix}-${String(seq).padStart(4, '0')}`;

    let existsQuery = this.receiptModel.findOne({
      receiptCode: code,
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
      existsQuery = this.receiptModel.findOne({
        receiptCode: code,
        isDeleted: false,
      });
      if (session && typeof existsQuery?.session === 'function') {
        existsQuery.session(session);
      }
    }

    return code;
  }

  /**
   * ERP-03: Tạo phiếu nhận hàng và nhập kho từ PO
   * - Hỗ trợ nhận một phần hoặc toàn bộ PO
   * - Kiểm tra số lượng còn chờ nhận
   * - Tự động cập nhật trạng thái PO (PARTIALLY_RECEIVED hoặc FULLY_RECEIVED)
   * - Nhập kho qua InventoryService, tự động tính lại giá vốn bình quân gia quyền di động
   * - Cập nhật lịch sử giá mua của nhà cung cấp
   * - Chống tạo trùng lặp với idempotencyKey
   */
  async create(
    dto: CreateGoodsReceiptDto,
    userId: string,
  ): Promise<GoodsReceiptDocument> {
    // 1. Chống nhận lặp cùng chứng từ qua idempotencyKey
    if (dto.idempotencyKey) {
      const existing = await this.receiptModel
        .findOne({
          idempotencyKey: dto.idempotencyKey,
          isDeleted: false,
        })
        .populate('purchaseOrder', 'poCode status')
        .populate('supplier', 'code name phone')
        .populate('items.product', 'name sku unit')
        .exec();

      if (existing) {
        this.logger.log(
          `Trùng lặp idempotencyKey phiếu nhận hàng: ${dto.idempotencyKey}. Trả về phiếu đã tồn tại ${existing.receiptCode}`,
        );
        return existing;
      }
    }

    // 2. Kiểm tra tính hợp lệ của PO
    if (!Types.ObjectId.isValid(dto.purchaseOrder)) {
      throw new BadRequestException('ID đơn đặt mua hàng (PO) không hợp lệ');
    }

    const po = await this.poModel
      .findOne({ _id: dto.purchaseOrder, isDeleted: false })
      .exec();

    if (!po) {
      throw new NotFoundException('Không tìm thấy đơn đặt mua hàng');
    }

    if (
      po.status !== PurchaseOrderStatus.APPROVED &&
      po.status !== PurchaseOrderStatus.SENT &&
      po.status !== PurchaseOrderStatus.PARTIALLY_RECEIVED
    ) {
      throw new BadRequestException(
        `Không thể nhận hàng cho đơn PO ở trạng thái "${po.status}". Chỉ nhận khi PO là APPROVED, SENT hoặc PARTIALLY_RECEIVED.`,
      );
    }

    let session: ClientSession | null = null;
    let isTransactionActive = false;

    try {
      session = await this.connection.startSession();
      session.startTransaction();
      isTransactionActive = true;
    } catch (sessionErr: any) {
      if (process.env.NODE_ENV === 'production') {
        this.logger.error(
          'CRITICAL: MongoDB client session is unavailable in production for goods receipt.',
        );
        throw new InternalServerErrorException(
          'Hệ thống không thể thực hiện giao dịch nhận hàng an toàn trong môi trường Production do thiếu hỗ trợ MongoDB Transaction.',
        );
      }
      this.logger.warn(
        `Session/Transaction not supported (${sessionErr?.message || sessionErr}). Falling back to multi-step execution.`,
      );
      session = null;
      isTransactionActive = false;
    }

    try {
      const receiptCode = await this.generateReceiptCode(session || undefined);

      let totalAmount = 0;
      const validatedItems = [];

      for (const item of dto.items) {
        const poItem = po.items.find(
          (pi) => pi.product.toString() === item.product,
        );

        if (!poItem) {
          throw new BadRequestException(
            `Sản phẩm ID "${item.product}" không nằm trong đơn đặt mua PO "${po.poCode}"`,
          );
        }

        const conversionRatio = poItem.conversionRatio || 1;
        const baseQuantity = item.receivedQuantity * conversionRatio;
        const rejectedQuantity = item.rejectedQuantity || 0;

        if (rejectedQuantity > baseQuantity) {
          throw new BadRequestException(
            `Số lượng hàng hỏng (${rejectedQuantity}) không được lớn hơn tổng số lượng nhận (${baseQuantity}) cho sản phẩm "${poItem.productName}"`,
          );
        }

        const acceptedQuantity = baseQuantity - rejectedQuantity;

        // Kiểm tra số lượng còn chờ nhận trên PO
        const remainingBaseQuantity =
          poItem.baseQuantity - poItem.receivedQuantity;
        if (baseQuantity > remainingBaseQuantity) {
          throw new BadRequestException(
            `Số lượng nhận quy đổi (${baseQuantity} ${poItem.unit}) vượt quá số lượng còn chờ nhận (${remainingBaseQuantity} ${poItem.unit}) của sản phẩm "${poItem.productName}" trên PO.`,
          );
        }

        const lineTotal = item.receivedQuantity * item.actualUnitPrice;
        totalAmount += lineTotal;

        // Cập nhật số lượng đã nhận trên PO
        poItem.receivedQuantity += baseQuantity;

        validatedItems.push({
          product: poItem.product,
          productName: poItem.productName,
          sku: poItem.sku,
          unit: item.unit || poItem.unit,
          conversionRatio,
          receivedQuantity: item.receivedQuantity,
          baseQuantity,
          acceptedQuantity,
          rejectedQuantity,
          condition: item.condition || ItemCondition.GOOD,
          actualUnitPrice: item.actualUnitPrice,
          lineTotal,
        });
      }

      // 3. Cập nhật trạng thái của PO
      const isAllFullyReceived = po.items.every(
        (pi) => pi.receivedQuantity >= pi.baseQuantity,
      );

      po.status = isAllFullyReceived
        ? PurchaseOrderStatus.FULLY_RECEIVED
        : PurchaseOrderStatus.PARTIALLY_RECEIVED;

      po.history.push({
        status: po.status,
        updatedBy: new Types.ObjectId(userId),
        note: `Nhận hàng theo phiếu ${receiptCode} (${isAllFullyReceived ? 'Nhận đủ 100%' : 'Nhận một phần'})`,
        timestamp: new Date(),
      });

      if (session) {
        await po.save({ session });
      } else {
        await po.save();
      }

      // 4. Tạo document GoodsReceipt
      const newReceipt = new this.receiptModel({
        receiptCode,
        purchaseOrder: po._id,
        supplier: po.supplier,
        items: validatedItems,
        totalAmount,
        receivedBy: new Types.ObjectId(userId),
        receivedAt: new Date(),
        idempotencyKey: dto.idempotencyKey,
        note: dto.note,
        isDeleted: false,
      });

      let savedReceipt: GoodsReceiptDocument;
      if (session) {
        savedReceipt = await newReceipt.save({ session });
      } else {
        savedReceipt = await newReceipt.save();
      }

      // 5. Cập nhật tồn kho và giá vốn (Moving Weighted Average Cost)
      for (const vItem of validatedItems) {
        if (vItem.acceptedQuantity > 0) {
          // Giá vốn đơn vị gốc
          const unitCostPrice = Math.round(
            vItem.actualUnitPrice / vItem.conversionRatio,
          );

          await this.inventoryService.importStock(
            {
              product: vItem.product.toString(),
              quantity: vItem.acceptedQuantity,
              costPrice: unitCostPrice,
              reference: receiptCode,
              note: `Nhập kho từ phiếu nhận hàng ${receiptCode} (PO: ${po.poCode})`,
            },
            userId,
          );

          // 6. Ghi nhận lịch sử giá mua sản phẩm từ nhà cung cấp
          await this.suppliersService.recordProductPurchase(
            po.supplier,
            vItem.product,
            vItem.actualUnitPrice,
            new Date(),
            session || undefined,
          );
        }
      }

      if (isTransactionActive && session) {
        await session.commitTransaction();
      }

      return savedReceipt;
    } catch (err) {
      if (isTransactionActive && session) {
        await session.abortTransaction();
      }
      this.logger.error(
        `Lỗi khi tạo phiếu nhận hàng: ${err?.message || err}`,
        err?.stack,
      );
      throw err;
    } finally {
      if (session) {
        await session.endSession();
      }
    }
  }

  /**
   * ERP-03: Lấy danh sách phiếu nhận hàng (phân trang, lọc theo PO, nhà cung cấp, ngày)
   */
  async findAll(
    query: GoodsReceiptQueryDto,
  ): Promise<PaginatedResult<GoodsReceiptDocument>> {
    const {
      page = 1,
      limit = 20,
      search,
      purchaseOrderId,
      supplierId,
      startDate,
      endDate,
    } = query;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = { isDeleted: false };

    if (purchaseOrderId && Types.ObjectId.isValid(purchaseOrderId)) {
      filter.purchaseOrder = new Types.ObjectId(purchaseOrderId);
    }

    if (supplierId && Types.ObjectId.isValid(supplierId)) {
      filter.supplier = new Types.ObjectId(supplierId);
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [{ receiptCode: searchRegex }, { note: searchRegex }];
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const [items, total] = await Promise.all([
      this.receiptModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('purchaseOrder', 'poCode status')
        .populate('supplier', 'code name phone')
        .populate('receivedBy', 'name email')
        .exec(),
      this.receiptModel.countDocuments(filter).exec(),
    ]);

    return paginate(items, total, page, limit);
  }

  /**
   * Xem chi tiết phiếu nhận hàng
   */
  async findById(id: string): Promise<GoodsReceiptDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID phiếu nhận hàng không hợp lệ');
    }

    const receipt = await this.receiptModel
      .findOne({ _id: id, isDeleted: false })
      .populate('purchaseOrder', 'poCode status items')
      .populate('supplier', 'code name phone address')
      .populate('receivedBy', 'name email')
      .populate('items.product', 'name sku unit')
      .exec();

    if (!receipt) {
      throw new NotFoundException('Không tìm thấy phiếu nhận hàng');
    }

    return receipt;
  }
}
