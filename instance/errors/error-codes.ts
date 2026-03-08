/**
 * Centralized Error Codes
 *
 * This file aggregates all error codes from across the application into a single
 * union type for type-safe error code handling.
 *
 * @example
 * ```typescript
 * import { AppErrorCode } from './error-codes';
 *
 * const errorCode: AppErrorCode = 'user_not_found'; // ✅ Type-safe
 * const invalid: AppErrorCode = 'invalid_code'; // ❌ Type error
 * ```
 */

import type { AuthErrorCode } from "../../services/auth/auth.error";
import type { UserErrorCodes } from "../../services/user/user.error";
import type { CommonErrorCode } from "./common.error";
import type { UploadErrorCode } from "./upload-error";

/**
 * Union of all possible error codes across the application.
 *
 * This type is automatically derived from all error definition files.
 * When you add a new error to any *.error.ts file, it will automatically
 * be included in this union type.
 */
export type AppErrorCode =
  | CommonErrorCode
  | UserErrorCodes
  | AuthErrorCode
  | UploadErrorCode;
