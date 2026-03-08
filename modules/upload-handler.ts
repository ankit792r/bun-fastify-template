import crypto from "crypto";
import path from "path";

import type { FastifyRequest } from "fastify";
import z from "zod";
import CommonErrors from "../instance/errors/common.error";
import { AppError, type AppErrorParams } from "../instance/errors/app-error";
import { isFastifyError } from "../instance/errors/handlers";
import UploadErrors from "../instance/errors/upload-error";

const UploadContentLengthHeaderSchema = z.coerce.number().int().positive();
const UploadContentTypeHeaderSchema = z.string();
const UploadContentDigestHeaderSchema = z
  .string()
  .regex(/^sha-256=:([A-Za-z0-9+/=]+):$/);

export type UploadHeaderRequirements = {
  /** Require X-Upload-Content-Length header (declared file size). */
  contentLength?: boolean;
  /** Require X-Upload-Content-Type header (declared MIME type, must match form data). */
  contentType?: boolean;
  /** Require X-Upload-Content-Digest header (sha-256=:<base64>: per RFC 9530). */
  contentDigest?: boolean;
};

export const ImageExtensionMime = {
  JPEG: {
    ext: ".jpeg",
    mime: "image/jpeg",
  },
  PNG: {
    ext: ".png",
    mime: "image/png",
  },
};

export type ParseFormFileToBufferOptions = {
  allowedMimeTypes: string[];
  allowedExtensions: string[];
  maxFileSize: number;
  multipleFile?: boolean; // TODO: implement this
  /** Optional upload header requirements for early validation. */
  requireUploadHeaders?: UploadHeaderRequirements;
};

export type ParseFormFileToBufferResult = {
  buffer: Buffer;
  mimetype: string;
  dangerousUserProvidedFilename: string;

  /** File extension in `.[ext]` format */
  fileExtension: string;
  fieldName: string;
};

const fastifyMultipartErrorMap: Record<string, AppErrorParams> = {
  FST_PARTS_LIMIT: UploadErrors.TooManyParts,
  FST_FILES_LIMIT: UploadErrors.TooManyFiles,
  FST_FIELDS_LIMIT: UploadErrors.TooManyFields,
  FST_REQ_FILE_TOO_LARGE: UploadErrors.FileTooLarge,
  FST_PROTO_VIOLATION: UploadErrors.InvalidField,
  FST_INVALID_MULTIPART_CONTENT_TYPE: UploadErrors.InvalidMultipartContentType,
  FST_INVALID_JSON_FIELD_ERROR: UploadErrors.InvalidField,
  FST_FILE_BUFFER_NOT_FOUND: CommonErrors.ServerError,
  FST_NO_FORM_DATA: CommonErrors.ServerError,
};

export const remapError = (error: unknown): unknown => {
  if (error instanceof AppError) {
    return error;
  } else if (isFastifyError(error)) {
    const code = error.code;
    const mappedError = fastifyMultipartErrorMap[code];
    if (mappedError) {
      return new AppError(mappedError);
    } else {
      return new Error("Unmapped Fastify error: " + code);
    }
  } else {
    return error;
  }
};

/**
 * Validates upload headers declared in the request BEFORE consuming the
 * multipart stream. These checks are cheap (header-only) and allow early
 * rejection of obviously-invalid requests.
 *
 * Throws AppError if any required header is missing or invalid.
 */
