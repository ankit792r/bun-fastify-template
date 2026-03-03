import { createEnv } from "@t3-oss/env-core";
import z from "zod";

export const coerceBoolean = () =>
  z
    .string()
    .transform((val) => val.toLowerCase())
    .pipe(z.enum(["0", "1", "true", "false", "on", "off"]))
    .transform((val) => val === "1" || val === "true" || val === "on");

const env = createEnv({
  emptyStringAsUndefined: true,
  server: {
    APP_NAME: z.string().default("test-backend"),

    PORT: z.coerce.number().default(8000),
    HOST: z.string().default("localhost"),
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    EXPOSE_DEBUG_VALIDATION_ERROR_INFO: coerceBoolean().default(false),

    MONGODB_URI: z.string().default("mongodb://localhost:27017"),
    DB_NAME: z.string().default("testdb"),

    DEFAULT_CACHE_IMPL: z.enum(["redis", "memory"]).default("memory"),
    REDIS_URL: z.string().default("redis://localhost:6379"),
  },
  runtimeEnv: process.env,
});

export default env;
