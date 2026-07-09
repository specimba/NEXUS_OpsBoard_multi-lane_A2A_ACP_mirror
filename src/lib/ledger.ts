// NEXUS ledger reader — reads NEXUScontinuity_runs.jsonl (JSONL).
// Real path is injectable via NEXUS_LEDGER_PATH; falls back to bundled sample.
// Reads are tail-biased: we only ever need the last N rows for the ops board.

import { promises as fs } from "node:fs";
import { resolveLedgerPath } from "./paths";
import type { LedgerRow } from "./types";

/**
 * Read the tail of the continuity ledger.
 * @param limit max number of rows to return (most recent last).
 */
export async function readLedgerTail(limit = 30): Promise<{
  rows: LedgerRow[];
  source: "env" | "sample";
  totalRead: number;
  error?: string;
}> {
  const { path, source } = resolveLedgerPath();

  try {
    const raw = await fs.readFile(path, "utf-8");
    const lines = raw
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const parsed: LedgerRow[] = [];
    for (const line of lines) {
      try {
        parsed.push(JSON.parse(line) as LedgerRow);
      } catch {
        // Skip malformed lines — ledger is append-only and may have partial tail writes.
      }
    }

    const tail = parsed.slice(-limit).reverse();
    return { rows: tail, source, totalRead: parsed.length };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      rows: [],
      source,
      totalRead: 0,
      error: message,
    };
  }
}

/**
 * Summarize the ledger by lane + kind for quick dashboards.
 */
export function summarizeLedger(rows: LedgerRow[]): {
  byLane: Record<string, number>;
  byKind: Record<string, number>;
  byStatus: Record<string, number>;
} {
  const byLane: Record<string, number> = {};
  const byKind: Record<string, number> = {};
  const byStatus: Record<string, number> = {};

  for (const row of rows) {
    if (row.lane) byLane[row.lane] = (byLane[row.lane] ?? 0) + 1;
    if (row.kind) byKind[row.kind] = (byKind[row.kind] ?? 0) + 1;
    if (row.status) byStatus[row.status] = (byStatus[row.status] ?? 0) + 1;
  }

  return { byLane, byKind, byStatus };
}
