import z from "zod";

export const UserCreateDtoSchema = z.object({
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
  password: z.string().min(8).max(255),
});

export type UserCreateDto = z.infer<typeof UserCreateDtoSchema>;
