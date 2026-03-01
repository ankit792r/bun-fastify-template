import type { ZodType } from "zod";

export type Entity<T> = {
  collectionName: string;
  indices: string[];
  domainSchema: ZodType<T>;
};
