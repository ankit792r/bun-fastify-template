import z from "zod";
import { createIdFactoryFromIdSchema, idSchema } from "./id-factory";
import type { CollectionConfig } from "../database/colls-factory";

export const UserIdSchema = idSchema({ brand: "UserId", prefix: "u_" });
export type UserId = z.infer<typeof UserIdSchema>;
export const createUserId = createIdFactoryFromIdSchema(UserIdSchema);

export const UserSchema = z.object({
  _id: UserIdSchema,
  name: z.string().min(1).max(100).optional(),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_-]+$/, {
      message:
        "Username can only contain letters, numbers, underscores, and hyphens",
    }),
  email: z.email().min(5).max(255),
  emailVerified: z.boolean().default(false),
  profileImage: z.url().optional(),
  bio: z.string().max(500).optional(),
  password: z.string().min(8).max(255),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export type User = z.infer<typeof UserSchema>;

export const UserCollectionConfig: CollectionConfig<User> = {
  name: "users",
  indices: [],
  primaryKey: "_id",
  schema: UserSchema,
  schemaVersion: 1,
};
