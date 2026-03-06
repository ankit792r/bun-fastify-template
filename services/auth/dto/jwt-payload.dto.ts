import z from "zod";
import {
  createIdFactoryFromIdSchema,
  idSchema,
} from "../../../entities/id-factory";
import { UserIdSchema } from "../../../entities/user.model";

type JwtClaimsAddedBySigning = "iat" | "jti" | "exp" | "typ";

export const JwtIdSchema = idSchema({ brand: "JwtId", prefix: "jti_" });
export type JwtId = z.infer<typeof JwtIdSchema>;
export const createJwtId = createIdFactoryFromIdSchema(JwtIdSchema);

// Base payload shared by all JWT types we use
const JwtBasePayloadDtoSchema = z.object({
  iat: z.number().int().positive(), // "issued at time" claim, in whole seconds since epoch
  exp: z.number().int().positive(), // "expiration time" claim, in whole seconds since epoch
  jti: JwtIdSchema, // "JWT ID" claim just a unique identifier for the token
});

// Access tokens
export const JwtAccessTokenPayloadDtoSchema = JwtBasePayloadDtoSchema.extend({
  typ: z.literal("access"),
  sub: UserIdSchema, // "subject" claim
  email: z.string("Email required in payload"),
  roles: z.array(z.string(), "User roles required in payload"),
});
export type JwtAccessTokenPayloadDto = z.infer<
  typeof JwtAccessTokenPayloadDtoSchema
>;
export type JwtAccessTokenPayloadUnsigned = Omit<
  JwtAccessTokenPayloadDto,
  JwtClaimsAddedBySigning
>;

// Refresh tokens
export const JwtRefreshTokenPayloadDtoSchema = JwtBasePayloadDtoSchema.extend({
  typ: z.literal("refresh"),
  sub: UserIdSchema, // "subject" claim
});
export type JwtRefreshTokenPayloadDto = z.infer<
  typeof JwtRefreshTokenPayloadDtoSchema
>;
export type JwtRefreshTokenPayloadUnsigned = Omit<
  JwtRefreshTokenPayloadDto,
  JwtClaimsAddedBySigning
>;
