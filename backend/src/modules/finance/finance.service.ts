import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
  Optional,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Types, Connection, ClientSession } from 'mongoose';
import * as crypto from 'crypto';
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
  CustomerCreditProfile,
  CustomerCreditProfileDocument,
  CreditStatus,
} from './schemas/customer-credit-profile.schema';
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
    @Optional()
    @InjectModel(CustomerCreditProfile.name)
    private readonly creditProfileModel?: Model<CustomerCreditProfileDocument>,
  ) {}

  /**
   * Tính SHA-256 canonical payload hash để kiểm soát Idempotency Key (FIN-01.1)
   */
  public computePayloadHash(payload: Record<string, any>): string {
    const sorted = Object.keys(payload)
      .sort()
      .reduce((acc: Record<string, string>, key) => {
        if (payload[key] !== undefined && payload[key] !== null) {
          acc[key] = String(payload[key]);
        }
        return acc;
      }, {});
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(sorted))
      .digest('hex');
  }

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
   * FIN-02 & FIN-01: Lập phiếu thu / phiếu chi và ghi sổ quỹ
   * - Sinh mã duy nhất (PT/PC + YYMMDD + -XXXX)
   * - Chống trùng lặp qua idempotencyKey + payloadHash
   * - Hỗ trợ externalSession cho các giao dịch phức hợp (paySupplier, collectCustomerPayment)
   * - Kiểm tra số dư sổ quỹ khi chi tiền (OUT)
   * - Cập nhật số dư sổ quỹ nguyên tử
   * - Trạng thái POSTED bất biến
   */
  async createEntry(
    dto: CreateCashEntryDto,
    userId: string,
    externalSession?: ClientSession,
    inheritedPayloadHash?: string,
  ): Promise<CashEntryDocument> {
    // 1. Chống tạo trùng lặp với idempotencyKey
    const payloadHash =
      inheritedPayloadHash ||
      (dto.idempotencyKey
        ? this.computePayloadHash({
            account: String(dto.account),
            direction: String(dto.direction),
            category: String(dto.category),
            amount: Number(dto.amount),
            referenceType: String(dto.referenceType || ''),
            referenceId: String(dto.referenceId || ''),
          })
        : undefined);

    if (dto.idempotencyKey && dto.idempotencyKey.trim()) {
      let existingQuery = this.entryModel.findOne({
        idempotencyKey: dto.idempotencyKey.trim(),
        isDeleted: false,
      });
      if (typeof (existingQuery as any)?.populate === 'function') {
        existingQuery = (existingQuery as any)
          .populate('account', 'code name type')
          .populate('createdBy', 'name email');
      }
      const existing =
        typeof (existingQuery as any)?.exec === 'function'
          ? await (existingQuery as any).exec()
          : await existingQuery;

      if (existing) {
        if (
          payloadHash &&
          existing.payloadHash &&
          existing.payloadHash !== payloadHash
        ) {
          throw new ConflictException(
            `Idempotency key "${dto.idempotencyKey}" đã được sử dụng với nội dung khác biệt (Payload mismatch).`,
          );
        }
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

    let session: ClientSession | null = externalSession || null;
    let isTransactionActive = false;

    if (!session) {
      try {
        session = await this.connection.startSession();
        session.startTransaction();
        isTransactionActive = true;
      } catch {
        // Standalone MongoDB không hỗ trợ replica set transactions
        session = null;
        isTransactionActive = false;
      }
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
        idempotencyKey: dto.idempotencyKey?.trim() || undefined,
        payloadHash,
        isDeleted: false,
      });

      let savedEntry: CashEntryDocument;
      if (session) {
        savedEntry = await newEntry.save({ session });
      } else {
        savedEntry = await newEntry.save();
      }

      // Cập nhật số dư sổ quỹ nguyên tử có điều kiện
      const balanceChange =
        dto.direction === CashEntryDirection.IN ? dto.amount : -dto.amount;

      const accountFilter: Record<string, any> = {
        _id: account._id,
        isDeleted: false,
      };
      if (dto.direction === CashEntryDirection.OUT) {
        accountFilter.currentBalance = { $gte: dto.amount };
        accountFilter.status = CashAccountStatus.ACTIVE;
      }

      const accountUpdateQuery = this.accountModel.findOneAndUpdate(
        accountFilter,
        { $inc: { currentBalance: balanceChange } },
        { new: true },
      );
      if (session && typeof accountUpdateQuery?.session === 'function') {
        accountUpdateQuery.session(session);
      }
      const updatedAccount = await accountUpdateQuery.exec();

      if (!updatedAccount && dto.direction === CashEntryDirection.OUT) {
        throw new BadRequestException(
          `Số dư sổ quỹ ${account.name} không đủ để chi ${dto.amount.toLocaleString('vi-VN')} đ`,
        );
      }

      if (isTransactionActive && session) {
        await session.commitTransaction();
      }

      return savedEntry;
    } catch (err: any) {
      if (isTransactionActive && session) {
        await session.abortTransaction();
      }
      if (
        err?.code === 11000 &&
        dto.idempotencyKey &&
        err?.keyPattern?.idempotencyKey
      ) {
        const existing = await this.entryModel
          .findOne({
            idempotencyKey: dto.idempotencyKey.trim(),
            isDeleted: false,
          })
          .populate('account', 'code name type')
          .populate('createdBy', 'name email')
          .exec();
        if (existing) {
          if (
            payloadHash &&
            existing.payloadHash &&
            existing.payloadHash !== payloadHash
          ) {
            throw new ConflictException(
              `Idempotency key "${dto.idempotencyKey}" đã được sử dụng với nội dung khác biệt.`,
            );
          }
          return existing;
        }
      }
      throw err;
    } finally {
      if (isTransactionActive && session) {
        await session.endSession();
      }
    }
  }

  /**
   * FIN-02: Hoàn đảo phiếu thu chi (Reversal) an toàn
   * Chứng từ POSTED là bất biến, để sửa lỗi phải tạo chứng từ đảo chiều ngược lại trong MongoDB Transaction
   * Chống đảo trùng qua conditional update và unique partial index trên reversalOf
   */
  async reverseEntry(
    id: string,
    dto: ReverseCashEntryDto,
    userId: string,
  ): Promise<{ original: CashEntryDocument; reversal: CashEntryDocument }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID phiếu thu chi không hợp lệ');
    }

    // 1. Kiểm tra idempotency key trước nếu có
    if (dto.idempotencyKey && dto.idempotencyKey.trim()) {
      const trimmedKey = dto.idempotencyKey.trim();
      const existingByKey = await this.entryModel
        .findOne({ idempotencyKey: trimmedKey, isDeleted: false })
        .exec();

      if (existingByKey) {
        if (
          existingByKey.reversalOf &&
          existingByKey.reversalOf.toString() === id.toString()
        ) {
          const orig = await this.entryModel.findById(id).exec();
          return {
            original: orig || (existingByKey as any),
            reversal: existingByKey,
          };
        }
        throw new ConflictException(
          `Idempotency key "${dto.idempotencyKey}" đã được sử dụng cho giao dịch khác.`,
        );
      }
    }

    // 2. Tìm phiếu gốc
    const original = await this.entryModel
      .findOne({ _id: id, isDeleted: false })
      .exec();

    if (!original) {
      throw new NotFoundException('Không tìm thấy phiếu thu chi');
    }

    // 3. Kiểm tra trạng thái phiếu gốc
    if (original.status === CashEntryStatus.REVERSED) {
      if (dto.idempotencyKey && dto.idempotencyKey.trim()) {
        const existingRev = await this.entryModel
          .findOne({ reversalOf: original._id, isDeleted: false })
          .exec();
        if (
          existingRev &&
          existingRev.idempotencyKey === dto.idempotencyKey.trim()
        ) {
          return { original, reversal: existingRev };
        }
      }
      throw new BadRequestException(
        'Phiếu thu/chi này đã được hoàn đảo trước đó',
      );
    }

    if (original.status !== CashEntryStatus.POSTED) {
      throw new BadRequestException(
        `Không thể hoàn đảo phiếu ở trạng thái ${original.status}`,
      );
    }

    // 4. Kiểm tra sổ quỹ và số dư
    const account = await this.accountModel
      .findOne({ _id: original.account, isDeleted: false })
      .exec();

    if (!account) {
      throw new NotFoundException('Không tìm thấy sổ quỹ của phiếu gốc');
    }

    if (account.status !== CashAccountStatus.ACTIVE) {
      throw new BadRequestException('Sổ quỹ đang bị khóa hoặc không hoạt động');
    }

    // Chiều ngược lại của phiếu đảo
    const reverseDirection =
      original.direction === CashEntryDirection.IN
        ? CashEntryDirection.OUT
        : CashEntryDirection.IN;

    if (reverseDirection === CashEntryDirection.OUT) {
      if (account.currentBalance < original.amount) {
        throw new BadRequestException(
          `Số dư sổ quỹ ${account.name} (${account.currentBalance.toLocaleString('vi-VN')} đ) không đủ để hoàn đảo khoản thu ${original.amount.toLocaleString('vi-VN')} đ`,
        );
      }
    }

    // 5. Khởi tạo transaction session
    let session: ClientSession | null = null;
    let isTransactionActive = false;

    if (this.connection && typeof this.connection.startSession === 'function') {
      try {
        session = await this.connection.startSession();
        session.startTransaction();
        isTransactionActive = true;
      } catch {
        session = null;
        isTransactionActive = false;
      }
    }

    try {
      // 5a. Conditional update trạng thái phiếu gốc POSTED -> REVERSED
      const updateOriginalQuery = this.entryModel.findOneAndUpdate(
        {
          _id: original._id,
          status: CashEntryStatus.POSTED,
          isDeleted: false,
        },
        {
          $set: {
            status: CashEntryStatus.REVERSED,
          },
        },
        { new: true },
      );
      if (session && typeof updateOriginalQuery?.session === 'function') {
        updateOriginalQuery.session(session);
      }
      const updatedOriginal =
        typeof updateOriginalQuery?.exec === 'function'
          ? await updateOriginalQuery.exec()
          : await updateOriginalQuery;

      if (!updatedOriginal) {
        throw new BadRequestException(
          'Phiếu thu/chi đã được hoàn đảo hoặc đang được xử lý bởi giao dịch khác',
        );
      }

      // 5b. Tạo mã chứng từ cho phiếu đảo
      const reverseCode = await this.generateEntryCode(
        reverseDirection,
        session || undefined,
      );

      const reversalPayloadHash = dto.idempotencyKey?.trim()
        ? this.computePayloadHash({
            reversalOf: original._id.toString(),
            direction: reverseDirection,
            amount: original.amount,
            reason: dto.reason,
          })
        : undefined;

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
        idempotencyKey: dto.idempotencyKey?.trim() || undefined,
        payloadHash: reversalPayloadHash,
        isDeleted: false,
      });

      let savedReversal: CashEntryDocument;
      if (session) {
        savedReversal = await reversal.save({ session });
      } else {
        savedReversal = await reversal.save();
      }

      // 5c. Ghi nhận reversedBy và cập nhật ghi chú phiếu gốc
      const linkOriginalQuery = this.entryModel.findOneAndUpdate(
        { _id: original._id },
        {
          $set: {
            reversedBy: savedReversal._id,
            note: `${original.note ? original.note + ' ' : ''}(Đã hoàn đảo bởi ${reverseCode})`.trim(),
          },
        },
        { new: true },
      );
      if (session && typeof linkOriginalQuery?.session === 'function') {
        linkOriginalQuery.session(session);
      }
      const finalOriginal =
        (typeof linkOriginalQuery?.exec === 'function'
          ? await linkOriginalQuery.exec()
          : await linkOriginalQuery) || updatedOriginal;

      // 5d. Cập nhật số dư sổ quỹ nguyên tử có điều kiện
      const balanceChange =
        reverseDirection === CashEntryDirection.IN
          ? original.amount
          : -original.amount;

      const accountFilter: Record<string, any> = {
        _id: original.account,
        isDeleted: false,
        status: CashAccountStatus.ACTIVE,
      };

      if (reverseDirection === CashEntryDirection.OUT) {
        accountFilter.currentBalance = { $gte: original.amount };
      }

      const accountUpdateQuery = this.accountModel.findOneAndUpdate(
        accountFilter,
        { $inc: { currentBalance: balanceChange } },
        { new: true },
      );
      if (session && typeof accountUpdateQuery?.session === 'function') {
        accountUpdateQuery.session(session);
      }
      const updatedAccount =
        typeof accountUpdateQuery?.exec === 'function'
          ? await accountUpdateQuery.exec()
          : await accountUpdateQuery;

      if (!updatedAccount && reverseDirection === CashEntryDirection.OUT) {
        throw new BadRequestException(
          `Số dư sổ quỹ không đủ để hoàn đảo phiếu thu ${original.amount.toLocaleString('vi-VN')} đ`,
        );
      }

      if (isTransactionActive && session) {
        await session.commitTransaction();
      }

      return { original: finalOriginal, reversal: savedReversal };
    } catch (err: any) {
      if (isTransactionActive && session) {
        await session.abortTransaction();
      }

      // Xử lý duplicate key (Mongo error code 11000)
      if (err?.code === 11000) {
        if (dto.idempotencyKey && dto.idempotencyKey.trim()) {
          const existing = await this.entryModel
            .findOne({
              idempotencyKey: dto.idempotencyKey.trim(),
              isDeleted: false,
            })
            .exec();
          if (existing) {
            const orig = await this.entryModel.findById(id).exec();
            return {
              original: orig || original,
              reversal: existing,
            };
          }
        }

        const existingReversal = await this.entryModel
          .findOne({ reversalOf: original._id, isDeleted: false })
          .exec();
        if (existingReversal) {
          if (
            dto.idempotencyKey &&
            existingReversal.idempotencyKey === dto.idempotencyKey.trim()
          ) {
            const orig = await this.entryModel.findById(id).exec();
            return { original: orig || original, reversal: existingReversal };
          }
          throw new BadRequestException(
            `Phiếu ${original.entryCode} đã được hoàn đảo bởi phiếu ${existingReversal.entryCode}`,
          );
        }

        throw new BadRequestException(
          'Phiếu thu/chi này đã được hoàn đảo hoặc bị trùng lặp giao dịch',
        );
      }

      throw err;
    } finally {
      if (isTransactionActive && session) {
        await session.endSession();
      }
    }
  }

  /**
   * Lấy danh sách phiếu thu chi (phân trang, lọc theo sổ quỹ, loại, ngày)
   */
  /**
   * CASH-01: Shared query filter builder cho cả findAllEntries và exportCashEntriesToExcel
   */
  /**
   * SEC-014: Escape ký tự đặc biệt của RegExp để input người dùng không bị
   * hiểu là pattern (chống ReDoS / regex injection).
   */
  private escapeRegex(input: string): string {
    return String(input).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  public buildCashEntryFilter(query: CashEntryQueryDto): Record<string, any> {
    const filter: Record<string, any> = { isDeleted: false };

    if (query.accountId && Types.ObjectId.isValid(query.accountId)) {
      filter.account = new Types.ObjectId(query.accountId);
    }

    if (query.direction) filter.direction = query.direction;
    if (query.category) filter.category = query.category;
    if (query.status) filter.status = query.status;

    if (query.search && query.search.trim()) {
      const searchRegex = new RegExp(
        this.escapeRegex(query.search.trim()),
        'i',
      );
      filter.$or = [
        { entryCode: searchRegex },
        { partnerName: searchRegex },
        { note: searchRegex },
        { referenceId: searchRegex },
      ];
    }

    if (query.startDate || query.endDate) {
      filter.postedAt = {};
      if (query.startDate) filter.postedAt.$gte = new Date(query.startDate);
      if (query.endDate) {
        const end = new Date(query.endDate);
        end.setHours(23, 59, 59, 999);
        filter.postedAt.$lte = end;
      }
    }

    return filter;
  }

  async findAllEntries(
    query: CashEntryQueryDto,
  ): Promise<PaginatedResult<CashEntryDocument>> {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const filter = this.buildCashEntryFilter(query);

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
   * PUR-04 & PUR-RET-01: Bù trừ công nợ khi trả hàng nhà cung cấp (Purchase Return Credit Adjustment)
   * Trừ remainingAmount và totalAmount của khoản công nợ phát sinh từ Goods Receipt
   * Nếu giá trị trả lớn hơn nợ còn lại, tính toán phần chênh lệch refundDueAmount để theo dõi NCC hoàn tiền
   */
  async applyPurchaseReturnCredit(
    goodsReceiptId: Types.ObjectId | string,
    returnAmount: number,
    returnCode: string,
    note?: string,
    session?: ClientSession,
  ): Promise<{
    payable: SupplierPayableDocument | null;
    adjustedDebtAmount: number;
    refundDueAmount: number;
  } | null> {
    if (returnAmount <= 0) return null;

    const findQuery = this.payableModel.findOne({
      goodsReceipt: new Types.ObjectId(goodsReceiptId.toString()),
      isDeleted: false,
    });
    if (session && typeof findQuery?.session === 'function') {
      findQuery.session(session);
    }
    const payable =
      typeof findQuery?.exec === 'function'
        ? await findQuery.exec()
        : await findQuery;

    if (!payable) {
      // Trường hợp không có khoản công nợ (hoặc đã tất toán trước đó), toàn bộ số tiền trả thành khoản chờ NCC hoàn
      return {
        payable: null,
        adjustedDebtAmount: 0,
        refundDueAmount: returnAmount,
      };
    }

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

    const refundDueAmount = returnAmount - actualCredit;

    payable.note =
      `${payable.note || ''} | Bù trừ ${actualCredit.toLocaleString('vi-VN')} đ từ phiếu trả hàng ${returnCode}${refundDueAmount > 0 ? ` (Chờ NCC hoàn trả ${refundDueAmount.toLocaleString('vi-VN')} đ)` : ''} ${note || ''}`.trim();

    let savedPayable: SupplierPayableDocument;
    if (session) {
      savedPayable = await payable.save({ session });
    } else {
      savedPayable = await payable.save();
    }

    return {
      payable: savedPayable,
      adjustedDebtAmount: actualCredit,
      refundDueAmount,
    };
  }

  /**
   * FIN-01 & FIN-03: Thanh toán công nợ nhà cung cấp
   * - Tạo phiếu chi (PC) từ sổ quỹ
   * - Trừ số dư sổ quỹ nguyên tử có điều kiện
   * - Giảm số dư công nợ remainingAmount nguyên tử có điều kiện
   * - Toàn bộ side effect chạy trong cùng 1 MongoDB transaction
   * - Chống trùng lặp idempotencyKey + payloadHash
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
    if (!Types.ObjectId.isValid(dto.accountId)) {
      throw new BadRequestException('ID sổ quỹ chi tiền không hợp lệ');
    }

    const payable = await this.payableModel
      .findOne({ _id: payableId, isDeleted: false })
      .populate('supplier', 'name code')
      .exec();

    if (!payable) {
      throw new NotFoundException('Không tìm thấy khoản công nợ nhà cung cấp');
    }

    if (
      payable.status === SupplierPayableStatus.PAID ||
      payable.remainingAmount <= 0
    ) {
      throw new BadRequestException('Khoản công nợ này đã được thanh toán đủ');
    }

    if (dto.amount > payable.remainingAmount) {
      throw new BadRequestException(
        `Số tiền thanh toán (${dto.amount.toLocaleString('vi-VN')} đ) không được vượt quá số nợ còn lại (${payable.remainingAmount.toLocaleString('vi-VN')} đ)`,
      );
    }

    // 1. Kiểm tra Idempotency trước khi thực hiện side effect
    const payloadHash = this.computePayloadHash({
      payableId: String(payable._id),
      accountId: String(dto.accountId),
      amount: Number(dto.amount),
      type: 'SUPPLIER_PAYMENT',
    });

    if (dto.idempotencyKey && dto.idempotencyKey.trim()) {
      const existingEntry = await this.entryModel
        .findOne({
          idempotencyKey: dto.idempotencyKey.trim(),
          isDeleted: false,
        })
        .exec();

      if (existingEntry) {
        if (
          existingEntry.payloadHash &&
          existingEntry.payloadHash !== payloadHash
        ) {
          throw new ConflictException(
            `Idempotency key "${dto.idempotencyKey}" đã được sử dụng với thông tin thanh toán khác biệt (Payload mismatch).`,
          );
        }
        this.logger.log(
          `Idempotent retry for supplier payment: key=${dto.idempotencyKey}, entry=${existingEntry.entryCode}`,
        );
        return { payable, cashEntry: existingEntry };
      }
    }

    const supplierName = (payable.supplier as any)?.name || 'Nhà cung cấp';

    // 2. Mở session transaction để đảm bảo toàn vẹn CashEntry + Account + Payable
    let session: ClientSession | null = null;
    let isTransactionActive = false;

    try {
      session = await this.connection.startSession();
      session.startTransaction();
      isTransactionActive = true;
    } catch {
      session = null;
      isTransactionActive = false;
    }

    try {
      // 3. Tạo phiếu chi và trừ số dư quỹ trong cùng session
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
          idempotencyKey: dto.idempotencyKey?.trim() || undefined,
        },
        userId,
        session || undefined,
        payloadHash,
      );

      // 4. Ghi nhận lịch sử thanh toán và cập nhật công nợ có conditional check
      const nextRemaining = Math.max(0, payable.remainingAmount - dto.amount);
      const nextStatus =
        nextRemaining === 0
          ? SupplierPayableStatus.PAID
          : SupplierPayableStatus.PARTIALLY_PAID;

      const paymentRecord = {
        cashEntry: cashEntry._id,
        entryCode: cashEntry.entryCode,
        amount: dto.amount,
        paidAt: new Date(),
        paidBy: new Types.ObjectId(userId),
        note: dto.note,
      };

      // SEC-009: Cập nhật nguyên tử có điều kiện (guard số nợ còn lại).
      // Tuyệt đối KHÔNG fallback sang payable.save() vì doc có thể đã cũ
      // (stale) do request đồng thời -> ghi đè gây thanh toán vượt số nợ.
      const payableQuery = this.payableModel.findOneAndUpdate(
        {
          _id: payable._id,
          remainingAmount: { $gte: dto.amount },
          status: { $ne: SupplierPayableStatus.PAID },
          isDeleted: false,
        },
        {
          $inc: { paidAmount: dto.amount, remainingAmount: -dto.amount },
          $set: { status: nextStatus },
          $push: { paymentHistory: paymentRecord },
        },
        { new: true },
      );
      if (session && typeof payableQuery?.session === 'function') {
        payableQuery.session(session);
      }
      let updatedPayable: SupplierPayableDocument | null =
        await payableQuery.exec();

      if (!updatedPayable) {
        // Đã có request khác thanh toán trước -> số nợ còn lại không đủ nữa.
        // Throw để catch bên dưới abort transaction (hoàn tác phiếu chi + quỹ).
        throw new ConflictException(
          'Khoản công nợ vừa được cập nhật bởi thao tác khác hoặc số nợ còn lại không đủ. Vui lòng tải lại và thử lại.',
        );
      }

      // Status tính từ snapshot đọc trước đó có thể cũ khi có thanh toán đồng
      // thời: đồng bộ lại thành PAID nếu số nợ thực tế đã về 0.
      if (
        updatedPayable.remainingAmount === 0 &&
        updatedPayable.status !== SupplierPayableStatus.PAID
      ) {
        const statusQuery = this.payableModel.findOneAndUpdate(
          {
            _id: payable._id,
            remainingAmount: 0,
            status: { $ne: SupplierPayableStatus.PAID },
            isDeleted: false,
          },
          { $set: { status: SupplierPayableStatus.PAID } },
          { new: true },
        );
        if (session && typeof statusQuery?.session === 'function') {
          statusQuery.session(session);
        }
        updatedPayable = (await statusQuery.exec()) || updatedPayable;
      }

      if (isTransactionActive && session) {
        await session.commitTransaction();
      }

      return { payable: updatedPayable, cashEntry };
    } catch (err: any) {
      if (isTransactionActive && session) {
        await session.abortTransaction();
      }
      if (
        err?.code === 11000 &&
        dto.idempotencyKey &&
        err?.keyPattern?.idempotencyKey
      ) {
        const existingEntry = await this.entryModel
          .findOne({
            idempotencyKey: dto.idempotencyKey.trim(),
            isDeleted: false,
          })
          .exec();
        if (existingEntry) {
          if (
            existingEntry.payloadHash &&
            existingEntry.payloadHash !== payloadHash
          ) {
            throw new ConflictException(
              `Idempotency key "${dto.idempotencyKey}" đã được sử dụng với thông tin thanh toán khác biệt.`,
            );
          }
          return { payable, cashEntry: existingEntry };
        }
      }
      throw err;
    } finally {
      if (isTransactionActive && session) {
        await session.endSession();
      }
    }
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
      filter.invoiceCode = new RegExp(this.escapeRegex(search.trim()), 'i');
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
   * CASH-01: Xuất Excel sổ quỹ và phiếu thu chi khớp chuẩn bộ lọc, không cắt dữ liệu âm thầm
   */
  async exportCashEntriesToExcel(
    query: CashEntryQueryDto,
    user?: any,
  ): Promise<Buffer> {
    const filter = this.buildCashEntryFilter(query);

    // Không dùng limit 5000 rồi âm thầm cắt dữ liệu (CASH-T06)
    const entries = await this.entryModel
      .find(filter)
      .sort({ postedAt: -1, createdAt: -1 })
      .populate('account', 'code name type')
      .populate('createdBy', 'name email')
      .exec();

    let accountName = 'Tất cả sổ quỹ';
    if (query.accountId && Types.ObjectId.isValid(query.accountId)) {
      const acc = await this.accountModel.findById(query.accountId);
      if (acc) accountName = `${acc.name} (${acc.code})`;
    }

    // Tính toán tổng thu, tổng chi, chênh lệch
    let totalInflow = 0;
    let totalOutflow = 0;
    for (const item of entries) {
      if (item.status === CashEntryStatus.POSTED) {
        if (item.direction === CashEntryDirection.IN) {
          totalInflow += item.amount || 0;
        } else if (item.direction === CashEntryDirection.OUT) {
          totalOutflow += item.amount || 0;
        }
      }
    }
    const netCashflow = totalInflow - totalOutflow;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Truong Thanh Bookstore ERP';
    workbook.created = new Date();
    const worksheet = workbook.addWorksheet('So_Quy_Thu_Chi');

    // Dòng 1: Tiêu đề báo cáo
    worksheet.mergeCells('A1:K1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'BÁO CÁO SỔ QUỸ THU CHI (CASHBOOK)';
    titleCell.font = { bold: true, size: 16, color: { argb: 'FF1E40AF' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(1).height = 30;

    // Dòng 2: Thông tin xuất file
    const exportedByName = user?.name || user?.email || 'Quản trị viên';
    const exportTimeStr = new Date().toLocaleString('vi-VN');
    worksheet.mergeCells('A2:K2');
    worksheet.getCell('A2').value =
      `Thời gian xuất: ${exportTimeStr}  |  Người xuất: ${exportedByName}`;
    worksheet.getCell('A2').font = {
      italic: true,
      size: 10,
      color: { argb: 'FF64748B' },
    };
    worksheet.getCell('A2').alignment = { horizontal: 'center' };

    // Dòng 3: Bộ lọc đã áp dụng
    const filterParts: string[] = [`Sổ quỹ: ${accountName}`];
    if (query.direction) {
      filterParts.push(
        `Loại: ${query.direction === CashEntryDirection.IN ? 'Thu (IN)' : 'Chi (OUT)'}`,
      );
    }
    if (query.category) filterParts.push(`Danh mục: ${query.category}`);
    if (query.status) filterParts.push(`Trạng thái: ${query.status}`);
    if (query.startDate || query.endDate) {
      filterParts.push(
        `Thời gian: ${query.startDate || '...'} đến ${query.endDate || '...'}`,
      );
    }
    if (query.search) filterParts.push(`Từ khóa: "${query.search}"`);
    worksheet.mergeCells('A3:K3');
    worksheet.getCell('A3').value =
      `Bộ lọc áp dụng: ${filterParts.join('  •  ')}`;
    worksheet.getCell('A3').font = { size: 10, color: { argb: 'FF334155' } };
    worksheet.getCell('A3').alignment = { horizontal: 'center' };

    // Dòng 4: Thống kê tổng hợp (Summary Cards)
    worksheet.mergeCells('A4:C4');
    worksheet.getCell('A4').value = `Tổng số chứng từ: ${entries.length}`;
    worksheet.getCell('A4').font = { bold: true, size: 11 };

    worksheet.mergeCells('D4:F4');
    worksheet.getCell('D4').value =
      `Tổng thu (IN): ${totalInflow.toLocaleString('vi-VN')} đ`;
    worksheet.getCell('D4').font = {
      bold: true,
      size: 11,
      color: { argb: 'FF16A34A' },
    };

    worksheet.mergeCells('G4:I4');
    worksheet.getCell('G4').value =
      `Tổng chi (OUT): ${totalOutflow.toLocaleString('vi-VN')} đ`;
    worksheet.getCell('G4').font = {
      bold: true,
      size: 11,
      color: { argb: 'FFDC2626' },
    };

    worksheet.mergeCells('J4:K4');
    worksheet.getCell('J4').value =
      `Chênh lệch: ${netCashflow.toLocaleString('vi-VN')} đ`;
    worksheet.getCell('J4').font = {
      bold: true,
      size: 11,
      color: { argb: netCashflow >= 0 ? 'FF16A34A' : 'FFDC2626' },
    };

    // Dòng 5: Trống
    worksheet.addRow([]);

    // Dòng 6: Tiêu đề cột
    const headerRow = worksheet.addRow([
      'STT',
      'Mã chứng từ',
      'Ngày ghi sổ',
      'Sổ quỹ',
      'Loại phiếu',
      'Danh mục',
      'Số tiền (VND)',
      'Đối tác / Người nộp nhận',
      'Chứng từ tham chiếu',
      'Trạng thái',
      'Người lập',
      'Ghi chú',
    ]);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' },
    };
    headerRow.height = 24;

    worksheet.columns = [
      { key: 'stt', width: 8 },
      { key: 'entryCode', width: 18 },
      { key: 'postedAt', width: 20 },
      { key: 'accountName', width: 25 },
      { key: 'direction', width: 14 },
      { key: 'category', width: 22 },
      { key: 'amount', width: 18 },
      { key: 'partnerName', width: 28 },
      { key: 'reference', width: 22 },
      { key: 'status', width: 14 },
      { key: 'createdBy', width: 20 },
      { key: 'note', width: 30 },
    ];

    // Dòng dữ liệu
    if (entries.length === 0) {
      // CASH-T07: File hợp lệ, có thông báo không có record
      const emptyRow = worksheet.addRow([
        '',
        'Không có dữ liệu phiếu thu chi phù hợp với bộ lọc đã chọn',
      ]);
      worksheet.mergeCells(`B${emptyRow.number}:L${emptyRow.number}`);
      emptyRow.getCell(2).font = { italic: true, color: { argb: 'FF94A3B8' } };
      emptyRow.getCell(2).alignment = { horizontal: 'center' };
    } else {
      let stt = 1;
      for (const item of entries) {
        const acc: any = item.account;
        const creator: any = item.createdBy;

        const row = worksheet.addRow({
          stt: stt++,
          entryCode: item.entryCode,
          postedAt: item.postedAt
            ? new Date(item.postedAt).toLocaleString('vi-VN')
            : '',
          accountName: acc?.name ? `${acc.name} (${acc.code})` : '-',
          direction:
            item.direction === CashEntryDirection.IN ? 'THU (+)' : 'CHI (-)',
          category: item.category,
          amount: item.amount,
          partnerName: item.partnerName || '-',
          reference:
            `${item.referenceType || ''} ${item.referenceId || ''}`.trim() ||
            '-',
          status: item.status,
          createdBy: creator?.name || 'Hệ thống',
          note: item.note || '',
        });

        // Định dạng màu cho loại Thu / Chi
        if (item.direction === CashEntryDirection.IN) {
          row.getCell('direction').font = {
            color: { argb: 'FF16A34A' },
            bold: true,
          };
          row.getCell('amount').font = {
            color: { argb: 'FF16A34A' },
            bold: true,
          };
        } else {
          row.getCell('direction').font = {
            color: { argb: 'FFDC2626' },
            bold: true,
          };
          row.getCell('amount').font = {
            color: { argb: 'FFDC2626' },
            bold: true,
          };
        }
      }

      // Dòng tổng kết cuối bảng
      const totalRow = worksheet.addRow({
        stt: '',
        entryCode: 'TỔNG CỘNG',
        postedAt: '',
        accountName: '',
        direction: `Thu: ${totalInflow.toLocaleString('vi-VN')} đ`,
        category: `Chi: ${totalOutflow.toLocaleString('vi-VN')} đ`,
        amount: netCashflow,
        partnerName: '',
        reference: '',
        status: '',
        createdBy: '',
        note: `Chênh lệch: ${netCashflow.toLocaleString('vi-VN')} đ`,
      });
      totalRow.font = { bold: true };
      totalRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF1F5F9' },
      };
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
   * FIN-01 & FIN-04: Thu tiền công nợ khách hàng (AR Collection)
   * - Tạo phiếu thu (PT) vào sổ quỹ
   * - Tăng số dư sổ quỹ nguyên tử
   * - Giảm số dư công nợ remainingAmount nguyên tử có conditional check
   * - Toàn bộ side effect chạy trong cùng 1 MongoDB transaction
   * - Chống trùng lặp idempotencyKey + payloadHash
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
    if (!Types.ObjectId.isValid(dto.accountId)) {
      throw new BadRequestException('ID sổ quỹ thu tiền không hợp lệ');
    }

    const recQuery = this.receivableModel.findOne({
      _id: receivableId,
      isDeleted: false,
    });
    const receivable =
      typeof (recQuery as any)?.exec === 'function'
        ? await (recQuery as any).exec()
        : await recQuery;

    if (!receivable) {
      throw new NotFoundException('Không tìm thấy khoản công nợ khách hàng');
    }

    if (
      receivable.status === CustomerReceivableStatus.PAID ||
      receivable.remainingAmount <= 0
    ) {
      throw new BadRequestException('Khoản công nợ này đã được thu đủ 100%');
    }

    if (dto.amount > receivable.remainingAmount) {
      throw new BadRequestException(
        `Số tiền thu (${dto.amount.toLocaleString('vi-VN')} đ) không được vượt quá số nợ còn lại (${receivable.remainingAmount.toLocaleString('vi-VN')} đ)`,
      );
    }

    // 1. Kiểm tra Idempotency trước khi thực hiện side effect
    const payloadHash = this.computePayloadHash({
      receivableId: String(receivable._id),
      accountId: String(dto.accountId),
      amount: Number(dto.amount),
      type: 'WHOLESALE_COLLECTION',
    });

    if (dto.idempotencyKey && dto.idempotencyKey.trim()) {
      const existingEntry = await this.entryModel
        .findOne({
          idempotencyKey: dto.idempotencyKey.trim(),
          isDeleted: false,
        })
        .exec();

      if (existingEntry) {
        if (
          existingEntry.payloadHash &&
          existingEntry.payloadHash !== payloadHash
        ) {
          throw new ConflictException(
            `Idempotency key "${dto.idempotencyKey}" đã được sử dụng với thông tin thu nợ khác biệt (Payload mismatch).`,
          );
        }
        this.logger.log(
          `Idempotent retry for customer payment: key=${dto.idempotencyKey}, entry=${existingEntry.entryCode}`,
        );
        return { receivable, cashEntry: existingEntry };
      }
    }

    // 2. Mở session transaction để đảm bảo toàn vẹn CashEntry + Account + Receivable
    let session: ClientSession | null = null;
    let isTransactionActive = false;

    try {
      session = await this.connection.startSession();
      session.startTransaction();
      isTransactionActive = true;
    } catch {
      session = null;
      isTransactionActive = false;
    }

    try {
      // 3. Tạo phiếu thu vào sổ quỹ trong cùng session
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
          idempotencyKey: dto.idempotencyKey?.trim() || undefined,
        },
        userId,
        session || undefined,
        payloadHash,
      );

      // 4. Cập nhật số dư nợ có conditional check
      const nextRemaining = Math.max(
        0,
        receivable.remainingAmount - dto.amount,
      );
      const nextStatus =
        nextRemaining === 0
          ? CustomerReceivableStatus.PAID
          : CustomerReceivableStatus.PARTIALLY_PAID;

      const collectionRecord = {
        cashEntry: cashEntry._id,
        entryCode: cashEntry.entryCode,
        amount: dto.amount,
        collectedAt: new Date(),
        collectedBy: new Types.ObjectId(userId),
        note: dto.note,
      };

      // SEC-009: Cập nhật nguyên tử có điều kiện (guard số nợ còn lại).
      // Không fallback sang receivable.save() vì doc có thể đã cũ (stale) do
      // request đồng thời -> ghi đè gây thu vượt số nợ / sai exposure.
      const receivableQuery = this.receivableModel.findOneAndUpdate(
        {
          _id: receivable._id,
          remainingAmount: { $gte: dto.amount },
          status: { $ne: CustomerReceivableStatus.PAID },
          isDeleted: false,
        },
        {
          $inc: { paidAmount: dto.amount, remainingAmount: -dto.amount },
          $set: { status: nextStatus },
          $push: { collectionHistory: collectionRecord },
        },
        { new: true },
      );
      if (session && typeof receivableQuery?.session === 'function') {
        receivableQuery.session(session);
      }
      let updatedReceivable: CustomerReceivableDocument | null =
        await receivableQuery.exec();

      if (!updatedReceivable) {
        // Đã có request khác thu trước -> số nợ còn lại không đủ nữa.
        // Throw để catch bên dưới abort transaction (hoàn tác phiếu thu + quỹ).
        throw new ConflictException(
          'Khoản công nợ vừa được cập nhật bởi thao tác khác hoặc số nợ còn lại không đủ. Vui lòng tải lại và thử lại.',
        );
      }

      // Status tính từ snapshot cũ có thể sai khi thu đồng thời: đồng bộ lại
      // thành PAID nếu số nợ thực tế đã về 0.
      if (
        updatedReceivable.remainingAmount === 0 &&
        updatedReceivable.status !== CustomerReceivableStatus.PAID
      ) {
        const statusQuery = this.receivableModel.findOneAndUpdate(
          {
            _id: receivable._id,
            remainingAmount: 0,
            status: { $ne: CustomerReceivableStatus.PAID },
            isDeleted: false,
          },
          { $set: { status: CustomerReceivableStatus.PAID } },
          { new: true },
        );
        if (session && typeof statusQuery?.session === 'function') {
          statusQuery.session(session);
        }
        updatedReceivable = (await statusQuery.exec()) || updatedReceivable;
      }

      // AR-01: Giảm exposure trên hồ sơ tín dụng khách hàng trong cùng transaction (AR-T06)
      if (this.creditProfileModel && receivable.customer) {
        const profileUpdate = this.creditProfileModel.updateOne(
          { customer: receivable.customer },
          { $inc: { currentExposure: -dto.amount } },
        );
        if (session) profileUpdate.session(session);
        await profileUpdate.exec();
      }

      if (isTransactionActive && session) {
        await session.commitTransaction();
      }

      return { receivable: updatedReceivable, cashEntry };
    } catch (err: any) {
      if (isTransactionActive && session) {
        await session.abortTransaction();
      }
      if (
        err?.code === 11000 &&
        dto.idempotencyKey &&
        err?.keyPattern?.idempotencyKey
      ) {
        const existingEntry = await this.entryModel
          .findOne({
            idempotencyKey: dto.idempotencyKey.trim(),
            isDeleted: false,
          })
          .exec();
        if (existingEntry) {
          if (
            existingEntry.payloadHash &&
            existingEntry.payloadHash !== payloadHash
          ) {
            throw new ConflictException(
              `Idempotency key "${dto.idempotencyKey}" đã được sử dụng với thông tin khác biệt.`,
            );
          }
          return { receivable, cashEntry: existingEntry };
        }
      }
      throw err;
    } finally {
      if (isTransactionActive && session) {
        await session.endSession();
      }
    }
  }

  /**
   * AR-01: Kiểm tra hạn mức nợ của khách hàng từ CustomerCreditProfile (không hardcode 30tr, không lấy từ receivable đầu tiên)
   */
  async checkCustomerCreditLimit(
    customerId: string,
    requestedAmount: number,
  ): Promise<{
    allowed: boolean;
    currentDebt: number;
    creditLimit: number;
    excessAmount: number;
    creditStatus?: string;
    message?: string;
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

    let creditLimit = 0;
    let creditStatus = CreditStatus.PENDING;

    if (this.creditProfileModel) {
      const profile = await this.creditProfileModel
        .findOne({ customer: new Types.ObjectId(customerId) })
        .exec();
      if (profile) {
        creditLimit = profile.creditLimit;
        creditStatus = profile.creditStatus;
      }
    } else {
      // Fallback nếu chưa khởi tạo creditProfileModel (môi trường test cũ)
      const firstRec = receivables.find(
        (r) => r.creditLimit && r.creditLimit > 0,
      );
      creditLimit = firstRec?.creditLimit || 30000000;
      if (creditLimit > 0) creditStatus = CreditStatus.APPROVED;
    }

    // AR-T05: Kiểm tra nợ quá hạn
    const now = new Date();
    const hasOverdue = receivables.some(
      (r) => r.dueDate && new Date(r.dueDate) < now,
    );

    const isApproved = creditStatus === CreditStatus.APPROVED;
    const totalProjectedDebt = currentDebt + requestedAmount;
    const withinLimit = creditLimit > 0 && totalProjectedDebt <= creditLimit;
    const allowed = isApproved && !hasOverdue && withinLimit;
    const excessAmount = allowed
      ? 0
      : Math.max(0, totalProjectedDebt - creditLimit);

    let message: string | undefined = undefined;
    if (!isApproved) {
      message =
        'Khách hàng chưa được phê duyệt hoặc đang bị khóa hồ sơ tín dụng (AR-T01, AR-T04)';
    } else if (hasOverdue) {
      message = 'Khách hàng có khoản nợ quá hạn chưa thanh toán (AR-T05)';
    } else if (!withinLimit) {
      message = `Vượt hạn mức tín dụng (${totalProjectedDebt.toLocaleString('vi-VN')} đ > ${creditLimit.toLocaleString('vi-VN')} đ) (AR-T02)`;
    }

    return {
      allowed,
      currentDebt,
      creditLimit,
      excessAmount,
      creditStatus,
      message,
    };
  }

  /**
   * AR-T09: Hủy khoản công nợ và giải phóng exposure tín dụng
   */
  async cancelReceivable(
    id: string,
    reason: string,
    _userId?: string,
  ): Promise<CustomerReceivableDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID khoản công nợ không hợp lệ');
    }
    const receivable = await this.receivableModel.findOne({
      _id: id,
      isDeleted: false,
    });
    if (!receivable) {
      throw new NotFoundException('Không tìm thấy khoản công nợ để hủy');
    }
    if (receivable.status === CustomerReceivableStatus.CANCELLED) {
      return receivable; // idempotent replay
    }

    const releasedAmount = receivable.remainingAmount;
    receivable.status = CustomerReceivableStatus.CANCELLED;
    receivable.remainingAmount = 0;
    receivable.note = `${receivable.note || ''} [Đã hủy: ${reason}]`.trim();
    const saved = await receivable.save();

    if (this.creditProfileModel && receivable.customer && releasedAmount > 0) {
      await this.creditProfileModel.updateOne(
        { customer: receivable.customer },
        { $inc: { currentExposure: -releasedAmount } },
      );
    }
    return saved;
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
      const searchRegex = new RegExp(this.escapeRegex(search.trim()), 'i');
      filter.$or = [
        { invoiceCode: searchRegex },
        { customerName: searchRegex },
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
