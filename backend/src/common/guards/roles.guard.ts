import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../enums';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<(UserRole | string)[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no roles specified, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      throw new UnauthorizedException('Bạn chưa đăng nhập');
    }

    if (user.status === false) {
      throw new ForbiddenException('Tài khoản đã bị khóa hoặc vô hiệu hóa');
    }

    const userRole = user.role as UserRole;

    // SUPER_ADMIN has full access to all role-restricted routes
    if (userRole === UserRole.SUPER_ADMIN) {
      return true;
    }

    // Role Hierarchy:
    // ADMIN satisfies ADMIN, STAFF, CUSTOMER
    if (userRole === UserRole.ADMIN) {
      if (
        requiredRoles.includes(UserRole.ADMIN) ||
        requiredRoles.includes('ADMIN') ||
        requiredRoles.includes(UserRole.STAFF) ||
        requiredRoles.includes('STAFF') ||
        requiredRoles.includes(UserRole.CUSTOMER) ||
        requiredRoles.includes('CUSTOMER')
      ) {
        return true;
      }
    }

    // STAFF satisfies STAFF, CUSTOMER
    if (userRole === UserRole.STAFF) {
      if (
        requiredRoles.includes(UserRole.STAFF) ||
        requiredRoles.includes('STAFF') ||
        requiredRoles.includes(UserRole.CUSTOMER) ||
        requiredRoles.includes('CUSTOMER')
      ) {
        return true;
      }
    }

    // Direct match check (e.g. for CUSTOMER or exact match)
    if (requiredRoles.some((role) => role === userRole)) {
      return true;
    }

    throw new ForbiddenException('Bạn không có quyền truy cập chức năng này');
  }
}
