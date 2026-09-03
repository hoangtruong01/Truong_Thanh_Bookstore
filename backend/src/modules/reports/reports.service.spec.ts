import { Test, TestingModule } from '@nestjs/testing';
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
});
