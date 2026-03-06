import z from "zod";
import { UserCreateDtoSchema } from "../../user/dto/user-create.dto";

export const RegisterDtoSchema = UserCreateDtoSchema.extend({
  passwordConfirmation: z.string().min(8).max(255),
});

export type RegisterDto = z.infer<typeof RegisterDtoSchema>;
