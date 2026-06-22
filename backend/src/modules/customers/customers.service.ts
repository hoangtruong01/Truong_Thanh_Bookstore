import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Order, OrderDocument } from '../orders/schemas/order.schema';
import { UserRole } from '../../common/enums';
import { PaginatedResult, paginate } from '../../common/dto/pagination.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
  ) {}

  async findAll(
    page = 1,
    limit = 10,
    search?: string,
  ): Promise<PaginatedResult<any>> {
    const filter: any = { role: UserRole.CUSTOMER };
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
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

    // Enrich with order stats (Bulk Aggregate to avoid N+1 queries)
    const userIds = users.map((user) => user._id);
    const orderStats = await this.orderModel.aggregate([
      { $match: { customer: { $in: userIds } } },
      {
        $group: {
          _id: '$customer',
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$total' },
        },
      },
    ]);

    const statsMap = new Map<string, { totalOrders: number; totalSpent: number }>(
      orderStats.map((stat) => [
        stat._id ? stat._id.toString() : '',
        { totalOrders: stat.totalOrders, totalSpent: stat.totalSpent },
      ]),
    );

    const enriched = users.map((user) => {
      const stats = statsMap.get(user._id.toString());
      return {
        ...user.toObject(),
        totalOrders: stats ? stats.totalOrders : 0,
        totalSpent: stats ? stats.totalSpent : 0,
      };
    });

    return paginate(enriched, total, page, limit);
  }

  async findById(id: string): Promise<any> {
    const user = await this.userModel.findById(id).select('-password').exec();
    if (!user) return null;

    const orders = await this.orderModel
      .find({ customer: id })
      .sort({ createdAt: -1 })
      .limit(20)
      .exec();

    const orderStats = await this.orderModel.aggregate([
      { $match: { customer: user._id } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$total' },
        },
      },
    ]);

    return {
      ...user.toObject(),
      totalOrders: orderStats[0]?.totalOrders || 0,
      totalSpent: orderStats[0]?.totalSpent || 0,
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
}
