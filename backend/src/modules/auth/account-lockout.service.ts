import {
  Injectable,
  Logger,
  OnModuleDestroy,
  Optional,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../common/redis/redis.service';
import { ErrorCode } from '../../common/enums/error-code.enum';

export interface LockoutStatus {
  isLocked: boolean;
  remainingSeconds: number;
  attempts: number;
}

@Injectable()
export class AccountLockoutService implements OnModuleDestroy {
  private readonly logger = new Logger(AccountLockoutService.name);

  // In-memory fallback lookup tables
  private readonly attemptsMap = new Map<
    string,
    { count: number; expiresAt: number }
  >();
  private readonly lockMap = new Map<string, { lockedUntil: number }>();

  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(
    @Optional() private readonly configService?: ConfigService,
    @Optional() private readonly redisService?: RedisService,
  ) {
    // Run cleanup every 5 minutes to prevent memory leaks from expired attempts in local memory
    this.cleanupInterval = setInterval(
      () => {
        this.cleanupExpiredEntries();
      },
      5 * 60 * 1000,
    );
  }

  onModuleDestroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  get maxAttempts(): number {
    const val = this.configService?.get<number>('AUTH_LOCKOUT_MAX_ATTEMPTS');
    return typeof val === 'number' && val > 0 ? val : 10;
  }

  get lockoutDurationSeconds(): number {
    const val = this.configService?.get<number>(
      'AUTH_LOCKOUT_DURATION_SECONDS',
    );
    return typeof val === 'number' && val > 0 ? val : 900; // 15 mins default
  }

  get windowSeconds(): number {
    const val = this.configService?.get<number>('AUTH_LOCKOUT_WINDOW_SECONDS');
    return typeof val === 'number' && val > 0 ? val : 900; // 15 mins default
  }

  normalizeEmail(email: string): string {
    return (email || '').trim().toLowerCase();
  }

  private maskEmail(email: string): string {
    const parts = email.split('@');
    if (parts.length !== 2) return '***';
    const name = parts[0];
    const domain = parts[1];
    const visible = name.length > 2 ? `${name.slice(0, 2)}***` : '***';
    return `${visible}@${domain}`;
  }

  /**
   * Checks whether the account (by normalized email) is currently locked out.
   */
  async isLocked(email: string): Promise<LockoutStatus> {
    const key = this.normalizeEmail(email);
    if (!key) {
      return { isLocked: false, remainingSeconds: 0, attempts: 0 };
    }

    // 1. Check Redis if available
    if (this.redisService?.isConnected) {
      try {
        const client = this.redisService.getClient();
        if (client) {
          const ttl = await client.ttl(`auth:lockout:lock:${key}`);
          if (ttl > 0) {
            return {
              isLocked: true,
              remainingSeconds: ttl,
              attempts: this.maxAttempts,
            };
          }
          // Check attempt count
          const attemptsStr = await client.get(`auth:lockout:fail:${key}`);
          const attempts = attemptsStr ? parseInt(attemptsStr, 10) : 0;
          return { isLocked: false, remainingSeconds: 0, attempts };
        }
      } catch (err: any) {
        this.logger.warn(
          `Redis check error for lockout (${this.maskEmail(key)}): ${err.message}`,
        );
      }
    }

    // 2. Check in-memory fallback
    const now = Date.now();
    const lockEntry = this.lockMap.get(key);
    if (lockEntry) {
      const remainingMs = lockEntry.lockedUntil - now;
      if (remainingMs > 0) {
        return {
          isLocked: true,
          remainingSeconds: Math.ceil(remainingMs / 1000),
          attempts: this.maxAttempts,
        };
      }
      this.lockMap.delete(key);
    }

    const attempt = this.attemptsMap.get(key);
    const attempts = attempt && now <= attempt.expiresAt ? attempt.count : 0;
    return { isLocked: false, remainingSeconds: 0, attempts };
  }

  /**
   * Asserts that the account is not locked. Throws HTTP 429 if locked.
   */
  async checkLockout(email: string): Promise<void> {
    const status = await this.isLocked(email);
    if (status.isLocked) {
      const minutes = Math.max(1, Math.ceil(status.remainingSeconds / 60));
      this.logger.warn(
        `[SECURITY] Blocked request for locked account ${this.maskEmail(email)}. Remaining lockout: ${status.remainingSeconds}s`,
      );
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Tài khoản tạm thời bị khóa do nhiều lần thử không thành công. Vui lòng thử lại sau ${minutes} phút.`,
          errorCode: ErrorCode.ERR_ACCOUNT_TEMPORARILY_LOCKED,
          retryAfter: status.remainingSeconds,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  /**
   * Records a failed authentication attempt. Triggers lockout if maxAttempts reached.
   */
  async recordFailure(email: string): Promise<LockoutStatus> {
    const key = this.normalizeEmail(email);
    if (!key) {
      return { isLocked: false, remainingSeconds: 0, attempts: 0 };
    }

    const now = Date.now();

    // 1. Redis path
    if (this.redisService?.isConnected) {
      try {
        const client = this.redisService.getClient();
        if (client) {
          const failKey = `auth:lockout:fail:${key}`;
          const lockKey = `auth:lockout:lock:${key}`;

          const attempts = await client.incr(failKey);
          if (attempts === 1) {
            await client.expire(failKey, this.windowSeconds);
          }

          if (attempts >= this.maxAttempts) {
            await client.setex(lockKey, this.lockoutDurationSeconds, '1');
            await client.del(failKey);

            // Mirror to memory
            this.lockMap.set(key, {
              lockedUntil: now + this.lockoutDurationSeconds * 1000,
            });

            this.logger.warn(
              `[SECURITY] Account lockout triggered for ${this.maskEmail(key)} after ${attempts} failed attempts (lockout ${this.lockoutDurationSeconds}s).`,
            );

            return {
              isLocked: true,
              remainingSeconds: this.lockoutDurationSeconds,
              attempts,
            };
          }

          return { isLocked: false, remainingSeconds: 0, attempts };
        }
      } catch (err: any) {
        this.logger.warn(
          `Redis failure recording error (${this.maskEmail(key)}): ${err.message}`,
        );
      }
    }

    // 2. In-memory fallback
    let attempt = this.attemptsMap.get(key);
    if (!attempt || now > attempt.expiresAt) {
      attempt = { count: 1, expiresAt: now + this.windowSeconds * 1000 };
    } else {
      attempt.count += 1;
    }
    this.attemptsMap.set(key, attempt);

    if (attempt.count >= this.maxAttempts) {
      this.lockMap.set(key, {
        lockedUntil: now + this.lockoutDurationSeconds * 1000,
      });
      this.attemptsMap.delete(key);

      this.logger.warn(
        `[SECURITY] Account lockout triggered (in-memory) for ${this.maskEmail(key)} after ${attempt.count} failed attempts (lockout ${this.lockoutDurationSeconds}s).`,
      );

      return {
        isLocked: true,
        remainingSeconds: this.lockoutDurationSeconds,
        attempts: attempt.count,
      };
    }

    return { isLocked: false, remainingSeconds: 0, attempts: attempt.count };
  }

  /**
   * Clears failure attempts and lockout status when authentication succeeds.
   */
  async recordSuccess(email: string): Promise<void> {
    const key = this.normalizeEmail(email);
    if (!key) return;

    if (this.redisService?.isConnected) {
      try {
        const client = this.redisService.getClient();
        if (client) {
          await client.del(`auth:lockout:fail:${key}`);
          await client.del(`auth:lockout:lock:${key}`);
        }
      } catch (err: any) {
        this.logger.warn(
          `Redis clear lockout error (${this.maskEmail(key)}): ${err.message}`,
        );
      }
    }

    this.attemptsMap.delete(key);
    this.lockMap.delete(key);
  }

  /**
   * Reset is an alias for recordSuccess.
   */
  async reset(email: string): Promise<void> {
    await this.recordSuccess(email);
  }

  private cleanupExpiredEntries() {
    const now = Date.now();
    for (const [key, lock] of this.lockMap.entries()) {
      if (now >= lock.lockedUntil) {
        this.lockMap.delete(key);
      }
    }
    for (const [key, attempt] of this.attemptsMap.entries()) {
      if (now > attempt.expiresAt) {
        this.attemptsMap.delete(key);
      }
    }
  }
}
