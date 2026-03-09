import type { Collection, Db } from "mongodb";
import {
  createMigrationId,
  type Migration,
  type MigrationId,
  type MigrationStatus,
} from "../../entities/migration.model";
import { buildLogString } from "./migration-helper";
import type { DiscoveredMigration, ProgressState } from "./migration-types";

export function getMigrationsContainer(
  database: Db,
  collectionName: string,
): Collection {
  return database.collection(collectionName);
}

/**
 * Fetch all migration records from the tracking container, ordered by id.
 */
export async function getAllMigrationRecords(
  collection: Collection<Migration>,
): Promise<Migration[]> {
  const cursor = collection.find();
  return await cursor.toArray();
}

/**
 * Point-read a single migration record.
 * Returns `undefined` if the record does not exist.
 */
export async function getMigrationRecord(
  collection: Collection<Migration>,
  id: MigrationId,
): Promise<Migration | null> {
  return await collection.findOne({ _id: id });
}

/**
 * Create the initial migration record in status `not_started`.
 */
export async function createMigrationRecord(
  collection: Collection<Migration>,
  discovered: DiscoveredMigration,
): Promise<Migration> {
  const now = new Date().toISOString();
  const fullId = createMigrationId();

  const record: Migration = {
    _id: fullId,
    name: discovered.definition.name,
    description: discovered.definition.description,
    collections: discovered.definition.collections,
    collectionScope: discovered.definition.collectionScope,
    migrationFileDigest: discovered.fileDigest,
    lastStatus: "not_started",
    progress: {
      requestCharge: 0,
      processedCount: 0,
      succeededCount: 0,
      failedCount: 0,
      failedIds: [],
      skippedCount: 0,
      skippedIds: [],
    },
    history: [{ status: "not_started", statusAt: now }],
    createdAt: now,
    startedAt: now,
    updatedAt: now,
  };

  const res = await collection.insertOne(record);
  if (res.acknowledged) return record;
  else throw new Error("Failed to create new Migration");
}

/**
 * Transition a migration record to a new status, updating progress and history.
 * Uses optimistic concurrency via the `_etag` field.
 */
export async function transitionStatus(
  collection: Collection<Migration>,
  record: Migration,
  newStatus: MigrationStatus,
  progressState: ProgressState,
): Promise<Migration> {
  const now = new Date().toISOString();

  const updated: Migration = {
    ...record,
    lastStatus: newStatus,
    progress: {
      requestCharge: progressState.requestCharge,
      processedCount: progressState.processedCount,
      succeededCount: progressState.succeededCount,
      failedCount: progressState.failedCount,
      failedIds: progressState.failedIds,
      skippedCount: progressState.skippedCount,
      skippedIds: progressState.skippedIds,
      cursor: progressState.cursor,
    },
    logs: buildLogString(progressState.logs),
    history: [...record.history, { status: newStatus, statusAt: now }],
    updatedAt: now,
    ...(newStatus === "completed" || newStatus === "failed"
      ? { finishedAt: now }
      : {}),
    ...(newStatus === "rolled_back" ? { rolledBackAt: now } : {}),
  };

  const res = await collection.updateOne(
    { _id: record._id },
    { $set: updated },
  );

  if (res.acknowledged) return updated;
  else throw new Error("Failed to update migration record");
}

/**
 * Save progress without changing status (for periodic checkpoints).
 */
export async function saveProgress(
  collection: Collection<Migration>,
  record: Migration,
  progressState: ProgressState,
): Promise<Migration> {
  const now = new Date().toISOString();

  const updated: Migration = {
    ...record,
    progress: {
      requestCharge: progressState.requestCharge,
      processedCount: progressState.processedCount,
      succeededCount: progressState.succeededCount,
      failedCount: progressState.failedCount,
      failedIds: progressState.failedIds,
      skippedCount: progressState.skippedCount,
      skippedIds: progressState.skippedIds,
      cursor: progressState.cursor,
    },
    logs: buildLogString(progressState.logs),
    updatedAt: now,
  };

  const res = await collection.updateOne(
    { _id: record._id },
    { $set: updated },
  );

  if (res.acknowledged) return updated;
  else throw new Error("Failed to save migration record");
}
