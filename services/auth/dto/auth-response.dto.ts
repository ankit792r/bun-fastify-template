import z from "zod";

export const AuthResponseDtoSchema = z.object({
  accessToken: z.string(),
});

export type AuthResponseDto = z.infer<typeof AuthResponseDtoSchema>;
