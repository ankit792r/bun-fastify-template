import z from "zod";
import type { Entity } from "../shared/database/entity";

export const BoardSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Board = z.infer<typeof BoardSchema>;

export const BoardEntity: Entity<Board> = {
  collectionName: "boards",
  indices: [],
  domainSchema: BoardSchema,
};