import type { AppErrorParams } from "./app-error";

// Common application errors used across different modules
const CommonErrors = {
  ServerError: {
    code: 'server_error',
    message: 'An unexpected error occurred while processing your request',
    statusCode: 500,
  },
  BadRequest: {
    code: 'bad_request',
    message: 'Bad request',
    statusCode: 400,
  },
  ValidationError: {
    code: 'validation_error',
    message: 'Validation error',
    statusCode: 400,
  },
  NotFound: {
    code: 'not_found',
    message: 'Resource not found',
    statusCode: 404,
  },
  Forbidden: {
    code: 'forbidden',
    message: 'You do not have permission to access this resource',
    statusCode: 403,
  },
} as const satisfies Record<string, AppErrorParams>;

/**
 * Extract error codes from CommonErrors as a union type.
 * This allows TypeScript to infer the exact string literals.
 */
export type CommonErrorCode =
  (typeof CommonErrors)[keyof typeof CommonErrors]['code'];

export default CommonErrors;