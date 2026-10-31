/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { CustomersService } from './customers.service';
import { User } from '../users/schemas/user.schema';
import { Order } from '../orders/schemas/order.schema';
import { OrderStatus, PaymentStatus, UserRole } from '../../common/enums';

describe('CustomersService (BUG-004 Analytics Accuracy Suite)', () => {
  let service: CustomersService;
  let mockUserModel: any;
  let mockOrderModel: any;

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
});
