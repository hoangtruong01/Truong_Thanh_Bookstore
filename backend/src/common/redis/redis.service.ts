import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private isAvailable = false;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.initClient();
  }

  private initClient() {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    if (!redisUrl) {
      this.logger.log(
        'ℹ️ REDIS_URL not configured. Running in in-memory fallback mode.',
      );
      this.isAvailable = false;
      return;
    }

    try {
      this.client = new Redis(redisUrl, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
        retryStrategy: (times) => {
          if (times > 3) {
            this.logger.warn(
              '⚠️ Redis connection failed after 3 retries. Using in-memory fallback.',
            );
            this.isAvailable = false;
            return null; // Stop retrying
          }
          return Math.min(times * 1000, 3000);
        },
      });

      this.client.on('connect', () => {
        this.isAvailable = true;
        this.logger.log('✅ Connected to Redis successfully');
      });

      this.client.on('error', (err) => {
        this.isAvailable = false;
        this.logger.warn(
          `⚠️ Redis error occurred (${err.message}). In-memory fallback active.`,
        );
      });

      this.client.on('close', () => {
        this.isAvailable = false;
      });

      // Attempt initial connection asynchronously
      this.client.connect().catch((err) => {
        this.isAvailable = false;
        this.logger.warn(
          `⚠️ Initial Redis connection failed (${err.message}). In-memory fallback active.`,
        );
      });
    } catch (error: any) {
      this.isAvailable = false;
      this.logger.warn(
        `⚠️ Failed to initialize Redis client (${error.message}). In-memory fallback active.`,
      );
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      try {
        await this.client.quit();
      } catch {
        this.client.disconnect();
      }
      this.client = null;
      this.isAvailable = false;
    }
  }

  get isConnected(): boolean {
    return this.isAvailable && this.client !== null && this.client.status === 'ready';
  }

  getClient(): Redis | null {
    return this.client;
  }

  async get(key: string): Promise<string | null> {
    if (!this.isConnected || !this.client) return null;
    try {
      return await this.client.get(key);
    } catch (err: any) {
      this.logger.warn(`Redis GET error for key ${key}: ${err.message}`);
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.isConnected || !this.client) return;
    try {
      if (ttlSeconds && ttlSeconds > 0) {
        await this.client.setex(key, ttlSeconds, value);
      } else {
        await this.client.set(key, value);
      }
    } catch (err: any) {
      this.logger.warn(`Redis SET error for key ${key}: ${err.message}`);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.isConnected || !this.client) return;
    try {
      await this.client.del(key);
    } catch (err: any) {
      this.logger.warn(`Redis DEL error for key ${key}: ${err.message}`);
    }
  }
}
