import { type FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import type { DependencyOverrides } from "../app";
import { createDefaultBlobStorage } from "../../shared/storage/storage-factory";
import type { IBlobStorage } from "../../shared/storage/storage-interface";

export default fp(
  async (fastify: FastifyInstance, _overrides: DependencyOverrides) => {
    fastify.log.info("plugging: STORAGE into app");
    const testBlobStorage = createDefaultBlobStorage("test");
    // const profileBlobStorage = createDefaultBlobStorage("profile");

    fastify.decorate("testBlobStorage", testBlobStorage);
    // fastify.decorate("profileBlobStorage", profileBlobStorage);
  },
  { name: "storage" },
);

declare module "fastify" {
  interface FastifyInstance {
    testBlobStorage: IBlobStorage;
    // profileBlobStorage: IBlobStorage
  }
}
