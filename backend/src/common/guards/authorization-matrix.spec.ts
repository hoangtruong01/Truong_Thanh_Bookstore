/* eslint-disable @typescript-eslint/unbound-method, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */
import * as crypto from 'crypto';
import { Test, TestingModule } from '@nestjs/testing';
import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { RolesGuard } from './roles.guard';
import { PermissionsGuard } from './permissions.guard';
import { UserRole, StaffPermission } from '../enums';
import { OrdersController } from '../../modules/orders/orders.controller';
import { UsersController } from '../../modules/users/users.controller';
import { PaymentsController } from '../../modules/payments/payments.controller';
import { ReportsController } from '../../modules/reports/reports.controller';
import { OrdersService } from '../../modules/orders/orders.service';
import { UsersService } from '../../modules/users/users.service';
import { ProductsService } from '../../modules/products/products.service';
import { PromotionsService } from '../../modules/promotions/promotions.service';
import { NotificationsService } from '../../modules/notifications/notifications.service';
import { EmailService } from '../../modules/email/email.service';
import { Order } from '../../modules/orders/schemas/order.schema';

describe('QA-01: Authorization Matrix & Security Regression Suite', () => {
  let reflector: Reflector;
  let rolesGuard: RolesGuard;
  let permissionsGuard: PermissionsGuard;

  // Actors definitions
  const superAdminActor = {
    _id: '507f1f77bcf86cd799439001',
    email: 'superadmin@truongthanh.vn',
    role: UserRole.SUPER_ADMIN,
    status: true,
    permissions: [],
  };

  const adminActor = {
    _id: '507f1f77bcf86cd799439002',
    email: 'admin@truongthanh.vn',
    role: UserRole.ADMIN,
    status: true,
    permissions: [],
  };

  const staffWithOrdersPermission = {
    _id: '507f1f77bcf86cd799439003',
    email: 'staff_orders@truongthanh.vn',
    role: UserRole.STAFF,
    status: true,
    permissions: [StaffPermission.MANAGE_ORDERS],
  };

  const staffWithReportsPermission = {
    _id: '507f1f77bcf86cd799439004',
    email: 'staff_reports@truongthanh.vn',
    role: UserRole.STAFF,
    status: true,
    permissions: [StaffPermission.VIEW_REPORTS],
  };

  const staffWithoutPermission = {
    _id: '507f1f77bcf86cd799439005',
    email: 'staff_noperm@truongthanh.vn',
    role: UserRole.STAFF,
    status: true,
    permissions: [],
  };

  const customerA = {
    _id: '507f1f77bcf86cd799439006',
    email: 'customera@gmail.com',
    role: UserRole.CUSTOMER,
    status: true,
    permissions: [],
  };

  const customerB = {
    _id: '507f1f77bcf86cd799439007',
    email: 'customerb@gmail.com',
    role: UserRole.CUSTOMER,
    status: true,
    permissions: [],
  };

  const createMockContext = (
    user: any,
    targetHandler: (...args: unknown[]) => unknown,
    targetClass: any,
  ): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: () => targetHandler,
      getClass: () => targetClass,
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    reflector = new Reflector();
    rolesGuard = new RolesGuard(reflector);
    permissionsGuard = new PermissionsGuard(reflector);
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // PHẦN B: AUTHORIZATION MATRIX ACROSS MODULES
  // ═════════════════════════════════════════════════════════════════════════════

  describe('Module 1: Orders Authorization Matrix', () => {
    const handler = OrdersController.prototype.findAll;
    const targetClass = OrdersController;

    it('SUPER_ADMIN can access all orders list', () => {
      const ctx = createMockContext(superAdminActor, handler, targetClass);
      expect(permissionsGuard.canActivate(ctx)).toBe(true);
    });

    it('ADMIN can access all orders list', () => {
      const ctx = createMockContext(adminActor, handler, targetClass);
      expect(permissionsGuard.canActivate(ctx)).toBe(true);
    });

    it('STAFF with MANAGE_ORDERS permission can access all orders list', () => {
      const ctx = createMockContext(
        staffWithOrdersPermission,
        handler,
        targetClass,
      );
      expect(permissionsGuard.canActivate(ctx)).toBe(true);
    });

    it('STAFF WITHOUT MANAGE_ORDERS permission must be REJECTED (403 Forbidden)', () => {
      const ctx = createMockContext(
        staffWithoutPermission,
        handler,
        targetClass,
      );
      expect(() => permissionsGuard.canActivate(ctx)).toThrow(
        ForbiddenException,
      );
    });

    it('CUSTOMER attempting to view all orders must be REJECTED (403 Forbidden)', () => {
      const ctx = createMockContext(customerA, handler, targetClass);
      expect(() => permissionsGuard.canActivate(ctx)).toThrow(
        ForbiddenException,
      );
    });

    it('Anonymous user (not logged in) must be REJECTED with 401 Unauthorized', () => {
      const ctx = createMockContext(undefined, handler, targetClass);
      expect(() => permissionsGuard.canActivate(ctx)).toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('Module 2: Users Management Authorization Matrix', () => {
    const handler = UsersController.prototype.findAllUsers;
    const targetClass = UsersController;

    it('SUPER_ADMIN can access users list', () => {
      const ctx = createMockContext(superAdminActor, handler, targetClass);
      expect(rolesGuard.canActivate(ctx)).toBe(true);
    });

    it('ADMIN can access users list', () => {
      const ctx = createMockContext(adminActor, handler, targetClass);
      expect(rolesGuard.canActivate(ctx)).toBe(true);
    });

    it('STAFF cannot access user list (403 Forbidden)', () => {
      const ctx = createMockContext(
        staffWithOrdersPermission,
        handler,
        targetClass,
      );
      expect(() => rolesGuard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('CUSTOMER cannot access user list (403 Forbidden)', () => {
      const ctx = createMockContext(customerA, handler, targetClass);
      expect(() => rolesGuard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('Anonymous user must be REJECTED with 401 Unauthorized', () => {
      const ctx = createMockContext(undefined, handler, targetClass);
      expect(() => rolesGuard.canActivate(ctx)).toThrow(UnauthorizedException);
    });
  });

  describe('Module 3: Payments Authorization Matrix', () => {
    const handler = PaymentsController.prototype.findAll;
    const targetClass = PaymentsController;

    it('ADMIN has full access to payments audit list', () => {
      const ctx = createMockContext(adminActor, handler, targetClass);
      expect(permissionsGuard.canActivate(ctx)).toBe(true);
    });

    it('STAFF with MANAGE_ORDERS can view payments list', () => {
      const ctx = createMockContext(
        staffWithOrdersPermission,
        handler,
        targetClass,
      );
      expect(permissionsGuard.canActivate(ctx)).toBe(true);
    });

    it('STAFF without permission is REJECTED from viewing payments (403 Forbidden)', () => {
      const ctx = createMockContext(
        staffWithoutPermission,
        handler,
        targetClass,
      );
      expect(() => permissionsGuard.canActivate(ctx)).toThrow(
        ForbiddenException,
      );
    });

    it('CUSTOMER is REJECTED from viewing all payments (403 Forbidden)', () => {
      const ctx = createMockContext(customerA, handler, targetClass);
      expect(() => permissionsGuard.canActivate(ctx)).toThrow(
        ForbiddenException,
      );
    });
  });

  describe('Module 4: Reports Authorization Matrix', () => {
    const handler = ReportsController.prototype.getDashboard;
    const targetClass = ReportsController;

    it('ADMIN has full access to reports', () => {
      const ctx = createMockContext(adminActor, handler, targetClass);
      expect(permissionsGuard.canActivate(ctx)).toBe(true);
    });

    it('STAFF with VIEW_REPORTS permission can view dashboard reports', () => {
      const ctx = createMockContext(
        staffWithReportsPermission,
        handler,
        targetClass,
      );
      expect(permissionsGuard.canActivate(ctx)).toBe(true);
    });

    it('STAFF without VIEW_REPORTS is REJECTED from reports (403 Forbidden)', () => {
      const ctx = createMockContext(
        staffWithOrdersPermission,
        handler,
        targetClass,
      );
      expect(() => permissionsGuard.canActivate(ctx)).toThrow(
        ForbiddenException,
      );
    });

    it('CUSTOMER is REJECTED from reports (403 Forbidden)', () => {
      const ctx = createMockContext(customerA, handler, targetClass);
      expect(() => permissionsGuard.canActivate(ctx)).toThrow(
        ForbiddenException,
      );
    });
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // PHẦN C: SECURITY REGRESSION & IDOR PREVENTION
  // ═════════════════════════════════════════════════════════════════════════════

  describe('Part C: Security Regression & IDOR Protection', () => {
    let ordersService: OrdersService;
    let mockOrderModel: any;

    const mockOrderCustomerB = {
      _id: '607f1f77bcf86cd799439999',
      orderCode: 'TT112233',
      customer: {
        _id: customerB._id,
        fullName: 'Customer B',
        email: customerB.email,
      },
      orderStatus: 'PENDING',
      total: 150000,
    };

    beforeEach(async () => {
      mockOrderModel = {
        findById: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockOrderCustomerB),
          }),
          select: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockOrderCustomerB),
          }),
          exec: jest.fn().mockResolvedValue(mockOrderCustomerB),
        }),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          OrdersService,
          { provide: getModelToken(Order.name), useValue: mockOrderModel },
          { provide: ProductsService, useValue: {} },
          { provide: ConfigService, useValue: { get: jest.fn() } },
          { provide: PromotionsService, useValue: {} },
          { provide: NotificationsService, useValue: {} },
          { provide: EmailService, useValue: {} },
          { provide: UsersService, useValue: {} },
        ],
      }).compile();

      ordersService = module.get<OrdersService>(OrdersService);
    });

    it('IDOR 1: Customer A MUST NOT be able to view Order of Customer B (403 Forbidden)', async () => {
      await expect(
        ordersService.findByIdForActor(mockOrderCustomerB._id, customerA),
      ).rejects.toThrow(ForbiddenException);

      try {
        await ordersService.findByIdForActor(mockOrderCustomerB._id, customerA);
      } catch (err: any) {
        expect(err.getStatus()).toBe(403);
        expect(err.message).toContain(
          'Bạn không có quyền xem thông tin đơn hàng này',
        );
      }
    });

    it('IDOR 2: Owner (Customer B) CAN view their own Order', async () => {
      const result = await ordersService.findByIdForActor(
        mockOrderCustomerB._id,
        customerB,
      );
      expect(result).toBeDefined();
      expect(result.orderCode).toBe('TT112233');
    });

    it('IDOR 3: Admin / SuperAdmin CAN view any Customer Order', async () => {
      const result = await ordersService.findByIdForActor(
        mockOrderCustomerB._id,
        adminActor,
      );
      expect(result).toBeDefined();
      expect(result.orderCode).toBe('TT112233');
    });

    it('IDOR 4: Customer A MUST NOT be able to cancel Order of Customer B (403 Forbidden)', async () => {
      await expect(
        ordersService.cancelForActor(mockOrderCustomerB._id, customerA),
      ).rejects.toThrow(ForbiddenException);
    });

    it('Guest Order Security: Accessing guest order with MISSING token must throw 403', async () => {
      await expect(
        ordersService.findGuestById(mockOrderCustomerB._id, undefined),
      ).rejects.toThrow(ForbiddenException);
    });

    it('Guest Order Security: Accessing guest order with WRONG token must throw 403', async () => {
      const correctSecret = 'super_secret_guest_token_123';
      const wrongSecret = 'hacker_guessed_token_999';
      const hashedSecret = crypto
        .createHash('sha256')
        .update(correctSecret)
        .digest('hex');

      const mockGuestOrder = {
        _id: '607f1f77bcf86cd799439888',
        orderCode: 'TT888888',
        customer: null, // guest order has no user account
        guestAccessTokenHash: hashedSecret,
      };

      mockOrderModel.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockGuestOrder),
        }),
      });

      await expect(
        ordersService.findGuestById(mockGuestOrder._id, wrongSecret),
      ).rejects.toThrow(ForbiddenException);

      // But with correct secret -> PASS
      const guestResult = await ordersService.findGuestById(
        mockGuestOrder._id,
        correctSecret,
      );
      expect(guestResult).toBeDefined();
      expect(guestResult.orderCode).toBe('TT888888');
    });
  });
});
