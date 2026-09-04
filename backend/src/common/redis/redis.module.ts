import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { RedisThrottlerStorageService } from './redis-throttler-storage.service';

@Global()
@Module({
  providers: [RedisService, RedisThrottlerStorageService],
  exports: [RedisService, RedisThrottlerStorageService],
})
export class RedisModule {}
