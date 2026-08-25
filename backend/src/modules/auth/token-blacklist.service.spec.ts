import { TokenBlacklistService } from './token-blacklist.service';

describe('TokenBlacklistService', () => {
  let service: TokenBlacklistService;

  beforeEach(() => {
    service = new TokenBlacklistService();
  });

  afterEach(() => {
    service.onModuleDestroy();
  });

  describe('JTI Blacklisting', () => {
    it('should correctly blacklist and verify a JTI', () => {
      const jti = 'test-jti-uuid-123';
      expect(service.isJtiBlacklisted(jti)).toBe(false);

      service.blacklistJti(jti);
      expect(service.isJtiBlacklisted(jti)).toBe(true);
    });

    it('should return false for empty or undefined JTI', () => {
      expect(service.isJtiBlacklisted('')).toBe(false);
      expect(service.isJtiBlacklisted(undefined as any)).toBe(false);
    });

    it('should respect custom expSeconds and consider expired tokens as not blacklisted', () => {
      const jti = 'expired-jti-456';
      const pastExp = Math.floor(Date.now() / 1000) - 60; // 60 seconds ago

      service.blacklistJti(jti, pastExp);
      expect(service.isJtiBlacklisted(jti)).toBe(false);
    });
  });

  describe('Raw Token Blacklisting', () => {
    it('should correctly blacklist and verify a raw token string', () => {
      const rawToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0';
      expect(service.isTokenBlacklisted(rawToken)).toBe(false);

      service.blacklistToken(rawToken);
      expect(service.isTokenBlacklisted(rawToken)).toBe(true);
    });

    it('should return false for empty or undefined token', () => {
      expect(service.isTokenBlacklisted('')).toBe(false);
      expect(service.isTokenBlacklisted(undefined as any)).toBe(false);
    });

    it('should respect custom expSeconds for raw token', () => {
      const rawToken = 'expired-raw-token-string';
      const pastExp = Math.floor(Date.now() / 1000) - 10;

      service.blacklistToken(rawToken, pastExp);
      expect(service.isTokenBlacklisted(rawToken)).toBe(false);
    });
  });

  describe('Cleanup & Stats', () => {
    it('should clean up expired entries correctly', () => {
      const activeJti = 'active-jti';
      const expiredJti = 'expired-jti';
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      const pastExp = Math.floor(Date.now() / 1000) - 100;

      service.blacklistJti(activeJti, futureExp);
      service.blacklistJti(expiredJti, pastExp);

      const activeToken = 'active-token';
      const expiredToken = 'expired-token';
      service.blacklistToken(activeToken, futureExp);
      service.blacklistToken(expiredToken, pastExp);

      expect(service.getStats()).toEqual({ jtiCount: 2, tokenCount: 2 });

      const cleared = service.cleanupExpiredTokens();
      expect(cleared).toBe(2);
      expect(service.getStats()).toEqual({ jtiCount: 1, tokenCount: 1 });
      expect(service.isJtiBlacklisted(activeJti)).toBe(true);
      expect(service.isTokenBlacklisted(activeToken)).toBe(true);
    });

    it('should clear all entries when clearAll is invoked', () => {
      service.blacklistJti('jti-1');
      service.blacklistToken('token-1');
      expect(service.getStats().jtiCount).toBe(1);

      service.clearAll();
      expect(service.getStats()).toEqual({ jtiCount: 0, tokenCount: 0 });
    });
  });
});
