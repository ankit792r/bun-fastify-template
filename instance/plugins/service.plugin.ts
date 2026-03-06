import { type FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import type { DependencyOverrides } from "../app";
import { UserService } from "../../services/user/user.service";
import { AuthService } from "../../services/auth/auth.service";

export default fp(
  async (fastify: FastifyInstance, overrides: DependencyOverrides) => {
    fastify.log.info("plugging: SERVICE in app");

    const userService =
      overrides.userService ?? new UserService(fastify.userCollection);

    const authService = new AuthService(userService);

    fastify.decorate("userService", userService);
    fastify.decorate("authService", authService);
  },
  { name: "service", dependencies: ["collection", "cache", "storage"] },
);

declare module "fastify" {
  interface FastifyInstance {
    userService: UserService;
    authService: AuthService;
  }
}
