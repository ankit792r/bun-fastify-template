import z from "zod";

export const UserUpdateDtoSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
});

export type UserUpdateDto = z.infer<typeof UserUpdateDtoSchema>;
