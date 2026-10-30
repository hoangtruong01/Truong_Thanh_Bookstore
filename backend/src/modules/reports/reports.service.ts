import { BadRequestException, Injectable, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as ExcelJS from 'exceljs';
import { OrdersService } from '../orders/orders.service';
import { ProductsService } from '../products/products.service';
import { InventoryService } from '../inventory/inventory.service';
import { CustomersService } from '../customers/customers.service';
import {
  OrderSource,
  OrderStatus,
  PaymentMethod,
  InventoryTransactionType,
} from '../../common/enums';
import {
  POSOrder,
  POSOrderDocument,
  POSOrderStatus,
  POSCustomerType,
} from '../pos/schemas/pos-order.schema';
import {
  Inventory,
  InventoryDocument,
  InventoryTransaction,
  InventoryTransactionDocument,
} from '../inventory/schemas/inventory.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import {
  PurchaseOrder,
  PurchaseOrderDocument,
  PurchaseOrderStatus,
} from '../purchasing/schemas/purchase-order.schema';
import {
  Supplier,
  SupplierDocument,
} from '../suppliers/schemas/supplier.schema';
import {
  InventoryLedgerQueryDto,
  ReorderSuggestionQueryDto,
} from './dto/inventory-ledger.dto';
import { Order, OrderDocument } from '../orders/schemas/order.schema';

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
    @Optional()
    @InjectModel(Order.name)
    private orderModel?: Model<OrderDocument>,
    @Optional()
    @InjectModel(Inventory.name)
    private inventoryDataModel?: Model<InventoryDocument>,
    @Optional()
    @InjectModel(InventoryTransaction.name)
    private transactionModel?: Model<InventoryTransactionDocument>,
    @Optional()
    @InjectModel(Product.name)
    private productModel?: Model<ProductDocument>,
    @Optional()
    @InjectModel(PurchaseOrder.name)
    private poModel?: Model<PurchaseOrderDocument>,
    @Optional()
    @InjectModel(Supplier.name)
    private supplierModel?: Model<SupplierDocument>,
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

  /**
   * ERP-05 / REP-02 & REP-04: Báo cáo Nhập Xuất Tồn và Lãi Gộp
   * - Tồn đầu kỳ
   * - Nhập trong kỳ
   * - Xuất trong kỳ
   * - Điều chỉnh trong kỳ
   * - Tồn cuối kỳ
   * - Giá vốn hàng xuất (COGS)
   * - Doanh thu thuần
   * - Lợi nhuận gộp & Biên lợi nhuận gộp (Gross Margin %)
   * - Đa chiều: SKU, Tên, Danh mục, Kênh, Thời gian
   */
  async getInventoryLedgerAndProfit(query: InventoryLedgerQueryDto) {
    const vnOffset = 7 * 60 * 60 * 1000;
    const now = new Date();

    let startDate: Date;
    let endDate: Date;

    if (query.startDate) {
      const utc = new Date(`${query.startDate}T00:00:00.000Z`);
      startDate = new Date(utc.getTime() - vnOffset);
    } else {
      // Mặc định đầu tháng hiện tại
      const firstDay = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
      );
      startDate = new Date(firstDay.getTime() - vnOffset);
    }

    if (query.endDate) {
      const utc = new Date(`${query.endDate}T23:59:59.999Z`);
      endDate = new Date(utc.getTime() - vnOffset);
    } else {
      endDate = now;
    }

    if (
      !this.productModel ||
      !this.inventoryDataModel ||
      !this.transactionModel
    ) {
      return {
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
        summary: {
          totalOpeningStock: 0,
          totalImports: 0,
          totalExports: 0,
          totalAdjustments: 0,
          totalClosingStock: 0,
          totalRevenue: 0,
          totalCogs: 0,
          totalGrossProfit: 0,
          overallGrossMargin: 0,
        },
      };
    }

    // 1. Tìm sản phẩm thỏa mãn bộ lọc
    const productFilter: any = { isDeleted: false };
    if (query.productId && Types.ObjectId.isValid(query.productId)) {
      productFilter._id = new Types.ObjectId(query.productId);
    }
    if (query.categoryId && Types.ObjectId.isValid(query.categoryId)) {
      productFilter.category = new Types.ObjectId(query.categoryId);
    }
    if (query.search && query.search.trim()) {
      const regex = new RegExp(query.search.trim(), 'i');
      productFilter.$or = [{ name: regex }, { sku: regex }];
    }

    const products = await this.productModel
      .find(productFilter)
      .populate('category', 'name')
      .lean()
      .exec();

    const productIds = products.map((p) => p._id);

    // 2. Lấy dữ liệu kho hiện tại
    const inventories = await this.inventoryDataModel
      .find({ product: { $in: productIds } })
      .lean()
      .exec();

    const invMap = new Map<string, any>();
    for (const inv of inventories) {
      invMap.set(inv.product.toString(), inv);
    }

    // 3. Lấy biến động kho trong kỳ & sau kỳ
    const [periodTx, afterPeriodTx] = await Promise.all([
      this.transactionModel
        .find({
          product: { $in: productIds },
          createdAt: { $gte: startDate, $lte: endDate },
        })
        .lean()
        .exec(),
      this.transactionModel
        .find({
          product: { $in: productIds },
          createdAt: { $gt: endDate },
        })
        .lean()
        .exec(),
    ]);

    const txInPeriodByProduct = new Map<
      string,
      { imports: number; exports: number; adjustments: number }
    >();
    for (const tx of periodTx) {
      const pid = tx.product.toString();
      if (!txInPeriodByProduct.has(pid)) {
        txInPeriodByProduct.set(pid, {
          imports: 0,
          exports: 0,
          adjustments: 0,
        });
      }
      const entry = txInPeriodByProduct.get(pid)!;
      if (tx.type === InventoryTransactionType.IMPORT) {
        entry.imports += tx.change || 0;
      } else if (
        tx.type === InventoryTransactionType.SALE ||
        tx.type === InventoryTransactionType.DAMAGE
      ) {
        entry.exports += Math.abs(tx.change || 0);
      } else if (tx.type === InventoryTransactionType.ADJUSTMENT) {
        entry.adjustments += tx.change || 0;
      }
    }

    const netChangeAfterByProduct = new Map<string, number>();
    for (const tx of afterPeriodTx) {
      const pid = tx.product.toString();
      netChangeAfterByProduct.set(
        pid,
        (netChangeAfterByProduct.get(pid) || 0) + (tx.change || 0),
      );
    }

    // 4. Doanh thu theo sản phẩm trong kỳ (từ POS và Online)
    const revenueByProduct = new Map<string, number>();

    // 4.1 Doanh thu POS
    if (
      this.posOrderModel &&
      query.channel !== 'WEB' &&
      query.channel !== 'MOBILE'
    ) {
      const posFilter: any = {
        status: { $ne: POSOrderStatus.CANCELLED },
        createdAt: { $gte: startDate, $lte: endDate },
      };
      if (query.channel === 'WHOLESALE') {
        posFilter.customerType = POSCustomerType.WHOLESALE;
      } else if (query.channel === 'POS') {
        posFilter.customerType = { $ne: POSCustomerType.WHOLESALE };
      }

      const posOrders = await this.posOrderModel.find(posFilter).lean().exec();
      for (const order of posOrders) {
        for (const item of order.items || []) {
          const pid =
            (item.product as any)?._id?.toString() || item.product?.toString();
          if (pid) {
            const netUnitPrice =
              item.netUnitPrice ||
              (item.quantity > 0
                ? Math.round(item.effectiveLineTotal / item.quantity)
                : 0);
            const activeQty = Math.max(
              0,
              item.quantity - (item.returnedQuantity || 0),
            );
            const lineRev = activeQty * netUnitPrice;
            revenueByProduct.set(
              pid,
              (revenueByProduct.get(pid) || 0) + lineRev,
            );
          }
        }
      }
    }

    // 4.2 Doanh thu Online
    if (
      this.orderModel &&
      query.channel !== 'POS' &&
      query.channel !== 'WHOLESALE'
    ) {
      const orderFilter: any = {
        orderStatus: {
          $in: [
            OrderStatus.CONFIRMED,
            OrderStatus.PROCESSING,
            OrderStatus.SHIPPING,
            OrderStatus.DELIVERED,
            OrderStatus.COMPLETED,
          ],
        },
        createdAt: { $gte: startDate, $lte: endDate },
      };
      if (query.channel === 'WEB') {
        orderFilter.orderSource = OrderSource.WEB;
      } else if (query.channel === 'MOBILE') {
        orderFilter.orderSource = OrderSource.MOBILE;
      }

      const onlineOrders = await this.orderModel
        .find(orderFilter)
        .lean()
        .exec();
      for (const o of onlineOrders || []) {
        for (const item of o.items || []) {
          const pid =
            (item.product as any)?._id?.toString() || item.product?.toString();
          if (pid) {
            const lineRev = (item.quantity || 0) * (item.price || 0);
            revenueByProduct.set(
              pid,
              (revenueByProduct.get(pid) || 0) + lineRev,
            );
          }
        }
      }
    }

    // 5. Tính toán chi tiết từng dòng sản phẩm
    let totalOpeningStock = 0;
    let totalImports = 0;
    let totalExports = 0;
    let totalAdjustments = 0;
    let totalClosingStock = 0;
    let totalRevenue = 0;
    let totalCogs = 0;
    let totalGrossProfit = 0;

    const rows = products.map((prod) => {
      const pid = prod._id.toString();
      const inv = invMap.get(pid);
      const currentStock = inv?.currentStock ?? prod.stock ?? 0;
      const costPrice = inv?.costPrice ?? 0;

      const txPeriod = txInPeriodByProduct.get(pid) || {
        imports: 0,
        exports: 0,
        adjustments: 0,
      };
      const netAfter = netChangeAfterByProduct.get(pid) || 0;

      const closingStock = currentStock - netAfter;
      const openingStock =
        closingStock -
        txPeriod.imports +
        txPeriod.exports -
        txPeriod.adjustments;

      const revenue = revenueByProduct.get(pid) || 0;
      const cogs = txPeriod.exports * costPrice;
      const grossProfit = revenue - cogs;
      const grossMargin =
        revenue > 0 ? Math.round((grossProfit / revenue) * 10000) / 100 : 0;

      totalOpeningStock += openingStock;
      totalImports += txPeriod.imports;
      totalExports += txPeriod.exports;
      totalAdjustments += txPeriod.adjustments;
      totalClosingStock += closingStock;
      totalRevenue += revenue;
      totalCogs += cogs;
      totalGrossProfit += grossProfit;

      return {
        productId: pid,
        sku: prod.sku,
        name: prod.name,
        category: (prod.category as any)?.name || 'Văn Phòng Phẩm',
        unit: prod.unit || 'Cái',
        costPrice,
        openingStock,
        importQty: txPeriod.imports,
        exportQty: txPeriod.exports,
        adjustQty: txPeriod.adjustments,
        closingStock,
        revenue,
        cogs,
        grossProfit,
        grossMargin,
      };
    });

    const overallGrossMargin =
      totalRevenue > 0
        ? Math.round((totalGrossProfit / totalRevenue) * 10000) / 100
        : 0;

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const paginatedRows = rows.slice(skip, skip + limit);

    return {
      data: paginatedRows,
      total: rows.length,
      page,
      limit,
      totalPages: Math.ceil(rows.length / limit),
      summary: {
        totalOpeningStock,
        totalImports,
        totalExports,
        totalAdjustments,
        totalClosingStock,
        totalRevenue,
        totalCogs,
        totalGrossProfit,
        overallGrossMargin,
      },
    };
  }

  /**
   * DOC-04: Xuất Excel Báo cáo Nhập Xuất Tồn và Lãi Gộp (ERP-05)
   */
  async exportInventoryLedgerProfitToExcel(
    query: InventoryLedgerQueryDto,
  ): Promise<Buffer> {
    const report = await this.getInventoryLedgerAndProfit({
      ...query,
      page: 1,
      limit: 10000,
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('NhapXuatTon_LaiGop');

    worksheet.columns = [
      { header: 'Mã SKU', key: 'sku', width: 15 },
      { header: 'Tên sản phẩm', key: 'name', width: 35 },
      { header: 'Danh mục', key: 'category', width: 22 },
      { header: 'Đơn vị', key: 'unit', width: 10 },
      { header: 'Giá vốn (VND)', key: 'costPrice', width: 16 },
      { header: 'Tồn đầu kỳ', key: 'openingStock', width: 14 },
      { header: 'Nhập trong kỳ', key: 'importQty', width: 14 },
      { header: 'Xuất trong kỳ', key: 'exportQty', width: 14 },
      { header: 'Điều chỉnh', key: 'adjustQty', width: 14 },
      { header: 'Tồn cuối kỳ', key: 'closingStock', width: 14 },
      { header: 'Doanh thu thuần', key: 'revenue', width: 18 },
      { header: 'Giá vốn xuất (COGS)', key: 'cogs', width: 18 },
      { header: 'Lãi gộp (VND)', key: 'grossProfit', width: 18 },
      { header: 'Biên lãi (%)', key: 'grossMargin', width: 14 },
    ];

    worksheet.getRow(1).font = { bold: true };

    for (const item of report.data) {
      worksheet.addRow({
        sku: item.sku,
        name: item.name,
        category: item.category,
        unit: item.unit,
        costPrice: item.costPrice,
        openingStock: item.openingStock,
        importQty: item.importQty,
        exportQty: item.exportQty,
        adjustQty: item.adjustQty,
        closingStock: item.closingStock,
        revenue: item.revenue,
        cogs: item.cogs,
        grossProfit: item.grossProfit,
        grossMargin: `${item.grossMargin}%`,
      });
    }

    // Dòng tổng cộng (Summary Row)
    const sumRow = worksheet.addRow({
      sku: 'TỔNG CỘNG',
      name: '',
      category: '',
      unit: '',
      costPrice: '',
      openingStock: report.summary.totalOpeningStock,
      importQty: report.summary.totalImports,
      exportQty: report.summary.totalExports,
      adjustQty: report.summary.totalAdjustments,
      closingStock: report.summary.totalClosingStock,
      revenue: report.summary.totalRevenue,
      cogs: report.summary.totalCogs,
      grossProfit: report.summary.totalGrossProfit,
      grossMargin: `${report.summary.overallGrossMargin}%`,
    });
    sumRow.font = { bold: true };

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  /**
   * ERP-06 / REP-02: Đề xuất nhập hàng thông minh (Smart Reordering Suggestions)
   * - Tồn tối thiểu & tồn mục tiêu
   * - Tốc độ bán 7/30/90 ngày
   * - Lượng hàng đang đặt chờ nhận (Pending PO Qty)
   * - Thời gian giao hàng dự kiến nhà cung cấp
   * - Gợi ý số lượng nên nhập & mức độ khẩn cấp (CRITICAL, HIGH, MEDIUM, LOW)
   */
  async getReorderSuggestions(query: ReorderSuggestionQueryDto) {
    if (!this.productModel || !this.inventoryDataModel) {
      return { data: [], total: 0, page: 1, limit: 20, totalPages: 0 };
    }

    const now = new Date();
    const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const d90 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const filter: any = { isDeleted: false };
    if (query.categoryId && Types.ObjectId.isValid(query.categoryId)) {
      filter.category = new Types.ObjectId(query.categoryId);
    }
    if (query.search && query.search.trim()) {
      const regex = new RegExp(query.search.trim(), 'i');
      filter.$or = [{ name: regex }, { sku: regex }];
    }

    const products = await this.productModel
      .find(filter)
      .populate('category', 'name')
      .lean()
      .exec();

    const productIds = products.map((p) => p._id);

    // 1. Kho hiện tại
    const inventories = await this.inventoryDataModel
      .find({ product: { $in: productIds } })
      .lean()
      .exec();
    const invMap = new Map<string, any>();
    for (const inv of inventories) {
      invMap.set(inv.product.toString(), inv);
    }

    // 2. Lượng hàng đang đặt chờ giao từ PO (Pending PO Quantity)
    const pendingPOMap = new Map<string, number>();
    if (this.poModel) {
      const activePOs = await this.poModel
        .find({
          status: {
            $in: [
              PurchaseOrderStatus.APPROVED,
              PurchaseOrderStatus.SENT,
              PurchaseOrderStatus.PARTIALLY_RECEIVED,
            ],
          },
          isDeleted: false,
        })
        .lean()
        .exec();

      for (const po of activePOs) {
        for (const it of po.items || []) {
          const pid =
            (it.product as any)?._id?.toString() || it.product?.toString();
          if (pid) {
            const ratio = it.conversionRatio || 1;
            const remainingUnits =
              Math.max(
                0,
                (it.orderedQuantity || 0) - (it.receivedQuantity || 0),
              ) * ratio;
            pendingPOMap.set(
              pid,
              (pendingPOMap.get(pid) || 0) + remainingUnits,
            );
          }
        }
      }
    }

    // 3. Tốc độ bán (7 ngày, 30 ngày, 90 ngày) từ POS
    const sales7dMap = new Map<string, number>();
    const sales30dMap = new Map<string, number>();
    const sales90dMap = new Map<string, number>();

    if (this.posOrderModel) {
      const recentOrders = await this.posOrderModel
        .find({
          status: { $ne: POSOrderStatus.CANCELLED },
          createdAt: { $gte: d90 },
        })
        .lean()
        .exec();

      for (const order of recentOrders) {
        const orderTime = new Date(order.createdAt).getTime();
        for (const it of order.items || []) {
          const pid =
            (it.product as any)?._id?.toString() || it.product?.toString();
          if (pid) {
            const qty = Math.max(
              0,
              (it.quantity || 0) - (it.returnedQuantity || 0),
            );
            if (qty > 0) {
              sales90dMap.set(pid, (sales90dMap.get(pid) || 0) + qty);
              if (orderTime >= d30.getTime()) {
                sales30dMap.set(pid, (sales30dMap.get(pid) || 0) + qty);
              }
              if (orderTime >= d7.getTime()) {
                sales7dMap.set(pid, (sales7dMap.get(pid) || 0) + qty);
              }
            }
          }
        }
      }
    }

    // 4. Nhà cung cấp đề xuất & lead time
    const supplierInfoMap = new Map<
      string,
      { name: string; leadTimeDays: number; lastPrice: number }
    >();
    if (this.supplierModel) {
      const suppliers = await this.supplierModel
        .find({ isDeleted: false })
        .lean()
        .exec();

      for (const sup of suppliers) {
        for (const history of sup.suppliedProducts || []) {
          const pid = history.product?.toString();
          if (pid && !supplierInfoMap.has(pid)) {
            supplierInfoMap.set(pid, {
              name: sup.name,
              leadTimeDays: 3, // Tiêu chuẩn 3 ngày
              lastPrice: history.lastPurchasePrice || 0,
            });
          }
        }
      }
    }

    // 5. Tính toán đề xuất nhập
    const suggestions = products
      .map((prod) => {
        const pid = prod._id.toString();
        const inv = invMap.get(pid);
        const currentStock = inv?.currentStock ?? prod.stock ?? 0;
        const costPrice = inv?.costPrice ?? 0;

        const minStock = inv?.minStock || 10;
        const targetStock = Math.round(minStock * 2.5);

        const sales7d = sales7dMap.get(pid) || 0;
        const sales30d = sales30dMap.get(pid) || 0;
        const sales90d = sales90dMap.get(pid) || 0;

        const dailyRunRate = Math.round((sales30d / 30) * 100) / 100;
        const pendingPOQty = pendingPOMap.get(pid) || 0;

        // Công thức đề xuất: SuggestedQty = max(0, TargetStock - CurrentStock - PendingPOQty)
        const suggestedQty = Math.max(
          0,
          Math.ceil(targetStock - (currentStock + pendingPOQty)),
        );

        // Số ngày tồn kho còn lại: CurrentStock / DailyRunRate
        const daysUntilStockout =
          dailyRunRate > 0
            ? Math.round(currentStock / dailyRunRate)
            : currentStock === 0
              ? 0
              : 999;

        let urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
        if (currentStock === 0 || daysUntilStockout <= 3) {
          urgency = 'CRITICAL';
        } else if (daysUntilStockout <= 7 || currentStock <= minStock) {
          urgency = 'HIGH';
        } else if (daysUntilStockout <= 14) {
          urgency = 'MEDIUM';
        } else {
          urgency = 'LOW';
        }

        const supInfo = supplierInfoMap.get(pid);

        return {
          productId: pid,
          sku: prod.sku,
          name: prod.name,
          category: (prod.category as any)?.name || 'Văn Phòng Phẩm',
          unit: prod.unit || 'Cái',
          currentStock,
          minStock,
          targetStock,
          sales7d,
          sales30d,
          sales90d,
          dailyRunRate,
          pendingPOQty,
          suggestedQty,
          daysUntilStockout,
          urgency,
          costPrice: supInfo?.lastPrice || costPrice,
          supplierName: supInfo?.name || 'Chưa gắn NCC',
          leadTimeDays: supInfo?.leadTimeDays || 3,
        };
      })
      .filter((item) => {
        if (query.onlyLowStock) {
          return (
            item.urgency === 'CRITICAL' ||
            item.urgency === 'HIGH' ||
            item.suggestedQty > 0
          );
        }
        return true;
      })
      .sort((a, b) => {
        const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        return (
          order[a.urgency] - order[b.urgency] ||
          a.daysUntilStockout - b.daysUntilStockout
        );
      });

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    return {
      data: suggestions.slice(skip, skip + limit),
      total: suggestions.length,
      page,
      limit,
      totalPages: Math.ceil(suggestions.length / limit),
    };
  }
}
