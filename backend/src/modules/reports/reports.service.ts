import { BadRequestException, Injectable, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OrdersService } from '../orders/orders.service';
import { ProductsService } from '../products/products.service';
import { InventoryService } from '../inventory/inventory.service';
import { CustomersService } from '../customers/customers.service';
import { OrderSource, OrderStatus, PaymentMethod } from '../../common/enums';
import {
  POSOrder,
  POSOrderDocument,
  POSOrderStatus,
  POSCustomerType,
} from '../pos/schemas/pos-order.schema';

interface LowStockReportItem {
  _id: { toString(): string } | string;
  currentStock: number;
  lastUpdated?: Date;
  product?: {
    _id: { toString(): string } | string;
    name: string;
    unit?: string;
  };
}

interface RecentOrderReportItem {
  _id: { toString(): string } | string;
  orderCode: string;
  orderStatus: OrderStatus;
  paymentMethod?: PaymentMethod;
  total: number;
  customerName?: string;
  createdAt: string | Date;
}

interface RecentCustomerReportItem {
  _id: { toString(): string } | string;
  fullName: string;
  email: string;
  createdAt: string | Date;
}

export interface DashboardNotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  createdAt: string | Date;
  meta?: Record<string, unknown>;
}

@Injectable()
export class ReportsService {
  constructor(
    private ordersService: OrdersService,
    private productsService: ProductsService,
    private inventoryService: InventoryService,
    private customersService: CustomersService,
    @Optional()
    @InjectModel(POSOrder.name)
    private posOrderModel?: Model<POSOrderDocument>,
  ) {}

  async getDashboard() {
    const vnOffset = 7 * 60 * 60 * 1000;
    const now = new Date();
    const vnTime = new Date(now.getTime() + vnOffset);
    vnTime.setUTCHours(0, 0, 0, 0);
    const startOfTodayVN = new Date(vnTime.getTime() - vnOffset);

    // Tính doanh thu hôm nay từ cả Online và POS (NEW-013)
    const [
      todayOnlineRevenue,
      totalOnlineOrders,
      totalProducts,
      lowStockCount,
      newCustomers,
      posTodayAgg,
      totalPOSOrders,
    ] = await Promise.all([
      this.ordersService.getTodayRevenue(),
      this.ordersService.count(),
      this.productsService.count(),
      this.inventoryService.getLowStockCount(),
      this.customersService.getNewCustomersCount(30),
      this.posOrderModel
        ? this.posOrderModel.aggregate([
            {
              $match: {
                status: { $ne: POSOrderStatus.CANCELLED },
                createdAt: { $gte: startOfTodayVN },
              },
            },
            {
              $group: {
                _id: null,
                total: { $sum: '$finalAmount' },
                refunds: { $sum: '$totalRefundedAmount' },
              },
            },
          ])
        : Promise.resolve([]),
      this.posOrderModel
        ? this.posOrderModel.countDocuments({
            status: { $ne: POSOrderStatus.CANCELLED },
          })
        : Promise.resolve(0),
    ]);

    const posTodayRow = posTodayAgg[0] as
      | { total: number; refunds: number }
      | undefined;
    const todayPOSRevenue = posTodayRow
      ? Math.max(0, posTodayRow.total - (posTodayRow.refunds || 0))
      : 0;

    const todayRevenue = todayOnlineRevenue + todayPOSRevenue;
    const totalOrders = totalOnlineOrders + totalPOSOrders;

    const recentOrders = await this.ordersService.getRecent(5);
    const bestSelling = await this.productsService.getBestSelling(5);

    return {
      stats: {
        todayRevenue,
        totalOrders,
        totalProducts,
        lowStockCount,
        newCustomers,
      },
      recentOrders,
      bestSellingProducts: bestSelling,
    };
  }

