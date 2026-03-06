
import { z } from "zod";

export const UserIdParamDtoSchema = z.object({
    id: UserIdSchema,
});

export type UserIdParamDto = z.infer<typeof UserIdParamDtoSchema>;
