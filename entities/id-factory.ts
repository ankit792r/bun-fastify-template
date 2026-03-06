import * as crypto from 'crypto';

import { z, ZodType } from 'zod';

/**
 * A statically branded type, e.g. UserId, CourseId, etc.
 * The brand is only at compile time and has no runtime impact.
 */
export type Branded<T, B extends string> = T & { readonly __brand: B };

/**
 * Parameters for generating ids.
 */
const ID_LENGTH_EXCLUDING_PREFIX = 16;
const ID_REGEX = /^[a-z]+_[A-Za-z0-9]+$/;
const ALLOWED_CHARS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'; // [A-Za-z0-9]
const ALLOWED_CHARS_LENGTH = ALLOWED_CHARS.length;

/**
 * Generates a string of random characters for use in ids.
 * @param length - number of random characters to generate
 * @returns a string of random characters
 */
const generateRandomRawIdChars = (length: number): string => {
  const randomBytes = crypto.randomBytes(length);
  let id = '';
  for (let i = 0; i < length; i++) {
    // slight bias since each byte is 256 possibilities,
    // which is not a multiple of how many allowed chars there are.
    // This is fine for our use case.
    id += ALLOWED_CHARS[randomBytes[i] % ALLOWED_CHARS_LENGTH];
  }
  return id;
};

/**
 * Creates a new id with a specific prefix and length (excluding the prefix).
 * @param prefix - The prefix to use for the id.
 * @param length - The length of the random characters to generate, does not include the length of the prefix.
 * @returns A new id prefixed string.
 */
const createPrefixedId = (prefix: string, length: number): string => {
  return `${prefix}${generateRandomRawIdChars(length)}`;
};

/**
 * Creates a new id factory function from a zod schema for an id type, e.g. UserId, CourseId, etc.
 * @param schema - A zod schema that has a registered prefix via the idSchema function.
 * @returns A function that generates a new id matching the given id schema.
 */
export const createIdFactoryFromIdSchema = <T extends ZodType>(
  schema: T,
): (() => z.infer<T>) => {
  const options = idOptionsRegistry.get(schema);
  if (!options) {
    throw new Error(
      'Schema does not have a registered prefix, use the idSchema function to create your ID schema.',
    );
  }
  const { prefix, length } = options;
  return () => createPrefixedId(prefix, length) as z.infer<T>;
};

const IdOptionsValidatedSchema = z.object({
  brand: z
    .string()
    .min(3)
    .max(32)
    .regex(/^[A-Za-z][A-Za-z0-9]+$/),
  prefix: z
    .string()
    .min(2)
    .max(5)
    .regex(/^[a-z]+_$/),
  length: z.number().min(16).max(32).default(ID_LENGTH_EXCLUDING_PREFIX),
});

const idOptionsRegistry =
  z.registry<z.infer<typeof IdOptionsValidatedSchema>>();

/**
 * Creates a zod schema for an id with a specific prefix and brand.
 * @returns A zod schema for the id field.
 *
 * @example
 * ```typescript
 * const UserIdSchema = idSchema({ brand: 'UserId', prefix: 'u_' });
 * type UserId = z.infer<typeof UserIdSchema>;
 *
 * const UserSchema = z.object({
 *  id: UserIdSchema,
 *  ...
 * });
 * type User = z.infer<typeof UserSchema>;
 * ```
 */
export const idSchema = <S extends string, T extends `${string}_`>(params: {
  brand: S;
  prefix: T;
  length?: number;
}): z.ZodType<Branded<string, S>> => {
  const options = IdOptionsValidatedSchema.parse(params);
  const { prefix, length } = options;
  return z
    .string()
    .length(prefix.length + length, 'Invalid ID length')
    .regex(ID_REGEX, 'Invalid ID format')
    .startsWith(prefix, 'Invalid ID prefix')
    .transform((value) => value as Branded<string, S>)
    .register(idOptionsRegistry, options)
    .meta({
      type: 'string', // for OpenAPI generation, to avoid 'Failed building the serialization schema'
      description: `A unique identifier with prefix "${prefix}"`,
      example: `${prefix}${'A'.repeat(length)}`,
    });
};

