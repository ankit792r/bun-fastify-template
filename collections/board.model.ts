import z from "zod";
import type { CollectionConfig } from "../shared/mongodb/colls-factory";

export const BoardSchema = z.object({
  _id: z.string(),
  name: z.string(),
  description: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Board = z.infer<typeof BoardSchema>;

export const BoardCollectionConfig: CollectionConfig<Board> = {
  name: "boards",
  indices: [],
  schema: BoardSchema,
  schemaVersion: 1,
  primaryKey: "_id",
};
