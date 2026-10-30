import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, ClientSession } from 'mongoose';
import {
  Supplier,
  SupplierDocument,
  SupplierStatus,
} from './schemas/supplier.schema';
import {
  CreateSupplierDto,
  UpdateSupplierDto,
  SupplierQueryDto,
} from './dto/supplier.dto';
import { paginate, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class SuppliersService {
  private readonly logger = new Logger(SuppliersService.name);

  constructor(
    @InjectModel(Supplier.name)
    private readonly supplierModel: Model<SupplierDocument>,
  ) {}

  /**
   * Sinh mã nhà cung cấp tự động duy nhất: NCC-XXXX (ví dụ NCC-0001)
   */
  async generateSupplierCode(session?: ClientSession): Promise<string> {
    const counterKey = 'supplier_code_seq';
    const counterCollection = this.supplierModel.db.collection('counters');

    const counterRes = await counterCollection.findOneAndUpdate(
      { _id: counterKey as any },
      { $inc: { seq: 1 } },
      { upsert: true, returnDocument: 'after' },
    );

    const seq = (counterRes as any)?.seq || 1;
    let code = `NCC-${String(seq).padStart(4, '0')}`;

    let existsQuery = this.supplierModel.findOne({
      code,
      isDeleted: false,
    });
    if (session) existsQuery.session(session);
    let attempts = 0;
    while ((await existsQuery.exec()) && attempts < 5) {
      attempts++;
      const nextRes = await counterCollection.findOneAndUpdate(
        { _id: counterKey as any },
        { $inc: { seq: 1 } },
        { upsert: true, returnDocument: 'after' },
      );
      const nextSeq = (nextRes as any)?.seq || seq + attempts;
      code = `NCC-${String(nextSeq).padStart(4, '0')}`;
      existsQuery = this.supplierModel.findOne({
        code,
        isDeleted: false,
      });
      if (session) existsQuery.session(session);
    }

    return code;
  }

  /**
   * ERP-01: Tạo mới nhà cung cấp
   */
  async create(
    dto: CreateSupplierDto,
    userId?: string,
  ): Promise<SupplierDocument> {
    let code = dto.code ? dto.code.trim().toUpperCase() : '';

    if (!code) {
      code = await this.generateSupplierCode();
    } else {
      const existing = await this.supplierModel
        .findOne({ code, isDeleted: false })
        .exec();
      if (existing) {
        throw new ConflictException(
          `Mã nhà cung cấp "${code}" đã tồn tại trên hệ thống`,
        );
      }
    }

    const createdSupplier = new this.supplierModel({
      ...dto,
      code,
      createdBy: userId ? new Types.ObjectId(userId) : undefined,
      isDeleted: false,
    });

    return createdSupplier.save();
  }

  /**
   * ERP-01: Lấy danh sách nhà cung cấp (hỗ trợ phân trang, tìm kiếm, lọc trạng thái)
   */
  async findAll(
    query: SupplierQueryDto,
  ): Promise<PaginatedResult<SupplierDocument>> {
    const { page = 1, limit = 20, search, status } = query;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = { isDeleted: false };

    if (status) {
      filter.status = status;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { name: searchRegex },
        { code: searchRegex },
        { phone: searchRegex },
        { contactPerson: searchRegex },
      ];
    }

    const [items, total] = await Promise.all([
      this.supplierModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('suppliedProducts.product', 'name sku unit price')
        .exec(),
      this.supplierModel.countDocuments(filter).exec(),
    ]);

    return paginate(items, total, page, limit);
  }

  /**
   * Lấy chi tiết nhà cung cấp theo ID
   */
  async findById(id: string): Promise<SupplierDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID nhà cung cấp không hợp lệ');
    }

    const supplier = await this.supplierModel
      .findOne({ _id: id, isDeleted: false })
      .populate('suppliedProducts.product', 'name sku unit price')
      .exec();

    if (!supplier) {
      throw new NotFoundException('Không tìm thấy nhà cung cấp');
    }

    return supplier;
  }

  /**
   * Cập nhật thông tin nhà cung cấp
   */
  async update(id: string, dto: UpdateSupplierDto): Promise<SupplierDocument> {
    const supplier = await this.findById(id);

    if (dto.code && dto.code.trim().toUpperCase() !== supplier.code) {
      const newCode = dto.code.trim().toUpperCase();
      const existing = await this.supplierModel
        .findOne({
          code: newCode,
          _id: { $ne: supplier._id },
          isDeleted: false,
        })
        .exec();

      if (existing) {
        throw new ConflictException(
          `Mã nhà cung cấp "${newCode}" đã được sử dụng bởi nhà cung cấp khác`,
        );
      }
      supplier.code = newCode;
    }

    if (dto.name !== undefined) supplier.name = dto.name;
    if (dto.contactPerson !== undefined)
      supplier.contactPerson = dto.contactPerson;
    if (dto.phone !== undefined) supplier.phone = dto.phone;
    if (dto.email !== undefined) supplier.email = dto.email;
    if (dto.address !== undefined) supplier.address = dto.address;
    if (dto.taxCode !== undefined) supplier.taxCode = dto.taxCode;
    if (dto.status !== undefined) supplier.status = dto.status;
    if (dto.notes !== undefined) supplier.notes = dto.notes;

    return supplier.save();
  }

  /**
   * ERP-01: Xóa mềm nhà cung cấp. Không bao giờ xóa cứng nếu đã có chứng từ liên quan.
   */
  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const supplier = await this.findById(id);

    // Kiểm tra xem nhà cung cấp có PO hoặc GoodsReceipt không
    try {
      const poModel = this.supplierModel.db.model('PurchaseOrder');
      const poCount = await poModel
        .countDocuments({ supplier: supplier._id, isDeleted: false })
        .exec();
      if (poCount > 0) {
        // Có chứng từ PO liên kết -> chỉ khóa và đánh dấu xóa mềm, không xóa vật lý
        supplier.isDeleted = true;
        supplier.status = SupplierStatus.INACTIVE;
        supplier.deletedAt = new Date();
        await supplier.save();
        return {
          success: true,
          message:
            'Nhà cung cấp đã có chứng từ đặt hàng, đã chuyển sang trạng thái ngưng hợp tác và lưu trữ mềm.',
        };
      }
    } catch {
      // PurchaseOrder model có thể chưa được load trong một số ngữ cảnh kiểm thử
    }

    // Mặc định luôn xóa mềm để bảo toàn tính toàn vẹn dữ liệu kế toán
    supplier.isDeleted = true;
    supplier.status = SupplierStatus.INACTIVE;
    supplier.deletedAt = new Date();
    await supplier.save();

    return {
      success: true,
      message: 'Đã xóa nhà cung cấp thành công (lưu trữ mềm).',
    };
  }

  /**
   * ERP-01 & ERP-03: Ghi nhận lịch sử giá mua sản phẩm từ nhà cung cấp
   */
  async recordProductPurchase(
    supplierId: string | Types.ObjectId,
    productId: string | Types.ObjectId,
    purchasePrice: number,
    purchaseDate: Date = new Date(),
    session?: ClientSession,
  ): Promise<void> {
    const sId =
      typeof supplierId === 'string'
        ? new Types.ObjectId(supplierId)
        : supplierId;
    const pId =
      typeof productId === 'string' ? new Types.ObjectId(productId) : productId;

    // Tìm xem sản phẩm đã có trong suppliedProducts chưa
    const query = {
      _id: sId,
      'suppliedProducts.product': pId,
    };

    let updateExisting = this.supplierModel.findOneAndUpdate(
      query,
      {
        $set: {
          'suppliedProducts.$.lastPurchasePrice': purchasePrice,
          'suppliedProducts.$.lastPurchasedAt': purchaseDate,
        },
      },
      { new: true },
    );
    if (session) updateExisting = updateExisting.session(session);

    const updated = await updateExisting.exec();

    if (!updated) {
      // Nếu sản phẩm chưa có trong danh sách cung ứng của NCC -> push vào
      let pushNew = this.supplierModel.findByIdAndUpdate(
        sId,
        {
          $push: {
            suppliedProducts: {
              product: pId,
              lastPurchasePrice: purchasePrice,
              lastPurchasedAt: purchaseDate,
            },
          },
        },
        { new: true },
      );
      if (session) pushNew = pushNew.session(session);
      await pushNew.exec();
    }
  }

  /**
   * ERP-01: Tra cứu nhà cung cấp đã từng cung ứng sản phẩm này (kèm giá mua và thời điểm)
   */
  async getSuppliersForProduct(productId: string): Promise<any[]> {
    if (!Types.ObjectId.isValid(productId)) {
      throw new BadRequestException('ID sản phẩm không hợp lệ');
    }

    const suppliers = await this.supplierModel
      .find({
        isDeleted: false,
        'suppliedProducts.product': new Types.ObjectId(productId),
      })
      .select('code name phone contactPerson suppliedProducts')
      .lean()
      .exec();

    return suppliers.map((s) => {
      const productInfo = s.suppliedProducts?.find(
        (sp: any) => sp.product?.toString() === productId,
      );
      return {
        _id: s._id,
        code: s.code,
        name: s.name,
        phone: s.phone,
        contactPerson: s.contactPerson,
        lastPurchasePrice: productInfo?.lastPurchasePrice || 0,
        lastPurchasedAt: productInfo?.lastPurchasedAt,
      };
    });
  }
}
