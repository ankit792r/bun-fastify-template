import { MongoClient } from "mongodb";
import env from "../../instance/env";

export const createMongoClient = async () => {
  const mongoClient = new MongoClient(env.MONGODB_URI, {
    appName: env.APP_NAME,
  });
  await mongoClient.connect();
  return mongoClient;
}
