
import z from "zod";

export const createListResponseDtoSchema = <T>(
  itemSchema: z.ZodType<T>,
): z.ZodType<ListResponseDto<T>> =>
  z.object({
    items: z.array(itemSchema),
    page: z.string().optional(),
  });

export type ListResponseDto<T> = {
  items: T[];
  page?: string;
};
