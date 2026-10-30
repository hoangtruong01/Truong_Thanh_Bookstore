import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, ClientSession } from 'mongoose';
import {
  PurchaseOrder,
  PurchaseOrderDocument,
  PurchaseOrderStatus,
} from './schemas/purchase-order.schema';
import {
  CreatePurchaseOrderDto,
  UpdatePurchaseOrderDto,
  PurchaseOrderQueryDto,
  ApprovePurchaseOrderDto,
  CancelPurchaseOrderDto,
} from './dto/purchase-order.dto';
import {
  Supplier,
  SupplierDocument,
} from '../suppliers/schemas/supplier.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { paginate, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class PurchaseOrdersService {
  private readonly logger = new Logger(PurchaseOrdersService.name);

  constructor(
    @InjectModel(PurchaseOrder.name)
    private readonly poModel: Model<PurchaseOrderDocument>,
    @InjectModel(Supplier.name)
    private readonly supplierModel: Model<SupplierDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  /**
   * Sinh mã PO duy nhất: PO + YYMMDD + -XXXX
   */
  async generatePOCode(session?: ClientSession): Promise<string> {
    const now = new Date();
    const vnDateStr = now.toLocaleDateString('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
    }); // Format: YYYY-MM-DD
    const [yyyy, mm, dd] = vnDateStr.split('-');
    const yy = yyyy.slice(-2);
    const datePrefix = `PO${yy}${mm}${dd}`;

    const counterKey = `po_code_${datePrefix}`;
    const counterCollection = this.poModel.db.collection('counters');

    const counterRes = await counterCollection.findOneAndUpdate(
      { _id: counterKey as any },
      { $inc: { seq: 1 } },
      { upsert: true, returnDocument: 'after' },
    );

    const seq = (counterRes as any)?.seq || 1;
    let code = `${datePrefix}-${String(seq).padStart(4, '0')}`;

    let existsQuery = this.poModel.findOne({ poCode: code, isDeleted: false });
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
      existsQuery = this.poModel.findOne({ poCode: code, isDeleted: false });
      if (session && typeof existsQuery?.session === 'function') {
        existsQuery.session(session);
      }
    }

    return code;
  }

  /**
   * ERP-02: Tạo mới đơn đặt mua hàng (Purchase Order)
   * LƯU Ý BẤT BIẾN: Việc tạo đơn PO KHÔNG ĐƯỢC làm tăng tồn kho thực tế!
   */
  async create(
    dto: CreatePurchaseOrderDto,
    userId: string,
    session?: ClientSession,
  ): Promise<PurchaseOrderDocument> {
    if (!Types.ObjectId.isValid(dto.supplier)) {
      throw new BadRequestException('ID nhà cung cấp không hợp lệ');
    }

    const supplier = await this.supplierModel
      .findOne({ _id: dto.supplier, isDeleted: false })
      .exec();
    if (!supplier) {
      throw new NotFoundException('Không tìm thấy nhà cung cấp');
    }

    const poCode = await this.generatePOCode(session);

    let subtotal = 0;
    const validatedItems = [];

    for (const item of dto.items) {
      if (!Types.ObjectId.isValid(item.product)) {
        throw new BadRequestException(
          `ID sản phẩm "${item.product}" không hợp lệ`,
        );
      }

      const product = await this.productModel
        .findOne({ _id: item.product, isDeleted: false })
        .exec();
      if (!product) {
        throw new NotFoundException(
          `Không tìm thấy sản phẩm có ID ${item.product}`,
        );
      }

      // Xác định đơn vị và tỷ lệ quy đổi từ cấu hình sản phẩm trong DB (NEW-002)
      const unit = item.unit ? item.unit.trim() : product.unit || 'cái';
      let conversionRatio = 1;

      if (unit === product.unit) {
        conversionRatio = 1;
      } else {
        const matchingConversion = product.unitConversions?.find(
          (c) => c.unit.toLowerCase() === unit.toLowerCase(),
        );
        if (!matchingConversion) {
          throw new BadRequestException(
            `Đơn vị "${unit}" chưa được cấu hình cho sản phẩm "${product.name}".`,
          );
        }
        conversionRatio = matchingConversion.ratio;
      }

      const baseQuantity = item.orderedQuantity * conversionRatio;
      const lineTotal = item.orderedQuantity * item.expectedUnitPrice;
      subtotal += lineTotal;

      validatedItems.push({
        product: product._id,
        productName: product.name,
        sku: product.sku,
        unit,
        conversionRatio,
        orderedQuantity: item.orderedQuantity,
        baseQuantity,
        receivedQuantity: 0,
        expectedUnitPrice: item.expectedUnitPrice,
        lineTotal,
      });
    }

    const tax = dto.tax || 0;
    const totalAmount = subtotal + tax;

    const newPO = new this.poModel({
      poCode,
      supplier: supplier._id,
      items: validatedItems,
      subtotal,
      tax,
      totalAmount,
      status: PurchaseOrderStatus.DRAFT,
      expectedDeliveryDate: dto.expectedDeliveryDate,
      note: dto.note,
      createdBy: new Types.ObjectId(userId),
      history: [
        {
          status: PurchaseOrderStatus.DRAFT,
          updatedBy: new Types.ObjectId(userId),
          note: dto.note || 'Tạo đơn đặt mua hàng mới',
          timestamp: new Date(),
        },
      ],
      isDeleted: false,
    });

    if (session) {
      return newPO.save({ session });
    }
    return newPO.save();
  }

  /**
   * ERP-02: Lấy danh sách PO (phân trang, lọc nhà cung cấp, trạng thái, thời gian)
   */
  async findAll(
    query: PurchaseOrderQueryDto,
  ): Promise<PaginatedResult<PurchaseOrderDocument>> {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      supplierId,
      startDate,
      endDate,
    } = query;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = { isDeleted: false };

    if (status) {
      filter.status = status;
    }

    if (supplierId && Types.ObjectId.isValid(supplierId)) {
      filter.supplier = new Types.ObjectId(supplierId);
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [{ poCode: searchRegex }, { note: searchRegex }];
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
      this.poModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('supplier', 'code name phone contactPerson')
        .populate('createdBy', 'name email')
        .populate('approvedBy', 'name email')
        .exec(),
      this.poModel.countDocuments(filter).exec(),
    ]);

    return paginate(items, total, page, limit);
  }

  /**
   * Xem chi tiết đơn PO
   */
  async findById(id: string): Promise<PurchaseOrderDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID đơn PO không hợp lệ');
    }

    const po = await this.poModel
      .findOne({ _id: id, isDeleted: false })
      .populate('supplier', 'code name phone contactPerson address')
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email')
      .populate('history.updatedBy', 'name email')
      .exec();

    if (!po) {
      throw new NotFoundException('Không tìm thấy đơn đặt mua hàng');
    }

    return po;
  }

  /**
   * Cập nhật đơn PO (chỉ cho phép khi PO ở trạng thái DRAFT)
   */
  async update(
    id: string,
    dto: UpdatePurchaseOrderDto,
    userId: string,
  ): Promise<PurchaseOrderDocument> {
    const po = await this.findById(id);

    if (po.status !== PurchaseOrderStatus.DRAFT) {
      throw new BadRequestException(
        `Không thể sửa đơn đặt mua khi đang ở trạng thái "${po.status}". Chỉ đơn DRAFT mới được sửa.`,
      );
    }

    if (dto.supplier) {
      if (!Types.ObjectId.isValid(dto.supplier)) {
        throw new BadRequestException('ID nhà cung cấp không hợp lệ');
      }
      const supplier = await this.supplierModel
        .findOne({ _id: dto.supplier, isDeleted: false })
        .exec();
      if (!supplier) {
        throw new NotFoundException('Không tìm thấy nhà cung cấp');
      }
      po.supplier = supplier._id;
    }

    if (dto.items && dto.items.length > 0) {
      let subtotal = 0;
      const validatedItems = [];

      for (const item of dto.items) {
        const product = await this.productModel
          .findOne({ _id: item.product, isDeleted: false })
          .exec();
        if (!product) {
          throw new NotFoundException(
            `Không tìm thấy sản phẩm có ID ${item.product}`,
          );
        }

        const unit = item.unit ? item.unit.trim() : product.unit || 'cái';
        let conversionRatio = 1;

        if (unit === product.unit) {
          conversionRatio = 1;
        } else {
          const matchingConversion = product.unitConversions?.find(
            (c) => c.unit.toLowerCase() === unit.toLowerCase(),
          );
          if (!matchingConversion) {
            throw new BadRequestException(
              `Đơn vị "${unit}" chưa được cấu hình cho sản phẩm "${product.name}".`,
            );
          }
          conversionRatio = matchingConversion.ratio;
        }

        const baseQuantity = item.orderedQuantity * conversionRatio;
        const lineTotal = item.orderedQuantity * item.expectedUnitPrice;
        subtotal += lineTotal;

        validatedItems.push({
          product: product._id,
          productName: product.name,
          sku: product.sku,
          unit,
          conversionRatio,
          orderedQuantity: item.orderedQuantity,
          baseQuantity,
          receivedQuantity: 0,
          expectedUnitPrice: item.expectedUnitPrice,
          lineTotal,
        });
      }

      po.items = validatedItems;
      po.subtotal = subtotal;
      po.totalAmount = subtotal + (dto.tax !== undefined ? dto.tax : po.tax);
    }

    if (dto.tax !== undefined) {
      po.tax = dto.tax;
      po.totalAmount = po.subtotal + po.tax;
    }

    if (dto.expectedDeliveryDate !== undefined) {
      po.expectedDeliveryDate = dto.expectedDeliveryDate;
    }

    if (dto.note !== undefined) {
      po.note = dto.note;
    }

    po.history.push({
      status: po.status,
      updatedBy: new Types.ObjectId(userId),
      note: 'Cập nhật thông tin đơn đặt mua',
      timestamp: new Date(),
    });

    return po.save();
  }

  /**
   * ERP-02: Phê duyệt đơn đặt mua (DRAFT -> APPROVED)
   */
  async approve(
    id: string,
    userId: string,
    dto?: ApprovePurchaseOrderDto,
  ): Promise<PurchaseOrderDocument> {
    const po = await this.findById(id);

    if (po.status !== PurchaseOrderStatus.DRAFT) {
      throw new BadRequestException(
        `Chỉ đơn PO ở trạng thái DRAFT mới có thể duyệt. Trạng thái hiện tại: ${po.status}`,
      );
    }

    po.status = PurchaseOrderStatus.APPROVED;
    po.approvedBy = new Types.ObjectId(userId);
    po.approvedAt = new Date();
    po.history.push({
      status: PurchaseOrderStatus.APPROVED,
      updatedBy: new Types.ObjectId(userId),
      note: dto?.note || 'Phê duyệt đơn đặt mua hàng',
      timestamp: new Date(),
    });

    return po.save();
  }

  /**
   * ERP-02: Gửi đơn đặt mua cho NCC (APPROVED -> SENT)
   */
  async sendToSupplier(
    id: string,
    userId: string,
    note?: string,
  ): Promise<PurchaseOrderDocument> {
    const po = await this.findById(id);

    if (po.status !== PurchaseOrderStatus.APPROVED) {
      throw new BadRequestException(
        `Chỉ đơn PO đã phê duyệt (APPROVED) mới có thể chuyển sang trạng thái đã gửi (SENT). Trạng thái hiện tại: ${po.status}`,
      );
    }

    po.status = PurchaseOrderStatus.SENT;
    po.history.push({
      status: PurchaseOrderStatus.SENT,
      updatedBy: new Types.ObjectId(userId),
      note: note || 'Đã gửi đơn đặt mua tới nhà cung cấp',
      timestamp: new Date(),
    });

    return po.save();
  }

  /**
   * ERP-02: Hủy đơn đặt mua
   */
  async cancel(
    id: string,
    userId: string,
    dto: CancelPurchaseOrderDto,
  ): Promise<PurchaseOrderDocument> {
    const po = await this.findById(id);

    if (
      po.status === PurchaseOrderStatus.PARTIALLY_RECEIVED ||
      po.status === PurchaseOrderStatus.FULLY_RECEIVED
    ) {
      throw new BadRequestException(
        `Không thể hủy đơn đặt mua đã nhận hàng (Trạng thái: ${po.status})`,
      );
    }

    if (po.status === PurchaseOrderStatus.CANCELLED) {
      throw new BadRequestException('Đơn đặt mua này đã bị hủy trước đó');
    }

    po.status = PurchaseOrderStatus.CANCELLED;
    po.history.push({
      status: PurchaseOrderStatus.CANCELLED,
      updatedBy: new Types.ObjectId(userId),
      note: `Hủy đơn: ${dto.reason}`,
      timestamp: new Date(),
    });

    return po.save();
  }
}
