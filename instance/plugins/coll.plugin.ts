import { type FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import type { DependencyOverrides } from "../app";
import { createCollection } from "../../shared/mongodb/colls-factory";
import {
  BoardCollectionConfig,
  type Board,
} from "../../collections/board.model";
import type { Collection } from "mongodb";

export default fp(
  async (fastify: FastifyInstance, overrides: DependencyOverrides) => {
    fastify.log.info("plugging: REPO into app");

    const boardCollection =
      overrides.boardRepository ||
      (await createCollection<Board>(
        BoardCollectionConfig,
        fastify.mongoClient,
      ));

    fastify.decorate("boardCollection", boardCollection);
  },
  { name: "collection", dependencies: ["db"] },
);

declare module "fastify" {
  interface FastifyInstance {
    boardCollection: Collection<Board>;
  }
}
