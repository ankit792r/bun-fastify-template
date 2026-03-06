import { type FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import type { DependencyOverrides } from "../app";
import { createDefaultBlobStorage } from "../../modules/storage/storage-factory";
import type { IBlobStorage } from "../../modules/storage/storage-interface";

export default fp(
  async (fastify: FastifyInstance, _overrides: DependencyOverrides) => {
    fastify.log.info("plugging: STORAGE into app");
    const profileBlobStorage = createDefaultBlobStorage("profile");

    fastify.decorate("profileBlobStorage", profileBlobStorage);
  },
  { name: "storage" },
);

declare module "fastify" {
  interface FastifyInstance {
    profileBlobStorage: IBlobStorage;
  }
}
