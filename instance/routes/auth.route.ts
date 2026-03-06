import type { CookieSerializeOptions } from "@fastify/cookie";
import type { FastifyInstance } from "fastify";
import type { FastifyZodOpenApiTypeProvider } from "fastify-zod-openapi";
import { LoginDtoSchema } from "../../services/auth/dto/login-request.dto";
import { AuthResponseDtoSchema } from "../../services/auth/dto/auth-response.dto";
import { ErrorResponseDtoSchema } from "../errors/error-dto";
import env from "../env";
import { RegisterDtoSchema } from "../../services/auth/dto/register-request.dto";
import { AppError } from "../errors/app-error";
import AuthErrors from "../../services/auth/auth.error";
import type { JwtRefreshTokenPayloadDto } from "../../services/auth/dto/jwt-payload.dto";
import z from "zod";

const refreshTokenCookieOptions: CookieSerializeOptions = {
  path: "/api/auth/refresh-token",
  secure: true,
  httpOnly: true,
  sameSite: "lax",
  maxAge: env.REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60,
} as const;

const clearRefreshTokenCookieOptions: CookieSerializeOptions = {
  path: "/api/auth/refresh-token",
  secure: true,
  httpOnly: true,
  sameSite: "lax",
} as const;

export default async function (fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<FastifyZodOpenApiTypeProvider>();

  server.route({
    method: "POST",
    url: "/auth/login",
    schema: {
      tags: ["Authentication"],
      summary: "Login user",
      body: LoginDtoSchema,
      response: {
        200: AuthResponseDtoSchema,
        default: ErrorResponseDtoSchema,
      },
    },
    handler: async (request, reply) => {
      const user = await fastify.authService.getUserByEmailAndPassword(
        request.body,
      );

      const accessToken = fastify.jwt.signAccessToken({
        email: user.email,
        sub: user._id,
        roles: ["user"],
      });

      const refreshToken = fastify.jwt.signRefreshToken({ sub: user._id });

      return reply
        .setCookie("refreshToken", refreshToken, refreshTokenCookieOptions)
        .status(200)
        .send({ accessToken });
    },
  });

  server.route({
    method: "POST",
    url: "/auth/register",
    schema: {
      tags: ["Authentication"],
      summary: "Register user",
      body: RegisterDtoSchema,
      response: {
        200: AuthResponseDtoSchema,
        default: ErrorResponseDtoSchema,
      },
    },
    handler: async (request, reply) => {
      const body = request.body;
      if (body.password !== body.passwordConfirmation)
        throw new AppError(AuthErrors.PasswordMismatch);
      const user = await fastify.userService.createUser(request.body);

      const accessToken = fastify.jwt.signAccessToken({
        email: user.email,
        sub: user._id,
        roles: ["user"],
      });

      const refreshToken = fastify.jwt.signRefreshToken({ sub: user._id });

      return reply
        .setCookie("refreshToken", refreshToken, refreshTokenCookieOptions)
        .status(200)
        .send({ accessToken });
    },
  });

  server.route({
    method: "POST",
    url: "/auth/refresh-token",
    schema: {
      tags: ["Authentication"],
      summary: "Request fresh access token",
      response: {
        200: AuthResponseDtoSchema,
        default: ErrorResponseDtoSchema,
      },
      security: [{ cookieAuth: [] }],
    },
    handler: async (request, reply) => {
      const refreshToken = request.cookies.refreshToken;
      if (!refreshToken) throw new AppError(AuthErrors.TokenMissing);

      const userRefreshPayload: JwtRefreshTokenPayloadDto =
        fastify.jwt.verifyRefreshToken(refreshToken);

      const user = await fastify.userService.getUserByIdOrThrow(
        userRefreshPayload.sub,
      );

      const accessToken = fastify.jwt.signAccessToken({
        email: user.email,
        sub: user._id,
        roles: ["user"],
      });
      return reply.status(200).send({ accessToken });
    },
  });

  server.route({
    method: "POST",
    url: "/auth/logout",
    schema: {
      tags: ["Authentication"],
      summary: "Logout user",
      response: {
        204: z.null(),
        default: ErrorResponseDtoSchema,
      },
    },

    handler: async (_request, reply) => {
      return reply
        .status(204)
        .clearCookie("refreshToken", clearRefreshTokenCookieOptions)
        .send(null);
    },
  });
}
