import type { AppErrorParams } from "../../instance/errors/app-error";


const AuthErrors = {
  PasswordMismatch: {
    code: 'password_mismatch',
    message: 'Password mismatch',
    statusCode: 400,
  },
  InvalidCredentials: {
    code: 'invalid_credentials',
    message: 'Invalid credentials',
    statusCode: 401,
  },
  UserNotFound: {
    code: 'user_not_found',
    message: 'User not found',
    statusCode: 404,
  },
  InvalidLink: {
    code: 'invalid_link',
    message: 'Invalid link',
    statusCode: 400,
  },
  LinkExpired: {
    code: 'link_expired',
    message: 'Link Expired',
    statusCode: 400,
  },
  LinkTypeMismatched: {
    code: 'type_mismatched',
    message: "Link type didn't match",
    statusCode: 400,
  },
  UnexpectedRefreshToken: {
    code: 'bad_request',
    message: 'Refresh token provided to non-refresh endpoint',
    statusCode: 400,
  },
  TokenMissing: {
    code: 'unauthorized',
    message: 'Authorization token is missing',
    statusCode: 401,
  },
  TokenExpired: {
    code: 'unauthorized',
    message: 'Token has expired',
    statusCode: 401,
  },
  InvalidToken: {
    code: 'unauthorized',
    message: 'Invalid token',
    statusCode: 401,
  },
  Unauthenticated: {
    code: 'unauthenticated',
    message: 'User unauthenticated',
    statusCode: 401,
  },
  Forbidden: {
    code: 'forbidden',
    message: 'Forbidden',
    statusCode: 403,
  },
} as const satisfies Record<string, AppErrorParams>;

/**
 * Extract error codes from AuthErrors as a union type.
 */
export type AuthErrorCode =
  (typeof AuthErrors)[keyof typeof AuthErrors]['code'];

export default AuthErrors;
