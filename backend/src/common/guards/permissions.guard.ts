import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { StaffPermission, UserRole } from '../enums';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<
      (StaffPermission | string)[]
    >(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    // No permissions required — allow access
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      throw new UnauthorizedException('Bạn chưa đăng nhập');
    }

    if (user.status === false) {
      throw new ForbiddenException('Tài khoản đã bị khóa hoặc vô hiệu hóa');
    }

    // SUPER_ADMIN and ADMIN always have full access — bypass permission checks
    if (
      user.role === UserRole.SUPER_ADMIN ||
      user.role === 'SUPER_ADMIN' ||
      user.role === UserRole.ADMIN ||
      user.role === 'ADMIN'
    ) {
      return true;
    }

    // STAFF must have at least one of the required permissions
    if (user.role === UserRole.STAFF || user.role === 'STAFF') {
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

    // CUSTOMER should not access staff/admin routes
    throw new ForbiddenException('Bạn không có quyền truy cập chức năng này');
  }
}
