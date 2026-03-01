import { type FastifyInstance } from "fastify"
import fp from "fastify-plugin"
import type { DependencyOverrides } from "../app"
import { type Board, BoardEntity } from "../../entities/board.entity"
import { createRepo } from "../../shared/database/repo-factory"
import type { Repository } from "../../shared/database/repository"

export default fp(
  async (fastify: FastifyInstance, overrides: DependencyOverrides) => {
    fastify.log.info("plugging: REPO into app")

    const boardRepository = overrides.boardRepository || await createRepo<Board>(BoardEntity);

    fastify.decorate("boardRepository", boardRepository);
  },
  { name: "repo" }
)

declare module 'fastify' {
  interface FastifyInstance {
    boardRepository: Repository<Board>;
  }
}
