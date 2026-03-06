import type { FastifyInstance, FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import { fastifyJwt, type FastifyJwtNamespace } from "@fastify/jwt";
import {
  createJwtId,
  type JwtAccessTokenPayloadDto,
  type JwtAccessTokenPayloadUnsigned,
  type JwtRefreshTokenPayloadDto,
  type JwtRefreshTokenPayloadUnsigned,
} from "../../services/auth/dto/jwt-payload.dto";
import { AppError } from "../errors/app-error";
import CommonErrors from "../errors/common.error";
import env from "../env";
import AuthErrors from "../../services/auth/auth.error";

declare module "fastify" {
  interface FastifyRequest
    extends
    FastifyJwtNamespace<{ namespace: "auth" }>,
    FastifyJwtNamespace<{ namespace: "cdn" }> {
    jwt: import("@fastify/jwt").JWT;

    /**
     * Get the authenticated user or throw an error if not authenticated.
     * Use this in routes that require authentication.
     */
    getUserOrThrow: () => JwtAccessTokenPayloadDto;
  }
  interface FastifyInstance {
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => Promise<void>;
  }
  interface FastifyContextConfig {
    public?: boolean;
  }
}

export type VerifyAccessTokenFn = (token: string) => JwtAccessTokenPayloadDto;
export type VerifyRefreshTokenFn = (token: string) => JwtRefreshTokenPayloadDto;

export type SignAccessTokenFn = (
  payload: JwtAccessTokenPayloadUnsigned,
) => string;
export type SignRefreshTokenFn = (
  payload: JwtRefreshTokenPayloadUnsigned,
) => string;

declare module "@fastify/jwt" {
  interface FastifyJWT {
    user: JwtAccessTokenPayloadDto;
  }

  interface JWT {
    auth: import("@fastify/jwt").JWT;
    cdn: import("@fastify/jwt").JWT;

    verifyAccessToken: (token: string) => JwtAccessTokenPayloadDto;
    verifyRefreshToken: (token: string) => JwtRefreshTokenPayloadDto;

    signRefreshToken: (payload: JwtRefreshTokenPayloadUnsigned) => string;
    signAccessToken: (payload: JwtAccessTokenPayloadUnsigned) => string;
  }
}

export default fp(
  async (fastify: FastifyInstance) => {
    // Auth strategy using JWTs
    // We use both Access Tokens and Refresh Tokens for authentication.
    // We also use Download Tokens for secure file downloads.

    // Access Token:
    //  - short lived (minutes)
    //  - used to access resources
    //  - MUST BE sent in Authorization header
    //  - CANNOT be sent in cookie

    // Refresh Token:
    //  - long lived (days)
    //  - used to get new access tokens (may implement rotating refresh tokens later)
    //  - MUST BE sent in cookie (httpOnly, secure, sameSite, path restricted)
    //  - CANNOT be sent in Authorization header

    // Register primary JWT for access and refresh tokens
    await fastify.register(fastifyJwt, {
      namespace: "auth",
      secret: env.JWT_SECRET,
      sign: { algorithm: "HS256" },
      // Although we use cookies for refresh tokens,
      // we don't want jwtVerify to automatically look for tokens in cookies.
      // We will manually verify refresh tokens when needed.
      // This prevents mixing up access and refresh tokens.
    });

    // Register separate JWT namespace for CDN download tokens
    await fastify.register(fastifyJwt, {
      namespace: "cdn",
      secret: env.CDN_SECRET,
      sign: { algorithm: "HS256" },
    });

    fastify.jwt.signAccessToken = (payload: JwtAccessTokenPayloadUnsigned) => {
      return fastify.jwt.auth.sign(
        { ...payload, typ: "access" },
        {
          expiresIn: `${env.ACCESS_TOKEN_EXPIRY_MINUTES}m`,
          jti: createJwtId(),
        },
      );
    };

    fastify.jwt.signRefreshToken = (
      payload: JwtRefreshTokenPayloadUnsigned,
    ) => {
      return fastify.jwt.auth.sign(
        { ...payload, typ: "refresh" },
        {
          expiresIn: `${env.REFRESH_TOKEN_EXPIRY_DAYS}d`,
          jti: createJwtId(),
        },
      );
    };

    fastify.jwt.verifyAccessToken = (
      token: string,
    ): JwtAccessTokenPayloadDto => {
      try {
        const payload =
          fastify.jwt.auth.verify<JwtAccessTokenPayloadDto>(token);
        if (payload.typ !== "access") {
          throw new AppError(AuthErrors.InvalidToken);
        }
        return payload;
      } catch (err) {
        convertErrorAndRethrow(err);
      }
    };

    fastify.jwt.verifyRefreshToken = (
      token: string,
    ): JwtRefreshTokenPayloadDto => {
      try {
        const payload =
          fastify.jwt.auth.verify<JwtRefreshTokenPayloadDto>(token);
        if (payload.typ !== "refresh") {
          throw new AppError(AuthErrors.InvalidToken);
        }
        return payload;
      } catch (err) {
        convertErrorAndRethrow(err);
      }
    };

    fastify.decorate("authenticate", async function (request: FastifyRequest) {
      try {
        // authJwtVerify is the namespaced version that uses the 'auth' JWT instance
        await (
          request as unknown as { authJwtVerify: () => Promise<void> }
        ).authJwtVerify();

        // jwtVerify verifies it is a valid JWT, but not that it is an access token,
        // so we need to check that here.
        // jwtVerify will have assigned the payload to request.user
        if (request.user.typ !== "access") {
          throw new AppError(AuthErrors.InvalidToken);
        }
      } catch (err) {
        // For public routes, allow missing auth but not invalid auth

        const isPublic = request.routeOptions.config?.public;
        if (isPublic && isFastifyNoAuthorizationError(err)) {
          return;
        }

        // For non-public routes or invalid tokens, throw the error
        convertErrorAndRethrow(err);
      }
    });

    fastify.addHook("onRequest", async (request, _reply) => {
      // Enforce that refresh tokens are never sent to non-refresh endpoints

      if (request.url === "/api/auth/refresh-token") {
        return; // skip for refresh-token endpoint
      }

      const refreshToken = request.cookies.refreshToken;
      if (refreshToken) {
        throw new AppError(AuthErrors.UnexpectedRefreshToken);
      }
    });

    // Decorate request with helper functions to get authenticated user
    fastify.decorateRequest("getUserOrThrow", function (this: FastifyRequest) {
      if (!this.user) {
        throw new Error("Expected request.user object to exist but it didn't.");
      }
      return this.user;
    });
  },
  { name: "jwt", dependencies: ["cookie"] },
);

function isFastifyNoAuthorizationError(err: unknown): boolean {
  // Check if the error is due to missing token
  if (err && typeof err === "object" && "code" in err) {
    const e = err as { code: string };
    return (
      e.code === "FST_JWT_NO_AUTHORIZATION_IN_HEADER" ||
      e.code === "FST_JWT_NO_AUTHORIZATION_IN_COOKIE"
    );
  }
  return false;
}

function convertErrorAndRethrow(err: unknown): never {
  if (err instanceof AppError) throw err;

  // Handle Fastify JWT errors that have 'code' property
  if (err && typeof err === "object" && "code" in err) {
    const e = err as { code: string; message?: string };
    switch (e.code) {
      case "FST_JWT_NO_AUTHORIZATION_IN_HEADER":
      case "FST_JWT_NO_AUTHORIZATION_IN_COOKIE":
        throw new AppError(AuthErrors.TokenMissing);
      case "FST_JWT_AUTHORIZATION_TOKEN_EXPIRED":
      case "FAST_JWT_EXPIRED":
        throw new AppError(AuthErrors.TokenExpired);
      case "FST_JWT_AUTHORIZATION_TOKEN_INVALID":
      case "FST_JWT_AUTHORIZATION_TOKEN_UNTRUSTED":
      case "FAST_JWT_MISSING_SIGNATURE":
      case "FST_JWT_BAD_REQUEST":
      case "FST_JWT_BAD_COOKIE_REQUEST":
        throw new AppError(AuthErrors.InvalidToken);
      case "ERR_ASSERTION":
        throw new AppError(CommonErrors.ServerError);
    }
  }

  // Handle errors from jsonwebtoken library (used by @fastify/jwt internally)
  // that use 'name' instead of 'code'
  if (err && typeof err === "object" && "name" in err) {
    const e = err as { name: string; message?: string };
    switch (e.name) {
      case "TokenExpiredError":
        throw new AppError(AuthErrors.TokenExpired);
      case "JsonWebTokenError":
      case "NotBeforeError":
        throw new AppError(AuthErrors.InvalidToken);
    }
  }

  // If we don't recognize the error, wrap it as InvalidToken
  // This handles edge cases and ensures we always throw an AppError
  throw new AppError(AuthErrors.InvalidToken);
}
