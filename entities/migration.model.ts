import z from "zod";
import { createIdFactoryFromIdSchema, idSchema } from "./id-factory";
import type { CollectionConfig } from "../database/colls-factory";

export const MigrationIdSchema = idSchema({
  brand: "MigrationId",
  prefix: "migr_",
});
export type MigrationId = z.infer<typeof MigrationIdSchema>;
export const createMigrationId = createIdFactoryFromIdSchema(MigrationIdSchema);

export const MIGRATION_STATUSES = [
  "not_started", // defined but not started
  "in_progress", // migration is currently running
  "interrupted", // migration gracefully interrupted but can be resumed
  "completed", // migration completed successfully
  "failed", // migration failed due to at least 1 skip or failure
  "rolled_back", // migration has been manually marked as rolled back
] as const;

export type MigrationStatus = (typeof MIGRATION_STATUSES)[number];

export const MigrationSchema = z.object({
  _id: MigrationIdSchema,
  name: z.string(),
  description: z.string().optional(),
  collections: z.array(z.string()).min(1), // list of container names that this migration applies to
  collectionScope: z.enum(["single", "multi"]),
  migrationFileDigest: z.string(), // sha256 digest of the migration file, used to detect changes in the migration function
  logs: z.string().optional(),
  lastStatus: z.enum(MIGRATION_STATUSES), // last reported status of the migration

  progress: z.object({
    requestCharge: z.number().min(0), // cumulative request charge for the migration so far
    processedCount: z.number().min(0),
    succeededCount: z.number().min(0),
    failedCount: z.number().min(0),
    failedIds: z.array(z.string()).optional(), // due to error in migration function (first 100 failures)
    skippedCount: z.number().min(0),
    skippedIds: z.array(z.string()).optional(), // due to manual skip or give up for concurrency (first 100 skips)
    cursor: z.record(z.string(), z.unknown()).optional(), // opaque state for resumption — often just { continuationToken } but can hold multi-step stage info
  }),

  history: z.array(
    z.object({
      status: z.enum(MIGRATION_STATUSES),
      statusAt: z.iso.datetime(),
    }),
  ),

  createdAt: z.iso.datetime(),
  startedAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  finishedAt: z.iso.datetime().optional(),
  rolledBackAt: z.iso.datetime().optional(),
});

export type Migration = z.infer<typeof MigrationSchema>;

export const MigrationCollectionConfig: CollectionConfig<Migration> = {
  indices: [],
  name: "migrations",
  primaryKey: "id",
  schema: MigrationSchema,
  schemaVersion: 1,
};
