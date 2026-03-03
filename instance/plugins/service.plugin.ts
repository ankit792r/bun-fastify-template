import { type FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import type { DependencyOverrides } from "../app";
import { BoardService } from "../../modules/board/board.service";

export default fp(
  async (fastify: FastifyInstance, overrides: DependencyOverrides) => {
    fastify.log.info("plugging: SERVICE in app");

    const boardService =
      overrides.boardService || new BoardService(fastify.boardCollection);
    fastify.decorate("boardService", boardService);
  },
  { name: "service", dependencies: ["collection", "cache"] },
);

declare module "fastify" {
  interface FastifyInstance {
    boardService: BoardService;
  }
}
