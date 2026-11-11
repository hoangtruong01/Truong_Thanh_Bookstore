import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Order, OrderDocument } from '../orders/schemas/order.schema';
import {
  CustomerCRMProfile,
  CustomerCRMProfileDocument,
} from './schemas/customer-crm-profile.schema';
import {
  UserRole,
  OrderStatus,
  PaymentStatus,
  CustomerType,
  CustomerCRMTier,
  CarePriority,
} from '../../common/enums';
import { PaginatedResult, paginate } from '../../common/dto/pagination.dto';
import { UpdateCustomerCRMProfileDto } from './dto/customer-crm.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(CustomerCRMProfile.name)
    private crmProfileModel: Model<CustomerCRMProfileDocument>,
  ) {}

  /**
   * SEC-014: Escape ký tự đặc biệt của RegExp để input người dùng không bị
   * hiểu là pattern (chống ReDoS / regex injection).
   */
  private escapeRegex(input: string): string {
    return String(input).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * SEC-017: Chỉ cho phép thao tác trên tài khoản có role CUSTOMER.
   * Người có quyền MANAGE_CUSTOMERS không được đọc/sửa hồ sơ STAFF/ADMIN/SUPER_ADMIN.
   */
  private async assertIsCustomer(customerId: Types.ObjectId): Promise<void> {
    const customer = await this.userModel
      .findOne({ _id: customerId, role: UserRole.CUSTOMER })
      .select('_id')
      .exec();
    if (!customer) {
      throw new NotFoundException(
        `Không tìm thấy khách hàng với ID: ${customerId.toString()}`,
      );
    }
  }

  async getOrCreateCRMProfile(
    customerId: Types.ObjectId,
  ): Promise<CustomerCRMProfileDocument> {
    let profile = await this.crmProfileModel
      .findOne({ customer: customerId })
      .exec();

    if (!profile) {
      profile = await this.crmProfileModel.create({
        customer: customerId,
        customerType: CustomerType.RETAIL,
        tier: CustomerCRMTier.BRONZE,
        carePriority: CarePriority.LOW,
      });
    }

    return profile;
  }

  async updateCRMProfile(
    customerId: string | Types.ObjectId,
    dto: UpdateCustomerCRMProfileDto,
    actorId?: Types.ObjectId,
  ): Promise<CustomerCRMProfileDocument> {
    const cId = new Types.ObjectId(customerId.toString());
    await this.assertIsCustomer(cId);
    const profile = await this.getOrCreateCRMProfile(cId);

    if (dto.tier && dto.tier !== profile.tier) {
      profile.tierAuditLog.push({
        previousTier: profile.tier,
        newTier: dto.tier,
        reason: dto.reason || 'Cập nhật thủ công bởi quản trị viên',
        actor: actorId,
        timestamp: new Date(),
      });
      profile.tier = dto.tier;
    }

    if (dto.customerType) {
      profile.customerType = dto.customerType;
    }

    if (dto.carePriority) {
      profile.carePriority = dto.carePriority;
    }

    if (dto.notes !== undefined) {
      profile.notes = dto.notes;
    }

    if (dto.creditBlocked !== undefined) {
      profile.creditBlocked = dto.creditBlocked;
    }

    return profile.save();
  }

  /**
   * Đánh giá hạng khách hàng tự động dựa trên doanh số 365 ngày và kiểm soát nợ quá hạn (CRM-01).
   */
  async evaluateCustomerTier(
    customerId: string | Types.ObjectId,
    actorId?: Types.ObjectId,
  ): Promise<CustomerCRMProfileDocument> {
    const cId = new Types.ObjectId(customerId.toString());
    await this.assertIsCustomer(cId);

    const profile = await this.getOrCreateCRMProfile(cId);

    const now = new Date();
    const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const d90 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const d365 = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    const validOrderConditions = {
      customer: cId,
      orderStatus: { $nin: [OrderStatus.CANCELLED, OrderStatus.RETURNED] },
    };

    const [statsResult, stats30d, stats90d, stats365d] = await Promise.all([
      this.orderModel.aggregate([
        { $match: validOrderConditions },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalSpent: {
              $sum: {
                $cond: [
                  {
                    $or: [
                      { $eq: ['$paymentStatus', PaymentStatus.PAID] },
                      {
                        $in: [
                          '$orderStatus',
                          [OrderStatus.DELIVERED, OrderStatus.COMPLETED],
                        ],
                      },
                    ],
                  },
                  '$total',
                  0,
                ],
              },
            },
          },
        },
      ]),
      this.orderModel.aggregate([
        { $match: { ...validOrderConditions, createdAt: { $gte: d30 } } },
        { $group: { _id: null, spent: { $sum: '$total' } } },
      ]),
      this.orderModel.aggregate([
        { $match: { ...validOrderConditions, createdAt: { $gte: d90 } } },
        { $group: { _id: null, spent: { $sum: '$total' } } },
      ]),
      this.orderModel.aggregate([
        { $match: { ...validOrderConditions, createdAt: { $gte: d365 } } },
        { $group: { _id: null, spent: { $sum: '$total' } } },
      ]),
    ]);

    const totalOrders = statsResult[0]?.totalOrders || 0;
    const totalSpent = statsResult[0]?.totalSpent || 0;
    const spent30d = stats30d[0]?.spent || 0;
    const spent90d = stats90d[0]?.spent || 0;
    const spent365d = stats365d[0]?.spent || 0;
    const aov = totalOrders > 0 ? Math.round(totalSpent / totalOrders) : 0;

    profile.totalOrders = totalOrders;
    profile.totalSpent = totalSpent;
    profile.spent30d = spent30d;
    profile.spent90d = spent90d;
    profile.spent365d = spent365d;
    profile.averageOrderValue = aov;
    profile.lastEvaluatedAt = now;

    let evaluatedTier = CustomerCRMTier.BRONZE;
    if (spent365d >= 100_000_000) {
      evaluatedTier = CustomerCRMTier.VIP;
    } else if (spent365d >= 50_000_000) {
      evaluatedTier = CustomerCRMTier.PLATINUM;
    } else if (spent365d >= 20_000_000) {
      evaluatedTier = CustomerCRMTier.GOLD;
    } else if (spent365d >= 5_000_000) {
      evaluatedTier = CustomerCRMTier.SILVER;
    }

    let reason = `Tự động tính theo doanh số 365 ngày (${spent365d.toLocaleString('vi-VN')} đ)`;

    if (profile.overdueDays > 30 || profile.creditBlocked) {
      evaluatedTier = CustomerCRMTier.BRONZE;
      profile.carePriority = CarePriority.HIGH;
      reason +=
        ' | Bị hạ xuống BRONZE do nợ quá hạn > 30 ngày hoặc bị tạm khóa tín dụng';
    }

    if (profile.tier !== evaluatedTier) {
      profile.tierAuditLog.push({
        previousTier: profile.tier,
        newTier: evaluatedTier,
        reason,
        actor: actorId,
        timestamp: now,
      });
      profile.tier = evaluatedTier;
    }

    return profile.save();
  }

  async findAll(
    page = 1,
    limit = 10,
    search?: string,
  ): Promise<PaginatedResult<any>> {
    // SEC-014: chuẩn hóa phân trang, giới hạn tối đa 100 bản ghi/trang
    page = Math.max(1, Math.floor(Number(page)) || 1);
    limit = Math.min(100, Math.max(1, Math.floor(Number(limit)) || 10));

    const filter: any = { role: UserRole.CUSTOMER };
    const keyword = typeof search === 'string' ? search.trim() : '';
    if (keyword) {
      const safeKeyword = this.escapeRegex(keyword);
      filter.$or = [
        { fullName: { $regex: safeKeyword, $options: 'i' } },
        { email: { $regex: safeKeyword, $options: 'i' } },
        { phone: { $regex: safeKeyword, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      this.userModel
        .find(filter)
        .select('-password')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      this.userModel.countDocuments(filter).exec(),
    ]);

    const userIds = users.map((user) => user._id);

    const [orderStats, crmProfiles] = await Promise.all([
      this.orderModel.aggregate([
        {
          $match: {
            customer: { $in: userIds },
            orderStatus: {
              $nin: [OrderStatus.CANCELLED, OrderStatus.RETURNED],
            },
          },
        },
        {
          $group: {
            _id: '$customer',
            totalOrders: { $sum: 1 },
            totalSpent: {
              $sum: {
                $cond: [
                  {
                    $or: [
                      { $eq: ['$paymentStatus', PaymentStatus.PAID] },
                      {
                        $in: [
                          '$orderStatus',
                          [OrderStatus.DELIVERED, OrderStatus.COMPLETED],
                        ],
                      },
                    ],
                  },
                  '$total',
                  0,
                ],
              },
            },
          },
        },
      ]),
      this.crmProfileModel
        .find({ customer: { $in: userIds } })
        .lean()
        .exec(),
    ]);

    const statsMap = new Map<
      string,
      { totalOrders: number; totalSpent: number }
    >(
      orderStats.map((stat) => [
        stat._id ? stat._id.toString() : '',
        { totalOrders: stat.totalOrders, totalSpent: stat.totalSpent },
      ]),
    );

    const crmMap = new Map(crmProfiles.map((p) => [p.customer.toString(), p]));

    const enriched = users.map((user) => {
      const stats = statsMap.get(user._id.toString());
      const crm = crmMap.get(user._id.toString());
      return {
        ...user.toObject(),
        totalOrders: stats ? stats.totalOrders : 0,
        totalSpent: stats ? stats.totalSpent : 0,
        customerType: crm?.customerType || CustomerType.RETAIL,
        tier: crm?.tier || CustomerCRMTier.BRONZE,
        carePriority: crm?.carePriority || CarePriority.LOW,
        spent365d: crm?.spent365d || 0,
        overdueDays: crm?.overdueDays || 0,
        creditBlocked: Boolean(crm?.creditBlocked),
      };
    });

    return paginate(enriched, total, page, limit);
  }

  async findById(id: string): Promise<any> {
    // SEC-017: chỉ trả về tài khoản CUSTOMER (không lộ hồ sơ STAFF/ADMIN)
    if (!Types.ObjectId.isValid(id)) return null;
    const user = await this.userModel
      .findOne({ _id: id, role: UserRole.CUSTOMER })
      .select('-password')
      .exec();
    if (!user) return null;

    const [orders, orderStats, crmProfile] = await Promise.all([
      this.orderModel
        .find({ customer: id })
        .sort({ createdAt: -1 })
        .limit(20)
        .exec(),
      this.orderModel.aggregate([
        {
          $match: {
            customer: user._id,
            orderStatus: {
              $nin: [OrderStatus.CANCELLED, OrderStatus.RETURNED],
            },
          },
        },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalSpent: {
              $sum: {
                $cond: [
                  {
                    $or: [
                      { $eq: ['$paymentStatus', PaymentStatus.PAID] },
                      {
                        $in: [
                          '$orderStatus',
                          [OrderStatus.DELIVERED, OrderStatus.COMPLETED],
                        ],
                      },
                    ],
                  },
                  '$total',
                  0,
                ],
              },
            },
          },
        },
      ]),
      this.getOrCreateCRMProfile(user._id),
    ]);

    return {
      ...user.toObject(),
      totalOrders: orderStats[0]?.totalOrders || 0,
      totalSpent: orderStats[0]?.totalSpent || 0,
      crmProfile,
      recentOrders: orders,
    };
  }

  async getNewCustomersCount(days = 30): Promise<number> {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return this.userModel
      .countDocuments({
        role: UserRole.CUSTOMER,
        createdAt: { $gte: date },
      })
      .exec();
  }

  async getRecent(limit = 5): Promise<UserDocument[]> {
    return this.userModel
      .find({ role: UserRole.CUSTOMER })
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  async getCustomerGrowth(days = 30): Promise<any[]> {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return this.userModel.aggregate([
      {
        $match: {
          role: UserRole.CUSTOMER,
          createdAt: { $gte: date },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  }
}
