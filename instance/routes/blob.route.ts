import type { FastifyInstance } from "fastify";
import type { FastifyZodOpenApiTypeProvider } from "fastify-zod-openapi";
import z from "zod";
import { AppError } from "../errors/app-error";
import CommonErrors from "../errors/common.error";

const FileContentParamsSchema = z.object({
  bucketName: z.string(),
  filePath: z.string(),
});

const FileContentQuerySchema = z.object({
  token: z.string().optional(),
});

export default async function (fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<FastifyZodOpenApiTypeProvider>();

  server.route({
    method: "GET",
    url: "/content/:bucketName/:filePath",
    schema: {
      params: FileContentParamsSchema,
      querystring: FileContentQuerySchema,
    },
    handler: async (request, reply) => {
      const { bucketName, filePath } = request.params;
      let stream;

      switch (bucketName) {
        case "profile":
          stream = await fastify.profileBlobStorage.download(filePath);
          break;

        default:
          throw new AppError(CommonErrors.NotFound);
      }

      return reply.send(stream);
    },
  });
}
