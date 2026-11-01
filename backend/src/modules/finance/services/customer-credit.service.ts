import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection, Types, ClientSession } from 'mongoose';
import * as ExcelJS from 'exceljs';
import {
  CustomerCreditProfile,
  CustomerCreditProfileDocument,
  CreditStatus,
} from '../schemas/customer-credit-profile.schema';
import {
  CustomerReceivable,
  CustomerReceivableDocument,
  CustomerReceivableStatus,
} from '../schemas/customer-receivable.schema';
import { User, UserDocument } from '../../users/schemas/user.schema';
import {
  CreateCustomerCreditProfileDto,
  UpdateCustomerCreditProfileDto,
  CustomerCreditProfileQueryDto,
  AgingReportQueryDto,
} from '../dto/customer-credit.dto';
import { PaginatedResult, paginate } from '../../../common/dto/pagination.dto';
import { StaffPermission, UserRole } from '../../../common/enums';

export interface AgingBucketSummary {
  totalRemaining: number;
  current: number;
  overdue1to30: number;
  overdue31to60: number;
  overdue61to90: number;
  overdueOver90: number;
  totalOverdue: number;
}

export interface AgingReportItem {
  receivableId: string;
  invoiceCode: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate: Date;
  daysOverdue: number;
  bucket:
    | 'CURRENT'
    | 'OVERDUE_1_30'
    | 'OVERDUE_31_60'
    | 'OVERDUE_61_90'
    | 'OVERDUE_OVER_90';
}

@Injectable()
export class CustomerCreditService {
  private readonly logger = new Logger(CustomerCreditService.name);

  constructor(
    @InjectModel(CustomerCreditProfile.name)
    private readonly creditProfileModel: Model<CustomerCreditProfileDocument>,
    @InjectModel(CustomerReceivable.name)
    private readonly receivableModel: Model<CustomerReceivableDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectConnection()
    private readonly connection: Connection,
  ) {}

  /**
   * Tạo hồ sơ tín dụng cho khách hàng (mặc định PENDING nếu chưa duyệt)
   */
  async createProfile(
    dto: CreateCustomerCreditProfileDto,
    userId: string,
    userName: string,
  ): Promise<CustomerCreditProfileDocument> {
    if (!Types.ObjectId.isValid(dto.customerId)) {
      throw new BadRequestException('ID khách hàng không hợp lệ');
    }

    const existing = await this.creditProfileModel
      .findOne({ customer: new Types.ObjectId(dto.customerId) })
      .exec();

    if (existing) {
      throw new ConflictException(
        `Khách hàng "${dto.customerName}" đã có hồ sơ tín dụng trên hệ thống.`,
      );
    }

    const initialStatus = dto.creditStatus || CreditStatus.PENDING;
    const initialLimit = dto.creditLimit || 0;

    const profile = new this.creditProfileModel({
      customer: new Types.ObjectId(dto.customerId),
      customerName: dto.customerName.trim(),
      customerPhone: dto.customerPhone?.trim(),
      creditLimit: initialLimit,
      currentExposure: 0,
      creditStatus: initialStatus,
      paymentTermDays: dto.paymentTermDays || 30,
      approvedBy:
        initialStatus === CreditStatus.APPROVED
          ? new Types.ObjectId(userId)
          : undefined,
      approvedAt:
        initialStatus === CreditStatus.APPROVED ? new Date() : undefined,
      creditNote: dto.creditNote,
      auditHistory: [
        {
          oldCreditLimit: 0,
          newCreditLimit: initialLimit,
          oldStatus: CreditStatus.PENDING,
          newStatus: initialStatus,
          changedBy: new Types.ObjectId(userId),
          changedByName: userName,
          reason: dto.reason || 'Khởi tạo hồ sơ tín dụng khách hàng',
          changedAt: new Date(),
        },
      ],
    });

    return await profile.save();
  }

