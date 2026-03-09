import path from "path";
import fs from "fs";
import crypto from "crypto";
import type {
  DiscoveredMigration,
  MigrationDefinition,
  MigrationFileExport,
} from "./migration-types";
import { pathToFileURL } from "bun";

/**
 * Resolve the migrations directory.
 */
function getMigrationsDir(): string {
  return path.resolve(__dirname, ".migrations");
}

/**
 * Compute the SHA-256 hex digest of a file.
 *
 * When the runtime file is compiled JS (`.js`), we look for a co-located `.ts`
 * source file first so that the digest is stable across rebuilds.
 */
function computeFileDigest(filePath: string): string {
  // Prefer the TypeScript source if available (stable across rebuilds)
  const tsPath = filePath.replace(/\.js$/, ".ts");
  const targetPath = fs.existsSync(tsPath) ? tsPath : filePath;

  console.log(`   [digest] Hashing: ${targetPath} (from ${filePath})`);
  const content = fs.readFileSync(targetPath, "utf-8");
  const digest = crypto.createHash("sha256").update(content).digest("hex");
  console.log(`   [digest] Result: ${digest.slice(0, 12)}…`);
  return digest;
}

/**
 * Derive the migration slug id from the filename.
 *
 * Filename pattern: `<timestamp>_<slug>.ts` (or `.js`).
 * The id is formed by stripping the extension and replacing `_`/`-`
 * separators so it matches the `MigrationIdSchema` alphanumeric regex.
 *
 * Example: `20260302_000000_addUserIndexes.ts` → `20260302000000addUserIndexes`
 */
function deriveIdFromFilename(fileName: string): string {
  return fileName.replace(/\.(ts|js)$/, "").replace(/[_-]/g, "");
}

/**
 * Validate that a loaded module is a valid {@link MigrationFileExport},
 * then enrich it into a full {@link MigrationDefinition} by deriving `id`
 * from the filename and `containerScope` from the `containers` array length.
 */
function validateAndEnrich(
  mod: unknown,
  fileName: string,
): MigrationDefinition | null {
  const def = (mod as { default?: MigrationFileExport })?.default;

  if (!def || typeof def !== "object") {
    console.warn(`⚠️  Skipping ${fileName}: no default export`);
    return null;
  }

  const missing: string[] = [];
  if (!def.name) missing.push("name");
  if (!def.up || typeof def.up !== "function") missing.push("up");
  if (!Array.isArray(def.collections) || def.collections.length === 0)
    missing.push("containers");

  if (missing.length > 0) {
    console.warn(
      `⚠️  Skipping ${fileName}: missing required fields (${missing.join(", ")})`,
    );
    return null;
  }

  const id = deriveIdFromFilename(fileName);
  const collectionScope: "single" | "multi" =
    def.collections.length === 1 ? "single" : "multi";

  return { ...def, id, collectionScope };
}

/**
 * Discover all migration files in the migrations directory.
 *
 * Files must match the pattern: `<timestamp>_<name>.ts` (or `.js` when compiled).
 * They are sorted lexicographically by filename (which sorts by timestamp).
 *
 * Each discovered migration includes its SHA-256 file digest for change detection.
 */
export async function discoverMigrations(): Promise<DiscoveredMigration[]> {
  const dir = getMigrationsDir();

  if (!fs.existsSync(dir)) {
    console.log(`📂 No migrations directory found at: ${dir}`);
    return [];
  }

  const files = fs
    .readdirSync(dir)
    .filter(
      (f) => /^\d+[_-]/.test(f) && (f.endsWith(".js") || f.endsWith(".ts")),
    )
    .sort();

  const migrations: DiscoveredMigration[] = [];

  for (const file of files) {
    const filePath = path.join(dir, file);
    const fileUrl = pathToFileURL(filePath).href;
    const mod = await import(fileUrl);
    const definition = validateAndEnrich(mod, file);

    if (!definition) continue;

    const fileDigest = computeFileDigest(filePath);

    migrations.push({ definition, fileDigest, filePath });
  }

  return migrations;
}
