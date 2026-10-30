import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { ReportsService } from './reports.service';
import { OrdersService } from '../orders/orders.service';
import { ProductsService } from '../products/products.service';
import { InventoryService } from '../inventory/inventory.service';
import { CustomersService } from '../customers/customers.service';
import { OrderStatus } from '../../common/enums';

describe('ReportsService', () => {
  let service: ReportsService;
  let mockOrdersService: any;
  let mockProductsService: any;
  let mockInventoryService: any;
  let mockCustomersService: any;

  beforeEach(async () => {
    mockOrdersService = {
      getTodayRevenue: jest.fn().mockResolvedValue(1500000),
      count: jest.fn().mockResolvedValue(120),
      getRecent: jest.fn().mockResolvedValue([
        {
          _id: 'order1',
          orderCode: 'TTB-001',
          total: 500000,
          customerName: 'Khách A',
          orderStatus: OrderStatus.PENDING,
          createdAt: new Date(),
        },
      ]),
      getRevenueByDateRange: jest
        .fn()
        .mockResolvedValue([
          { _id: '2026-08-30', totalRevenue: 1500000, orderCount: 3 },
        ]),
      getStatusDistribution: jest.fn().mockResolvedValue({
        [OrderStatus.PENDING]: 5,
        [OrderStatus.CONFIRMED]: 10,
        [OrderStatus.DELIVERED]: 80,
      }),
      getAov: jest.fn().mockResolvedValue(250000),
      getVoucherEffectiveness: jest.fn().mockResolvedValue({}),
      getCategoryRevenue: jest
        .fn()
        .mockResolvedValue([{ category: 'Sách Kỹ Năng', revenue: 12750000 }]),
      getGrowthStats: jest.fn().mockResolvedValue({
        currentRevenue: 25000000,
        previousRevenue: 20000000,
        revenueGrowthRate: 25.0,
        currentOrders: 150,
        previousOrders: 120,
        ordersGrowthRate: 25.0,
      }),
    };

    mockProductsService = {
      count: jest.fn().mockResolvedValue(450),
      getBestSelling: jest.fn().mockResolvedValue([
        {
          _id: 'prod1',
          name: 'Đắc Nhân Tâm',
          sold: 150,
          price: 85000,
          category: { name: 'Sách Kỹ Năng' },
        },
      ]),
    };

    mockInventoryService = {
      getLowStockCount: jest.fn().mockResolvedValue(4),
      getLowStock: jest.fn().mockResolvedValue([
        {
          _id: 'inv1',
          currentStock: 2,
          product: { name: 'Vở Kẻ Ngang', unit: 'quyển', _id: 'p2' },
          lastUpdated: new Date(),
        },
      ]),
    };

    mockCustomersService = {
      getNewCustomersCount: jest.fn().mockResolvedValue(25),
      getRecent: jest.fn().mockResolvedValue([
        {
          _id: 'c1',
          fullName: 'Nguyễn Thị C',
          email: 'c@gmail.com',
          createdAt: new Date(),
        },
      ]),
      getCustomerGrowth: jest
        .fn()
        .mockResolvedValue([{ _id: '2026-08-30', count: 5 }]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: OrdersService, useValue: mockOrdersService },
        { provide: ProductsService, useValue: mockProductsService },
        { provide: InventoryService, useValue: mockInventoryService },
        { provide: CustomersService, useValue: mockCustomersService },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getDashboard', () => {
    it('should aggregate todayRevenue, totalOrders, totalProducts, lowStock and newCustomers', async () => {
      const result = await service.getDashboard();
      expect(result.stats.todayRevenue).toBe(1500000);
      expect(result.stats.totalOrders).toBe(120);
      expect(result.stats.totalProducts).toBe(450);
      expect(result.stats.lowStockCount).toBe(4);
      expect(result.stats.newCustomers).toBe(25);
      expect(result.recentOrders.length).toBe(1);
      expect(result.bestSellingProducts.length).toBe(1);
    });
  });

  describe('getRevenue', () => {
    it('uses Vietnam day boundaries independent of server timezone', async () => {
      await service.getRevenue('2026-09-05', '2026-09-05');
      expect(mockOrdersService.getRevenueByDateRange).toHaveBeenCalledWith(
        new Date('2026-09-04T17:00:00.000Z'),
        new Date('2026-09-05T16:59:59.999Z'),
      );
    });

    it.each(['2026-02-30', 'bad-date', '2026-13-01'])(
      'rejects invalid date %s',
      async (date) => {
        await expect(service.getRevenue(date, '2026-09-05')).rejects.toThrow(
          'Ngày báo cáo',
        );
      },
    );

    it('rejects reversed ranges', async () => {
      await expect(
        service.getRevenue('2026-09-06', '2026-09-05'),
      ).rejects.toThrow('Ngày bắt đầu');
    });
    it('should query revenue within date range', async () => {
      const result = await service.getRevenue('2026-08-01', '2026-08-30');
      expect(result).toBeDefined();
      expect(mockOrdersService.getRevenueByDateRange).toHaveBeenCalled();
    });
  });

  describe('getSummary & getCategoryRevenue', () => {
    it('should compute comprehensive KPIs and category distribution with dynamic growth stats', async () => {
      const result = await service.getSummary('month');
      expect(result.kpis.todayRevenue).toBe(1500000);
      expect(result.kpis.totalOrders).toBe(120);
      expect(result.kpis.aov).toBe(250000);
      expect(result.kpis.revenueGrowthRate).toBe(25.0);
      expect(result.kpis.ordersGrowthRate).toBe(25.0);
      expect(mockOrdersService.getGrowthStats).toHaveBeenCalledWith('month');
      expect(result.categoryRevenue.length).toBe(1);
      expect(result.categoryRevenue[0].category).toBe('Sách Kỹ Năng');
      expect(result.categoryRevenue[0].revenue).toBe(12750000);
    });

    it('should delegate getCategoryRevenue to ordersService directly', async () => {
      const result = await service.getCategoryRevenue();
      expect(mockOrdersService.getCategoryRevenue).toHaveBeenCalled();
      expect(result.length).toBe(1);
      expect(result[0].category).toBe('Sách Kỹ Năng');
    });
  });

  describe('getNotifications', () => {
    it('should generate low stock, orders, and customer alerts', async () => {
      const result = await service.getNotifications();
      expect(result.length).toBeGreaterThanOrEqual(3);
      expect(result.some((n) => n.type === 'stock')).toBe(true);
      expect(result.some((n) => n.type === 'order')).toBe(true);
      expect(result.some((n) => n.type === 'customer')).toBe(true);
    });
  });

  describe('Sprint 3: NEW-013 & NEW-016 Omnichannel & Category Revenue', () => {
    it('NEW-013: aggregates omnichannel revenue combining Online + POS with refund deduction and COGS', async () => {
      // Create mock POSOrderModel with 1 POS order
      const mockPOSOrderModel: any = {
        find: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue([
              {
                _id: 'pos-01',
                invoiceCode: 'HD260905-0001',
                createdAt: new Date('2026-09-05T03:00:00.000Z'), // 10:00 AM VN
                subtotal: 2200000,
                totalDiscountAmount: 200000,
                finalAmount: 2000000,
                totalRefundedAmount: 200000, // Net = 1,800,000
                items: [
                  {
                    quantity: 2,
                    returnedQuantity: 0,
                    conversionRatio: 1,
                    costPrice: 500000, // COGS = 1,000,000
                  },
                ],
              },
            ]),
          }),
        }),
      };

      const customReportsService = new ReportsService(
        mockOrdersService,
        mockProductsService,
        mockInventoryService,
        mockCustomersService,
        mockPOSOrderModel,
      );

      // Online mock returns: date '2026-09-05', total 1,000,000
      mockOrdersService.getRevenueByDateRange.mockResolvedValueOnce([
        {
          _id: '2026-09-05',
          subtotal: 1000000,
          discount: 0,
          total: 1000000,
          count: 1,
        },
      ]);

      const result = await customReportsService.getRevenue(
        '2026-09-05',
        '2026-09-05',
        'ALL',
      );

      expect(result.length).toBe(1);
      const row = result[0];
      // Total net = 1,000,000 (online) + (2,000,000 - 200,000) (pos) = 2,800,000
      expect(row.total).toBe(2800000);
      expect(row.refund).toBe(200000);
      expect(row.cogs).toBe(1000000);
      expect(row.grossProfit).toBe(1800000); // 2,800,000 - 1,000,000
      expect(row.count).toBe(2);
    });

    it('NEW-016: category revenue aggregates both Online and POS categories', async () => {
      const mockPOSOrderModel: any = {
        find: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue([
                {
                  status: 'COMPLETED',
                  items: [
                    {
                      quantity: 3,
                      returnedQuantity: 1,
                      effectiveLineTotal: 150000,
                      netUnitPrice: 50000, // soldQty = 2 * 50k = 100k
                      product: {
                        name: 'Bút Bi',
                        category: { name: 'Văn Phòng Phẩm' },
                      },
                    },
                  ],
                },
              ]),
            }),
          }),
        }),
      };

      const customReportsService = new ReportsService(
        mockOrdersService,
        mockProductsService,
        mockInventoryService,
        mockCustomersService,
        mockPOSOrderModel,
      );

      mockOrdersService.getCategoryRevenue.mockResolvedValueOnce([
        { category: 'Sách Kỹ Năng', revenue: 500000 },
      ]);

      const result = await customReportsService.getCategoryRevenue(
        '2026-09-01',
        '2026-09-05',
        'ALL',
      );

      expect(result.length).toBe(2);
      expect(result).toEqual(
        expect.arrayContaining([
          { category: 'Sách Kỹ Năng', revenue: 500000 },
          { category: 'Văn Phòng Phẩm', revenue: 100000 },
        ]),
      );
    });
  });

  describe('Sprint 5: ERP-05 & ERP-06 Inventory Ledger, Gross Profit & Smart Reordering', () => {
    it('ERP-05: getInventoryLedgerAndProfit tính toán chính xác Tồn đầu, Nhập, Xuất, Điều chỉnh, Tồn cuối, COGS và Lãi gộp', async () => {
      const pId = new Types.ObjectId();
      const mockProduct = {
        _id: pId,
        sku: 'SKU-BUTBI',
        name: 'Bút Bi TL-027',
        category: { name: 'Văn Phòng Phẩm' },
        stock: 50,
        unit: 'cái',
      };

      const mockProductModel: any = {
        find: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue([mockProduct]),
            }),
          }),
        }),
      };

      const mockInventoryDataModel: any = {
        find: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue([
              {
                product: pId,
                currentStock: 50,
                costPrice: 4000,
              },
            ]),
          }),
        }),
      };

      const mockTransactionModel: any = {
        find: jest
          .fn()
          // 1st call for periodTx
          .mockReturnValueOnce({
            lean: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue([
                { product: pId, type: 'IMPORT', change: 40 },
                { product: pId, type: 'SALE', change: -20 },
                { product: pId, type: 'ADJUSTMENT', change: -2 },
              ]),
            }),
          })
          // 2nd call for afterPeriodTx
          .mockReturnValueOnce({
            lean: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue([]),
            }),
          }),
      };

      const mockPosOrderModel: any = {
        find: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue([
              {
                items: [
                  {
                    product: pId,
                    quantity: 20,
                    netUnitPrice: 6000,
                    returnedQuantity: 0,
                  },
                ],
              },
            ]),
          }),
        }),
      };

      const customService = new ReportsService(
        mockOrdersService,
        mockProductsService,
        mockInventoryService,
        mockCustomersService,
        mockPosOrderModel,
        undefined, // orderModel
        mockInventoryDataModel,
        mockTransactionModel,
        mockProductModel,
      );

      const res = await customService.getInventoryLedgerAndProfit({
        startDate: '2026-10-01',
        endDate: '2026-10-31',
      });

      expect(res.data.length).toBe(1);
      const row = res.data[0];
      expect(row.closingStock).toBe(50);
      // closingStock = opening + import - export + adjust => 50 = opening + 40 - 20 - 2 => opening = 32
      expect(row.openingStock).toBe(32);
      expect(row.importQty).toBe(40);
      expect(row.exportQty).toBe(20);
      expect(row.adjustQty).toBe(-2);
      expect(row.revenue).toBe(120000); // 20 * 6000
      expect(row.cogs).toBe(80000); // 20 * 4000
      expect(row.grossProfit).toBe(40000); // 120000 - 80000
      expect(row.grossMargin).toBeCloseTo(33.33, 1);
    });

    it('ERP-06: getReorderSuggestions đề xuất lượng nhập chính xác theo TargetStock, PendingPO và DailyRunRate', async () => {
      const pId = new Types.ObjectId();
      const mockProduct = {
        _id: pId,
        sku: 'SKU-VO-KE-NGANG',
        name: 'Vở Kẻ Ngang 200 Trang',
        stock: 5, // Tồn thấp
        category: { name: 'Vở Viết' },
        unit: 'quyển',
      };

      const mockProductModel: any = {
        find: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue([mockProduct]),
            }),
          }),
        }),
      };

      const mockInventoryDataModel: any = {
        find: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue([
              {
                product: pId,
                currentStock: 5,
                minStock: 20, // min 20 => targetStock = 50
                costPrice: 10000,
              },
            ]),
          }),
        }),
      };

      // Đang có PO đặt 15 quyển chưa giao
      const mockPoModel: any = {
        find: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue([
              {
                items: [
                  {
                    product: pId,
                    orderedQuantity: 20,
                    receivedQuantity: 5, // còn 15
                    conversionRatio: 1,
                  },
                ],
              },
            ]),
          }),
        }),
      };

      // Bán được 60 quyển trong 30 ngày => daily rate = 2 quyển/ngày
      const mockPosOrderModel: any = {
        find: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue([
              {
                createdAt: new Date(),
                items: [
                  {
                    product: pId,
                    quantity: 60,
                    returnedQuantity: 0,
                  },
                ],
              },
            ]),
          }),
        }),
      };

      const customService = new ReportsService(
        mockOrdersService,
        mockProductsService,
        mockInventoryService,
        mockCustomersService,
        mockPosOrderModel,
        undefined, // orderModel
        mockInventoryDataModel,
        undefined, // transactionModel
        mockProductModel,
        mockPoModel,
      );

      const res = await customService.getReorderSuggestions({});
      expect(res.data.length).toBe(1);
      const sug = res.data[0];
      expect(sug.currentStock).toBe(5);
      expect(sug.minStock).toBe(20);
      expect(sug.targetStock).toBe(50);
      expect(sug.pendingPOQty).toBe(15);
      // SuggestedQty = targetStock (50) - (currentStock 5 + pendingPO 15) = 30
      expect(sug.suggestedQty).toBe(30);
      expect(sug.dailyRunRate).toBe(2);
      // Days until stockout = 5 / 2 = 2.5 => round 3 ngày => CRITICAL
      expect(sug.daysUntilStockout).toBe(3);
      expect(sug.urgency).toBe('CRITICAL');
    });
  });
});
