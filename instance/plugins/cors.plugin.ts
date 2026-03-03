import { type FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import type { DependencyOverrides } from "../app";
import env from "../env";
import fastifyCors from "@fastify/cors";

export default fp(
  async (fastify: FastifyInstance, overrides: DependencyOverrides) => {
    fastify.log.info("plugging: CORS into app");
    await fastify.register(fastifyCors, {
      origin: env.CORS_ORIGIN,
      credentials: true,
    });
  },
  { name: "cors" },
);

declare module "fastify" {
  interface FastifyInstance { }
}
