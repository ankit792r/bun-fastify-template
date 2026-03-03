import { type FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import type { DependencyOverrides } from "../app";
import fastifyCookie from "@fastify/cookie";

export default fp(
  async (fastify: FastifyInstance, overrides: DependencyOverrides) => {
    fastify.log.info("plugging: COOKIE into app");
    await fastify.register(fastifyCookie, {
      parseOptions: {},
    });
  },
  { name: "cookie" },
);

declare module "fastify" {
  interface FastifyInstance { }
}
