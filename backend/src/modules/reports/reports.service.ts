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
    const [todayRevenue, totalOrders, totalProducts, lowStockCount, newCustomers] =
      await Promise.all([
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
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate
      ? new Date(startDate)
      : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    return this.ordersService.getRevenueByDateRange(start, end);
  }

  async getBestSellingProducts(limit = 10) {
    return this.productsService.getBestSelling(limit);
  }

  async getLowStockProducts() {
    return this.inventoryService.getLowStock();
  }
}
