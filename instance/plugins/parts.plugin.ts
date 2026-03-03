import fastifyMultipart from "@fastify/multipart";
import { type FastifyInstance } from "fastify";
import fp from "fastify-plugin";

export default fp(
  async (fastify: FastifyInstance) => {
    fastify.log.info("plugging: PARTS into app");

    await fastify.register(fastifyMultipart, {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
    });
  },
  { name: "parts", dependencies: ["storage"] },
);

declare module "fastify" {
  interface FastifyInstance { }
}
