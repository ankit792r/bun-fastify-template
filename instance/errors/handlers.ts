import type { FastifyError, FastifyRequest, FastifyReply } from "fastify";
import { AppError } from "./app-error";
import env from "../env";

const genericServerErrorResponse = {
  error: {
    code: 'server_error',
    message: 'An unexpected error occurred while processing your request',
  },
} as const;

const genericBadRequestErrorResponse = {
  error: {
    code: 'bad_request',
    message: 'Bad request',
  },
} as const;

export const isFastifyError = (error: unknown): error is FastifyError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    typeof (error as { code?: string }).code === 'string' &&
    (error as { code: string }).code.startsWith('FST_')
  );
};

const logError = (error: unknown, request: FastifyRequest) => {
  request.log.error(
    {
      err: error,
      url: request.url,
      method: request.method,
    },
    'Error occurred during request processing',
  );
};

export const errorHandler = (
  error: unknown,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  // NOTE: Fastify DOES NOT call this function for 404 Not Found errors, see the notFoundHandler.

  // console.log(typeof error);
  // console.log(error.name);
  // console.log(error);
  // console.log(JSON.stringify(error));

  if (error instanceof SyntaxError) {
    return reply.status(400).send(genericBadRequestErrorResponse);
  } else if (isFastifyError(error)) {
    // Fastify built-in error
    return errorHandlerFastifyError(error, request, reply);
  } else if (error instanceof AppError) {
    // One of our custom application errors
    return errorHandlerAppError(error, request, reply);
  }

  // Something bad happened, all errors should have been fastify or custom AppErrors
  return errorHandlerUnexpectedError(error, request, reply);
};

const errorHandlerFastifyError = (
  error: FastifyError,
  _request: FastifyRequest,
  reply: FastifyReply,
) => {
  if (error.validation !== undefined) {
    // Validation error
    const param = extractValidationParam(error);
    return reply.status(400).send({
      error: {
        code: 'validation_error',
        message: 'Validation error',
        param,
        debugValidationErrorInfo: env.EXPOSE_DEBUG_VALIDATION_ERROR_INFO
          ? error.validation
          : undefined,
      },
    });
  } else if (error.statusCode === undefined || error.statusCode >= 500) {
    return reply.status(500).send(genericServerErrorResponse);
  } else if (error.statusCode >= 400) {
    return reply.status(error.statusCode).send(genericBadRequestErrorResponse);
  }

  // fallback to generic server error
  return reply.status(500).send(genericServerErrorResponse);
};

const errorHandlerAppError = (
  error: AppError,
  _request: FastifyRequest,
  reply: FastifyReply,
) => {
  if (error.statusCode === undefined || error.statusCode >= 500) {
    return reply.status(500).send(genericServerErrorResponse);
  }
  return reply.status(error.statusCode).send({
    error: {
      code: error.code,
      message: error.message,
      param: error.param,
    },
  });
};

const errorHandlerUnexpectedError = (
  error: unknown,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  logError(error, request);
  return reply.status(500).send(genericServerErrorResponse);
};

const extractValidationParam = (error: FastifyError): string => {
  if (error.validation && error.validation.length > 0) {
    const firstValidation = error.validation[0];

    // instancePath will be something like /paramName/subField
    // We want to extract 'paramNameRR
    const path = firstValidation?.instancePath;
    if (path && path.startsWith('/')) {
      return path.slice(1);
    }
  }
  return '';
};

export const notFoundHandler = (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  request.log.warn(
    {
      url: request.url,
      method: request.method,
    },
    'Route or method not found',
  );

  return reply.status(404).send({
    error: {
      code: 'not_found',
      message: 'Route or method not found',
    },
  });
};