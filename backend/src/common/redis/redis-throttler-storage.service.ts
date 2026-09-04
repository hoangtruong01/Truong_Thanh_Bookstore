import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import {
  ThrottlerStorage,
  ThrottlerStorageService,
} from '@nestjs/throttler';

export interface ThrottlerStorageRecord {
  totalHits: number;
  timeToExpire: number;
  isBlocked: boolean;
  timeToBlockExpire: number;
}
import { RedisService } from './redis.service';

@Injectable()
export class RedisThrottlerStorageService
  implements ThrottlerStorage, OnModuleDestroy
{
  private readonly logger = new Logger(RedisThrottlerStorageService.name);
  private readonly fallbackStorage = new ThrottlerStorageService();

  constructor(private readonly redisService: RedisService) {}

  onModuleDestroy() {
    if (typeof this.fallbackStorage.onApplicationShutdown === 'function') {
      this.fallbackStorage.onApplicationShutdown();
    }
  }

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    // If Redis is not connected, use in-memory ThrottlerStorageService
    if (!this.redisService.isConnected) {
      return this.fallbackStorage.increment(
        key,
        ttl,
        limit,
        blockDuration,
        throttlerName,
      );
    }

    const client = this.redisService.getClient();
    if (!client) {
      return this.fallbackStorage.increment(
        key,
        ttl,
        limit,
        blockDuration,
        throttlerName,
      );
    }

    try {
      const blockKey = `throttle:block:${key}`;
      const hitsKey = `throttle:hits:${key}:${throttlerName}`;
      const ttlSec = Math.max(1, Math.ceil(ttl / 1000));
      const blockDurationSec = Math.max(1, Math.ceil(blockDuration / 1000));

      // 1. Check if currently blocked
      const isBlockedInRedis = await client.get(blockKey);
      if (isBlockedInRedis) {
        const pttl = await client.pttl(blockKey);
        const timeToBlockExpire = Math.max(0, Math.ceil(pttl / 1000));
        return {
          totalHits: limit + 1,
          timeToExpire: timeToBlockExpire,
          isBlocked: true,
          timeToBlockExpire,
        };
      }

      // 2. Increment hits count
      const totalHits = await client.incr(hitsKey);
      if (totalHits === 1) {
        await client.expire(hitsKey, ttlSec);
      }

      const pttl = await client.pttl(hitsKey);
      const timeToExpire = Math.max(0, Math.ceil(pttl / 1000));

      // 3. Check if hits exceeded limit -> trigger block
      if (totalHits > limit) {
        await client.setex(blockKey, blockDurationSec, '1');
        return {
          totalHits,
          timeToExpire,
          isBlocked: true,
          timeToBlockExpire: blockDurationSec,
        };
      }

      return {
        totalHits,
        timeToExpire,
        isBlocked: false,
        timeToBlockExpire: 0,
      };
    } catch (error: any) {
      this.logger.warn(
        `Redis throttler increment failed (${error.message}). Falling back to memory storage.`,
      );
      return this.fallbackStorage.increment(
        key,
        ttl,
        limit,
        blockDuration,
        throttlerName,
      );
    }
  }
}
