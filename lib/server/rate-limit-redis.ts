// @/lib/server/rate-limit-redis.ts
import { Redis } from '@upstash/redis';

export interface Store {
  increment(key: string, windowMs: number): Promise<{ count: number; ttl: number }>;
}

// Singleton Redis pour éviter de recréer la connexion à chaque requête (serverless-safe via globalThis)
declare global {
  // eslint-disable-next-line no-var
  var __kokowa_redis_singleton: Redis | undefined;
}

function getRedisInstance(redisUrl: string): Redis {
  if (!process.env.UPSTASH_REDIS_TOKEN) {
    throw new Error("UPSTASH_REDIS_TOKEN manquant");
  }

  if (!globalThis.__kokowa_redis_singleton) {
    globalThis.__kokowa_redis_singleton = new Redis({
      url: redisUrl,
      token: process.env.UPSTASH_REDIS_TOKEN,
    });
  }

  return globalThis.__kokowa_redis_singleton;
}

export class RedisStore implements Store {
  private redis: Redis;

  constructor(redisUrl: string) {
    this.redis = getRedisInstance(redisUrl);
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
