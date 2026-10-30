import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, ClientSession } from 'mongoose';
import {
  StockAudit,
  StockAuditDocument,
  StockAuditStatus,
} from './schemas/stock-audit.schema';
import {
  CreateStockAuditDto,
  SubmitStockAuditDto,
  ApproveStockAuditDto,
  RejectStockAuditDto,
  StockAuditQueryDto,
} from './dto/stock-audit.dto';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import {
  Inventory,
  InventoryDocument,
} from '../inventory/schemas/inventory.schema';
import { InventoryService } from '../inventory/inventory.service';
import { paginate, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class StockAuditsService {
  private readonly logger = new Logger(StockAuditsService.name);

  constructor(
    @InjectModel(StockAudit.name)
    private readonly auditModel: Model<StockAuditDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(Inventory.name)
    private readonly inventoryModel: Model<InventoryDocument>,
    private readonly inventoryService: InventoryService,
  ) {}

  /**
   * Sinh mã kiểm kê duy nhất: AUD + YYMMDD + -XXXX
   */
  async generateAuditCode(session?: ClientSession): Promise<string> {
    const now = new Date();
    const vnDateStr = now.toLocaleDateString('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
    });
    const [yyyy, mm, dd] = vnDateStr.split('-');
    const yy = yyyy.slice(-2);
    const datePrefix = `AUD${yy}${mm}${dd}`;

    const counterKey = `stock_audit_code_${datePrefix}`;
    const counterCollection = this.auditModel.db.collection('counters');

    const counterRes = await counterCollection.findOneAndUpdate(
      { _id: counterKey as any },
      { $inc: { seq: 1 } },
      { upsert: true, returnDocument: 'after' },
    );

    const seq = (counterRes as any)?.seq || 1;
    let code = `${datePrefix}-${String(seq).padStart(4, '0')}`;

    let existsQuery = this.auditModel.findOne({
      auditCode: code,
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
      existsQuery = this.auditModel.findOne({
        auditCode: code,
        isDeleted: false,
      });
      if (session && typeof existsQuery?.session === 'function') {
        existsQuery.session(session);
      }
    }

    return code;
  }

  /**
   * ERP-04: Tạo đợt kiểm kê mới
   * - Chốt danh sách SKU và đóng băng số tồn hệ thống (systemStock) tại thời điểm tạo
   */
  async create(
    dto: CreateStockAuditDto,
    userId: string,
  ): Promise<StockAuditDocument> {
    const auditCode = await this.generateAuditCode();

    const productFilter: Record<string, any> = { isDeleted: false };
    if (dto.productIds && dto.productIds.length > 0) {
      productFilter._id = {
        $in: dto.productIds.map((id) => new Types.ObjectId(id)),
      };
    }

    const products = await this.productModel.find(productFilter).exec();
    if (products.length === 0) {
      throw new BadRequestException(
        'Không tìm thấy sản phẩm nào phù hợp để tạo đợt kiểm kê',
      );
    }

    // Lấy tồn kho và giá vốn hiện tại từ Inventory
    const productObjectIds = products.map((p) => p._id);
    const inventories = await this.inventoryModel
      .find({ product: { $in: productObjectIds } })
      .exec();

    const inventoryMap = new Map<string, InventoryDocument>();
    for (const inv of inventories) {
      inventoryMap.set(inv.product.toString(), inv);
    }

    const items = products.map((prod) => {
      const inv = inventoryMap.get(prod._id.toString());
      const systemStock =
        inv?.currentStock !== undefined ? inv.currentStock : 0;
      const costPrice = inv?.costPrice || 0;

      return {
        product: prod._id,
        productName: prod.name,
        sku: prod.sku,
        unit: prod.unit || 'cái',
        systemStock,
        actualStock: systemStock, // Khởi tạo bằng systemStock, nhân viên sẽ kiểm đếm
        discrepancy: 0,
        costPrice,
        discrepancyValue: 0,
        reason: '',
      };
    });

    const newAudit = new this.auditModel({
      auditCode,
      title: dto.title,
      items,
      totalDiscrepancyQty: 0,
      totalDiscrepancyValue: 0,
      requiresApproval: false,
      status: StockAuditStatus.DRAFT,
      createdBy: new Types.ObjectId(userId),
      note: dto.note,
      isDeleted: false,
    });

    return newAudit.save();
  }

  /**
   * ERP-04: Nhập số lượng thực đếm và gửi phê duyệt
   * - Tự động tính chênh lệch: discrepancy = actualStock - systemStock
   * - Tự động tính giá trị chênh lệch: discrepancyValue = discrepancy * costPrice
   * - Kiểm tra ngưỡng phê duyệt (lệch > 5 cái hoặc giá trị lệch > 500.000 đ)
   */
  async submitCount(
    id: string,
    dto: SubmitStockAuditDto,
    userId: string,
  ): Promise<StockAuditDocument> {
    const audit = await this.findById(id);

    if (
      audit.status !== StockAuditStatus.DRAFT &&
      audit.status !== StockAuditStatus.PENDING_APPROVAL
    ) {
      throw new BadRequestException(
        `Không thể nhập số liệu kiểm kê khi đang ở trạng thái "${audit.status}"`,
      );
    }

    const countMap = new Map<
      string,
      { actualStock: number; reason?: string }
    >();
    for (const countItem of dto.items) {
      countMap.set(countItem.product, countItem);
    }

    let totalDiscrepancyQty = 0;
    let totalDiscrepancyValue = 0;
    let requiresApproval = false;

    for (const item of audit.items) {
      const submitted = countMap.get(item.product.toString());
      if (submitted) {
        item.actualStock = submitted.actualStock;
        if (submitted.reason) item.reason = submitted.reason;
      }

      item.discrepancy = item.actualStock - item.systemStock;
      item.discrepancyValue = item.discrepancy * item.costPrice;

      totalDiscrepancyQty += Math.abs(item.discrepancy);
      totalDiscrepancyValue += item.discrepancyValue;

      // Ngưỡng kiểm soát nghiệp vụ ERP-04:
      // Nếu có bất kỳ dòng nào lệch > 5 sản phẩm -> Bắt buộc quản lý duyệt
      if (Math.abs(item.discrepancy) > 5) {
        requiresApproval = true;
      }
    }

    // Nếu tổng giá trị chênh lệch > 500,000 VND -> Bắt buộc quản lý duyệt
    if (Math.abs(totalDiscrepancyValue) > 500000) {
      requiresApproval = true;
    }

    audit.totalDiscrepancyQty = totalDiscrepancyQty;
    audit.totalDiscrepancyValue = totalDiscrepancyValue;
    audit.requiresApproval = requiresApproval;
    audit.status = StockAuditStatus.PENDING_APPROVAL;
    audit.submittedBy = new Types.ObjectId(userId);
    audit.submittedAt = new Date();
    if (dto.note) audit.note = dto.note;

    return audit.save();
  }

  /**
   * ERP-04: Phê duyệt kết quả kiểm kê và áp dụng điều chỉnh kho
   * - Chỉ cập nhật kho sau khi được phê duyệt
   * - Kiểm tra tranh chấp (optimistic locking): nếu số tồn hệ thống đã thay đổi so với systemStock lúc kiểm kê,
   *   báo lỗi 409 Conflict để yêu cầu đối soát lại, không ghi đè số lượng bán vừa phát sinh.
   */
  async approve(
    id: string,
    userId: string,
    dto?: ApproveStockAuditDto,
  ): Promise<StockAuditDocument> {
    const audit = await this.findById(id);

    if (audit.status !== StockAuditStatus.PENDING_APPROVAL) {
      throw new BadRequestException(
        `Chỉ đợt kiểm kê đang ở trạng thái PENDING_APPROVAL mới có thể phê duyệt. Trạng thái hiện tại: ${audit.status}`,
      );
    }

    // Áp dụng điều chỉnh kho cho các mặt hàng có chênh lệch
    for (const item of audit.items) {
      if (item.discrepancy !== 0) {
        try {
          await this.inventoryService.adjustStock(
            {
              product: item.product.toString(),
              newStock: item.actualStock,
              expectedCurrentStock: item.systemStock, // NEW-011: Optimistic lock kiểm tra tồn thực tế
              reference: audit.auditCode,
              note: `Điều chỉnh sau kiểm kê ${audit.auditCode}: Lệch ${item.discrepancy > 0 ? '+' : ''}${item.discrepancy} ${item.unit}. Lý do: ${item.reason || 'Kiểm kê định kỳ'}`,
            },
            userId,
          );
        } catch (err: any) {
          if (err instanceof ConflictException) {
            throw new ConflictException(
              `Xung đột tồn kho tại sản phẩm "${item.productName}": Tồn kho thực tế trong hệ thống đã thay đổi so với số lúc bắt đầu kiểm kê (${item.systemStock}). Vui lòng kiểm đếm lại hoặc đối soát giao dịch phát sinh.`,
            );
          }
          throw err;
        }
      }
    }

    audit.status = StockAuditStatus.APPROVED;
    audit.approvedBy = new Types.ObjectId(userId);
    audit.approvedAt = new Date();
    audit.appliedAt = new Date();
    if (dto?.note) {
      audit.note = audit.note ? `${audit.note} | ${dto.note}` : dto.note;
    }

    return audit.save();
  }

  /**
   * ERP-04: Từ chối kết quả kiểm kê
   */
  async reject(
    id: string,
    userId: string,
    dto: RejectStockAuditDto,
  ): Promise<StockAuditDocument> {
    const audit = await this.findById(id);

    if (audit.status !== StockAuditStatus.PENDING_APPROVAL) {
      throw new BadRequestException(
        `Chỉ đợt kiểm kê đang ở trạng thái PENDING_APPROVAL mới có thể từ chối. Trạng thái hiện tại: ${audit.status}`,
      );
    }

    audit.status = StockAuditStatus.REJECTED;
    audit.rejectedBy = new Types.ObjectId(userId);
    audit.rejectedAt = new Date();
    audit.rejectionReason = dto.reason;

    return audit.save();
  }

  /**
   * Lấy danh sách đợt kiểm kê
   */
  async findAll(
    query: StockAuditQueryDto,
  ): Promise<PaginatedResult<StockAuditDocument>> {
    const { page = 1, limit = 20, search, status, startDate, endDate } = query;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = { isDeleted: false };

    if (status) {
      filter.status = status;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [{ auditCode: searchRegex }, { title: searchRegex }];
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
      this.auditModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'name email')
        .populate('submittedBy', 'name email')
        .populate('approvedBy', 'name email')
        .exec(),
      this.auditModel.countDocuments(filter).exec(),
    ]);

    return paginate(items, total, page, limit);
  }

  /**
   * Xem chi tiết đợt kiểm kê
   */
  async findById(id: string): Promise<StockAuditDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID đợt kiểm kê không hợp lệ');
    }

    const audit = await this.auditModel
      .findOne({ _id: id, isDeleted: false })
      .populate('createdBy', 'name email')
      .populate('submittedBy', 'name email')
      .populate('approvedBy', 'name email')
      .populate('rejectedBy', 'name email')
      .exec();

    if (!audit) {
      throw new NotFoundException('Không tìm thấy đợt kiểm kê');
    }

    return audit;
  }
}
