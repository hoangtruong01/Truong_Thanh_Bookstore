import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { createHash } from 'crypto';

@Injectable()
export class TokenBlacklistService implements OnModuleDestroy {
  private readonly logger = new Logger(TokenBlacklistService.name);

  // In-memory lookup tables for revoked tokens with expiry timestamps (epoch ms)
  private readonly jtiBlacklist = new Map<string, number>();
  private readonly tokenHashBlacklist = new Map<string, number>();

  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Run cleanup every 10 minutes to prevent memory leak from expired tokens
    this.cleanupInterval = setInterval(
      () => {
        this.cleanupExpiredTokens();
      },
      10 * 60 * 1000,
    );
  }

  onModuleDestroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /**
   * Blacklist a token by its unique JWT ID (JTI)
   * @param jti Unique identifier of the JWT
   * @param expSeconds Expiration timestamp in seconds (epoch time from JWT payload)
   */
  blacklistJti(jti: string, expSeconds?: number): void {
    if (!jti) return;
    const expiryMs = expSeconds
      ? expSeconds * 1000
      : Date.now() + 7 * 24 * 60 * 60 * 1000; // Default 7 days
    this.jtiBlacklist.set(jti, expiryMs);
  }

  /**
   * Check if a JTI is present in the blacklist and not yet expired
   */
  isJtiBlacklisted(jti: string): boolean {
    if (!jti) return false;
    const expiryMs = this.jtiBlacklist.get(jti);
    if (!expiryMs) return false;

    if (Date.now() > expiryMs) {
      this.jtiBlacklist.delete(jti);
      return false;
    }
    return true;
  }

  /**
   * Blacklist a raw token string (hashes the token for fast, memory-efficient lookups)
   * @param token Raw JWT string
   * @param expSeconds Expiration timestamp in seconds
   */
  blacklistToken(token: string, expSeconds?: number): void {
    if (!token) return;
    const tokenHash = this.hashToken(token);
    const expiryMs = expSeconds
      ? expSeconds * 1000
      : Date.now() + 7 * 24 * 60 * 60 * 1000; // Default 7 days
    this.tokenHashBlacklist.set(tokenHash, expiryMs);
  }

  /**
   * Check if a raw token is blacklisted
   */
  isTokenBlacklisted(token: string): boolean {
    if (!token) return false;
    const tokenHash = this.hashToken(token);
    const expiryMs = this.tokenHashBlacklist.get(tokenHash);
    if (!expiryMs) return false;

    if (Date.now() > expiryMs) {
      this.tokenHashBlacklist.delete(tokenHash);
      return false;
    }
    return true;
  }

  /**
   * Clean up expired blacklist entries
   * @returns Total number of cleared entries
   */
  cleanupExpiredTokens(): number {
    const now = Date.now();
    let clearedCount = 0;

    for (const [jti, expiryMs] of this.jtiBlacklist.entries()) {
      if (now > expiryMs) {
        this.jtiBlacklist.delete(jti);
        clearedCount++;
      }
    }

    for (const [hash, expiryMs] of this.tokenHashBlacklist.entries()) {
      if (now > expiryMs) {
        this.tokenHashBlacklist.delete(hash);
        clearedCount++;
      }
    }

    if (clearedCount > 0) {
      this.logger.debug(
        `Token blacklist cleanup completed. Removed ${clearedCount} expired entries.`,
      );
    }

    return clearedCount;
  }

  /**
   * Get active blacklist statistics for monitoring & testing
   */
  getStats(): { jtiCount: number; tokenCount: number } {
    return {
      jtiCount: this.jtiBlacklist.size,
      tokenCount: this.tokenHashBlacklist.size,
    };
  }

  /**
   * Clear all entries (primarily used in testing)
   */
  clearAll(): void {
    this.jtiBlacklist.clear();
    this.tokenHashBlacklist.clear();
  }
}