const validateUploadHeaders = (
  request: FastifyRequest,
  options: ParseFormFileToBufferOptions,
): {
  declaredContentLength: number | undefined;
  declaredContentType: string | undefined;
  declaredDigest: string | undefined;
} => {
  const requirements = options.requireUploadHeaders;
  if (!requirements)
    return {
      declaredContentLength: undefined,
      declaredContentType: undefined,
      declaredDigest: undefined,
    };

  let declaredContentLength: number | undefined;
  let declaredContentType: string | undefined;
  let declaredDigest: string | undefined;

  // --- X-Upload-Content-Length ---
  if (requirements.contentLength) {
    const rawLength = request.headers["x-upload-content-length"];
    if (!rawLength) throw new AppError(UploadErrors.MissingUploadContentLength);

    const parsed = UploadContentLengthHeaderSchema.safeParse(rawLength);
    if (!parsed.success)
      throw new AppError(UploadErrors.InvalidUploadContentLength);
    declaredContentLength = parsed.data;

    // Early reject: declared size already exceeds limit
    if (declaredContentLength > options.maxFileSize)
      throw new AppError(UploadErrors.FileTooLarge);
  }

  // --- X-Upload-Content-Type ---
  if (requirements.contentType) {
    const rawType = request.headers["x-upload-content-type"];
    if (!rawType) throw new AppError(UploadErrors.MissingUploadContentType);

    const parsed = UploadContentTypeHeaderSchema.safeParse(rawType);
    if (!parsed.success) throw new AppError(UploadErrors.InvalidMimeType);
    declaredContentType = parsed.data;

    // Early reject: declared MIME type is not in the allowed list
    if (!options.allowedMimeTypes.includes(declaredContentType))
      throw new AppError(UploadErrors.InvalidMimeType);
  }

  // --- X-Upload-Content-Digest ---
  if (requirements.contentDigest) {
    const rawDigest = request.headers["x-upload-content-digest"];
    if (!rawDigest) throw new AppError(UploadErrors.MissingUploadContentDigest);
    const parsed = UploadContentDigestHeaderSchema.safeParse(rawDigest);
    if (!parsed.success)
      throw new AppError(UploadErrors.InvalidUploadContentDigest);
    declaredDigest = parsed.data.slice(9, -1); // Extract base64 digest from "sha-256=:<digest>:"
  }

  return { declaredContentLength, declaredContentType, declaredDigest };
};

/**
 * Validates the consumed buffer against the declared upload headers.
 * These checks run AFTER the stream has been fully drained.
 */
const validateBufferAgainstHeaders = (
  buffer: Buffer,
  fileMimetype: string,
  declaredContentLength: number | undefined,
  declaredContentType: string | undefined,
  declaredDigest: string | undefined,
): void => {
  // Verify declared content length matches actual size
  if (
    declaredContentLength !== undefined &&
    buffer.length !== declaredContentLength
  )
    throw new AppError(UploadErrors.UploadContentLengthMismatch);

  // Verify declared content type matches the multipart part's Content-Type
  if (declaredContentType !== undefined && declaredContentType !== fileMimetype)
    throw new AppError(UploadErrors.UploadContentTypeMismatch);

  // Verify SHA-256 digest
  if (declaredDigest !== undefined) {
    const actualDigest = crypto
      .createHash("sha256")
      .update(buffer)
      .digest("base64");
    if (actualDigest !== declaredDigest)
      throw new AppError(UploadErrors.UploadContentDigestMismatch);
  }
};

export const parseFormFileToBuffer = async (
  request: FastifyRequest,
  options: ParseFormFileToBufferOptions,
): Promise<ParseFormFileToBufferResult> => {
  try {
    // Phase 1: Validate upload headers BEFORE consuming the stream.
    // These are cheap checks on request headers that can reject early.
    const { declaredContentLength, declaredContentType, declaredDigest } =
      validateUploadHeaders(request, options);

    const file = await request.file({
      limits: { fileSize: options.maxFileSize, files: 1 },
    });
    if (!file) throw new AppError(UploadErrors.EmptyFile);

    // Phase 2: Always consume the file stream BEFORE throwing validation errors.
    // If we throw before the stream is drained, the HTTP connection hangs because
    // the client is still sending the request body while the server tries to respond.
    const buffer = await file.toBuffer();

    if (buffer.length === 0) throw new AppError(UploadErrors.EmptyFile);

    // Phase 3: Validate the consumed buffer against declared headers.
    validateBufferAgainstHeaders(
      buffer,
      file.mimetype,
      declaredContentLength,
      declaredContentType,
      declaredDigest,
    );

    // Phase 4: Standard validations on the multipart metadata.
    if (!options.allowedMimeTypes.includes(file.mimetype))
      throw new AppError(UploadErrors.InvalidMimeType);

    const extension = path.extname(file.filename).toLowerCase();
    if (!options.allowedExtensions.includes(extension))
      throw new AppError(UploadErrors.InvalidFileType);

    return {
      buffer,
      mimetype: file.mimetype,
      dangerousUserProvidedFilename: file.filename,
      fileExtension: extension,
      fieldName: file.fieldname,
    };
  } catch (error) {
    throw remapError(error);
  }
};
