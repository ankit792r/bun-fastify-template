import type { FastifyInstance } from "fastify";
import type { FastifyZodOpenApiTypeProvider } from "fastify-zod-openapi";
import type { Board } from "../../collections/board.model";

export default async function (fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<FastifyZodOpenApiTypeProvider>();

  server.route({
    method: "GET",
    url: "/boards",
    handler: async (request, reply) => {
      const boardService = fastify.boardService;

      const cache = fastify.cache;
      console.log(await cache.get("hello"));

      const blbo = fastify.testBlobStorage.getStorageUrl("test.jpg");
      console.log(blbo);

      const result = await boardService.listBoards();
      return reply.send(result);
    },
  });

  server.route({
    method: "POST",
    url: "/boards",
    handler: async (request, reply) => {
      const boardService = fastify.boardService;

      await fastify.cache.set("hello", "world");

      await fastify.testBlobStorage.upload(
        "test.jpg",
        Buffer.from("some string"),
        "img/jpg",
      );

      const result = await boardService.createBoard({
        _id: "some if",
        name: "my new board",
        description: "test board description",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Board);
      return reply.send(result);
    },
  });
}
