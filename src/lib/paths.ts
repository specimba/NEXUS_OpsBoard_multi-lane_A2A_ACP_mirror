// NEXUS path + env resolution.
// Real Windows ledger path is injectable via NEXUS_LEDGER_PATH.
// In-sandbox we always fall back to bundled sample data.

import path from "node:path";

/** Env var keys consumed by the control plane. */
export const ENV = {
  ledgerPath: process.env.NEXUS_LEDGER_PATH ?? "",
  mcpHealthUrl: process.env.NEXUS_MCP_HEALTH_URL ?? "http://127.0.0.1:7354/health",
  mcpSseUrl: process.env.NEXUS_MCP_SSE_URL ?? "http://127.0.0.1:7354/sse",
  cdpPort: Number(process.env.NEXUS_CDP_PORT ?? 9224),
} as const;

/** Absolute path to the bundled sample ledger (always available in-sandbox). */
export const SAMPLE_LEDGER_PATH = path.join(
  process.cwd(),
  "data",
  "sample_ledger.jsonl",
);

/** Absolute path to the bundled sample handoffs file. */
export const SAMPLE_HANDOFFS_PATH = path.join(
  process.cwd(),
  "data",
  "sample_handoffs.json",
);

/** Absolute path to the file-backed handoff store (Milestone E). */
export const HANDOFF_STORE_PATH = path.join(
  process.cwd(),
  "data",
  "handoffs.json",
);

/** Absolute path to bundled sample MCP health (used when bridge is unreachable). */
export const SAMPLE_MCP_HEALTH_PATH = path.join(
  process.cwd(),
  "data",
  "sample_mcp_health.json",
);

/** Resolve the active ledger path: real env path if set + present, else sample. */
export function resolveLedgerPath(): { path: string; source: "env" | "sample" } {
  if (ENV.ledgerPath) {
    return { path: ENV.ledgerPath, source: "env" };
  }
  return { path: SAMPLE_LEDGER_PATH, source: "sample" };
}
