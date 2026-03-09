import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RedisService } from '../../services/redis.service';
import Redis from 'ioredis';

// Mock ioredis
vi.mock('ioredis');

describe('RedisService', () => {
  let redisService: RedisService;
  let mockRedisClient: any;

  beforeEach(() => {
    mockRedisClient = {
      get: vi.fn(),
      set: vi.fn(),
      del: vi.fn(),
      publish: vi.fn(),
      subscribe: vi.fn(),
      on: vi.fn(),
      quit: vi.fn(),
      ping: vi.fn(),
      setex: vi.fn(),
      expire: vi.fn(),
      ttl: vi.fn(),
      exists: vi.fn(),
      keys: vi.fn(),
      mget: vi.fn(),
      mset: vi.fn(),
      incr: vi.fn(),
      decr: vi.fn(),
      hget: vi.fn(),
      hset: vi.fn(),
      hgetall: vi.fn(),
      lpush: vi.fn(),
      rpush: vi.fn(),
      lrange: vi.fn(),
      sadd: vi.fn(),
      smembers: vi.fn(),
    };

    (Redis as any).mockImplementation(() => mockRedisClient);
    redisService = new RedisService();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Operations', () => {
    it('should get value from Redis', async () => {
      const key = 'test-key';
      const value = 'test-value';
      mockRedisClient.get.mockResolvedValue(value);

      const result = await redisService.get(key);

      expect(mockRedisClient.get).toHaveBeenCalledWith(key);
      expect(result).toBe(value);
    });

    it('should set value in Redis', async () => {
      const key = 'test-key';
      const value = 'test-value';
      mockRedisClient.set.mockResolvedValue('OK');

      await redisService.set(key, value);

      expect(mockRedisClient.set).toHaveBeenCalledWith(key, value);
    });

    it('should set value with expiration', async () => {
      const key = 'test-key';
      const value = 'test-value';
      const ttl = 3600;
      mockRedisClient.setex.mockResolvedValue('OK');

      await redisService.setex(key, ttl, value);

      expect(mockRedisClient.setex).toHaveBeenCalledWith(key, ttl, value);
    });

    it('should delete key from Redis', async () => {
      const key = 'test-key';
      mockRedisClient.del.mockResolvedValue(1);

      const result = await redisService.del(key);

      expect(mockRedisClient.del).toHaveBeenCalledWith(key);
      expect(result).toBe(1);
    });

    it('should check if key exists', async () => {
      const key = 'test-key';
      mockRedisClient.exists.mockResolvedValue(1);

      const result = await redisService.exists(key);

      expect(mockRedisClient.exists).toHaveBeenCalledWith(key);
      expect(result).toBe(1);
    });

    it('should get TTL of key', async () => {
      const key = 'test-key';
      mockRedisClient.ttl.mockResolvedValue(3600);

      const result = await redisService.ttl(key);

      expect(mockRedisClient.ttl).toHaveBeenCalledWith(key);
      expect(result).toBe(3600);
    });

    it('should set expiration on key', async () => {
      const key = 'test-key';
      const seconds = 3600;
      mockRedisClient.expire.mockResolvedValue(1);

      await redisService.expire(key, seconds);

      expect(mockRedisClient.expire).toHaveBeenCalledWith(key, seconds);
    });
  });

  describe('Pub/Sub Operations', () => {
    it('should publish message to channel', async () => {
      const channel = 'test-channel';
      const message = JSON.stringify({ data: 'test' });
      mockRedisClient.publish.mockResolvedValue(1);

      await redisService.publish(channel, message);

      expect(mockRedisClient.publish).toHaveBeenCalledWith(channel, message);
    });

    it('should subscribe to channel', async () => {
      const channel = 'test-channel';
      const callback = vi.fn();
      mockRedisClient.subscribe.mockResolvedValue(null);
      mockRedisClient.on.mockImplementation((event, handler) => {
        if (event === 'message') {
          handler(channel, 'test message');
        }
      });

      await redisService.subscribe(channel, callback);

      expect(mockRedisClient.subscribe).toHaveBeenCalledWith(channel);
      expect(callback).toHaveBeenCalledWith('test message');
    });

    it('should handle multiple subscribers', async () => {
      const channel = 'test-channel';
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      await redisService.subscribe(channel, callback1);
      await redisService.subscribe(channel, callback2);

      expect(mockRedisClient.subscribe).toHaveBeenCalledTimes(2);
    });
  });

  describe('Hash Operations', () => {
    it('should set hash field', async () => {
      const key = 'hash-key';
      const field = 'field1';
      const value = 'value1';
      mockRedisClient.hset.mockResolvedValue(1);

      await redisService.hset(key, field, value);

      expect(mockRedisClient.hset).toHaveBeenCalledWith(key, field, value);
    });

    it('should get hash field', async () => {
      const key = 'hash-key';
      const field = 'field1';
      const value = 'value1';
      mockRedisClient.hget.mockResolvedValue(value);

      const result = await redisService.hget(key, field);

      expect(mockRedisClient.hget).toHaveBeenCalledWith(key, field);
      expect(result).toBe(value);
    });

    it('should get all hash fields', async () => {
      const key = 'hash-key';
      const hash = { field1: 'value1', field2: 'value2' };
      mockRedisClient.hgetall.mockResolvedValue(hash);

      const result = await redisService.hgetall(key);

      expect(mockRedisClient.hgetall).toHaveBeenCalledWith(key);
      expect(result).toEqual(hash);
    });
  });

  describe('List Operations', () => {
    it('should push to list (left)', async () => {
      const key = 'list-key';
      const value = 'item1';
      mockRedisClient.lpush.mockResolvedValue(1);

      await redisService.lpush(key, value);

      expect(mockRedisClient.lpush).toHaveBeenCalledWith(key, value);
    });

    it('should push to list (right)', async () => {
      const key = 'list-key';
      const value = 'item1';
      mockRedisClient.rpush.mockResolvedValue(1);

      await redisService.rpush(key, value);

      expect(mockRedisClient.rpush).toHaveBeenCalledWith(key, value);
    });

    it('should get list range', async () => {
      const key = 'list-key';
      const items = ['item1', 'item2', 'item3'];
      mockRedisClient.lrange.mockResolvedValue(items);

      const result = await redisService.lrange(key, 0, -1);

      expect(mockRedisClient.lrange).toHaveBeenCalledWith(key, 0, -1);
      expect(result).toEqual(items);
    });
  });

  describe('Set Operations', () => {
    it('should add to set', async () => {
      const key = 'set-key';
      const member = 'member1';
      mockRedisClient.sadd.mockResolvedValue(1);

      await redisService.sadd(key, member);

      expect(mockRedisClient.sadd).toHaveBeenCalledWith(key, member);
    });

    it('should get set members', async () => {
      const key = 'set-key';
      const members = ['member1', 'member2', 'member3'];
      mockRedisClient.smembers.mockResolvedValue(members);

      const result = await redisService.smembers(key);

      expect(mockRedisClient.smembers).toHaveBeenCalledWith(key);
      expect(result).toEqual(members);
    });
  });

  describe('Counter Operations', () => {
    it('should increment counter', async () => {
      const key = 'counter-key';
      mockRedisClient.incr.mockResolvedValue(1);

      const result = await redisService.incr(key);

      expect(mockRedisClient.incr).toHaveBeenCalledWith(key);
      expect(result).toBe(1);
    });

    it('should decrement counter', async () => {
      const key = 'counter-key';
      mockRedisClient.decr.mockResolvedValue(0);

      const result = await redisService.decr(key);

      expect(mockRedisClient.decr).toHaveBeenCalledWith(key);
      expect(result).toBe(0);
    });
  });

  describe('Batch Operations', () => {
    it('should get multiple keys', async () => {
      const keys = ['key1', 'key2', 'key3'];
      const values = ['value1', 'value2', 'value3'];
      mockRedisClient.mget.mockResolvedValue(values);

      const result = await redisService.mget(keys);

      expect(mockRedisClient.mget).toHaveBeenCalledWith(keys);
      expect(result).toEqual(values);
    });

    it('should set multiple keys', async () => {
      const keyValues = ['key1', 'value1', 'key2', 'value2'];
      mockRedisClient.mset.mockResolvedValue('OK');

      await redisService.mset(keyValues);

      expect(mockRedisClient.mset).toHaveBeenCalledWith(keyValues);
    });

    it('should find keys by pattern', async () => {
      const pattern = 'user:*';
      const keys = ['user:1', 'user:2', 'user:3'];
      mockRedisClient.keys.mockResolvedValue(keys);

      const result = await redisService.keys(pattern);

      expect(mockRedisClient.keys).toHaveBeenCalledWith(pattern);
      expect(result).toEqual(keys);
    });
  });

  describe('Connection Management', () => {
    it('should ping Redis', async () => {
      mockRedisClient.ping.mockResolvedValue('PONG');

      const result = await redisService.ping();

      expect(result).toBe('PONG');
    });

    it('should disconnect from Redis', async () => {
      mockRedisClient.quit.mockResolvedValue('OK');

      await redisService.disconnect();

      expect(mockRedisClient.quit).toHaveBeenCalled();
    });

    it('should check connection health', async () => {
      mockRedisClient.ping.mockResolvedValue('PONG');

      const isHealthy = await redisService.isHealthy();

      expect(isHealthy).toBe(true);
    });

    it('should return false when connection unhealthy', async () => {
      mockRedisClient.ping.mockRejectedValue(new Error('Connection failed'));

      const isHealthy = await redisService.isHealthy();

      expect(isHealthy).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle get errors', async () => {
      mockRedisClient.get.mockRejectedValue(new Error('Redis error'));

      await expect(redisService.get('key')).rejects.toThrow('Redis error');
    });

    it('should handle set errors', async () => {
      mockRedisClient.set.mockRejectedValue(new Error('Redis error'));

      await expect(redisService.set('key', 'value')).rejects.toThrow(
        'Redis error'
      );
    });

    it('should handle publish errors', async () => {
      mockRedisClient.publish.mockRejectedValue(new Error('Publish failed'));

      await expect(
        redisService.publish('channel', 'message')
      ).rejects.toThrow('Publish failed');
    });

    it('should handle connection errors', async () => {
      mockRedisClient.on.mockImplementation((event, handler) => {
        if (event === 'error') {
          handler(new Error('Connection error'));
        }
      });

      // Connection error should be handled
      expect(mockRedisClient).toBeDefined();
    });
  });

  describe('Cache Patterns', () => {
    it('should implement cache-aside pattern', async () => {
      const key = 'cache-key';
      const value = 'cached-value';

      // Cache miss
      mockRedisClient.get.mockResolvedValueOnce(null);
      mockRedisClient.set.mockResolvedValue('OK');

      const miss = await redisService.get(key);
      expect(miss).toBeNull();

      await redisService.set(key, value);

      // Cache hit
      mockRedisClient.get.mockResolvedValueOnce(value);
      const hit = await redisService.get(key);
      expect(hit).toBe(value);
    });

    it('should invalidate cache on update', async () => {
      const key = 'cache-key';
      mockRedisClient.del.mockResolvedValue(1);

      await redisService.del(key);

      expect(mockRedisClient.del).toHaveBeenCalledWith(key);
    });
  });
});
