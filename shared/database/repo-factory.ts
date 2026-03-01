import { MongoRepository } from "./mongo.repo";
import { InMemoryRepository } from "./memory.repo";
import type { Entity } from "./entity";
import type { Repository } from "./repository";
import env from "../../instance/env";
import { createMongoClient } from "./db-factory";

export async function createRepo<T extends { id: string }>(
  entityConfig: Entity<T>,
  options?: {
    dbName?: string;
  },
): Promise<Repository<T>> {
  switch (env.DB_IMPL) {
    case "mongodb":
      const mongoClient = await createMongoClient()
      const dbName = options?.dbName ?? env.DB_NAME;

      const db = mongoClient.db(dbName);
      const collection = db.collection(entityConfig.collectionName);
      return new MongoRepository<T>(collection, entityConfig);

    case "memory":
      return new InMemoryRepository<T>(entityConfig);

    default:
      throw new Error("Unknown DB_IMPL provided");

  }
}