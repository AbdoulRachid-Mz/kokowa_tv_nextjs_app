// @/lib/server/rate-limit.ts

import { NextRequest } from 'next/server';

export interface Store {
  increment(key: string, windowMs: number): Promise<{ count: number; ttl: number }>;
}

interface RateLimitConfig {
  windowMs: number;
  max: number;
  message?: string;
  statusCode?: number;
  store?: Store;
}

class MemoryStore implements Store {
  private store = new Map<string, { count: number; expires: number }>();

  async increment(key: string, windowMs: number): Promise<{ count: number; ttl: number }> {
    const now = Date.now();
    const record = this.store.get(key);

    if (!record || now > record.expires) {
      this.store.set(key, {
        count: 1,
        expires: now + windowMs,
      });
      return { count: 1, ttl: windowMs };
    }

    record.count++;
    const ttl = record.expires - now;
    this.store.set(key, record);
    
    // Nettoyage périodique
    if (Math.random() < 0.01) { // 1% de chance de nettoyer
      this.cleanup();
    }

    return { count: record.count, ttl };
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, value] of this.store.entries()) {
      if (now > value.expires) {
        this.store.delete(key);
      }
    }
  }
}

export class RateLimiter {
  private config: Required<RateLimitConfig>;
  private store: Store;

  constructor(config: RateLimitConfig) {
    this.config = {
      windowMs: config.windowMs || 60 * 1000,
      max: config.max || 60,
      message: config.message || 'Trop de requêtes, veuillez réessayer plus tard',
      statusCode: config.statusCode || 429,
      store: config.store || new MemoryStore(),
    };
    this.store = this.config.store;
  }

  async check(request: NextRequest): Promise<{
    success: boolean;
    headers: Record<string, string>;
    message?: string;
    statusCode?: number;
  }> {
    const identifier = this.getIdentifier(request);
    const { count, ttl } = await this.store.increment(identifier, this.config.windowMs);

    const remaining = Math.max(0, this.config.max - count);
    const resetTime = Date.now() + ttl;

    const headers = {
      'X-RateLimit-Limit': this.config.max.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': Math.ceil(resetTime / 1000).toString(),
    };

    if (count > this.config.max) {
      return {
        success: false,
        headers,
        message: this.config.message,
        statusCode: this.config.statusCode,
      };
    }

    return { success: true, headers };
  }

  private getIdentifier(request: NextRequest): string {
    // Priorité: utilisateur connecté > IP
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      // Utiliser un hash du token pour identifier l'utilisateur
      const token = authHeader.split(' ')[1];
      if (token) {
        // Hash simple (en production, utiliser crypto.createHash)
        return `user:${Buffer.from(token).toString('base64').slice(0, 32)}`;
      }
    }
    
    // Fallback sur l'IP
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ip = forwarded?.split(',')[0] || realIp || 'unknown';
    return `ip:${ip}`;
  }
}