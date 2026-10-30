import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Types, Connection, ClientSession } from 'mongoose';
import * as ExcelJS from 'exceljs';
import {
  CashAccount,
  CashAccountDocument,
  CashAccountStatus,
} from './schemas/cash-account.schema';
import {
  CashEntry,
  CashEntryDocument,
  CashEntryDirection,
  CashEntryCategory,
  CashEntryStatus,
} from './schemas/cash-entry.schema';
import {
  SupplierPayable,
  SupplierPayableDocument,
  SupplierPayableStatus,
} from './schemas/supplier-payable.schema';
import {
  CustomerReceivable,
  CustomerReceivableDocument,
  CustomerReceivableStatus,
} from './schemas/customer-receivable.schema';
import {
  CreateCashAccountDto,
  UpdateCashAccountDto,
  CreateCashEntryDto,
  ReverseCashEntryDto,
  CashEntryQueryDto,
  PaySupplierDto,
  SupplierPayableQueryDto,
  CreateCustomerReceivableDto,
  CollectCustomerPaymentDto,
  CustomerReceivableQueryDto,
} from './dto/finance.dto';
import { PaginatedResult, paginate } from '../../common/dto/pagination.dto';

@Injectable()
export class FinanceService {
  private readonly logger = new Logger(FinanceService.name);

  constructor(
    @InjectModel(CashAccount.name)
    private readonly accountModel: Model<CashAccountDocument>,
    @InjectModel(CashEntry.name)
    private readonly entryModel: Model<CashEntryDocument>,
    @InjectModel(SupplierPayable.name)
    private readonly payableModel: Model<SupplierPayableDocument>,
    @InjectModel(CustomerReceivable.name)
    private readonly receivableModel: Model<CustomerReceivableDocument>,
    @InjectConnection()
    private readonly connection: Connection,
  ) {}

  /**
   * Sinh mã phiếu thu (PT) hoặc phiếu chi (PC) duy nhất:
   * PT + YYMMDD + -XXXX hoặc PC + YYMMDD + -XXXX
   */
  async generateEntryCode(
    direction: CashEntryDirection,
    session?: ClientSession,
  ): Promise<string> {
    const now = new Date();
    const vnDateStr = now.toLocaleDateString('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
    });
    const [yyyy, mm, dd] = vnDateStr.split('-');
    const yy = yyyy.slice(-2);
    const prefix = direction === CashEntryDirection.IN ? 'PT' : 'PC';
    const datePrefix = `${prefix}${yy}${mm}${dd}`;

    const counterKey = `cash_entry_code_${datePrefix}`;
    const counterCollection = this.entryModel.db.collection('counters');

    const counterRes = await counterCollection.findOneAndUpdate(
      { _id: counterKey as any },
      { $inc: { seq: 1 } },
      { upsert: true, returnDocument: 'after' },
    );

    const seq = (counterRes as any)?.seq || 1;
    let code = `${datePrefix}-${String(seq).padStart(4, '0')}`;

    let existsQuery = this.entryModel.findOne({
      entryCode: code,
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
      existsQuery = this.entryModel.findOne({
        entryCode: code,
        isDeleted: false,
      });
      if (session && typeof existsQuery?.session === 'function') {
        existsQuery.session(session);
      }
    }

    return code;
  }

  // ==================== CASH ACCOUNTS ====================

  async createAccount(
    dto: CreateCashAccountDto,
    userId?: string,
  ): Promise<CashAccountDocument> {
    const existing = await this.accountModel
      .findOne({ code: dto.code.toUpperCase(), isDeleted: false })
      .exec();

    if (existing) {
      throw new ConflictException(
        `Mã sổ quỹ ${dto.code.toUpperCase()} đã tồn tại`,
      );
    }

    const openingBalance = dto.openingBalance || 0;
    const account = new this.accountModel({
      ...dto,
      code: dto.code.toUpperCase(),
      openingBalance,
      currentBalance: openingBalance,
      createdBy: userId ? new Types.ObjectId(userId) : undefined,
      isDeleted: false,
    });

    return account.save();
  }

  async findAllAccounts(): Promise<CashAccountDocument[]> {
    return this.accountModel
      .find({ isDeleted: false })
      .sort({ createdAt: 1 })
      .exec();
  }

