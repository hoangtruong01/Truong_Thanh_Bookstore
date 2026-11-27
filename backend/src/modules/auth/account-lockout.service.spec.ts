import { HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AccountLockoutService } from './account-lockout.service';
import { RedisService } from '../../common/redis/redis.service';
import { ErrorCode } from '../../common/enums/error-code.enum';

describe('AccountLockoutService (SEC-044)', () => {
  let service: AccountLockoutService;
  let mockConfigService: Partial<ConfigService>;
  let mockRedisService: Partial<RedisService>;
  let redisStorage: Map<string, { value: string; ttl: number }>;

  beforeEach(() => {
    redisStorage = new Map();
    mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'AUTH_LOCKOUT_MAX_ATTEMPTS') return 3; // Use 3 for easy unit testing
        if (key === 'AUTH_LOCKOUT_DURATION_SECONDS') return 60; // 60 seconds
        if (key === 'AUTH_LOCKOUT_WINDOW_SECONDS') return 30; // 30 seconds
        return undefined;
      }),
    };
  });

  afterEach(() => {
    service?.onModuleDestroy();
  });

  describe('In-Memory Mode (No Redis)', () => {
    beforeEach(() => {
      service = new AccountLockoutService(
        mockConfigService as ConfigService,
        undefined,
      );
    });

    it('normalizes email (lowercases and trims whitespace)', () => {
      expect(service.normalizeEmail('  User.NAME@Example.COM  ')).toBe(
        'user.name@example.com',
      );
    });

    it('returns unlocked status initially for a clean email', async () => {
      const status = await service.isLocked('user@test.vn');
      expect(status.isLocked).toBe(false);
      expect(status.remainingSeconds).toBe(0);
      expect(status.attempts).toBe(0);
    });

    it('records failed attempts up to threshold without locking', async () => {
      const email = 'user@test.vn';

      const res1 = await service.recordFailure(email);
      expect(res1.isLocked).toBe(false);
      expect(res1.attempts).toBe(1);

      const res2 = await service.recordFailure(email);
      expect(res2.isLocked).toBe(false);
      expect(res2.attempts).toBe(2);

      const status = await service.isLocked(email);
      expect(status.isLocked).toBe(false);
      expect(status.attempts).toBe(2);
    });

    it('locks account when maxAttempts threshold is reached and throws 429 on checkLockout', async () => {
      const email = 'victim@test.vn';

      await service.recordFailure(email);
      await service.recordFailure(email);
      const res3 = await service.recordFailure(email); // Threshold = 3

      expect(res3.isLocked).toBe(true);
      expect(res3.remainingSeconds).toBe(60);

      const status = await service.isLocked(email);
      expect(status.isLocked).toBe(true);
      expect(status.remainingSeconds).toBeGreaterThan(0);

      // checkLockout should throw HttpException with status 429
      await expect(service.checkLockout(email)).rejects.toThrow(HttpException);

      try {
        await service.checkLockout(email);
      } catch (err: any) {
        expect(err.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
        const response = err.getResponse();
        expect(response.errorCode).toBe(ErrorCode.ERR_ACCOUNT_TEMPORARILY_LOCKED);
        expect(response.message).toContain('Tài khoản tạm thời bị khóa');
      }
    });

    it('shares lockout bucket across different cases and spaces of the same email', async () => {
      await service.recordFailure('TARGET@TEST.VN');
      await service.recordFailure('target@test.vn ');
      const res = await service.recordFailure('  Target@Test.vn  ');

      expect(res.isLocked).toBe(true);
      expect((await service.isLocked('target@test.vn')).isLocked).toBe(true);
    });

    it('clears failed attempts upon recordSuccess', async () => {
      const email = 'user@test.vn';
      await service.recordFailure(email);
      await service.recordFailure(email);

      let status = await service.isLocked(email);
      expect(status.attempts).toBe(2);

      await service.recordSuccess(email);

      status = await service.isLocked(email);
      expect(status.attempts).toBe(0);
      expect(status.isLocked).toBe(false);
    });

    it('clears lockout state when reset() is called', async () => {
      const email = 'user@test.vn';
      await service.recordFailure(email);
      await service.recordFailure(email);
      await service.recordFailure(email); // Locked!

      expect((await service.isLocked(email)).isLocked).toBe(true);

      await service.reset(email);

      expect((await service.isLocked(email)).isLocked).toBe(false);
    });
  });

  describe('Redis Distributed Mode', () => {
    let mockClient: any;

    beforeEach(() => {
      mockClient = {
        incr: jest.fn(async (key: string) => {
          const current = redisStorage.get(key);
          const nextVal = current ? parseInt(current.value, 10) + 1 : 1;
          redisStorage.set(key, { value: nextVal.toString(), ttl: 30 });
          return nextVal;
        }),
        expire: jest.fn(async (key: string, ttl: number) => {
          const item = redisStorage.get(key);
          if (item) item.ttl = ttl;
          return 1;
        }),
        setex: jest.fn(async (key: string, ttl: number, val: string) => {
          redisStorage.set(key, { value: val, ttl });
          return 'OK';
        }),
        get: jest.fn(async (key: string) => {
          return redisStorage.get(key)?.value ?? null;
        }),
        del: jest.fn(async (key: string) => {
          redisStorage.delete(key);
          return 1;
        }),
        ttl: jest.fn(async (key: string) => {
          return redisStorage.has(key) ? (redisStorage.get(key)?.ttl ?? 0) : -2;
        }),
      };

      mockRedisService = {
        isConnected: true,
        getClient: () => mockClient,
        del: async (key: string) => {
          redisStorage.delete(key);
        },
      };

      service = new AccountLockoutService(
        mockConfigService as ConfigService,
        mockRedisService as RedisService,
      );
    });

    it('increments attempts in Redis and expires window on first attempt', async () => {
      const email = 'distributed@test.vn';
      const res = await service.recordFailure(email);

      expect(res.attempts).toBe(1);
      expect(mockClient.incr).toHaveBeenCalledWith(
        'auth:lockout:fail:distributed@test.vn',
      );
      expect(mockClient.expire).toHaveBeenCalledWith(
        'auth:lockout:fail:distributed@test.vn',
        30,
      );
    });

    it('sets Redis lockout key when threshold reached and removes fail counter', async () => {
      const email = 'distributed@test.vn';
      await service.recordFailure(email);
      await service.recordFailure(email);
      const res3 = await service.recordFailure(email);

      expect(res3.isLocked).toBe(true);
      expect(mockClient.setex).toHaveBeenCalledWith(
        'auth:lockout:lock:distributed@test.vn',
        60,
        '1',
      );
      expect(mockClient.del).toHaveBeenCalledWith(
        'auth:lockout:fail:distributed@test.vn',
      );
    });

    it('detects locked status from Redis TTL', async () => {
      const email = 'distributed@test.vn';
      redisStorage.set('auth:lockout:lock:distributed@test.vn', {
        value: '1',
        ttl: 45,
      });

      const status = await service.isLocked(email);
      expect(status.isLocked).toBe(true);
      expect(status.remainingSeconds).toBe(45);
    });

    it('deletes lockout and failure keys in Redis upon recordSuccess', async () => {
      const email = 'distributed@test.vn';
      redisStorage.set('auth:lockout:lock:distributed@test.vn', {
        value: '1',
        ttl: 45,
      });
      redisStorage.set('auth:lockout:fail:distributed@test.vn', {
        value: '2',
        ttl: 30,
      });

      await service.recordSuccess(email);

      expect(mockClient.del).toHaveBeenCalledWith(
        'auth:lockout:lock:distributed@test.vn',
      );
      expect(mockClient.del).toHaveBeenCalledWith(
        'auth:lockout:fail:distributed@test.vn',
      );
    });
  });
});
