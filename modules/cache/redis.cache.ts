import type { ICache } from "./cache.interface";
import { RedisClient } from "bun";

export class RedisCache implements ICache {
  private client: RedisClient;

  constructor(client: RedisClient) {
    this.client = client;
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    return value ? JSON.parse(value) : null;
  }

  async set<T>(key: string, value: T, ttlMillis?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    if (ttlMillis) {
      // For sub-second TTLs (< 1000ms), use set with PX option (milliseconds)
      // For second-or-greater TTLs, use setEx (seconds) for better precision
      if (ttlMillis < 1000) {
        await this.client.set(key, serialized, "PX", ttlMillis);
      } else {
        // node-redis setEx expects seconds, not milliseconds
        const ttlSeconds = Math.floor(ttlMillis / 1000);
        await this.client.setex(key, ttlSeconds, serialized);
      }
    } else {
      await this.client.set(key, serialized);
    }
  }

  async delete(key: string): Promise<void> {
    await this.client.del(key);
  }
}
