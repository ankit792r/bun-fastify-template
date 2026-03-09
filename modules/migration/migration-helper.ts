/** Maximum byte size for the `logs` field before truncation. */
const MAX_LOGS_BYTES = 1_000_000; // 1 MB total
const HALF_LOGS_BYTES = 500_000; // 500 KB each side

/**
 * Join log lines and truncate if the result exceeds {@link MAX_LOGS_BYTES}.
 * Keeps the first 500 KB and last 500 KB, snipping the middle.
 */
export function buildLogString(logs: string[]): string | undefined {
  if (logs.length === 0) return undefined;
  const full = logs.join("\n");
  const byteLength = Buffer.byteLength(full, "utf-8");
  if (byteLength <= MAX_LOGS_BYTES) return full;

  const head = full.slice(0, HALF_LOGS_BYTES);
  const tail = full.slice(full.length - HALF_LOGS_BYTES);
  const snipped = byteLength - HALF_LOGS_BYTES * 2;
  return `${head}\n\n--- ✂ ${snipped.toLocaleString()} bytes snipped ---\n\n${tail}`;
}
