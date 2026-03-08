import type { FastifyInstance } from "fastify";
import { join } from "node:path";
import type { AppPluginOptions } from "./server";
import autoload from "@fastify/autoload";
import { errorHandler, notFoundHandler } from "./errors/handlers";
import type { RedisClient } from "bun";
import type { Collection, MongoClient } from "mongodb";
import type { User } from "../entities/user.model";
import type { UserService } from "../services/user/user.service";
import type { ICache } from "../modules/cache/cache.interface";
import type { AuthService } from "../services/auth/auth.service";

export type DependencyOverrides = {
  mongoClient?: MongoClient;
  redisClient?: RedisClient;
  defaultCache?: ICache;

  userCollection?: Collection<User>;
  userService?: UserService;

  authService?: AuthService;
};

export async function app(fastify: FastifyInstance, opts?: AppPluginOptions) {
  fastify.setErrorHandler(errorHandler);
  fastify.setNotFoundHandler(notFoundHandler);

  fastify.register(autoload, {
    dir: join(__dirname, "plugins"),
    options: opts,
  });


  fastify.log.info("plugging: ROUTES into app");
  fastify.register(autoload, {
    dir: join(__dirname, "routes"),
    prefix: opts?.appOptions?.apiPrefix,
  });
}
