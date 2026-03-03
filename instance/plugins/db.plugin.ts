import { type FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import type { DependencyOverrides } from "../app";
import { createMongoClient } from "../../shared/mongodb/mongo-factory";
import type { MongoClient } from "mongodb";

export default fp(
  async (fastify: FastifyInstance, overrides: DependencyOverrides) => {
    fastify.log.info("plugging: DB into app");
    const mongoClient = overrides.mongoClient ?? (await createMongoClient());

    fastify.decorate("mongoClient", mongoClient);
  },
  { name: "db" },
);

declare module "fastify" {
  interface FastifyInstance {
    mongoClient: MongoClient;
  }
}
