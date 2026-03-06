import { type FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import type { DependencyOverrides } from "../app";
import type { RedisClient } from "bun";
import env from "../env";
import type { ICache } from "../../modules/cache/cache.interface";
import {
  createCache,
  createRedisClient,
} from "../../modules/cache/cache-factory";

export default fp(
  async (fastify: FastifyInstance, overrides: DependencyOverrides) => {
    fastify.log.info("plugging: CACHE into app");
    let redisClient: RedisClient | undefined;
    let cache: ICache;

    if (overrides.redisClient) {
      redisClient = overrides.redisClient;
      cache = createCache({ type: "redis", redisClient });
    } else if (env.DEFAULT_CACHE_IMPL === "redis") {
      redisClient = await createRedisClient();
      cache = createCache({ type: "redis", redisClient });
    } else cache = createCache({ type: "memory" });

    fastify.decorate("redisClient", redisClient);
    fastify.decorate("cache", cache);
  },
  { name: "cache" },
);

declare module "fastify" {
  interface FastifyInstance {
    redisClient: RedisClient | undefined;
    cache: ICache;
  }
}
