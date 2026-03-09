import type { MongoClient, Db, Document, Collection } from "mongodb";

/**
 * Context passed to each migration's `up` function,
 * giving it access to the Cosmos client, database, and progress tracking helpers.
 */
export interface MigrationContext {
  /** The underlying Cosmos client. */
  client: MongoClient;

  /** The target database. */
  database: Db;

  /** Get an existing container by id. Must already exist — no metadata operations. */
  getCollection: <T extends Document>(collectionName: string) => Collection<T>;

  // ── Progress reporting ────────────────────────────────────────────

  /** Report successfully processed documents. */
  reportSuccess: (count?: number) => void;

  /** Report a failed document (first 100 ids are stored). */
  reportFailure: (documentId: string) => void;

  /** Report a skipped document (first 100 ids are stored). */
  reportSkip: (documentId: string) => void;

  /** Add Cosmos request-charge units to the cumulative total. */
  addRequestCharge: (charge: number) => void;

  // ── Logging ───────────────────────────────────────────────────────

  /** Append a line to the migration log (stored in the DB record). */
  log: (message: string) => void;

  // ── Resuming ──────────────────────────────────────────────────

  /**
   * The opaque cursor from a previous interrupted run, if resuming.
   * `undefined` when the migration has not been started yet.
   *
   * The cursor always represents **where to resume from next**, not what
   * just completed. For simple single-query migrations this is typically
   * `{ continuationToken: string }`. Multi-step migrations can store
   * arbitrary state, e.g. `{ stage: 2, continuationToken: '…' }`.
   */
  cursor: Record<string, unknown> | undefined;

  /**
   * Persist an opaque cursor so the migration can be resumed later.
   *
   * Convention: the cursor should describe **what to do next**.
   * When advancing between stages, checkpoint the *next* stage
   * (e.g. `{ stage: 2 }`), not the one that just finished.
   *
   * The {@link transformEachDocument} helper merges `continuationToken`
   * into the existing cursor automatically, preserving other keys.
   *
   * @example
   * // single-query migration (handled by transformEachDocument)
   * context.checkpoint({ continuationToken });
   *
   * // multi-step migration — advance to next stage
   * context.checkpoint({ stage: 2 });
   *
   * // multi-step with continuation within a stage
   * context.checkpoint({ stage: 2, continuationToken });
   */
  checkpoint: (cursor: Record<string, unknown> | undefined) => void;

  // ── Interruption ──────────────────────────────────────────────────

  /** Returns `true` when a graceful shutdown has been requested (SIGINT / SIGTERM). */
  shouldStop: () => boolean;
}

export interface ProgressState {
  requestCharge: number;
  processedCount: number;
  succeededCount: number;
  failedCount: number;
  failedIds: string[];
  skippedCount: number;
  skippedIds: string[];
  cursor: Record<string, unknown> | undefined;
  logs: string[];
}

/**
 * The shape exported by each migration file.
 *
 * Authors only specify `name`, `containers`, and `up`.
 * The `id` is derived from the filename and `containerScope` is inferred from
 * the length of `containers` during discovery.
 */
export interface MigrationFileExport {
  /** Human-readable name of the migration (e.g. "Add user indexes"). */
  name: string;

  /** Optional longer description of what this migration does. */
  description?: string;

  /**
   * Collection names this migration reads from or writes to.
   * Must list at least one container.
   *
   * `getContainer()` will throw if called with a name not in this list.
   */
  collections: string[];

  /** Execute the migration against the database. */
  up: (context: MigrationContext) => Promise<void>;
}

/**
 * Fully resolved migration definition produced by the discovery phase.
 *
 * The `id` slug and `containerScope` are computed automatically:
 * - `id` — derived from the migration filename (e.g. `20260302000000addUserIndexes`).
 * - `containerScope` — `'single'` when `containers` has exactly one entry, `'multi'` otherwise.
 *
 * The runner prepends the `migr_` prefix to form the full {@link MigrationId}.
 */
export interface MigrationDefinition extends MigrationFileExport {
  /** Slug identifier — derived from the filename. */
  id: string;

  /** Whether the migration touches a single container or multiple (inferred from `containers`). */
  collectionScope: "single" | "multi";
}

/** Discovered migration file with its computed digest. */
export interface DiscoveredMigration {
  definition: MigrationDefinition;
  /** SHA-256 hex digest of the migration source file. */
  fileDigest: string;
  /** Absolute path to the migration source file. */
  filePath: string;
}