  /**
   * NEW-013 & NEW-015: Tổng hợp doanh thu đa kênh (WEB, MOBILE, POS, WHOLESALE),
   * kèm khấu trừ hoàn trả và tính toán COGS (Giá vốn) & Lợi nhuận gộp theo từng ngày.
   */
  async getRevenue(startDate?: string, endDate?: string, channel?: string) {
    const dayMs = 24 * 60 * 60 * 1000;
    const vnOffset = 7 * 60 * 60 * 1000;
    const today = new Date(Date.now() + vnOffset).toISOString().slice(0, 10);
    const parseDay = (value: string): Date => {
      const utc = new Date(`${value}T00:00:00.000Z`);
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
        !Number.isFinite(utc.getTime()) ||
        utc.toISOString().slice(0, 10) !== value
      ) {
        throw new BadRequestException(
          'Ngày báo cáo phải hợp lệ theo định dạng YYYY-MM-DD',
        );
      }
      return new Date(utc.getTime() - vnOffset);
    };
    const start = startDate
      ? parseDay(startDate)
      : new Date(parseDay(today).getTime() - 30 * dayMs);
    const end = new Date(parseDay(endDate || today).getTime() + dayMs - 1);
    if (start > end) {
      throw new BadRequestException(
        'Ngày bắt đầu phải trước hoặc bằng ngày kết thúc',
      );
    }

    const dateMap = new Map<
      string,
      {
        _id: string;
        subtotal: number;
        discount: number;
        refund: number;
        total: number;
        cogs: number;
        grossProfit: number;
        count: number;
      }
    >();

    // 1. Lấy dữ liệu từ kênh Online (nếu channel không giới hạn chỉ POS hoặc WHOLESALE)
    if (channel !== 'POS' && channel !== 'WHOLESALE') {
      const onlineRows = await this.ordersService.getRevenueByDateRange(
        start,
        end,
      );
      for (const row of onlineRows) {
        dateMap.set(row._id, {
          _id: row._id,
          subtotal: row.subtotal || row.total || 0,
          discount: row.discount || 0,
          refund: 0,
          total: row.total || 0,
          cogs: 0,
          grossProfit: row.total || 0,
          count: row.count || 0,
        });
      }
    }

    // 2. Lấy dữ liệu từ kênh POS (nếu channel không giới hạn chỉ WEB hoặc MOBILE)
    if (channel !== 'WEB' && channel !== 'MOBILE' && this.posOrderModel) {
      const posMatch: any = {
        status: { $ne: POSOrderStatus.CANCELLED },
        createdAt: { $gte: start, $lte: end },
      };
      if (channel === 'WHOLESALE') {
        posMatch.customerType = POSCustomerType.WHOLESALE;
      } else if (channel === 'POS') {
        posMatch.customerType = { $ne: POSCustomerType.WHOLESALE };
      }

      const posOrders = await this.posOrderModel.find(posMatch).lean().exec();

      for (const ord of posOrders) {
        const orderDateVN = new Date(
          new Date(ord.createdAt).getTime() + vnOffset,
        )
          .toISOString()
          .slice(0, 10);

        let ordCogs = 0;
        for (const it of ord.items || []) {
          const activeQty = Math.max(
            0,
            (it.quantity || 0) - (it.returnedQuantity || 0),
          );
          const ratio = it.conversionRatio || 1;
          const unitCost = it.costPrice || 0;
          ordCogs += activeQty * ratio * unitCost;
        }

        const netFinal = Math.max(
          0,
          ord.finalAmount - (ord.totalRefundedAmount || 0),
        );
        const existing = dateMap.get(orderDateVN) || {
          _id: orderDateVN,
          subtotal: 0,
          discount: 0,
          refund: 0,
          total: 0,
          cogs: 0,
          grossProfit: 0,
          count: 0,
        };

        existing.subtotal += ord.subtotal || 0;
        existing.discount += ord.totalDiscountAmount || 0;
        existing.refund += ord.totalRefundedAmount || 0;
        existing.total += netFinal;
        existing.cogs += ordCogs;
        existing.grossProfit = Math.max(0, existing.total - existing.cogs);
        existing.count += 1;
        dateMap.set(orderDateVN, existing);
      }
    }