  /**
   * Cập nhật hạn mức hoặc trạng thái tín dụng (bắt buộc audit log và phân quyền - AR-T12, AR-T13)
   */
  async updateProfile(
    customerId: string,
    dto: UpdateCustomerCreditProfileDto,
    user: {
      _id: string;
      role?: string;
      permissions?: string[];
      fullName?: string;
    },
  ): Promise<CustomerCreditProfileDocument> {
    if (!Types.ObjectId.isValid(customerId)) {
      throw new BadRequestException('ID khách hàng không hợp lệ');
    }

    // AR-T12: Kiểm tra phân quyền sửa hạn mức tín dụng
    const isAuthorized =
      user.role === UserRole.ADMIN ||
      user.role === UserRole.SUPER_ADMIN ||
      (Array.isArray(user.permissions) &&
        user.permissions.includes(StaffPermission.MANAGE_FINANCE));

    if (!isAuthorized) {
      throw new ForbiddenException(
        'Bạn không có quyền điều chỉnh hạn mức công nợ hoặc trạng thái tín dụng (AR-T12).',
      );
    }

    const profile = await this.creditProfileModel
      .findOne({ customer: new Types.ObjectId(customerId) })
      .exec();

    if (!profile) {
      throw new NotFoundException(
        'Không tìm thấy hồ sơ tín dụng của khách hàng này',
      );
    }

    const oldLimit = profile.creditLimit;
    const oldStatus = profile.creditStatus;
    const newLimit = dto.creditLimit !== undefined ? dto.creditLimit : oldLimit;
    const newStatus = dto.creditStatus || oldStatus;

    // AR-T13: Ghi nhận audit log lịch sử thay đổi
    profile.auditHistory.push({
      oldCreditLimit: oldLimit,
      newCreditLimit: newLimit,
      oldStatus,
      newStatus,
      changedBy: new Types.ObjectId(user._id),
      changedByName: user.fullName || 'Người quản lý',
      reason: dto.reason,
      changedAt: new Date(),
    });

    profile.creditLimit = newLimit;
    profile.creditStatus = newStatus;
    if (dto.paymentTermDays) profile.paymentTermDays = dto.paymentTermDays;
    if (dto.creditNote !== undefined) profile.creditNote = dto.creditNote;
    profile.approvedBy = new Types.ObjectId(user._id);
    profile.approvedAt = new Date();

    return await profile.save();
  }

  /**
   * Tra cứu hồ sơ tín dụng theo customerId
   */
  async getProfile(
    customerId: string,
  ): Promise<CustomerCreditProfileDocument | null> {
    if (!Types.ObjectId.isValid(customerId)) {
      throw new BadRequestException('ID khách hàng không hợp lệ');
    }
    return await this.creditProfileModel
      .findOne({ customer: new Types.ObjectId(customerId) })
      .populate('customer', 'fullName email phone')
      .populate('approvedBy', 'fullName email')
      .exec();
  }

  /**
   * Lấy danh sách hồ sơ tín dụng (phân trang, lọc)
   */
  async findAllProfiles(
    query: CustomerCreditProfileQueryDto,
  ): Promise<PaginatedResult<CustomerCreditProfileDocument>> {
    const { page = 1, limit = 20, creditStatus, search } = query;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};
    if (creditStatus) filter.creditStatus = creditStatus;
    if (search && search.trim()) {
      filter.$or = [
        { customerName: new RegExp(search.trim(), 'i') },
        { customerPhone: new RegExp(search.trim(), 'i') },
      ];
    }

    const [items, total] = await Promise.all([
      this.creditProfileModel
        .find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('customer', 'fullName email phone')
        .populate('approvedBy', 'fullName email')
        .exec(),
      this.creditProfileModel.countDocuments(filter).exec(),
    ]);

