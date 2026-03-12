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
    APP_NAME: z.string().default("base-backend"),
    CORS_ORIGIN: z
      .string()
      .transform((val) => val.split(","))
      .default(["http://localhost:3000"]),

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

    DEFAULT_BLOB_STORAGE_IMPL: z.enum(["memory", "disk"]).default("disk"),
    DISK_STORAGE_BASE_PATH: z.string().default("statics/storage"),
    BLOB_STORAGE_SERVICE_URL: z
      .string()
      .default(`http://localhost:8000/content`),

    // Email configuration
    EMAIL_SERVICE_IMPL: z.enum(["mock", "print", "smpt"]).default("print"),
    EMAIL_FROM: z.string().default("no-reply@great-walls.com"),
    EMAIL_HOST: z.string().default("smtp.gmail.com"),
    EMAIL_PORT: z.number().default(587),
    EMAIL_USER: z.string().default("no-reply@great-walls.com"),
    EMAIL_PASSWORD: z.string().default(""),

    // Authentication configuration
    JWT_SECRET: z.string().default("secret"),
    JWT_EXPIRES_IN: z.string().default("1h"),
    JWT_REFRESH_SECRET: z.string().default("refresh-secret"),
    JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),

    CDN_SECRET: z.string().default("cdn-secret"),
    CDN_EXPIRES_IN: z.string().default("1h"),

    ACCESS_TOKEN_EXPIRY_MINUTES: z.number().default(30),
    REFRESH_TOKEN_EXPIRY_DAYS: z.number().default(30),

    // Rate limiting configuration
    RATE_LIMIT_WINDOW: z.number().default(60000),
    RATE_LIMIT_MAX: z.number().default(100),
  },
  runtimeEnv: process.env,
});

export default env;