    return Array.from(dateMap.values()).sort((a, b) =>
      a._id.localeCompare(b._id),
    );
  }

  async getBestSellingProducts(limit = 10) {
    return this.productsService.getBestSelling(limit);
  }

  async getLowStockProducts() {
    return this.inventoryService.getLowStock();
  }

  async getNotifications() {
    const [lowStock, recentOrders, recentCustomers] = await Promise.all([
      this.inventoryService.getLowStock(),
      this.ordersService.getRecent(15),
      this.customersService.getRecent(10),
    ]);

    const notifications: DashboardNotificationItem[] = [];
    const now = Date.now();

    // Map low stock & out of stock products
    (lowStock as unknown as LowStockReportItem[]).forEach((item) => {
      if (item.product) {
        const isOutOfStock = item.currentStock <= 0;
        notifications.push({
          id: `stock-${item._id.toString()}`,
          type: isOutOfStock ? 'out_of_stock' : 'stock',
          title: isOutOfStock
            ? 'Hết sạch hàng trong kho'
            : 'Cảnh báo sắp hết hàng',
          message: isOutOfStock
            ? `Sản phẩm "${item.product.name}" đã hết hàng (Tồn kho: 0 ${item.product.unit || 'cái'}). Vui lòng nhập hàng bổ sung.`
            : `Sản phẩm "${item.product.name}" sắp hết hàng (chỉ còn ${item.currentStock} ${item.product.unit || 'cái'}).`,
          createdAt: item.lastUpdated || new Date(),
          meta: { productId: item.product._id },
        });
      }
    });

    // Map recent orders with smart alerts
    (recentOrders as unknown as RecentOrderReportItem[]).forEach((order) => {
      const isPending = order.orderStatus === OrderStatus.PENDING;
      const isHighValueCod =
        order.paymentMethod === PaymentMethod.COD &&
        order.total >= 1000000 &&
        isPending;
      const isDelayedPending =
        isPending &&
        now - new Date(order.createdAt).getTime() > 12 * 3600 * 1000;

      if (isHighValueCod) {
        notifications.push({
          id: `cod-high-${order._id.toString()}`,
          type: 'high_value_order',
          title: 'Đơn hàng COD giá trị cao',
          message: `Đơn hàng #${order.orderCode} (${order.total.toLocaleString('vi-VN')}đ) thanh toán COD cần nhân viên gọi điện xác nhận trước khi giao hàng.`,
          createdAt: order.createdAt,
          meta: { orderId: order._id, orderCode: order.orderCode },
        });
      } else if (isDelayedPending) {
        notifications.push({
          id: `delay-${order._id.toString()}`,
          type: 'pending_delay',
          title: 'Đơn hàng chờ xử lý quá lâu',
          message: `Đơn hàng #${order.orderCode} đã tạo hơn 12 giờ nhưng vẫn đang ở trạng thái chờ duyệt.`,
          createdAt: order.createdAt,
          meta: { orderId: order._id, orderCode: order.orderCode },
        });
      } else {
        notifications.push({
          id: `order-${order._id.toString()}`,
          type: 'order',
          title: 'Đơn hàng mới',
          message: `Đơn hàng #${order.orderCode} trị giá ${order.total.toLocaleString('vi-VN')}đ được tạo bởi ${order.customerName || 'Khách vãng lai'}.`,
          createdAt: order.createdAt,
          meta: { orderId: order._id, orderCode: order.orderCode },
        });
      }
    });

    // Map recent customers
    (recentCustomers as unknown as RecentCustomerReportItem[]).forEach(
      (customer) => {
        notifications.push({
          id: `customer-${customer._id.toString()}`,
          type: 'customer',
          title: 'Khách hàng mới đăng ký',
          message: `Thành viên mới ${customer.fullName} (${customer.email}) vừa tạo tài khoản mua sắm.`,
          createdAt: customer.createdAt,
          meta: { customerId: customer._id },
        });
      },
    );

    // Sort by date (newest first)
    notifications.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return notifications;
  }

  async getAdvancedDashboard() {
    const [
      statusDistribution,
      aov,
      voucherEffectiveness,
      customerGrowth,
      topProducts,
    ] = await Promise.all([
      this.ordersService.getStatusDistribution(),
      this.ordersService.getAov(),
      this.ordersService.getVoucherEffectiveness(),
      this.customersService.getCustomerGrowth(30),
      this.productsService.getBestSelling(10),
    ]);

    return {
      statusDistribution,
      aov,
      voucherEffectiveness,
      customerGrowth,
      topProducts,
    };
  }

  async getSummary(range: 'day' | 'week' | 'month' | 'year' = 'month') {
    const [dashboard, advanced, orderStatusStats, categoryRevenue, growth] =
      await Promise.all([
        this.getDashboard(),
        this.getAdvancedDashboard(),
        this.getOrderStatusStats(),
        this.getCategoryRevenue(),
        this.ordersService.getGrowthStats(range),
      ]);

    const todayRev = dashboard.stats.todayRevenue || 0;
    const aov = advanced.aov || 0;
    const totalOrders = dashboard.stats.totalOrders || 0;

    return {
      kpis: {
        todayRevenue: todayRev,
        totalOrders: totalOrders,
        totalProducts: dashboard.stats.totalProducts,
        lowStockCount: dashboard.stats.lowStockCount,
        newCustomers: dashboard.stats.newCustomers,
        aov: aov,
        revenueGrowthRate: growth.revenueGrowthRate,
        ordersGrowthRate: growth.ordersGrowthRate,
      },
      orderStatusStats,
      categoryRevenue,
      recentOrders: dashboard.recentOrders,
      topSellingProducts: dashboard.bestSellingProducts,
      statusDistribution: advanced.statusDistribution,
      customerGrowth: advanced.customerGrowth,
    };
  }

  async getOrderStatusStats() {
    const distribution = await this.ordersService.getStatusDistribution();
    return distribution;
  }

  /**
   * NEW-016: Cơ cấu doanh thu theo danh mục sản phẩm,
   * phân bổ giảm giá cấp đơn theo từng dòng, khấu trừ trả hàng và tổng hợp cả POS & Online.
   */
  async getCategoryRevenue(
    startDate?: string,
    endDate?: string,
    channel?: string,
  ): Promise<{ category: string; revenue: number }[]> {
    const vnOffset = 7 * 60 * 60 * 1000;
    const parseDay = (value: string): Date => {
      const utc = new Date(`${value}T00:00:00.000Z`);
      return new Date(utc.getTime() - vnOffset);
    };

    let start: Date | undefined;
    let end: Date | undefined;
    if (startDate) {
      start = parseDay(startDate);
    }
    if (endDate) {
      end = new Date(parseDay(endDate).getTime() + 24 * 60 * 60 * 1000 - 1);
    }

    const categoryMap = new Map<string, number>();

    // 1. Kênh Online (nếu channel không giới hạn chỉ POS hoặc WHOLESALE)
    if (channel !== 'POS' && channel !== 'WHOLESALE') {
      const onlineSource =
        channel === 'WEB'
          ? OrderSource.WEB
          : channel === 'MOBILE'
            ? OrderSource.MOBILE
            : undefined;

      const onlineCatList = await this.ordersService.getCategoryRevenue(
        start,
        end,
        onlineSource,
      );

      for (const row of onlineCatList) {
        categoryMap.set(
          row.category,
          (categoryMap.get(row.category) || 0) + (row.revenue || 0),
        );
      }
    }

    // 2. Kênh POS (nếu channel không giới hạn chỉ WEB hoặc MOBILE)
    if (channel !== 'WEB' && channel !== 'MOBILE' && this.posOrderModel) {
      const posMatch: any = {
        status: { $ne: POSOrderStatus.CANCELLED },
      };
      if (start && end) {
        posMatch.createdAt = { $gte: start, $lte: end };
      } else if (start) {
        posMatch.createdAt = { $gte: start };
      } else if (end) {
        posMatch.createdAt = { $lte: end };
      }

      if (channel === 'WHOLESALE') {
        posMatch.customerType = POSCustomerType.WHOLESALE;
      } else if (channel === 'POS') {
        posMatch.customerType = { $ne: POSCustomerType.WHOLESALE };
      }

      const posOrders = await this.posOrderModel
        .find(posMatch)
        .populate({
          path: 'items.product',
          populate: { path: 'category', select: 'name' },
        })
        .lean()
        .exec();

      for (const pOrder of posOrders) {
        for (const it of pOrder.items || []) {
          const catName =
            (it.product as any)?.category?.name || 'Văn Phòng Phẩm & Khác';
          const netUnitPrice =
            it.netUnitPrice ||
            (it.quantity > 0
              ? Math.round(it.effectiveLineTotal / it.quantity)
              : 0);
          const activeQty = Math.max(
            0,
            it.quantity - (it.returnedQuantity || 0),
          );
          const lineNet = activeQty * netUnitPrice;

          if (lineNet > 0) {
            categoryMap.set(catName, (categoryMap.get(catName) || 0) + lineNet);
          }
        }
      }
    }

    return Array.from(categoryMap.entries())
      .map(([category, revenue]) => ({ category, revenue }))
      .sort((a, b) => b.revenue - a.revenue);
  }
}