    return paginate(items, total, page, limit);
  }

  /**
   * AR-01: Kiểm tra tính hợp lệ khi bán chịu nợ
   * - Khách hàng phải có hồ sơ APPROVED (AR-T01, AR-T04)
   * - Không có nợ quá hạn (AR-T05)
   * - Dư nợ mới không vượt hạn mức (AR-T02, AR-T03)
   */
  async checkCreditEligibility(
    customerId: string,
    requestedAmount: number,
  ): Promise<{
    eligible: boolean;
    profile: CustomerCreditProfileDocument;
    dueDate: Date;
  }> {
    if (!Types.ObjectId.isValid(customerId)) {
      throw new BadRequestException('ID khách hàng không hợp lệ');
    }

    const profile = await this.creditProfileModel
      .findOne({ customer: new Types.ObjectId(customerId) })
      .exec();

    // AR-T01: Khách mới chưa được duyệt credit
    if (!profile || profile.creditStatus === CreditStatus.PENDING) {
      throw new BadRequestException(
        'Khách hàng chưa được phê duyệt hồ sơ tín dụng để mua nợ / bán chịu (AR-T01).',
      );
    }

    // AR-T04: Khách bị BLOCKED
    if (profile.creditStatus === CreditStatus.BLOCKED) {
      throw new BadRequestException(
        'Khách hàng đang bị khóa quyền mua nợ / bán chịu (AR-T04). Vui lòng liên hệ kế toán.',
      );
    }

    // AR-T05: Khách có khoản nợ quá hạn
    const now = new Date();
    const overdueReceivable = await this.receivableModel
      .findOne({
        customer: new Types.ObjectId(customerId),
        status: { $ne: CustomerReceivableStatus.PAID },
        dueDate: { $lt: now },
        isDeleted: false,
      })
      .exec();

    if (overdueReceivable) {
      throw new BadRequestException(
        `Khách hàng có khoản nợ quá hạn chưa thanh toán (Hóa đơn: ${overdueReceivable.invoiceCode}, Hạn: ${overdueReceivable.dueDate.toLocaleDateString('vi-VN')}). Không thể tiếp tục bán chịu (AR-T05).`,
      );
    }

    // AR-T02 & AR-T03: Kiểm tra hạn mức công nợ
    const nextExposure = profile.currentExposure + requestedAmount;
    if (nextExposure > profile.creditLimit) {
      throw new BadRequestException(
        `Vượt quá hạn mức công nợ được cấp (Hạn mức: ${profile.creditLimit.toLocaleString('vi-VN')} đ, Dư nợ hiện tại: ${profile.currentExposure.toLocaleString('vi-VN')} đ, Yêu cầu nợ: ${requestedAmount.toLocaleString('vi-VN')} đ) (AR-T02).`,
      );
    }

    const termDays = profile.paymentTermDays || 30;
    const dueDate = new Date(Date.now() + termDays * 24 * 60 * 60 * 1000);

    return {
      eligible: true,
      profile,
      dueDate,
    };
  }

  /**
   * AR-T08: Đặt trước / Bảo lưu hạn mức công nợ nguyên tử (Atomic Conditional Reservation)
   * Chống race condition khi 2 đơn cùng tạo đồng thời vượt hạn mức
   */
  async reserveCreditExposureAtomic(
    customerId: string,
    requestedAmount: number,
    session?: ClientSession,
  ): Promise<CustomerCreditProfileDocument> {
    const updateQuery = this.creditProfileModel.findOneAndUpdate(
      {
        customer: new Types.ObjectId(customerId),
        creditStatus: CreditStatus.APPROVED,
        $expr: {
          $lte: [
            { $add: ['$currentExposure', requestedAmount] },
            '$creditLimit',
          ],
        },
      },
      {
        $inc: { currentExposure: requestedAmount },
      },
      { new: true },
    );

    if (session) updateQuery.session(session);
    const updated = await updateQuery.exec();

    if (!updated) {
      throw new BadRequestException(
        'Không thể cấp tín dụng bán chịu: Số dư nợ vượt hạn mức tín dụng cho phép hoặc trạng thái khách hàng không hợp lệ (AR-T08).',
      );
    }

    return updated;
  }

  /**
   * AR-T06, AR-T09: Giải phóng dư nợ công nợ (khi thu nợ hoặc hủy đơn)
   */
  async releaseCreditExposureAtomic(
    customerId: string,
    amount: number,
    session?: ClientSession,
  ): Promise<void> {
    const updateQuery = this.creditProfileModel.updateOne(
      { customer: new Types.ObjectId(customerId) },
      { $inc: { currentExposure: -amount } },
    );
    if (session) updateQuery.session(session);
    await updateQuery.exec();
  }

  /**
   * Đối soát / Điều chỉnh dư nợ thực tế so với tổng các khoản nợ còn lại (Reconciliation)
   */
  async reconcileExposure(customerId: string): Promise<{
    customerId: string;
    reconciledExposure: number;
    profile: CustomerCreditProfileDocument | null;
  }> {
    const receivables = await this.receivableModel
      .find({
        customer: new Types.ObjectId(customerId),
        status: { $ne: CustomerReceivableStatus.PAID },
        isDeleted: false,
      })
      .exec();

    const actualExposure = receivables.reduce(
      (sum, r) => sum + (r.remainingAmount || 0),
      0,
    );

    const updated = await this.creditProfileModel
      .findOneAndUpdate(
        { customer: new Types.ObjectId(customerId) },
        { $set: { currentExposure: Math.max(0, actualExposure) } },
        { new: true },
      )
      .exec();

    return {
      customerId,
      reconciledExposure: actualExposure,
      profile: updated,
    };
  }

  /**
   * AR-T14: Báo cáo tuổi nợ (Aging Report) phân loại theo các bucket:
   * - CURRENT: Chưa đến hạn
   * - OVERDUE_1_30: Quá hạn 1 - 30 ngày
   * - OVERDUE_31_60: Quá hạn 31 - 60 ngày
   * - OVERDUE_61_90: Quá hạn 61 - 90 ngày
   * - OVERDUE_OVER_90: Quá hạn trên 90 ngày
   */
  async getAgingReport(query: AgingReportQueryDto): Promise<{
    items: AgingReportItem[];
    summary: AgingBucketSummary;
  }> {
    const filter: Record<string, any> = {
      status: { $ne: CustomerReceivableStatus.PAID },
      remainingAmount: { $gt: 0 },
      isDeleted: false,
    };

    if (query.customerId && Types.ObjectId.isValid(query.customerId)) {
      filter.customer = new Types.ObjectId(query.customerId);
    }

    const asOf = query.asOfDate ? new Date(query.asOfDate) : new Date();

    const receivables = await this.receivableModel
      .find(filter)
      .sort({ dueDate: 1 })
      .exec();

    let totalRemaining = 0;
    let current = 0;
    let overdue1to30 = 0;
    let overdue31to60 = 0;
    let overdue61to90 = 0;
    let overdueOver90 = 0;

    const items: AgingReportItem[] = receivables.map((rec) => {
      const remaining = rec.remainingAmount;
      totalRemaining += remaining;

      const diffMs = asOf.getTime() - new Date(rec.dueDate).getTime();
      const daysOverdue = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      let bucket: AgingReportItem['bucket'] = 'CURRENT';

      if (daysOverdue <= 0) {
        bucket = 'CURRENT';
        current += remaining;
      } else if (daysOverdue <= 30) {
        bucket = 'OVERDUE_1_30';
        overdue1to30 += remaining;
      } else if (daysOverdue <= 60) {
        bucket = 'OVERDUE_31_60';
        overdue31to60 += remaining;
      } else if (daysOverdue <= 90) {
        bucket = 'OVERDUE_61_90';
        overdue61to90 += remaining;
      } else {
        bucket = 'OVERDUE_OVER_90';
        overdueOver90 += remaining;
      }

      return {
        receivableId: rec._id.toString(),
        invoiceCode: rec.invoiceCode,
        customerId: rec.customer.toString(),
        customerName: rec.customerName,
        customerPhone: rec.customerPhone,
        totalAmount: rec.totalAmount,
        paidAmount: rec.paidAmount,
        remainingAmount: rec.remainingAmount,
        dueDate: rec.dueDate,
        daysOverdue: Math.max(0, daysOverdue),
        bucket,
      };
    });

    const totalOverdue =
      overdue1to30 + overdue31to60 + overdue61to90 + overdueOver90;

    return {
      items,
      summary: {
        totalRemaining,
        current,
        overdue1to30,
        overdue31to60,
        overdue61to90,
        overdueOver90,
        totalOverdue,
      },
    };
  }

  /**
   * AR-T14: Xuất báo cáo tuổi nợ ra file Excel
   */
  async exportAgingReportExcel(query: AgingReportQueryDto): Promise<Buffer> {
    const report = await this.getAgingReport(query);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Truong Thanh Bookstore';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('BaoCaoTuoiNo');

    sheet.columns = [
      { header: 'Mã hóa đơn', key: 'invoiceCode', width: 20 },
      { header: 'Khách hàng', key: 'customerName', width: 25 },
      { header: 'Số điện thoại', key: 'customerPhone', width: 15 },
      { header: 'Hạn thanh toán', key: 'dueDate', width: 15 },
      { header: 'Tổng tiền (đ)', key: 'totalAmount', width: 18 },
      { header: 'Đã thu (đ)', key: 'paidAmount', width: 18 },
      { header: 'Còn lại (đ)', key: 'remainingAmount', width: 18 },
      { header: 'Số ngày quá hạn', key: 'daysOverdue', width: 16 },
      { header: 'Nhóm tuổi nợ', key: 'bucket', width: 20 },
    ];

    // Style header
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E40AF' },
    };

    report.items.forEach((it) => {
      sheet.addRow({
        invoiceCode: it.invoiceCode,
        customerName: it.customerName,
        customerPhone: it.customerPhone || '',
        dueDate: it.dueDate
          ? new Date(it.dueDate).toLocaleDateString('vi-VN')
          : '',
        totalAmount: it.totalAmount,
        paidAmount: it.paidAmount,
        remainingAmount: it.remainingAmount,
        daysOverdue: it.daysOverdue,
        bucket:
          it.bucket === 'CURRENT'
            ? 'Chưa đến hạn'
            : it.bucket === 'OVERDUE_1_30'
              ? 'Quá hạn 1-30 ngày'
              : it.bucket === 'OVERDUE_31_60'
                ? 'Quá hạn 31-60 ngày'
                : it.bucket === 'OVERDUE_61_90'
                  ? 'Quá hạn 61-90 ngày'
                  : 'Quá hạn >90 ngày',
      });
    });

    // Summary row
    sheet.addRow({});
    const summaryRow = sheet.addRow({
      invoiceCode: 'TỔNG CỘNG',
      remainingAmount: report.summary.totalRemaining,
      bucket: `Quá hạn: ${report.summary.totalOverdue.toLocaleString('vi-VN')} đ`,
    });
    summaryRow.font = { bold: true };

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }
}
