/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { CustomersService } from './customers.service';
import { User } from '../users/schemas/user.schema';
import { Order } from '../orders/schemas/order.schema';
import { CustomerCRMProfile } from './schemas/customer-crm-profile.schema';
import {
  OrderStatus,
  PaymentStatus,
  UserRole,
  CustomerType,
  CustomerCRMTier,
  CarePriority,
} from '../../common/enums';

describe('CustomersService (BUG-004 Analytics Accuracy Suite)', () => {
  let service: CustomersService;
  let mockUserModel: any;
  let mockOrderModel: any;
  let mockCrmProfileModel: any;

  const mockCustomerId = new Types.ObjectId();
  const mockUserDoc = {
    _id: mockCustomerId,
    fullName: 'Nguyễn Văn Khách',
    email: 'khachhang@example.com',
    phone: '0901234567',
    role: UserRole.CUSTOMER,
    toObject: () => ({
      _id: mockCustomerId,
      fullName: 'Nguyễn Văn Khách',
      email: 'khachhang@example.com',
      phone: '0901234567',
      role: UserRole.CUSTOMER,
    }),
  };

  beforeEach(async () => {
    mockUserModel = {
      find: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockUserDoc]),
      }),
      countDocuments: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(1),
      }),
      findById: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockUserDoc),
      }),
      aggregate: jest.fn().mockResolvedValue([]),
    };

    mockOrderModel = {
      aggregate: jest.fn(),
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      }),
    };

    mockCrmProfileModel = {
      findOne: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      }),
      find: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      }),
      create: jest.fn().mockImplementation((data: any) => ({
        ...data,
        tierAuditLog: [],
        save: jest.fn().mockResolvedValue(data),
      })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
        {
          provide: getModelToken(Order.name),
          useValue: mockOrderModel,
        },
        {
          provide: getModelToken(CustomerCRMProfile.name),
          useValue: mockCrmProfileModel,
        },
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
  });

  describe('findAll (Enrichment with Realized Revenue)', () => {
    it('filters out CANCELLED and RETURNED orders and sums realized revenue', async () => {
      mockOrderModel.aggregate.mockResolvedValue([
        {
          _id: mockCustomerId,
          totalOrders: 3,
          totalSpent: 450000,
        },
      ]);

      const result = await service.findAll(1, 10);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].totalOrders).toBe(3);
      expect(result.data[0].totalSpent).toBe(450000);

      // Verify the aggregation pipeline excludes CANCELLED and RETURNED
      expect(mockOrderModel.aggregate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            $match: expect.objectContaining({
              customer: expect.objectContaining({ $in: [mockCustomerId] }),
              orderStatus: {
                $nin: [OrderStatus.CANCELLED, OrderStatus.RETURNED],
              },
            }),
          }),
        ]),
      );
    });
  });

  describe('findById (Customer Detail with Realized Revenue)', () => {
    it('calculates totalSpent excluding cancelled and unpaid orders', async () => {
      mockOrderModel.aggregate.mockResolvedValue([
        {
          _id: null,
          totalOrders: 2,
          totalSpent: 300000,
        },
      ]);

      const result = await service.findById(mockCustomerId.toString());

      expect(result).toBeDefined();
      expect(result.totalOrders).toBe(2);
      expect(result.totalSpent).toBe(300000);

      expect(mockOrderModel.aggregate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            $match: expect.objectContaining({
              customer: mockCustomerId,
              orderStatus: {
                $nin: [OrderStatus.CANCELLED, OrderStatus.RETURNED],
              },
            }),
          }),
        ]),
      );
    });

    it('returns null if customer does not exist', async () => {
      mockUserModel.findById.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await service.findById('non_existing_id');
      expect(result).toBeNull();
    });
  });

  describe('getNewCustomersCount', () => {
    it('returns customer count within specified days', async () => {
      mockUserModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(15),
      });

      const count = await service.getNewCustomersCount(30);
      expect(count).toBe(15);
      expect(mockUserModel.countDocuments).toHaveBeenCalledWith(
        expect.objectContaining({
          role: UserRole.CUSTOMER,
        }),
      );
    });
  });

  describe('CRM-01: Quản lý khách hàng nâng cao & Hạng thẻ tự động', () => {
    it('CRM-01-T01: seeds default RETAIL and BRONZE CRM profile if none exists', async () => {
      mockCrmProfileModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const profile = await service.getOrCreateCRMProfile(mockCustomerId);

      expect(mockCrmProfileModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customer: mockCustomerId,
          customerType: CustomerType.RETAIL,
          tier: CustomerCRMTier.BRONZE,
          carePriority: CarePriority.LOW,
        }),
      );
      expect(profile.tier).toBe(CustomerCRMTier.BRONZE);
    });

    it('CRM-01-T02: evaluates tier to VIP when 365d revenue >= 100M', async () => {
      const mockProfile: any = {
        customer: mockCustomerId,
        customerType: CustomerType.WHOLESALE,
        tier: CustomerCRMTier.BRONZE,
        overdueDays: 0,
        creditBlocked: false,
        tierAuditLog: [],
        save: jest.fn().mockImplementation(function (this: any) {
          return Promise.resolve(this);
        }),
      };

      jest
        .spyOn(service, 'getOrCreateCRMProfile')
        .mockResolvedValue(mockProfile);

      // Mock 365d spending = 120M
      mockOrderModel.aggregate
        .mockResolvedValueOnce([{ totalOrders: 10, totalSpent: 120000000 }]) // total
        .mockResolvedValueOnce([{ spent: 20000000 }]) // 30d
        .mockResolvedValueOnce([{ spent: 50000000 }]) // 90d
        .mockResolvedValueOnce([{ spent: 120000000 }]); // 365d

      const evaluated = await service.evaluateCustomerTier(mockCustomerId);

      expect(evaluated.tier).toBe(CustomerCRMTier.VIP);
      expect(evaluated.tierAuditLog).toHaveLength(1);
      expect(evaluated.tierAuditLog[0].previousTier).toBe(
        CustomerCRMTier.BRONZE,
      );
      expect(evaluated.tierAuditLog[0].newTier).toBe(CustomerCRMTier.VIP);
    });

    it('CRM-01-T03: penalizes tier to BRONZE and sets HIGH priority if overdueDays > 30', async () => {
      const mockProfile: any = {
        customer: mockCustomerId,
        customerType: CustomerType.WHOLESALE,
        tier: CustomerCRMTier.GOLD,
        overdueDays: 45, // Overdue > 30 days
        creditBlocked: false,
        carePriority: CarePriority.LOW,
        tierAuditLog: [],
        save: jest.fn().mockImplementation(function (this: any) {
          return Promise.resolve(this);
        }),
      };

      jest
        .spyOn(service, 'getOrCreateCRMProfile')
        .mockResolvedValue(mockProfile);

      // High revenue (120M) but overdue
      mockOrderModel.aggregate
        .mockResolvedValueOnce([{ totalOrders: 10, totalSpent: 120000000 }])
        .mockResolvedValueOnce([{ spent: 20000000 }])
        .mockResolvedValueOnce([{ spent: 50000000 }])
        .mockResolvedValueOnce([{ spent: 120000000 }]);

      const evaluated = await service.evaluateCustomerTier(mockCustomerId);

      // Despite 120M revenue, penalized to BRONZE because overdueDays = 45
      expect(evaluated.tier).toBe(CustomerCRMTier.BRONZE);
      expect(evaluated.carePriority).toBe(CarePriority.HIGH);
      expect(evaluated.tierAuditLog[0].reason).toContain(
        'Bị hạ xuống BRONZE do nợ quá hạn > 30 ngày',
      );
    });

    it('CRM-01-T04: penalizes tier to BRONZE when creditBlocked is true', async () => {
      const mockProfile: any = {
        customer: mockCustomerId,
        customerType: CustomerType.CORPORATE,
        tier: CustomerCRMTier.PLATINUM,
        overdueDays: 0,
        creditBlocked: true,
        carePriority: CarePriority.LOW,
        tierAuditLog: [],
        save: jest.fn().mockImplementation(function (this: any) {
          return Promise.resolve(this);
        }),
      };

      jest
        .spyOn(service, 'getOrCreateCRMProfile')
        .mockResolvedValue(mockProfile);

      mockOrderModel.aggregate
        .mockResolvedValueOnce([{ totalOrders: 5, totalSpent: 60000000 }])
        .mockResolvedValueOnce([{ spent: 10000000 }])
        .mockResolvedValueOnce([{ spent: 30000000 }])
        .mockResolvedValueOnce([{ spent: 60000000 }]);

      const evaluated = await service.evaluateCustomerTier(mockCustomerId);

      expect(evaluated.tier).toBe(CustomerCRMTier.BRONZE);
      expect(evaluated.carePriority).toBe(CarePriority.HIGH);
    });

    it('CRM-01-T05: manual CRM profile update records tierAuditLog and care notes', async () => {
      const mockProfile: any = {
        customer: mockCustomerId,
        customerType: CustomerType.RETAIL,
        tier: CustomerCRMTier.BRONZE,
        carePriority: CarePriority.LOW,
        notes: '',
        tierAuditLog: [],
        save: jest.fn().mockImplementation(function (this: any) {
          return Promise.resolve(this);
        }),
      };

      jest
        .spyOn(service, 'getOrCreateCRMProfile')
        .mockResolvedValue(mockProfile);

      const updated = await service.updateCRMProfile(
        mockCustomerId,
        {
          customerType: CustomerType.SCHOOL,
          tier: CustomerCRMTier.GOLD,
          carePriority: CarePriority.MEDIUM,
          reason: 'Khách hàng đại diện trường tiểu học mua số lượng lớn',
          notes: 'Chiết khấu đặc biệt theo hợp đồng số 05/2026',
        },
        new Types.ObjectId(),
      );

      expect(updated.customerType).toBe(CustomerType.SCHOOL);
      expect(updated.tier).toBe(CustomerCRMTier.GOLD);
      expect(updated.carePriority).toBe(CarePriority.MEDIUM);
      expect(updated.notes).toBe(
        'Chiết khấu đặc biệt theo hợp đồng số 05/2026',
      );
      expect(updated.tierAuditLog).toHaveLength(1);
      expect(updated.tierAuditLog[0].previousTier).toBe(CustomerCRMTier.BRONZE);
      expect(updated.tierAuditLog[0].newTier).toBe(CustomerCRMTier.GOLD);
    });
  });
});
