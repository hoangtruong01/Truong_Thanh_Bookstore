import { TokenBlacklistService } from './token-blacklist.service';

describe('TokenBlacklistService (BE-04)', () => {
  let service: TokenBlacklistService;

  beforeEach(() => {
    service = new TokenBlacklistService();
  });

  afterEach(() => {
    service.onModuleDestroy();
  });

  describe('JTI Blacklisting (In-Memory Fallback)', () => {
    it('should correctly blacklist and verify a JTI', async () => {
      const jti = 'test-jti-uuid-123';
      expect(await service.isJtiBlacklisted(jti)).toBe(false);

      await service.blacklistJti(jti);
      expect(await service.isJtiBlacklisted(jti)).toBe(true);
      expect(service.isJtiBlacklistedSync(jti)).toBe(true);
    });

    it('should return false for empty or undefined JTI', async () => {
      expect(await service.isJtiBlacklisted('')).toBe(false);
      expect(await service.isJtiBlacklisted(undefined as any)).toBe(false);
    });

    it('should respect custom expSeconds and consider expired tokens as not blacklisted', async () => {
      const jti = 'expired-jti-456';
      const pastExp = Math.floor(Date.now() / 1000) - 60; // 60 seconds ago

      await service.blacklistJti(jti, pastExp);
      expect(await service.isJtiBlacklisted(jti)).toBe(false);
    });
  });

  describe('Raw Token Blacklisting (In-Memory Fallback)', () => {
    it('should correctly blacklist and verify a raw token string', async () => {
      const rawToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0';
      expect(await service.isTokenBlacklisted(rawToken)).toBe(false);

      await service.blacklistToken(rawToken);
      expect(await service.isTokenBlacklisted(rawToken)).toBe(true);
    });

    it('should return false for empty or undefined token', async () => {
      expect(await service.isTokenBlacklisted('')).toBe(false);
      expect(await service.isTokenBlacklisted(undefined as any)).toBe(false);
    });

    it('should respect custom expSeconds for raw token', async () => {
      const rawToken = 'expired-raw-token-string';
      const pastExp = Math.floor(Date.now() / 1000) - 10;

      await service.blacklistToken(rawToken, pastExp);
      expect(await service.isTokenBlacklisted(rawToken)).toBe(false);
    });
  });

  describe('Cleanup & Stats', () => {
    it('should clean up expired entries correctly', async () => {
      const activeJti = 'active-jti';
      const expiredJti = 'expired-jti';
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      const pastExp = Math.floor(Date.now() / 1000) - 100;

      await service.blacklistJti(activeJti, futureExp);
      await service.blacklistJti(expiredJti, pastExp);

      const activeToken = 'active-token';
      const expiredToken = 'expired-token';
      await service.blacklistToken(activeToken, futureExp);
      await service.blacklistToken(expiredToken, pastExp);

      expect(service.getStats()).toEqual({ jtiCount: 2, tokenCount: 2 });

      const cleared = service.cleanupExpiredTokens();
      expect(cleared).toBe(2);
      expect(service.getStats()).toEqual({ jtiCount: 1, tokenCount: 1 });
      expect(await service.isJtiBlacklisted(activeJti)).toBe(true);
      expect(await service.isTokenBlacklisted(activeToken)).toBe(true);
    });

    it('should clear all entries when clearAll is invoked', async () => {
      await service.blacklistJti('jti-1');
      await service.blacklistToken('token-1');
      expect(service.getStats().jtiCount).toBe(1);

      service.clearAll();
      expect(service.getStats()).toEqual({ jtiCount: 0, tokenCount: 0 });
    });
  });

  describe('BE-04: Redis Distributed Blacklist Integration', () => {
    let mockRedisService: any;
    let redisBackedService: TokenBlacklistService;

    beforeEach(() => {
      mockRedisService = {
        isConnected: true,
        get: jest.fn(),
        set: jest.fn().mockResolvedValue(undefined),
        del: jest.fn().mockResolvedValue(undefined),
      };
      redisBackedService = new TokenBlacklistService(mockRedisService);
    });

    afterEach(() => {
      redisBackedService.onModuleDestroy();
    });

    it('should setex key in Redis with remaining TTL when blacklisting JTI', async () => {
      const jti = 'cluster-jti-test';
      const futureExp = Math.floor(Date.now() / 1000) + 900; // 15 mins

      await redisBackedService.blacklistJti(jti, futureExp);

      expect(mockRedisService.set).toHaveBeenCalledWith(
        `bl:jti:${jti}`,
        '1',
        expect.any(Number),
      );
      const ttlPassed = mockRedisService.set.mock.calls[0][2];
      expect(ttlPassed).toBeGreaterThan(890);
      expect(ttlPassed).toBeLessThanOrEqual(900);
    });

    it('should identify blacklisted token when present in Redis from another instance', async () => {
      const remoteJti = 'remote-node-jti';
      mockRedisService.get.mockResolvedValueOnce('1');

      const isBlacklisted = await redisBackedService.isJtiBlacklisted(remoteJti);

      expect(isBlacklisted).toBe(true);
      expect(mockRedisService.get).toHaveBeenCalledWith(`bl:jti:${remoteJti}`);
    });

    it('should fail-open gracefully when Redis errors occur', async () => {
      const errJti = 'error-case-jti';
      mockRedisService.get.mockRejectedValueOnce(new Error('Redis connection timeout'));

      const isBlacklisted = await redisBackedService.isJtiBlacklisted(errJti);

      // Should not throw, returns false gracefully
      expect(isBlacklisted).toBe(false);
    });
  });
});
