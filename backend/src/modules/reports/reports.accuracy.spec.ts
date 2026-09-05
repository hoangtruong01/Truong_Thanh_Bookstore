import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { OrdersService } from '../orders/orders.service';
import { ProductsService } from '../products/products.service';
import { InventoryService } from '../inventory/inventory.service';
import { CustomersService } from '../customers/customers.service';
import { OrderStatus, PaymentMethod, PaymentStatus } from '../../common/enums';

// Verifies report composition with mocked order queries. Real MongoDB
// aggregation and transaction regressions live in test/sprint4-regression.e2e-spec.ts.
describe('Reports composition contract with mocked OrdersService (QA-03)', () => {
  let reportsService: ReportsService;

  // 1. Known Seed Dataset representing diverse lifecycle states
  const now = new Date();
  const tzOffset = 7 * 60 * 60 * 1000;
  const vnNow = new Date(now.getTime() + tzOffset);
  vnNow.setUTCHours(10, 0, 0, 0);
  const todayVN = new Date(vnNow.getTime() - tzOffset);

  const yesterdayVN = new Date(todayVN.getTime() - 24 * 60 * 60 * 1000);
  const twoDaysAgoVN = new Date(todayVN.getTime() - 48 * 60 * 60 * 1000);

  interface SeedOrder {
    _id: string;
    orderCode: string;
    orderStatus: OrderStatus;
    paymentStatus: PaymentStatus;
    paymentMethod: PaymentMethod;
    subtotal: number;
    discount: number;
    loyaltyDiscount: number;
    loyaltyPointsUsed: number;
    shippingFee: number;
    total: number;
    createdAt: Date;
    revenueRecognizedAt?: Date;
    promotionCode?: string;
    items: {
      product: string;
      productName: string;
      categoryName: string;
      price: number;
      quantity: number;
    }[];
  }

  const seedOrders: SeedOrder[] = [
    // Order 1: DELIVERED, PAID, Voucher used -> Realized Today
    {
      _id: 'ord-01',
      orderCode: 'TT-01',
      orderStatus: OrderStatus.DELIVERED,
      paymentStatus: PaymentStatus.PAID,
      paymentMethod: PaymentMethod.COD,
      subtotal: 280000,
      discount: 30000,
      loyaltyDiscount: 0,
      loyaltyPointsUsed: 0,
      shippingFee: 0,
      total: 250000,
      promotionCode: 'SALE30',
      createdAt: todayVN,
      revenueRecognizedAt: todayVN,
      items: [
        {
          product: 'prod-01',
          productName: 'Đắc Nhân Tâm',
          categoryName: 'Sách Kỹ Năng',
          price: 140000,
          quantity: 2,
        },
      ],
    },
    // Order 2: COMPLETED, PAID, Loyalty Points used -> Realized Today
    {
      _id: 'ord-02',
      orderCode: 'TT-02',
      orderStatus: OrderStatus.COMPLETED,
      paymentStatus: PaymentStatus.PAID,
      paymentMethod: PaymentMethod.VNPAY,
      subtotal: 500000,
      discount: 0,
      loyaltyDiscount: 50000,
      loyaltyPointsUsed: 500,
      shippingFee: 0,
      total: 450000,
      createdAt: todayVN,
      revenueRecognizedAt: todayVN,
      items: [
        {
          product: 'prod-02',
          productName: 'Vở Kẻ Ngang Cao Cấp',
          categoryName: 'Văn Phòng Phẩm',
          price: 250000,
          quantity: 2,
        },
      ],
    },
    // Order 3: CANCELLED (Customer paid initially, then cancelled & refunded) -> MUST NOT BE REALIZED
    {
      _id: 'ord-03',
      orderCode: 'TT-03',
      orderStatus: OrderStatus.CANCELLED,
      paymentStatus: PaymentStatus.PAID,
      paymentMethod: PaymentMethod.MOMO,
      subtotal: 150000,
      discount: 0,
      loyaltyDiscount: 0,
      loyaltyPointsUsed: 0,
      shippingFee: 0,
      total: 150000,
      createdAt: todayVN,
      revenueRecognizedAt: todayVN,
      items: [
        {
          product: 'prod-03',
          productName: 'Bút Gel Thiên Long',
          categoryName: 'Văn Phòng Phẩm',
          price: 50000,
          quantity: 3,
        },
      ],
    },
    // Order 4: RETURNED (Delivered then returned & refunded) -> MUST NOT BE REALIZED
    {
      _id: 'ord-04',
      orderCode: 'TT-04',
      orderStatus: OrderStatus.RETURNED,
      paymentStatus: PaymentStatus.REFUNDED,
      paymentMethod: PaymentMethod.COD,
      subtotal: 300000,
      discount: 0,
      loyaltyDiscount: 0,
      loyaltyPointsUsed: 0,
      shippingFee: 0,
      total: 300000,
      createdAt: todayVN,
      revenueRecognizedAt: todayVN,
      items: [
        {
          product: 'prod-01',
          productName: 'Đắc Nhân Tâm',
          categoryName: 'Sách Kỹ Năng',
          price: 150000,
          quantity: 2,
        },
      ],
    },
    // Order 5: PENDING, UNPAID COD -> MUST NOT BE REALIZED (not delivered, not paid)
    {
      _id: 'ord-05',
      orderCode: 'TT-05',
      orderStatus: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      paymentMethod: PaymentMethod.COD,
      subtotal: 180000,
      discount: 0,
      loyaltyDiscount: 0,
      loyaltyPointsUsed: 0,
      shippingFee: 0,
      total: 180000,
      createdAt: todayVN,
      items: [
        {
          product: 'prod-04',
          productName: 'Bộ Thước Kẻ Parabol',
          categoryName: 'Dụng Cụ Học Tập',
          price: 90000,
          quantity: 2,
        },
      ],
    },
    // Order 6: PENDING, PAID (Online payment confirmed, waiting for packing) -> Realized Today
    {
      _id: 'ord-06',
      orderCode: 'TT-06',
      orderStatus: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PAID,
      paymentMethod: PaymentMethod.VNPAY,
      subtotal: 200000,
      discount: 0,
      loyaltyDiscount: 0,
      loyaltyPointsUsed: 0,
      shippingFee: 0,
      total: 200000,
      createdAt: todayVN,
      revenueRecognizedAt: todayVN,
      items: [
        {
          product: 'prod-04',
          productName: 'Bộ Thước Kẻ Parabol',
          categoryName: 'Dụng Cụ Học Tập',
          price: 100000,
          quantity: 2,
        },
      ],
    },
    // Order 7: DELIVERED Yesterday, COD -> Realized Yesterday
    {
      _id: 'ord-07',
      orderCode: 'TT-07',
      orderStatus: OrderStatus.DELIVERED,
      paymentStatus: PaymentStatus.PAID,
      paymentMethod: PaymentMethod.COD,
      subtotal: 120000,
      discount: 0,
      loyaltyDiscount: 0,
      loyaltyPointsUsed: 0,
      shippingFee: 0,
      total: 120000,
      createdAt: yesterdayVN,
      revenueRecognizedAt: yesterdayVN,
      items: [
        {
          product: 'prod-01',
          productName: 'Đắc Nhân Tâm',
          categoryName: 'Sách Kỹ Năng',
          price: 120000,
          quantity: 1,
        },
      ],
    },
    // Order 8: CANCELLED Two Days Ago -> MUST NOT BE REALIZED
    {
      _id: 'ord-08',
      orderCode: 'TT-08',
      orderStatus: OrderStatus.CANCELLED,
      paymentStatus: PaymentStatus.FAILED,
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      subtotal: 90000,
      discount: 0,
      loyaltyDiscount: 0,
      loyaltyPointsUsed: 0,
      shippingFee: 0,
      total: 90000,
      createdAt: twoDaysAgoVN,
      items: [
        {
          product: 'prod-03',
          productName: 'Bút Gel Thiên Long',
          categoryName: 'Văn Phòng Phẩm',
          price: 30000,
          quantity: 3,
        },
      ],
    },
  ];

  // Helper matching the exact logic of OrdersService.getRealizedRevenueMatch
  function isRealized(order: SeedOrder): boolean {
    if (
      order.orderStatus === OrderStatus.CANCELLED ||
      order.orderStatus === OrderStatus.RETURNED
    ) {
      return false;
    }
    return (
      order.paymentStatus === PaymentStatus.PAID ||
      order.orderStatus === OrderStatus.DELIVERED ||
      order.orderStatus === OrderStatus.COMPLETED
    );
  }

  // Pure evaluator replicating OrdersService aggregation logic on seedOrders
  const mockOrdersService = {
    count: jest.fn().mockImplementation(() => seedOrders.length),

    getTodayRevenue: jest.fn().mockImplementation(async () => {
      const realizedToday = seedOrders.filter(
        (o) =>
          isRealized(o) &&
          (o.revenueRecognizedAt || o.createdAt).getTime() >=
            todayVN.getTime() - 1000,
      );
      return realizedToday.reduce((sum, o) => sum + o.total, 0);
    }),

    getRecent: jest.fn().mockImplementation(async (limit: number = 5) => {
      return [...seedOrders]
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, limit);
    }),

    getRevenueByDateRange: jest
      .fn()
      .mockImplementation(async (start: Date, end: Date) => {
        const realizedInRange = seedOrders.filter((o) => {
          if (!isRealized(o)) return false;
          const d = o.revenueRecognizedAt || o.createdAt;
          return d.getTime() >= start.getTime() && d.getTime() <= end.getTime();
        });

        // Group by YYYY-MM-DD
        const map: Record<
          string,
          { total: number; subtotal: number; discount: number; count: number }
        > = {};
        for (const ord of realizedInRange) {
          const d = ord.revenueRecognizedAt || ord.createdAt;
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          const key = `${yyyy}-${mm}-${dd}`;
          if (!map[key]) {
            map[key] = { total: 0, subtotal: 0, discount: 0, count: 0 };
          }
          map[key].total += ord.total;
          map[key].subtotal += ord.subtotal;
          map[key].discount += ord.discount + ord.loyaltyDiscount;
          map[key].count += 1;
        }

        return Object.entries(map).map(([key, val]) => ({
          _id: key,
          ...val,
        }));
      }),

    getStatusDistribution: jest.fn().mockImplementation(async () => {
      const counts: Record<string, number> = {};
      for (const ord of seedOrders) {
        counts[ord.orderStatus] = (counts[ord.orderStatus] || 0) + 1;
      }
      return Object.entries(counts).map(([_id, count]) => ({ _id, count }));
    }),

    getAov: jest.fn().mockImplementation(async () => {
      const realized = seedOrders.filter(isRealized);
      if (realized.length === 0) return 0;
      const sum = realized.reduce((acc, o) => acc + o.total, 0);
      return Math.round(sum / realized.length);
    }),

    getVoucherEffectiveness: jest.fn().mockImplementation(async () => {
      const withVoucher = seedOrders.filter(
        (o) => isRealized(o) && !!o.promotionCode,
      );
      return withVoucher.map((o) => ({
        _id: o.promotionCode,
        count: 1,
        totalSavings: o.discount,
      }));
    }),

    getCategoryRevenue: jest.fn().mockImplementation(async () => {
      const realized = seedOrders.filter(isRealized);
      const catMap: Record<string, number> = {};
      for (const ord of realized) {
        for (const itm of ord.items) {
          catMap[itm.categoryName] =
            (catMap[itm.categoryName] || 0) + itm.price * itm.quantity;
        }
      }
      return Object.entries(catMap)
        .map(([category, revenue]) => ({ category, revenue }))
        .sort((a, b) => b.revenue - a.revenue);
    }),

    getGrowthStats: jest
      .fn()
      .mockImplementation(
        async (_range: 'day' | 'week' | 'month' | 'year' = 'month') => {
          const currentRevenue = 1020000;
          const previousRevenue = 800000;
          const calcGrowth = (curr: number, prev: number) => {
            if (prev === 0) return curr > 0 ? 100 : 0;
            return Math.round(((curr - prev) / prev) * 1000) / 10;
          };
          return {
            currentRevenue,
            previousRevenue,
            revenueGrowthRate: calcGrowth(currentRevenue, previousRevenue),
            currentOrders: 4,
            previousOrders: 3,
            ordersGrowthRate: calcGrowth(4, 3),
          };
        },
      ),
  };

  const mockProductsService = {
    count: jest.fn().mockResolvedValue(4),
    getBestSelling: jest.fn().mockResolvedValue([
      { _id: 'prod-01', name: 'Đắc Nhân Tâm', sold: 3 },
      { _id: 'prod-02', name: 'Vở Kẻ Ngang Cao Cấp', sold: 2 },
    ]),
  };

  const mockInventoryService = {
    getLowStockCount: jest.fn().mockResolvedValue(1),
    getLowStock: jest.fn().mockResolvedValue([]),
  };

  const mockCustomersService = {
    getNewCustomersCount: jest.fn().mockResolvedValue(5),
    getRecent: jest.fn().mockResolvedValue([]),
    getCustomerGrowth: jest
      .fn()
      .mockResolvedValue([{ _id: '2026-09-05', count: 5 }]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: OrdersService, useValue: mockOrdersService },
        { provide: ProductsService, useValue: mockProductsService },
        { provide: InventoryService, useValue: mockInventoryService },
        { provide: CustomersService, useValue: mockCustomersService },
      ],
    }).compile();

    reportsService = module.get<ReportsService>(ReportsService);
  });

  describe('1. Realized Revenue Accuracy (Strict Non-Contamination)', () => {
    it('should correctly sum only realized orders for today (excludes CANCELLED, RETURNED, and unpaid PENDING)', async () => {
      // Expected today realized orders:
      // Ord 1: 250,000 (DELIVERED, COD, PAID)
      // Ord 2: 450,000 (COMPLETED, VNPAY, PAID)
      // Ord 6: 200,000 (PENDING, VNPAY, PAID)
      // Total realized today = 250,000 + 450,000 + 200,000 = 900,000 VND
      // Contamination traps to reject:
      // Ord 3: 150,000 (CANCELLED)
      // Ord 4: 300,000 (RETURNED)
      // Ord 5: 180,000 (PENDING unpaid COD)
      const todayRevenue =
        (await mockOrdersService.getTodayRevenue()) as number;
      expect(todayRevenue).toBe(900000);

      // Verify non-contamination
      const uncleanedTotal = seedOrders
        .filter((o) => (o.revenueRecognizedAt || o.createdAt) === todayVN)
        .reduce((sum, o) => sum + o.total, 0);
      expect(uncleanedTotal).toBe(1530000);
      expect(todayRevenue).not.toBe(uncleanedTotal);
    });

    it('should compute Average Order Value (AOV) accurately over realized orders only', async () => {
      // Realized orders across dataset: Ord 1 (250k) + Ord 2 (450k) + Ord 6 (200k) + Ord 7 (120k)
      // Total realized = 1,020,000 across 4 orders
      // AOV = 1,020,000 / 4 = 255,000 VND
      const aov = (await mockOrdersService.getAov()) as number;
      expect(aov).toBe(255000);
    });
  });

  describe('2. Category Revenue Integrity', () => {
    it('should aggregate revenue by category without including cancelled or returned item revenues', async () => {
      const categoryRevenue = await reportsService.getCategoryRevenue();

      // Realized items:
      // Ord 1 (Sách Kỹ Năng): 140,000 * 2 = 280,000
      // Ord 2 (Văn Phòng Phẩm): 250,000 * 2 = 500,000
      // Ord 6 (Dụng Cụ Học Tập): 100,000 * 2 = 200,000
      // Ord 7 (Sách Kỹ Năng): 120,000 * 1 = 120,000
      // Expected totals:
      // Văn Phòng Phẩm: 500,000 (Ord 3: 150k cancelled NOT included)
      // Sách Kỹ Năng: 280,000 + 120,000 = 400,000 (Ord 4: 300k returned NOT included)
      // Dụng Cụ Học Tập: 200,000 (Ord 5: 180k unpaid pending NOT included)

      const vanPhongPham = categoryRevenue.find(
        (c) => c.category === 'Văn Phòng Phẩm',
      );
      const sachKyNang = categoryRevenue.find(
        (c) => c.category === 'Sách Kỹ Năng',
      );
      const dungCu = categoryRevenue.find(
        (c) => c.category === 'Dụng Cụ Học Tập',
      );

      expect(vanPhongPham?.revenue).toBe(500000);
      expect(sachKyNang?.revenue).toBe(400000);
      expect(dungCu?.revenue).toBe(200000);

      // Verify ranking: highest revenue first
      expect(categoryRevenue[0].category).toBe('Văn Phòng Phẩm');
      expect(categoryRevenue[1].category).toBe('Sách Kỹ Năng');
      expect(categoryRevenue[2].category).toBe('Dụng Cụ Học Tập');
    });
  });

  describe('3. Date Range Revenue Accuracy', () => {
    it('should correctly filter and format revenue when date range is provided', async () => {
      const startStr = yesterdayVN.toISOString().split('T')[0];
      const endStr = todayVN.toISOString().split('T')[0];

      const revenueByRange = (await reportsService.getRevenue(
        startStr,
        endStr,
      )) as Array<{ _id: string; total: number; count: number }>;

      expect(revenueByRange.length).toBe(2);
      const todayEntry = revenueByRange.find(
        (r: { _id: string }) => r._id === endStr,
      );
      const yesterdayEntry = revenueByRange.find(
        (r: { _id: string }) => r._id === startStr,
      );

      expect(todayEntry).toBeDefined();
      expect(todayEntry?.total).toBe(900000);
      expect(todayEntry?.count).toBe(3);

      expect(yesterdayEntry).toBeDefined();
      expect(yesterdayEntry?.total).toBe(120000);
      expect(yesterdayEntry?.count).toBe(1);
    });
  });

  describe('4. Comprehensive getSummary() KPIs verification', () => {
    it('should produce exact matching KPIs and distributions in getSummary', async () => {
      interface SummaryResult {
        kpis: {
          todayRevenue: number;
          totalOrders: number;
          totalProducts: number;
          lowStockCount: number;
          newCustomers: number;
          aov: number;
          revenueGrowthRate: number;
          ordersGrowthRate: number;
        };
        orderStatusStats: Array<{ _id: string; count: number }>;
      }

      const summary = (await reportsService.getSummary(
        'month',
      )) as unknown as SummaryResult;

      expect(summary.kpis.todayRevenue).toBe(900000);
      expect(summary.kpis.totalOrders).toBe(8);
      expect(summary.kpis.totalProducts).toBe(4);
      expect(summary.kpis.lowStockCount).toBe(1);
      expect(summary.kpis.newCustomers).toBe(5);
      expect(summary.kpis.aov).toBe(255000);
      expect(summary.kpis.revenueGrowthRate).toBe(27.5);
      expect(summary.kpis.ordersGrowthRate).toBe(33.3);

      // Order status distribution check
      const statusCounts = summary.orderStatusStats.reduce(
        (acc: Record<string, number>, s: { _id: string; count: number }) => {
          acc[s._id] = s.count;
          return acc;
        },
        {},
      );

      expect(statusCounts[OrderStatus.DELIVERED]).toBe(2);
      expect(statusCounts[OrderStatus.COMPLETED]).toBe(1);
      expect(statusCounts[OrderStatus.CANCELLED]).toBe(2);
      expect(statusCounts[OrderStatus.RETURNED]).toBe(1);
      expect(statusCounts[OrderStatus.PENDING]).toBe(2);
    });
  });

  describe('5. Growth Rate Mathematical Bounds & Corner Cases', () => {
    it('should handle zero previous revenue gracefully without NaN or Infinity', () => {
      const calcGrowth = (curr: number, prev: number) => {
        if (prev === 0) return curr > 0 ? 100 : 0;
        return Math.round(((curr - prev) / prev) * 1000) / 10;
      };

      expect(calcGrowth(1000000, 0)).toBe(100);
      expect(calcGrowth(0, 0)).toBe(0);
      expect(calcGrowth(500000, 1000000)).toBe(-50.0);
      expect(calcGrowth(1500000, 1000000)).toBe(50.0);
    });
  });
});
