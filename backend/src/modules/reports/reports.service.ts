import { BadRequestException, Injectable } from '@nestjs/common';
import { OrdersService } from '../orders/orders.service';
import { ProductsService } from '../products/products.service';
import { InventoryService } from '../inventory/inventory.service';
import { CustomersService } from '../customers/customers.service';
import { OrderStatus, PaymentMethod } from '../../common/enums';

@Injectable()
export class ReportsService {
  constructor(
    private ordersService: OrdersService,
    private productsService: ProductsService,
    private inventoryService: InventoryService,
    private customersService: CustomersService,
  ) {}

  async getDashboard() {
    const [
      todayRevenue,
      totalOrders,
      totalProducts,
      lowStockCount,
      newCustomers,
    ] = await Promise.all([
      this.ordersService.getTodayRevenue(),
      this.ordersService.count(),
      this.productsService.count(),
      this.inventoryService.getLowStockCount(),
      this.customersService.getNewCustomersCount(30),
    ]);

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

  async getRevenue(startDate?: string, endDate?: string) {
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
    if (start > end)
      throw new BadRequestException(
        'Ngày bắt đầu phải trước hoặc bằng ngày kết thúc',
      );
    return this.ordersService.getRevenueByDateRange(start, end);
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

    const notifications: any[] = [];
    const now = Date.now();

    // Map low stock & out of stock products
    lowStock.forEach((item: any) => {
      if (item.product) {
        const isOutOfStock = item.currentStock <= 0;
        notifications.push({
          id: `stock-${item._id}`,
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
    recentOrders.forEach((order: any) => {
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
          id: `cod-high-${order._id}`,
          type: 'high_value_order',
          title: 'Đơn hàng COD giá trị cao',
          message: `Đơn hàng #${order.orderCode} (${order.total.toLocaleString('vi-VN')}đ) thanh toán COD cần nhân viên gọi điện xác nhận trước khi giao hàng.`,
          createdAt: order.createdAt,
          meta: { orderId: order._id, orderCode: order.orderCode },
        });
      } else if (isDelayedPending) {
        notifications.push({
          id: `delay-${order._id}`,
          type: 'pending_delay',
          title: 'Đơn hàng chờ xử lý quá lâu',
          message: `Đơn hàng #${order.orderCode} đã tạo hơn 12 giờ nhưng vẫn đang ở trạng thái chờ duyệt.`,
          createdAt: order.createdAt,
          meta: { orderId: order._id, orderCode: order.orderCode },
        });
      } else {
        notifications.push({
          id: `order-${order._id}`,
          type: 'order',
          title: 'Đơn hàng mới',
          message: `Đơn hàng #${order.orderCode} trị giá ${order.total.toLocaleString('vi-VN')}đ được tạo bởi ${order.customerName || 'Khách vãng lai'}.`,
          createdAt: order.createdAt,
          meta: { orderId: order._id, orderCode: order.orderCode },
        });
      }
    });

    // Map recent customers
    recentCustomers.forEach((customer: any) => {
      notifications.push({
        id: `customer-${customer._id}`,
        type: 'customer',
        title: 'Khách hàng mới đăng ký',
        message: `Thành viên mới ${customer.fullName} (${customer.email}) vừa tạo tài khoản mua sắm.`,
        createdAt: customer.createdAt,
        meta: { customerId: customer._id },
      });
    });

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

  async getCategoryRevenue(): Promise<{ category: string; revenue: number }[]> {
    return this.ordersService.getCategoryRevenue();
  }
}
