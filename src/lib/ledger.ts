// NEXUS ledger reader — reads NEXUScontinuity_runs.jsonl (JSONL).
// Real path is injectable via NEXUS_LEDGER_PATH; falls back to bundled sample.
// Reads are tail-biased: we only ever need the last N rows for the ops board.

import { promises as fs } from "node:fs";
import { createHash } from "node:crypto";
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
        const row = JSON.parse(line) as LedgerRow;
        // FABLE5 fix: real ledger rows use `timestamp`, older samples use `ts`.
        // Normalize: if row has `timestamp` but no `ts`, copy it so the UI (which
        // reads row.ts) works with both formats.
        if (row.timestamp && !row.ts) {
          row.ts = row.timestamp;
        }
        parsed.push(row);
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

/**
 * Compute a SHA-256 hash chain over ledger rows.
 * D7 v2: "ledger-integrity panel (host-computed hash chain over ledger rows in pack
 * — proof_chain concept at the right layer)".
 *
 * Each row's hash = SHA-256(prev_hash + canonical_json(row_fields)).
 * The chain root is the hash of the first row; each subsequent row builds on it.
 * This is the proof_chain concept applied at the ledger layer (not the vault layer).
 */
export function computeLedgerChain(
  rows: LedgerRow[],
): {
  chainHead: string | null;
  chainValid: boolean;
  entries: { index: number; hash: string; ts?: string; kind?: string; lane?: string }[];
  breaks: number[];
} {
  if (rows.length === 0) {
    return { chainHead: null, chainValid: true, entries: [], breaks: [] };
  }

  const { createHash: ch } = { createHash };
  const entries: { index: number; hash: string; ts?: string; kind?: string; lane?: string }[] = [];
  const breaks: number[] = [];
  let prevHash = "0".repeat(64); // genesis

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    // Canonical JSON: sort keys, omit undefined
    const canonical = JSON.stringify({
      ts: row.ts ?? row.timestamp ?? "",
      kind: row.kind ?? "",
      lane: row.lane ?? "",
      status: row.status ?? "",
      cycle: row.cycle ?? "",
      ...(row.summary ? { summary: row.summary } : {}),
      ...(row.note ? { note: row.note } : {}),
      ...(row.task ? { task: row.task } : {}),
      ...(row.verdict ? { verdict: row.verdict } : {}),
    }, Object.keys({
      ts: row.ts ?? row.timestamp ?? "",
      kind: row.kind ?? "",
      lane: row.lane ?? "",
      status: row.status ?? "",
      cycle: row.cycle ?? "",
      ...(row.summary ? { summary: row.summary } : {}),
      ...(row.note ? { note: row.note } : {}),
      ...(row.task ? { task: row.task } : {}),
      ...(row.verdict ? { verdict: row.verdict } : {}),
    }).sort());

    const hash = ch("sha256")
      .update(prevHash + canonical)
      .digest("hex");

    entries.push({
      index: i,
      hash,
      ts: (row.ts ?? row.timestamp) as string | undefined,
      kind: row.kind,
      lane: row.lane,
    });

    prevHash = hash;
  }

  // Chain is valid if no breaks detected (we compute forward, so it's always
  // internally consistent — the "breaks" would come from external verification
  // comparing against a known chain head)
  return {
    chainHead: entries[entries.length - 1]?.hash ?? null,
    chainValid: breaks.length === 0,
    entries,
    breaks,
  };
}
