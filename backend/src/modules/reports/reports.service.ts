import { Injectable } from '@nestjs/common';
import { OrdersService } from '../orders/orders.service';
import { ProductsService } from '../products/products.service';
import { InventoryService } from '../inventory/inventory.service';
import { CustomersService } from '../customers/customers.service';

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
    let start: Date;
    let end: Date;

    if (startDate) {
      const [y, m, d] = startDate.split('-').map(Number);
      start = new Date(y, m - 1, d, 0, 0, 0, 0);
    } else {
      start = new Date();
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
    }

    if (endDate) {
      const [y, m, d] = endDate.split('-').map(Number);
      end = new Date(y, m - 1, d, 23, 59, 59, 999);
    } else {
      end = new Date();
      end.setHours(23, 59, 59, 999);
    }

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
      this.ordersService.getRecent(10),
      this.customersService.getRecent(10),
    ]);

    const notifications: any[] = [];

    // Map low stock products
    lowStock.forEach((item: any) => {
      if (item.product) {
        notifications.push({
          id: `stock-${item._id}`,
          type: 'stock',
          title: 'Cảnh báo hết hàng',
          message: `Sản phẩm "${item.product.name}" sắp hết hàng (chỉ còn ${item.currentStock} cái)`,
          createdAt: item.lastUpdated || new Date(),
          meta: { productId: item.product._id },
        });
      }
    });

    // Map recent orders
    recentOrders.forEach((order: any) => {
      notifications.push({
        id: `order-${order._id}`,
        type: 'order',
        title: 'Đơn hàng mới',
        message: `Đơn hàng mới #${order.orderCode} trị giá ${order.total.toLocaleString('vi-VN')}đ được tạo bởi ${order.customerName || 'Khách vãng lai'}`,
        createdAt: order.createdAt,
        meta: { orderId: order._id, orderCode: order.orderCode },
      });
    });

    // Map recent customers
    recentCustomers.forEach((customer: any) => {
      notifications.push({
        id: `customer-${customer._id}`,
        type: 'customer',
        title: 'Khách hàng mới đăng ký',
        message: `Khách hàng ${customer.fullName} (${customer.email}) vừa tạo tài khoản`,
        createdAt: customer.createdAt,
        meta: { customerId: customer._id },
      });
    });

    // Sort by date (newest first)
    notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

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
}
