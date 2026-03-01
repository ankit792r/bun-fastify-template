import type { FastifyInstance } from "fastify";
import type { FastifyZodOpenApiTypeProvider } from "fastify-zod-openapi";
import type { Board } from "../../entities/board.entity";

export default async function (fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<FastifyZodOpenApiTypeProvider>();

  server.route({
    method: "GET",
    url: "/boards",
    handler: async (request, reply) => {
      const boardService = fastify.boardService
      const result = await boardService.getBoards()
      return reply.send(result)
    }
  })

  server.route({
    method: "POST",
    url: "/boards",
    handler: async (request, reply) => {
      const boardService = fastify.boardService
      const result = await boardService.createBoard({ id: "some if", name: "my new board", description: "test board description", createdAt: new Date(), updatedAt: new Date() } as Board)
      return reply.send(result)
    }
  })
}

