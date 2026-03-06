import Fastify from "fastify";
import {
  validatorCompiler,
  type FastifyZodOpenApiTypeProvider,
  serializerCompiler,
  fastifyZodOpenApiPlugin,
  fastifyZodOpenApiTransformers,
} from "fastify-zod-openapi";
import { app, type DependencyOverrides } from "./app";
import env from "./env";

export interface AppOptions {
  dependencyOverrides: DependencyOverrides;
  apiPrefix: string;
}

export interface AppPluginOptions {
  appOptions?: AppOptions;
}

declare module "fastify" {
  interface FastifyInstance {
    appOptions: AppOptions;
  }
}

export const createServer = async () => {
  const server = Fastify({
    logger: {
      formatters: {
        level: (label: string) => ({
          label,
        }),
      },
    },
    pluginTimeout: 15000,
    disableRequestLogging: false,
    trustProxy: true,
    bodyLimit: 1048576,
  }).withTypeProvider<FastifyZodOpenApiTypeProvider>();

  server.setValidatorCompiler(validatorCompiler);
  server.setSerializerCompiler(serializerCompiler);

  if (env.NODE_ENV === "development") {
    server.log.info("Registering Swagger/OpenAPI plugin...");
    const { fastifySwagger } = await import("@fastify/swagger");
    await server.register(fastifyZodOpenApiPlugin);
    await server.register(fastifySwagger, {
      openapi: {
        openapi: "3.0.0",
        info: {
          title: "Portal API",
          description: "Fastify backend API",
          version: "1.0.0",
        },
        components: {
          securitySchemes: {
            bearerAuth: {
              type: "http",
              scheme: "bearer",
              bearerFormat: "JWT",
            },
            cookieAuth: {
              type: "apiKey",
              in: "cookie",
              name: "refreshToken",
            },
          },
        },
      },
      ...fastifyZodOpenApiTransformers,
    });

    await server.register(import("@fastify/swagger-ui"), {
      routePrefix: "/docs",
      uiConfig: {
        docExpansion: "none",
        deepLinking: false,
        persistAuthorization: true,
        withCredentials: true,
      },
      staticCSP: true,
      transformStaticCSP: (header) => header,
    });
  }

  server.register(app, {
    apiPrefix: "/api",
    dependencyOverrides: {
      name: "hello",
    },
  } as AppOptions);

  return server;
};
