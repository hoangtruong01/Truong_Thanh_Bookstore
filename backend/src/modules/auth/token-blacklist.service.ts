import {
  Injectable,
  Logger,
  OnModuleDestroy,
  Optional,
} from '@nestjs/common';
import { createHash } from 'crypto';
import { RedisService } from '../../common/redis/redis.service';

@Injectable()
export class TokenBlacklistService implements OnModuleDestroy {
  private readonly logger = new Logger(TokenBlacklistService.name);

  // In-memory lookup tables for revoked tokens with expiry timestamps (epoch ms)
  private readonly jtiBlacklist = new Map<string, number>();
  private readonly tokenHashBlacklist = new Map<string, number>();

  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(@Optional() private readonly redisService?: RedisService) {
    // Run cleanup every 10 minutes to prevent memory leak from expired tokens in local memory
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
   * BE-04: Blacklist a token by its unique JWT ID (JTI)
   * Writes to Redis with SETEX (TTL matching remaining JWT lifespan) and mirrors to in-memory cache.
   * @param jti Unique identifier of the JWT
   * @param expSeconds Expiration timestamp in seconds (epoch time from JWT payload)
   */
  async blacklistJti(jti: string, expSeconds?: number): Promise<void> {
    if (!jti) return;
    const nowSec = Math.floor(Date.now() / 1000);
    const ttlSeconds = expSeconds
      ? Math.max(1, expSeconds - nowSec)
      : 7 * 24 * 60 * 60; // Default 7 days
    const expiryMs = expSeconds
      ? expSeconds * 1000
      : Date.now() + 7 * 24 * 60 * 60 * 1000;

    // 1. Mirror in local memory
    this.jtiBlacklist.set(jti, expiryMs);

    // 2. Persist in Redis if available
    if (this.redisService?.isConnected) {
      try {
        await this.redisService.set(`bl:jti:${jti}`, '1', ttlSeconds);
      } catch (err: any) {
        this.logger.warn(
          `Failed to persist JTI blacklist to Redis: ${err.message}`,
        );
      }
    }
  }

  /**
   * BE-04: Check if a JTI is present in the blacklist and not yet expired.
   * Checks local memory first; falls back to Redis query; fails open safely if Redis errors.
   */
  async isJtiBlacklisted(jti: string): Promise<boolean> {
    if (!jti) return false;

    // 1. Check local in-memory table
    const expiryMs = this.jtiBlacklist.get(jti);
    if (expiryMs) {
      if (Date.now() > expiryMs) {
        this.jtiBlacklist.delete(jti);
      } else {
        return true;
      }
    }

    // 2. Query Redis for distributed multi-instance synchronization
    if (this.redisService?.isConnected) {
      try {
        const val = await this.redisService.get(`bl:jti:${jti}`);
        if (val) {
          // Cache locally for up to 60 seconds to avoid repetitive network roundtrips
          this.jtiBlacklist.set(jti, Date.now() + 60 * 1000);
          return true;
        }
      } catch (err: any) {
        this.logger.warn(
          `Failed to query JTI blacklist from Redis: ${err.message}`,
        );
      }
    }

    return false;
  }

  /**
   * Synchronous check for non-async contexts (falls back strictly to local memory)
   */
  isJtiBlacklistedSync(jti: string): boolean {
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
   * BE-04: Blacklist a raw token string (hashes the token for fast, memory-efficient lookups)
   * Writes to Redis with SETEX (TTL matching remaining JWT lifespan) and mirrors to in-memory cache.
   * @param token Raw JWT string
   * @param expSeconds Expiration timestamp in seconds
   */
  async blacklistToken(token: string, expSeconds?: number): Promise<void> {
    if (!token) return;
    const tokenHash = this.hashToken(token);
    const nowSec = Math.floor(Date.now() / 1000);
    const ttlSeconds = expSeconds
      ? Math.max(1, expSeconds - nowSec)
      : 7 * 24 * 60 * 60;
    const expiryMs = expSeconds
      ? expSeconds * 1000
      : Date.now() + 7 * 24 * 60 * 60 * 1000;

    // 1. Mirror in local memory
    this.tokenHashBlacklist.set(tokenHash, expiryMs);

    // 2. Persist in Redis
    if (this.redisService?.isConnected) {
      try {
        await this.redisService.set(`bl:tok:${tokenHash}`, '1', ttlSeconds);
      } catch (err: any) {
        this.logger.warn(
          `Failed to persist raw token blacklist to Redis: ${err.message}`,
        );
      }
    }
  }

  /**
   * BE-04: Check if a raw token is blacklisted.
   * Checks local memory first; falls back to Redis query; fails open safely if Redis errors.
   */
  async isTokenBlacklisted(token: string): Promise<boolean> {
    if (!token) return false;
    const tokenHash = this.hashToken(token);

    // 1. Check local in-memory table
    const expiryMs = this.tokenHashBlacklist.get(tokenHash);
    if (expiryMs) {
      if (Date.now() > expiryMs) {
        this.tokenHashBlacklist.delete(tokenHash);
      } else {
        return true;
      }
    }

    // 2. Query Redis
    if (this.redisService?.isConnected) {
      try {
        const val = await this.redisService.get(`bl:tok:${tokenHash}`);
        if (val) {
          this.tokenHashBlacklist.set(tokenHash, Date.now() + 60 * 1000);
          return true;
        }
      } catch (err: any) {
        this.logger.warn(
          `Failed to query token blacklist from Redis: ${err.message}`,
        );
      }
    }

    return false;
  }

  /**
   * Clean up expired blacklist entries in local memory
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
