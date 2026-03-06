import type { Collection, Document, MongoClient } from "mongodb";
import type { ZodType } from "zod";
import env from "../instance/env";

export type CollectionConfig<T extends Document> = {
  name: string;
  primaryKey: string & keyof T;
  indices: string[];
  schema: ZodType<T>;
  schemaVersion: number;
};

export type CollectionCreateOption = {
  dbName?: string;
};

export async function createCollection<T extends Document>(
  collectionConfig: CollectionConfig<T>,
  mongoClient: MongoClient,
  option?: CollectionCreateOption,
): Promise<Collection<T>> {
  const dbName = option?.dbName ?? env.DB_NAME;
  const database = mongoClient.db(dbName);
  const collection = database.collection<T>(collectionConfig.name);
  // TODO: collection.createIndex()
  return collection;
}
