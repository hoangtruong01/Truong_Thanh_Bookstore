import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No permissions required — allow access
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      throw new ForbiddenException('Bạn chưa đăng nhập');
    }

    // ADMIN always has full access — bypass permission checks
    if (user.role === 'ADMIN') {
      return true;
    }

    // STAFF must have at least one of the required permissions
    if (user.role === 'STAFF') {
      const userPermissions: string[] = user.permissions || [];
      const hasPermission = requiredPermissions.some((perm) =>
        userPermissions.includes(perm),
      );
      if (!hasPermission) {
        throw new ForbiddenException(
          'Bạn không có quyền thực hiện hành động này',
        );
      }
      return true;
    }

    // CUSTOMER should not access admin routes
    throw new ForbiddenException('Bạn không có quyền truy cập');
  }
}
