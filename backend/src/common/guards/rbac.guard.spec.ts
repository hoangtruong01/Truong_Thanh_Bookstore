import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { PermissionsGuard } from './permissions.guard';
import { UserRole, StaffPermission } from '../enums';

describe('RBAC Guards Spec', () => {
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
  });

  const createMockExecutionContext = (user?: any): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
  };

  describe('RolesGuard', () => {
    let guard: RolesGuard;

    beforeEach(() => {
      guard = new RolesGuard(reflector);
    });

    it('should allow access if no roles are required', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
      const context = createMockExecutionContext({ role: UserRole.CUSTOMER, status: true });
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should throw UnauthorizedException if user is not authenticated', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);
      const context = createMockExecutionContext(undefined);
      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    });

    it('should throw ForbiddenException if user account is locked (status === false)', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);
      const context = createMockExecutionContext({
        role: UserRole.ADMIN,
        status: false,
      });
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should grant SUPER_ADMIN access to any role requirement', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);
      const superAdminContext = createMockExecutionContext({
        role: UserRole.SUPER_ADMIN,
        status: true,
      });
      expect(guard.canActivate(superAdminContext)).toBe(true);

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.STAFF]);
      expect(guard.canActivate(superAdminContext)).toBe(true);

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.SUPER_ADMIN]);
      expect(guard.canActivate(superAdminContext)).toBe(true);
    });

    it('should grant ADMIN access when required role is ADMIN or STAFF', () => {
      const adminContext = createMockExecutionContext({
        role: UserRole.ADMIN,
        status: true,
      });

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);
      expect(guard.canActivate(adminContext)).toBe(true);

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.STAFF]);
      expect(guard.canActivate(adminContext)).toBe(true);
    });

    it('should reject ADMIN when required role is only SUPER_ADMIN', () => {
      const adminContext = createMockExecutionContext({
        role: UserRole.ADMIN,
        status: true,
      });

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.SUPER_ADMIN]);
      expect(() => guard.canActivate(adminContext)).toThrow(ForbiddenException);
    });

    it('should grant STAFF access when required role includes STAFF', () => {
      const staffContext = createMockExecutionContext({
        role: UserRole.STAFF,
        status: true,
      });

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.STAFF]);
      expect(guard.canActivate(staffContext)).toBe(true);
    });

    it('should reject STAFF when required role is ADMIN or SUPER_ADMIN', () => {
      const staffContext = createMockExecutionContext({
        role: UserRole.STAFF,
        status: true,
      });

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);
      expect(() => guard.canActivate(staffContext)).toThrow(ForbiddenException);

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.SUPER_ADMIN]);
      expect(() => guard.canActivate(staffContext)).toThrow(ForbiddenException);
    });

    it('should grant CUSTOMER access only when CUSTOMER is explicitly allowed', () => {
      const customerContext = createMockExecutionContext({
        role: UserRole.CUSTOMER,
        status: true,
      });

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.CUSTOMER]);
      expect(guard.canActivate(customerContext)).toBe(true);

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);
      expect(() => guard.canActivate(customerContext)).toThrow(ForbiddenException);
    });
  });

  describe('PermissionsGuard', () => {
    let guard: PermissionsGuard;

    beforeEach(() => {
      guard = new PermissionsGuard(reflector);
    });

    it('should allow access if no permissions are required', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
      const context = createMockExecutionContext({ role: UserRole.STAFF, status: true });
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should throw UnauthorizedException if user is not authenticated', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([StaffPermission.MANAGE_ORDERS]);
      const context = createMockExecutionContext(undefined);
      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    });

    it('should throw ForbiddenException if user account is locked (status === false)', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([StaffPermission.MANAGE_ORDERS]);
      const context = createMockExecutionContext({
        role: UserRole.ADMIN,
        status: false,
      });
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should automatically allow SUPER_ADMIN without checking permissions', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([StaffPermission.MANAGE_ORDERS]);
      const context = createMockExecutionContext({
        role: UserRole.SUPER_ADMIN,
        status: true,
        permissions: [],
      });
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should automatically allow ADMIN without checking permissions', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([StaffPermission.MANAGE_ORDERS]);
      const context = createMockExecutionContext({
        role: UserRole.ADMIN,
        status: true,
        permissions: [],
      });
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow STAFF if they have the required permission', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([StaffPermission.MANAGE_ORDERS]);
      const context = createMockExecutionContext({
        role: UserRole.STAFF,
        status: true,
        permissions: [StaffPermission.MANAGE_ORDERS, StaffPermission.MANAGE_PRODUCTS],
      });
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should reject STAFF if they do not have the required permission', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([StaffPermission.MANAGE_ORDERS]);
      const context = createMockExecutionContext({
        role: UserRole.STAFF,
        status: true,
        permissions: [StaffPermission.MANAGE_PRODUCTS],
      });
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should reject CUSTOMER even if permissions list contains the permission', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([StaffPermission.MANAGE_ORDERS]);
      const context = createMockExecutionContext({
        role: UserRole.CUSTOMER,
        status: true,
        permissions: [StaffPermission.MANAGE_ORDERS],
      });
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });
  });
});