  async findAccountById(id: string): Promise<CashAccountDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID sổ quỹ không hợp lệ');
    }
    const acc = await this.accountModel
      .findOne({ _id: id, isDeleted: false })
      .exec();
    if (!acc) {
      throw new NotFoundException('Không tìm thấy sổ quỹ');
    }
    return acc;
  }

  async updateAccount(
    id: string,
    dto: UpdateCashAccountDto,
  ): Promise<CashAccountDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID sổ quỹ không hợp lệ');
    }
    const acc = await this.accountModel
      .findOneAndUpdate({ _id: id, isDeleted: false }, dto, { new: true })
      .exec();
    if (!acc) {
      throw new NotFoundException('Không tìm thấy sổ quỹ để cập nhật');
    }
    return acc;
  }

  // ==================== CASH ENTRIES (PHIẾU THU / CHI) ====================

  /**
   * FIN-02: Lập phiếu thu / phiếu chi và ghi sổ quỹ
   * - Sinh mã duy nhất (PT/PC + YYMMDD + -XXXX)
   * - Chống trùng lặp qua idempotencyKey
   * - Kiểm tra số dư sổ quỹ khi chi tiền (OUT)
   * - Cập nhật số dư sổ quỹ nguyên tử
   * - Trạng thái POSTED bất biến
   */
  async createEntry(
    dto: CreateCashEntryDto,
    userId: string,
  ): Promise<CashEntryDocument> {
    // 1. Chống tạo trùng lặp với idempotencyKey
    if (dto.idempotencyKey) {
      const existing = await this.entryModel
        .findOne({ idempotencyKey: dto.idempotencyKey, isDeleted: false })
        .populate('account', 'code name type')
        .populate('createdBy', 'name email')
        .exec();

      if (existing) {
        this.logger.log(
          `Trùng lặp idempotencyKey phiếu thu chi: ${dto.idempotencyKey}. Trả về phiếu ${existing.entryCode}`,
        );
        return existing;
      }
    }

    if (!Types.ObjectId.isValid(dto.account)) {
      throw new BadRequestException('ID sổ quỹ không hợp lệ');
    }

    const account = await this.accountModel
      .findOne({ _id: dto.account, isDeleted: false })
      .exec();

    if (!account) {
      throw new NotFoundException('Không tìm thấy sổ quỹ');
    }

    if (account.status !== CashAccountStatus.ACTIVE) {
      throw new BadRequestException('Sổ quỹ đang bị khóa hoặc ngưng hoạt động');
    }

    // 2. Kiểm tra số dư nếu là Phiếu Chi (OUT)
    if (
      dto.direction === CashEntryDirection.OUT &&
      account.currentBalance < dto.amount
    ) {
      throw new BadRequestException(
        `Số dư sổ quỹ ${account.name} (${account.currentBalance.toLocaleString('vi-VN')} đ) không đủ để chi ${dto.amount.toLocaleString('vi-VN')} đ`,
      );
    }

    let session: ClientSession | null = null;
    let isTransactionActive = false;

    try {
      session = await this.connection.startSession();
      session.startTransaction();
      isTransactionActive = true;
    } catch {
      // Standalone MongoDB không hỗ trợ replica set transactions
      session = null;
    }

    try {
      const entryCode = await this.generateEntryCode(
        dto.direction,
        session || undefined,
      );

      const newEntry = new this.entryModel({
        entryCode,
        account: account._id,
        direction: dto.direction,
        category: dto.category,
        amount: dto.amount,
        referenceType: dto.referenceType,
        referenceId: dto.referenceId,
        partnerName: dto.partnerName,
        status: CashEntryStatus.POSTED,
        postedAt: new Date(),
        createdBy: new Types.ObjectId(userId),
        note: dto.note,
        idempotencyKey: dto.idempotencyKey,
        isDeleted: false,
      });

      let savedEntry: CashEntryDocument;
      if (session) {
        savedEntry = await newEntry.save({ session });
      } else {
        savedEntry = await newEntry.save();
      }

      // Cập nhật số dư sổ quỹ nguyên tử
      const balanceChange =
        dto.direction === CashEntryDirection.IN ? dto.amount : -dto.amount;

      const accountUpdateQuery = this.accountModel.findOneAndUpdate(
        { _id: account._id },
        { $inc: { currentBalance: balanceChange } },
        { new: true },
      );
      if (session && typeof accountUpdateQuery?.session === 'function') {
        accountUpdateQuery.session(session);
      }
      await accountUpdateQuery.exec();

      if (isTransactionActive && session) {
        await session.commitTransaction();
      }

      return savedEntry;
    } catch (err) {
      if (isTransactionActive && session) {
        await session.abortTransaction();
      }
      throw err;
    } finally {
      if (session) {
        await session.endSession();
      }
    }
  }

  /**
   * FIN-02: Hoàn đảo phiếu thu chi (Reversal)
   * Chứng từ POSTED là bất biến, để sửa lỗi phải tạo chứng từ đảo chiều ngược lại
   */
  async reverseEntry(
    id: string,
    dto: ReverseCashEntryDto,
    userId: string,
  ): Promise<{ original: CashEntryDocument; reversal: CashEntryDocument }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID phiếu thu chi không hợp lệ');
    }

    const original = await this.entryModel
      .findOne({ _id: id, isDeleted: false })
      .exec();

    if (!original) {
      throw new NotFoundException('Không tìm thấy phiếu thu chi');
    }

    if (original.status !== CashEntryStatus.POSTED) {
      throw new BadRequestException(
        `Không thể hoàn đảo phiếu ở trạng thái ${original.status}`,
      );
    }

    // Chiều ngược lại của phiếu đảo
    const reverseDirection =
      original.direction === CashEntryDirection.IN
        ? CashEntryDirection.OUT
        : CashEntryDirection.IN;

    const reverseCode = await this.generateEntryCode(reverseDirection);

    const reversal = new this.entryModel({
      entryCode: reverseCode,
      account: original.account,
      direction: reverseDirection,
      category: original.category,
      amount: original.amount,
      referenceType: 'REVERSAL',
      referenceId: original.entryCode,
      partnerName: original.partnerName,
      status: CashEntryStatus.POSTED,
      postedAt: new Date(),
      createdBy: new Types.ObjectId(userId),
      note: `Hoàn đảo phiếu ${original.entryCode}. Lý do: ${dto.reason}`,
      reversalOf: original._id,
      isDeleted: false,
    });

    const savedReversal = await reversal.save();

    // Cập nhật trạng thái phiếu gốc thành REVERSED
    original.status = CashEntryStatus.REVERSED;
    original.note = `${original.note || ''} (Đã hoàn đảo bởi ${reverseCode})`;
    await original.save();

    // Cập nhật lại số dư sổ quỹ
    const balanceChange =
      reverseDirection === CashEntryDirection.IN
        ? original.amount
        : -original.amount;

    await this.accountModel.findOneAndUpdate(
      { _id: original.account },
      { $inc: { currentBalance: balanceChange } },
    );

    return { original, reversal: savedReversal };
  }

  /**
   * Lấy danh sách phiếu thu chi (phân trang, lọc theo sổ quỹ, loại, ngày)
   */
  async findAllEntries(
    query: CashEntryQueryDto,
  ): Promise<PaginatedResult<CashEntryDocument>> {
    const {
      page = 1,
      limit = 20,
      accountId,
      direction,
      category,
      status,
      startDate,
      endDate,
      search,
    } = query;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = { isDeleted: false };

    if (accountId && Types.ObjectId.isValid(accountId)) {
      filter.account = new Types.ObjectId(accountId);
    }

    if (direction) filter.direction = direction;
    if (category) filter.category = category;
    if (status) filter.status = status;

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { entryCode: searchRegex },
        { partnerName: searchRegex },
        { note: searchRegex },
      ];
    }

    if (startDate || endDate) {
      filter.postedAt = {};
      if (startDate) filter.postedAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.postedAt.$lte = end;
      }
    }

    const [items, total] = await Promise.all([
      this.entryModel
        .find(filter)
        .sort({ postedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('account', 'code name type')
        .populate('createdBy', 'name email')
        .exec(),
      this.entryModel.countDocuments(filter).exec(),
    ]);

    return paginate(items, total, page, limit);
  }

  // ==================== SUPPLIER PAYABLES (CÔNG NỢ NCC) ====================

  /**
   * FIN-03: Tự động ghi nhận nghĩa vụ công nợ phải trả NCC khi phiếu nhận hàng (GRN) được xác nhận
   */
  async createPayableFromGoodsReceipt(
    supplierId: Types.ObjectId | string,
    receiptId: Types.ObjectId | string,
    poId: Types.ObjectId | string,
    receiptCode: string,
    totalAmount: number,
    session?: ClientSession,
  ): Promise<SupplierPayableDocument | null> {
    if (totalAmount <= 0) return null;

    const existing = await this.payableModel
      .findOne({
        goodsReceipt: new Types.ObjectId(receiptId.toString()),
        isDeleted: false,
      })
      .exec();

    if (existing) return existing;

    // Hạn thanh toán mặc định 30 ngày từ ngày nhập hàng
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    const payable = new this.payableModel({
      supplier: new Types.ObjectId(supplierId.toString()),
      goodsReceipt: new Types.ObjectId(receiptId.toString()),
      purchaseOrder: poId ? new Types.ObjectId(poId.toString()) : undefined,
      invoiceCode: receiptCode,
      totalAmount,
      paidAmount: 0,
      remainingAmount: totalAmount,
      dueDate,
      status: SupplierPayableStatus.UNPAID,
      paymentHistory: [],
      note: `Công nợ phát sinh từ phiếu nhận hàng ${receiptCode}`,
      isDeleted: false,
    });

    if (session) {
      return payable.save({ session });
    }
    return payable.save();
  }

  /**
   * PUR-04: Bù trừ công nợ khi trả hàng nhà cung cấp (Purchase Return Credit Adjustment)
   */
  async applyPurchaseReturnCredit(
    goodsReceiptId: Types.ObjectId | string,
    returnAmount: number,
    returnCode: string,
    note?: string,
  ): Promise<SupplierPayableDocument | null> {
    if (returnAmount <= 0) return null;

    const payable = await this.payableModel.findOne({
      goodsReceipt: new Types.ObjectId(goodsReceiptId.toString()),
      isDeleted: false,
    });

    if (!payable) return null;

    // Giảm số dư công nợ còn lại (remainingAmount) và điều chỉnh totalAmount
    const actualCredit = Math.min(returnAmount, payable.remainingAmount);
    payable.remainingAmount = Math.max(
      0,
      payable.remainingAmount - actualCredit,
    );
    payable.totalAmount = Math.max(
      payable.paidAmount,
      payable.totalAmount - actualCredit,
    );

    if (
      payable.remainingAmount === 0 &&
      payable.paidAmount >= payable.totalAmount
    ) {
      payable.status = SupplierPayableStatus.PAID;
    }

    payable.note =
      `${payable.note || ''} | Bù trừ ${actualCredit.toLocaleString('vi-VN')} đ từ phiếu trả hàng ${returnCode} ${note || ''}`.trim();

    return await payable.save();
  }

  /**
   * FIN-03: Thanh toán công nợ nhà cung cấp
   * - Tạo phiếu chi (PC) từ sổ quỹ
   * - Trừ số dư sổ quỹ
   * - Giảm số dư công nợ remainingAmount
   * - Chống trả vượt quá số nợ còn lại
   */
  async paySupplier(
    payableId: string,
    dto: PaySupplierDto,
    userId: string,
  ): Promise<{
    payable: SupplierPayableDocument;
    cashEntry: CashEntryDocument;
  }> {
    if (!Types.ObjectId.isValid(payableId)) {
      throw new BadRequestException('ID khoản công nợ không hợp lệ');
    }

    const payable = await this.payableModel
      .findOne({ _id: payableId, isDeleted: false })
      .populate('supplier', 'name code')
      .exec();

    if (!payable) {
      throw new NotFoundException('Không tìm thấy khoản công nợ nhà cung cấp');
    }

    if (payable.status === SupplierPayableStatus.PAID) {
      throw new BadRequestException('Khoản công nợ này đã được thanh toán đủ');
    }

    if (dto.amount > payable.remainingAmount) {
      throw new BadRequestException(
        `Số tiền thanh toán (${dto.amount.toLocaleString('vi-VN')} đ) không được vượt quá số nợ còn lại (${payable.remainingAmount.toLocaleString('vi-VN')} đ)`,
      );
    }

    // 1. Tạo phiếu chi tiền mặt/ngân hàng
    const supplierName = (payable.supplier as any)?.name || 'Nhà cung cấp';
    const cashEntry = await this.createEntry(
      {
        account: dto.accountId,
        direction: CashEntryDirection.OUT,
        category: CashEntryCategory.SUPPLIER_PAYMENT,
        amount: dto.amount,
        referenceType: 'SUPPLIER_PAYABLE',
        referenceId: payable.invoiceCode,
        partnerName: supplierName,
        note: dto.note || `Thanh toán công nợ phiếu ${payable.invoiceCode}`,
        idempotencyKey: dto.idempotencyKey,
      },
      userId,
    );

    // 2. Ghi nhận lịch sử thanh toán vào khoản nợ
    payable.paidAmount += dto.amount;
    payable.remainingAmount = Math.max(
      0,
      payable.totalAmount - payable.paidAmount,
    );

    if (payable.remainingAmount === 0) {
      payable.status = SupplierPayableStatus.PAID;
    } else {
      payable.status = SupplierPayableStatus.PARTIALLY_PAID;
    }

    payable.paymentHistory.push({
      cashEntry: cashEntry._id,
      entryCode: cashEntry.entryCode,
      amount: dto.amount,
      paidAt: new Date(),
      paidBy: new Types.ObjectId(userId),
      note: dto.note,
    });

    const savedPayable = await payable.save();
    return { payable: savedPayable, cashEntry };
  }

  /**
   * Lấy danh sách công nợ nhà cung cấp
   */
  async findAllPayables(
    query: SupplierPayableQueryDto,
  ): Promise<PaginatedResult<SupplierPayableDocument>> {
    const {
      page = 1,
      limit = 20,
      supplierId,
      status,
      dueDateFrom,
      dueDateTo,
      search,
    } = query;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = { isDeleted: false };

    if (supplierId && Types.ObjectId.isValid(supplierId)) {
      filter.supplier = new Types.ObjectId(supplierId);
    }

    if (status) filter.status = status;

    if (search && search.trim()) {
      filter.invoiceCode = new RegExp(search.trim(), 'i');
    }

    if (dueDateFrom || dueDateTo) {
      filter.dueDate = {};
      if (dueDateFrom) filter.dueDate.$gte = new Date(dueDateFrom);
      if (dueDateTo) {
        const end = new Date(dueDateTo);
        end.setHours(23, 59, 59, 999);
        filter.dueDate.$lte = end;
      }
    }

    const [items, total] = await Promise.all([
      this.payableModel
        .find(filter)
        .sort({ dueDate: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('supplier', 'code name phone email')
        .populate('goodsReceipt', 'receiptCode receivedAt')
        .populate('purchaseOrder', 'poCode')
        .exec(),
      this.payableModel.countDocuments(filter).exec(),
    ]);

    return paginate(items, total, page, limit);
  }

  /**
   * DOC-04: Xuất Excel sổ quỹ và phiếu thu chi
   */
  async exportCashEntriesToExcel(query: CashEntryQueryDto): Promise<Buffer> {
    const filter: Record<string, any> = { isDeleted: false };
    if (query.accountId && Types.ObjectId.isValid(query.accountId)) {
      filter.account = new Types.ObjectId(query.accountId);
    }
    if (query.direction) filter.direction = query.direction;
    if (query.category) filter.category = query.category;

    const entries = await this.entryModel
      .find(filter)
      .sort({ postedAt: -1 })
      .limit(5000)
      .populate('account', 'code name')
      .populate('createdBy', 'name')
      .exec();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('SoQuyThuChi');

    worksheet.columns = [
      { header: 'Mã phiếu', key: 'entryCode', width: 18 },
      { header: 'Ngày ghi sổ', key: 'postedAt', width: 20 },
      { header: 'Sổ quỹ', key: 'accountName', width: 25 },
      { header: 'Loại', key: 'direction', width: 12 },
      { header: 'Danh mục', key: 'category', width: 22 },
      { header: 'Số tiền (VND)', key: 'amount', width: 18 },
      { header: 'Đối tác / Người nộp nhận', key: 'partnerName', width: 28 },
      { header: 'Chứng từ tham chiếu', key: 'reference', width: 20 },
      { header: 'Trạng thái', key: 'status', width: 14 },
      { header: 'Người lập', key: 'createdBy', width: 20 },
      { header: 'Ghi chú', key: 'note', width: 30 },
    ];

    worksheet.getRow(1).font = { bold: true };

    for (const item of entries) {
      const acc: any = item.account;
      const creator: any = item.createdBy;
      worksheet.addRow({
        entryCode: item.entryCode,
        postedAt: item.postedAt
          ? new Date(item.postedAt).toLocaleString('vi-VN')
          : '',
        accountName: acc?.name || '-',
        direction:
          item.direction === CashEntryDirection.IN ? 'THU (+)' : 'CHI (-)',
        category: item.category,
        amount: item.amount,
        partnerName: item.partnerName || '-',
        reference:
          `${item.referenceType || ''} ${item.referenceId || ''}`.trim(),
        status: item.status,
        createdBy: creator?.name || 'Hệ thống',
        note: item.note || '',
      });
    }

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  // ==================== CUSTOMER RECEIVABLES (FIN-04) ====================

  /**
   * FIN-04: Tạo khoản công nợ phải thu khách hàng (AR)
   */
  async createReceivable(
    dto: CreateCustomerReceivableDto,
    _userId?: string,
  ): Promise<CustomerReceivableDocument> {
    const existing = await this.receivableModel.findOne({
      invoiceCode: dto.invoiceCode,
      isDeleted: false,
    });
    if (existing) {
      throw new ConflictException(
        `Đã tồn tại khoản công nợ cho hóa đơn ${dto.invoiceCode}`,
      );
    }

    const receivable = new this.receivableModel({
      customer: new Types.ObjectId(dto.customerId),
      customerName: dto.customerName,
      customerPhone: dto.customerPhone,
      invoiceCode: dto.invoiceCode,
      totalAmount: dto.totalAmount,
      paidAmount: 0,
      remainingAmount: dto.totalAmount,
      creditLimit: dto.creditLimit || 0,
      dueDate: new Date(dto.dueDate),
      status:
        dto.totalAmount === 0
          ? CustomerReceivableStatus.PAID
          : CustomerReceivableStatus.UNPAID,
      collectionHistory: [],
      order: dto.orderId ? new Types.ObjectId(dto.orderId) : undefined,
      posOrder: dto.posOrderId ? new Types.ObjectId(dto.posOrderId) : undefined,
      note: dto.note,
    });

    return await receivable.save();
  }

  /**
   * FIN-04: Thu tiền công nợ khách hàng (AR Collection)
   * - Tạo phiếu thu (PT) vào sổ quỹ
   * - Tăng số dư sổ quỹ
   * - Giảm số dư công nợ remainingAmount
   * - Chống thu vượt quá số nợ còn lại
   */
  async collectCustomerPayment(
    receivableId: string,
    dto: CollectCustomerPaymentDto,
    userId: string,
  ): Promise<{
    receivable: CustomerReceivableDocument;
    cashEntry: CashEntryDocument;
  }> {
    if (!Types.ObjectId.isValid(receivableId)) {
      throw new BadRequestException('ID khoản công nợ khách hàng không hợp lệ');
    }

    const receivable = await this.receivableModel.findOne({
      _id: receivableId,
      isDeleted: false,
    });

    if (!receivable) {
      throw new NotFoundException('Không tìm thấy khoản công nợ khách hàng');
    }

    if (receivable.status === CustomerReceivableStatus.PAID) {
      throw new BadRequestException('Khoản công nợ này đã được thu đủ 100%');
    }

    if (dto.amount > receivable.remainingAmount) {
      throw new BadRequestException(
        `Số tiền thu (${dto.amount.toLocaleString('vi-VN')} đ) không được vượt quá số nợ còn lại (${receivable.remainingAmount.toLocaleString('vi-VN')} đ)`,
      );
    }

    // 1. Tạo phiếu thu vào sổ quỹ
    const cashEntry = await this.createEntry(
      {
        account: dto.accountId,
        direction: CashEntryDirection.IN,
        category: CashEntryCategory.WHOLESALE_COLLECTION,
        amount: dto.amount,
        referenceType: 'CUSTOMER_RECEIVABLE',
        referenceId: receivable.invoiceCode,
        partnerName: receivable.customerName,
        note: dto.note || `Thu nợ khách sỉ đơn ${receivable.invoiceCode}`,
        idempotencyKey: dto.idempotencyKey,
      },
      userId,
    );

    // 2. Cập nhật số dư nợ
    receivable.paidAmount += dto.amount;
    receivable.remainingAmount = Math.max(
      0,
      receivable.totalAmount - receivable.paidAmount,
    );

    if (receivable.remainingAmount === 0) {
      receivable.status = CustomerReceivableStatus.PAID;
    } else {
      receivable.status = CustomerReceivableStatus.PARTIALLY_PAID;
    }

    receivable.collectionHistory.push({
      cashEntry: cashEntry._id,
      entryCode: cashEntry.entryCode,
      amount: dto.amount,
      collectedAt: new Date(),
      collectedBy: new Types.ObjectId(userId),
      note: dto.note,
    });

    const savedReceivable = await receivable.save();
    return { receivable: savedReceivable, cashEntry };
  }

  /**
   * Kiểm tra hạn mức nợ của khách hàng (Wholesale Credit Limit Check)
   */
  async checkCustomerCreditLimit(
    customerId: string,
    requestedAmount: number,
  ): Promise<{
    allowed: boolean;
    currentDebt: number;
    creditLimit: number;
    excessAmount: number;
  }> {
    if (!Types.ObjectId.isValid(customerId)) {
      throw new BadRequestException('ID khách hàng không hợp lệ');
    }

    const receivables = await this.receivableModel.find({
      customer: new Types.ObjectId(customerId),
      status: {
        $in: [
          CustomerReceivableStatus.UNPAID,
          CustomerReceivableStatus.PARTIALLY_PAID,
        ],
      },
      isDeleted: false,
    });

    const currentDebt = receivables.reduce(
      (sum, r) => sum + r.remainingAmount,
      0,
    );
    const creditLimit =
      receivables.length > 0 && receivables[0].creditLimit
        ? receivables[0].creditLimit
        : 30000000;

    const totalProjectedDebt = currentDebt + requestedAmount;
    const allowed = creditLimit <= 0 || totalProjectedDebt <= creditLimit;
    const excessAmount = allowed ? 0 : totalProjectedDebt - creditLimit;

    return {
      allowed,
      currentDebt,
      creditLimit,
      excessAmount,
    };
  }

  /**
   * Lấy danh sách công nợ khách hàng
   */
  async findAllReceivables(
    query: CustomerReceivableQueryDto,
  ): Promise<PaginatedResult<CustomerReceivableDocument>> {
    const {
      page = 1,
      limit = 20,
      customerId,
      status,
      dueDateFrom,
      dueDateTo,
      search,
    } = query;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = { isDeleted: false };

    if (customerId && Types.ObjectId.isValid(customerId)) {
      filter.customer = new Types.ObjectId(customerId);
    }

    if (status) filter.status = status;

    if (search && search.trim()) {
      filter.$or = [
        { invoiceCode: new RegExp(search.trim(), 'i') },
        { customerName: new RegExp(search.trim(), 'i') },
      ];
    }

    if (dueDateFrom || dueDateTo) {
      filter.dueDate = {};
      if (dueDateFrom) filter.dueDate.$gte = new Date(dueDateFrom);
      if (dueDateTo) {
        const end = new Date(dueDateTo);
        end.setHours(23, 59, 59, 999);
        filter.dueDate.$lte = end;
      }
    }

    const [items, total] = await Promise.all([
      this.receivableModel
        .find(filter)
        .sort({ dueDate: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('customer', 'fullName phone email code')
        .populate('order', 'orderNumber totalAmount')
        .exec(),
      this.receivableModel.countDocuments(filter).exec(),
    ]);

    return paginate(items, total, page, limit);
  }

  async findReceivableById(id: string): Promise<CustomerReceivableDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID công nợ khách hàng không hợp lệ');
    }
    const receivable = await this.receivableModel
      .findOne({ _id: id, isDeleted: false })
      .populate('customer', 'fullName phone email code')
      .populate('order', 'orderNumber')
      .exec();
    if (!receivable) {
      throw new NotFoundException('Không tìm thấy khoản công nợ khách hàng');
    }
    return receivable;
  }
}
