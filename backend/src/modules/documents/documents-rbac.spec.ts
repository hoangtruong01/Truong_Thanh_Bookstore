/* eslint-disable @typescript-eslint/unbound-method */
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { UserRole, StaffPermission } from '../../common/enums';

describe('DocumentsController RBAC (SEC-P0-01)', () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new PermissionsGuard(reflector);
  });

  const createMockContext = (
    handler: (...args: unknown[]) => unknown,
    user: { role: string; permissions?: string[]; status?: boolean },
  ): ExecutionContext =>
    ({
      getHandler: () => handler,
      getClass: () => DocumentsController,
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as unknown as ExecutionContext;

  const routes = [
    {
      name: 'create (POST /documents)',
      handler: DocumentsController.prototype.create,
    },
    {
      name: 'findAll (GET /documents)',
      handler: DocumentsController.prototype.findAll,
    },
    {
      name: 'findById (GET /documents/:id)',
      handler: DocumentsController.prototype.findById,
    },
    {
      name: 'postDocument (PATCH /documents/:id/post)',
      handler: DocumentsController.prototype.postDocument,
    },
    {
      name: 'addAttachment (POST /documents/:id/attachments)',
      handler: DocumentsController.prototype.addAttachment,
    },
    {
      name: 'removeAttachment (DELETE /documents/:id/attachments/:fileId)',
      handler: DocumentsController.prototype.removeAttachment,
    },
    {
      name: 'reverseDocument (POST /documents/:id/reverse)',
      handler: DocumentsController.prototype.reverseDocument,
    },
    {
      name: 'cancelDocument (PATCH /documents/:id/cancel)',
      handler: DocumentsController.prototype.cancelDocument,
    },
  ];

  describe('SEC-01-T01 & SEC-01-T02: Deny CUSTOMER on all 8 routes', () => {
    routes.forEach(({ name, handler }) => {
      it(`should deny CUSTOMER on ${name}`, () => {
        const ctx = createMockContext(handler, {
          role: UserRole.CUSTOMER,
          permissions: [],
          status: true,
        });

        expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
      });
    });
  });

  describe('SEC-01-T03: Deny STAFF without document/finance permissions', () => {
    routes.forEach(({ name, handler }) => {
      it(`should deny unauthorized STAFF on ${name}`, () => {
        const ctx = createMockContext(handler, {
          role: UserRole.STAFF,
          permissions: [StaffPermission.MANAGE_ORDERS],
          status: true,
        });

        expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
      });
    });
  });

  describe('Allow STAFF with appropriate permissions', () => {
    it('should allow STAFF with VIEW_REPORTS to read documents (GET)', () => {
      const readCtx = createMockContext(DocumentsController.prototype.findAll, {
        role: UserRole.STAFF,
        permissions: [StaffPermission.VIEW_REPORTS],
        status: true,
      });
      expect(guard.canActivate(readCtx)).toBe(true);
    });

    it('should allow STAFF with MANAGE_DOCUMENTS to perform write operations', () => {
      const writeCtx = createMockContext(DocumentsController.prototype.create, {
        role: UserRole.STAFF,
        permissions: [StaffPermission.MANAGE_DOCUMENTS],
        status: true,
      });
      expect(guard.canActivate(writeCtx)).toBe(true);
    });

    it('should allow STAFF with MANAGE_FINANCE to perform post operations', () => {
      const postCtx = createMockContext(
        DocumentsController.prototype.postDocument,
        {
          role: UserRole.STAFF,
          permissions: [StaffPermission.MANAGE_FINANCE],
          status: true,
        },
      );
      expect(guard.canActivate(postCtx)).toBe(true);
    });
  });

  describe('Allow ADMIN and SUPER_ADMIN on all routes', () => {
    routes.forEach(({ name, handler }) => {
      it(`should allow ADMIN on ${name}`, () => {
        const ctx = createMockContext(handler, {
          role: UserRole.ADMIN,
          status: true,
        });
        expect(guard.canActivate(ctx)).toBe(true);
      });

      it(`should allow SUPER_ADMIN on ${name}`, () => {
        const ctx = createMockContext(handler, {
          role: UserRole.SUPER_ADMIN,
          status: true,
        });
        expect(guard.canActivate(ctx)).toBe(true);
      });
    });
  });
});
