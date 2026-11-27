import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { AccountLockoutService } from './account-lockout.service';

@Injectable()
export class AccountLockoutGuard implements CanActivate {
  constructor(private readonly lockoutService: AccountLockoutService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const email = request.body?.email;
    if (typeof email === 'string' && email.trim()) {
      await this.lockoutService.checkLockout(email);
    }
    return true;
  }
}
