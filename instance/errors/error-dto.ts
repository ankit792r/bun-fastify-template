
import { z } from "zod";

/**
 * Schema for individual validation error items returned by Zod/AJV validation
 */
export const ValidationErrorItemSchema = z.object({
  keyword: z.string(),
  instancePath: z.string(),
  schemaPath: z.string(),
  params: z.record(z.string(), z.unknown()),
  message: z.string().optional(),
  devMessage: z
    .string()
    .default("DO NOT USE THIS IN PRODUCTION, FOR DEBUGGING ONLY."),
});

export type ValidationErrorItem = z.infer<typeof ValidationErrorItemSchema>;

/**
 * Standard Error Response Schema
 *
 * This schema defines the consistent error response format used across all API endpoints.
 * All error responses follow this structure to provide a predictable interface for clients.
 *
 * @note Error responses are read by the frontend, so avoid including any sensitive information
 * or internal details such as stack traces or database error codes. They should be user-friendly
 * but vague enough to not expose internal workings.
 */
export const ErrorResponseDtoSchema = z
  .object({
    error: z.object({
      code: z.string().meta({ description: "Error code" }),
      message: z.string().meta({ description: "Error message" }),
      param: z
        .string()
        .optional()
        .meta({ description: "Parameter related to the error" }),
      debugValidationErrorInfo: z
        .array(ValidationErrorItemSchema)
        .optional()
        .meta({
          description:
            "Debug information for validation errors, used only in development. Not included in production responses.",
        }),
    }),
  })
  .meta({
    description: "Error response shape for all errors",
    examples: [
      {
        error: {
          code: "server_error",
          message: "An unexpected error occurred while processing your request",
        },
      },
      {
        error: {
          code: "validation_error",
          message: "The email address format is invalid",
          param: "email",
        },
      },
      {
        error: {
          code: "too_many_requests",
          message: "Rate limit exceeded. Please try again later",
        },
      },
    ],
  });

export type ErrorResponseDto = z.infer<typeof ErrorResponseDtoSchema>;
