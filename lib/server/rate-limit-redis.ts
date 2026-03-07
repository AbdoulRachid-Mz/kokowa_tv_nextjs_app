// @/lib/server/rate-limit-redis.ts
import { Redis } from '@upstash/redis';

export interface Store {
  increment(key: string, windowMs: number): Promise<{ count: number; ttl: number }>;
}

export class RedisStore implements Store {
  private redis: Redis;

  constructor(redisUrl: string) {
    this.redis = new Redis({
      url: redisUrl,
      token: process.env.UPSTASH_REDIS_TOKEN,
    });
  }

  async increment(key: string, windowMs: number): Promise<{ count: number; ttl: number }> {
    const now = Date.now();
    const windowKey = `${key}:${Math.floor(now / windowMs)}`;
    
    // Pipeline pour atomicité
    const multi = this.redis.multi();
    multi.incr(windowKey);
    multi.expire(windowKey, Math.ceil(windowMs / 1000));
    
    const [count, ttl] = await multi.exec<[number, number]>();
    
    return {
      count,
      ttl,
    };
  }
}