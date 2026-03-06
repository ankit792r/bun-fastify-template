import z from "zod";

export const LoginDtoSchema = z.object({
  email: z.email().min(5).max(255),
  password: z.string().min(8),
});

export type LoginDto = z.infer<typeof LoginDtoSchema>;
