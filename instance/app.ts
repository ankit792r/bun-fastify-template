import type { FastifyInstance } from "fastify";
import { join } from "node:path";
import type { AppPluginOptions } from "./server";
import autoload from "@fastify/autoload";
import type { Repository } from "../shared/database/repository";
import type { Board } from "../entities/board.entity";
import type { BoardService } from "../modules/board/board.service";
import { errorHandler, notFoundHandler } from "./errors/handlers";

export type DependencyOverrides = {
  name: string;
  boardRepository?: Repository<Board>;
  boardService?: BoardService;
};

export async function app(fastify: FastifyInstance, opts?: AppPluginOptions) {

  fastify.setErrorHandler(errorHandler);
  fastify.setNotFoundHandler(notFoundHandler);

  fastify.register(autoload, {
    dir: join(__dirname, "plugins"),
    options: opts,
  });

  fastify.log.info("plugging ROUTES into app")
  fastify.register(autoload, {
    dir: join(__dirname, "routes"),
    prefix: opts?.appOptions?.apiPrefix,
  });
}
