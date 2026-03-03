import { RedisClient } from "bun";
import env from "../../instance/env";
import type { ICache } from "./cache.interface";
import { MemoryCache } from "./memory.cache";
import { RedisCache } from "./redis.cache";

export type CreateCacheOptions = {
  type: typeof env.DEFAULT_CACHE_IMPL;
  redisClient?: RedisClient;
};

/**
 *  check the env DEFAULT_CACHE_IMPL and return the cache impl ICache
 *  this method can be extend by modifying param to accept cosmos. inMemory
 *  @param redis redis client (optional, only required if using Redis cache)
 *  @returns ICache instance
 */
export function createDefaultCache(
  redisClient: RedisClient | undefined,
): ICache {
  return createCache({
    type: env.DEFAULT_CACHE_IMPL,
    redisClient: redisClient,
  });
}

export function createCache(options: CreateCacheOptions) {
  switch (options.type) {
    case "redis":
      if (!options.redisClient) {
        throw new Error(
          "Redis client must be provided for Redis cache implementation.",
        );
      }
      return new RedisCache(options.redisClient);
    case "memory":
      return new MemoryCache();
    default:
      throw new Error(`Invalid cache type: ${options.type}`);
  }
}

export async function createRedisClient(): Promise<RedisClient> {
  const client = new RedisClient(env.REDIS_URL);
  await client.connect();
  return client;
}
