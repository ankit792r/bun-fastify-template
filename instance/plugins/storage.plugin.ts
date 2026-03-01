import { type FastifyInstance } from "fastify"
import fp from "fastify-plugin"
import type { DependencyOverrides } from "../app"

export default fp(
  async (fastify: FastifyInstance, overrides: DependencyOverrides) => {
    fastify.log.info("plugging: STORAGE into app")

  },
  { name: "storage" }
)

declare module 'fastify' {
  interface FastifyInstance {
  }
}
