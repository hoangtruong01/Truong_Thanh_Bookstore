import { RedisThrottlerStorageService } from './redis-throttler-storage.service';
import { RedisService } from './redis.service';

describe('RedisThrottlerStorageService (BE-04 Distributed Rate Limiting)', () => {
  let service: RedisThrottlerStorageService;
  let mockRedisService: any;
  let mockRedisClient: any;

  beforeEach(() => {
    mockRedisClient = {
      get: jest.fn(),
      setex: jest.fn().mockResolvedValue('OK'),
      incr: jest.fn(),
      expire: jest.fn().mockResolvedValue(1),
      pttl: jest.fn().mockResolvedValue(55000),
    };

    mockRedisService = {
      isConnected: false,
      getClient: jest.fn().mockReturnValue(mockRedisClient),
    };

    service = new RedisThrottlerStorageService(mockRedisService);
  });

  afterEach(() => {
    service.onModuleDestroy();
  });

  it('should use in-memory fallback when Redis is not connected', async () => {
    mockRedisService.isConnected = false;

    const record = await service.increment('test-ip', 60000, 10, 60000, 'default');

    expect(record.totalHits).toBe(1);
    expect(record.isBlocked).toBe(false);
    expect(mockRedisClient.incr).not.toHaveBeenCalled();
  });

  it('should use Redis storage when connected and record hit count', async () => {
    mockRedisService.isConnected = true;
    mockRedisClient.get.mockResolvedValue(null); // Not blocked
    mockRedisClient.incr.mockResolvedValue(1); // 1st hit

    const record = await service.increment('user-1', 60000, 100, 60000, 'default');

    expect(record.totalHits).toBe(1);
    expect(record.isBlocked).toBe(false);
    expect(mockRedisClient.incr).toHaveBeenCalledWith('throttle:hits:user-1:default');
    expect(mockRedisClient.expire).toHaveBeenCalledWith(
      'throttle:hits:user-1:default',
      60,
    );
  });

  it('should block when hit count exceeds limit in Redis', async () => {
    mockRedisService.isConnected = true;
    mockRedisClient.get.mockResolvedValue(null);
    mockRedisClient.incr.mockResolvedValue(101); // Exceeded limit of 100

    const record = await service.increment('user-spammer', 60000, 100, 120000, 'default');

    expect(record.totalHits).toBe(101);
    expect(record.isBlocked).toBe(true);
    expect(mockRedisClient.setex).toHaveBeenCalledWith(
      'throttle:block:user-spammer',
      120,
      '1',
    );
  });

  it('should immediately return blocked record if key is already blocked in Redis', async () => {
    mockRedisService.isConnected = true;
    mockRedisClient.get.mockResolvedValue('1'); // Already blocked
    mockRedisClient.pttl.mockResolvedValue(45000);

    const record = await service.increment('user-spammer', 60000, 100, 120000, 'default');

    expect(record.isBlocked).toBe(true);
    expect(record.timeToBlockExpire).toBe(45);
    expect(mockRedisClient.incr).not.toHaveBeenCalled();
  });

  it('should fall back gracefully to in-memory if Redis command throws', async () => {
    mockRedisService.isConnected = true;
    mockRedisClient.get.mockRejectedValue(new Error('Redis connection severed'));

    const record = await service.increment('user-failover', 60000, 10, 60000, 'default');

    // Falls back to in-memory without throwing error
    expect(record.totalHits).toBe(1);
    expect(record.isBlocked).toBe(false);
  });
});
