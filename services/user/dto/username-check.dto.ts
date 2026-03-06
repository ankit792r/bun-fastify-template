import z from "zod";

export const UsernameCheckDtoSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(8)
    .regex(/^[a-zA-Z0-9]+$/, {
      message:
        "Username can only contain letters, numbers, underscores, and hyphens",
    }),
});

export type UsernameCheckDto = z.infer<typeof UsernameCheckDtoSchema>;
