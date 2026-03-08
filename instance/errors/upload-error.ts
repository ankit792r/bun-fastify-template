import type { AppErrorParams } from "./app-error";

export const UploadErrors = {
  UploadFailed: {
    code: "upload_failed",
    message: "Failed to upload file to storage",
    statusCode: 500,
  },
  ImageDimensionsTooSmall: {
    code: "image_dimensions_too_small",
    message: "Image dimensions are below the minimum required size",
    statusCode: 400,
  },
  ImageDimensionsExceeded: {
    code: "image_dimensions_exceeded",
    message: "Image dimensions exceed the maximum allowed size",
    statusCode: 400,
  },
  EmptyFile: {
    code: "empty_file",
    message: "Empty file",
    statusCode: 400,
  },
  InvalidFileType: {
    code: "invalid_file_type",
    message: "Invalid file uploaded",
    statusCode: 400,
  },
  InvalidMimeType: {
    code: "invalid_mime_type",
    message: "Invalid file MIME type",
    statusCode: 400,
  },
  TooManyParts: {
    code: "too_many_parts",
    message: "Too many parts in the upload",
    statusCode: 413,
  },
  TooManyFiles: {
    code: "too_many_files",
    message: "Too many files uploaded",
    statusCode: 413,
  },
  TooManyFields: {
    code: "too_many_fields",
    message: "Too many fields in the upload",
    statusCode: 413,
  },
  FileTooLarge: {
    code: "file_too_large",
    message: "File size exceeds the allowed limit",
    statusCode: 413,
  },
  InvalidField: {
    code: "invalid_field",
    message: "Invalid field in the upload",
    statusCode: 400,
  },
  InvalidMultipartContentType: {
    code: "invalid_multipart_content_type",
    message: "Invalid multipart content type",
    statusCode: 400,
  },
  MissingUploadContentLength: {
    code: "missing_upload_content_length",
    message: "X-Upload-Content-Length header is required",
    statusCode: 400,
  },
  InvalidUploadContentLength: {
    code: "invalid_upload_content_length",
    message: "X-Upload-Content-Length header must be a positive integer",
    statusCode: 400,
  },
  MissingUploadContentType: {
    code: "missing_upload_content_type",
    message: "X-Upload-Content-Type header is required",
    statusCode: 400,
  },
  UploadContentLengthMismatch: {
    code: "upload_content_length_mismatch",
    message: "X-Upload-Content-Length does not match the actual file size",
    statusCode: 400,
  },
  UploadContentTypeMismatch: {
    code: "upload_content_type_mismatch",
    message:
      "X-Upload-Content-Type header does not match the uploaded file MIME type",
    statusCode: 400,
  },
  MissingUploadContentDigest: {
    code: "missing_upload_content_digest",
    message: "X-Upload-Content-Digest header is required",
    statusCode: 400,
  },
  InvalidUploadContentDigest: {
    code: "invalid_upload_content_digest",
    message:
      "X-Upload-Content-Digest header must use the RFC 9530 format sha-256=:<base64>:",
    statusCode: 400,
  },
  UploadContentDigestMismatch: {
    code: "upload_content_digest_mismatch",
    message:
      "X-Upload-Content-Digest does not match the SHA-256 hash of the uploaded file",
    statusCode: 400,
  },
} as const satisfies Record<string, AppErrorParams>;

/**
 * Extract error codes from UploadErrors as a union type.
 */
export type UploadErrorCode =
  (typeof UploadErrors)[keyof typeof UploadErrors]["code"];

export default UploadErrors;
