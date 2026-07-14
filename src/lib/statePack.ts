// NEXUS A2A Control Plane — STATE_PACK v1 loader + schema.
// NXM-038 REV 2 Step 2 (FABLE5 plan D3 step 2).
//
// The STATE_PACK is the one-way git-bus truth channel: the host-side generator
// (NXM-043, not yet built) collects live state (ledger tail, MCP health, board,
// ports doctor) → assembles a STATE_PACK.json → redaction-sweeps it → commits
// to this repo. The sandbox pulls and every panel reads from here.
//
// Until the first pack lands, all panels render their SEED/MOCK baseline with
// an honest badge. Absent section ⇒ UI renders labeled STUB.
//
// Schema per FABLE5 D2: semver pack_schema; soft 128 KiB / hard 512 KiB.

import { promises as fs } from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { z } from "zod";

// ---- Schema (zod v4) ----

export const LanePackEntry = z.object({
  id: z.string(),
  status: z.string(),
  evidence: z.string().optional(),
  class: z.string().optional(),
  checked_at: z.string().optional(),
});
export type LanePackEntry = z.infer<typeof LanePackEntry>;

export const McpToolPack = z.object({
  name: z.string(),
  schema_hash: z.string().optional(),
  group: z.string().optional(),
});
export type McpToolPack = z.infer<typeof McpToolPack>;

export const McpQueuePack = z.object({
  open: z.number().optional(),
  claimed: z.number().optional(),
  completed: z.number().optional(),
  failed: z.number().optional(),
  items: z
    .array(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        lane: z.string().optional(),
        state: z.string().optional(),
        created_at: z.string().optional(),
      }),
    )
    .optional(),
});

export const McpPack = z.object({
  status: z.string().optional(), // UP | DOWN | STUB
  version: z.string().optional(),
  tool_count: z.number().optional(),
  registry_schema_hash: z.string().optional(),
  tools: z.array(McpToolPack).optional(),
  queue: McpQueuePack.optional(),
});
export type McpPack = z.infer<typeof McpPack>;

export const LedgerRowPack = z.object({
  ts: z.string().optional(),
  timestamp: z.string().optional(),
  kind: z.string().optional(),
  lane: z.string().optional(),
  status: z.string().optional(),
  cycle: z.string().optional(),
}).catchall(z.unknown());

export const BoardCardPack = z.object({
  id: z.string(),
  title: z.string().optional(),
  executor: z.string().optional(),
  priority: z.string().optional(),
  status: z.string().optional(),
  gate: z.string().optional(),
  rev: z.number().optional(),
});
export type BoardCardPack = z.infer<typeof BoardCardPack>;

export const PortsDoctorEntry = z.object({
  port: z.number(),
  service: z.string().optional(),
  status: z.string().optional(),
  note: z.string().optional(),
});

export const StatePack = z.object({
  pack_id: z.string(),
  generated_at: z.string(), // ISO UTC
  ttl_hours: z.number().default(24),
  generator: z.string().optional(),
  master_doc_sha: z.string().optional(),
  sweep_proof: z
    .object({
      ran: z.boolean(),
      blocks: z.number().optional(),
      canary_blocked: z.boolean().optional(),
    })
    .optional(),
  pack_schema: z.string().default("1.0.0"),
  lanes: z.array(LanePackEntry).optional(),
  mcp: McpPack.optional(),
  ledger_tail: z.array(LedgerRowPack).optional(),
  board: z
    .object({
      cards: z.array(BoardCardPack).optional(),
    })
    .optional(),
  ports_doctor: z.array(PortsDoctorEntry).optional(),
  host_metrics: z.unknown().optional(),
  handoffs: z.unknown().optional(),
});
export type StatePack = z.infer<typeof StatePack>;

// ---- Paths ----

export const STATE_PACK_PATH = path.join(
  process.cwd(),
  "data",
  "state_pack.json",
);

export const TEST_PACK_PATH = path.join(
  process.cwd(),
  "data",
  "test_pack.example.json",
);

// ---- Loader (mtime-cached) ----

interface CachedPack {
  data: StatePack | null;
  error: string | null;
  mtime: number; // ms epoch
  source: "pack" | "test" | "none";
}

let cache: CachedPack = {
  data: null,
  error: null,
  mtime: 0,
  source: "none",
};

/** Clear the cache (call after /api/import writes a new pack). */
export function invalidatePackCache(): void {
  cache = { data: null, error: null, mtime: 0, source: "none" };
}

async function readJson(
  p: string,
): Promise<{ data: unknown; mtime: number } | null> {
  try {
    const stat = await fs.stat(p);
    const raw = await fs.readFile(p, "utf-8");
    return { data: JSON.parse(raw), mtime: stat.mtimeMs };
  } catch {
    return null;
  }
}

export interface PackResult {
  data: StatePack | null;
  error: string | null;
  source: "pack" | "test" | "none";
  stale: boolean;
  ageHours: number | null;
  ageLabel: string | null;
}

/**
 * Load the STATE_PACK with mtime caching.
 * Priority: data/state_pack.json (live) → data/test_pack.example.json (sentinel) → none.
 */
export async function loadPack(): Promise<PackResult> {
  // Try live pack first
  const live = await readJson(STATE_PACK_PATH);
  if (live && live.mtime !== cache.mtime) {
    const parsed = StatePack.safeParse(live.data);
    if (parsed.success) {
      cache = {
        data: parsed.data,
        error: null,
        mtime: live.mtime,
        source: "pack",
      };
    } else {
      cache = {
        data: null,
        error: `schema error: ${parsed.error.issues[0]?.message ?? "unknown"}`,
        mtime: live.mtime,
        source: "pack",
      };
    }
  } else if (!live && cache.source === "pack") {
    // pack was deleted
    cache = { data: null, error: null, mtime: 0, source: "none" };
  }

  // If no live pack, try test fixture (sentinel — clearly labeled)
  if (cache.source === "none" || (!cache.data && cache.source !== "test")) {
    const test = await readJson(TEST_PACK_PATH);
    if (test) {
      const parsed = StatePack.safeParse(test.data);
      if (parsed.success) {
        cache = {
          data: parsed.data,
          error: null,
          mtime: test.mtime,
          source: "test",
        };
      }
    }
  }

  const data = cache.data;
  if (!data) {
    return {
      data: null,
      error: cache.error,
      source: "none",
      stale: false,
      ageHours: null,
      ageLabel: null,
    };
  }

  // Staleness math
  const generated = new Date(data.generated_at).getTime();
  const ageMs = Date.now() - generated;
  const ageHours = ageMs / 3_600_000;
  const stale = ageHours > data.ttl_hours;

  // Human-readable age
  let ageLabel: string;
  if (ageMs < 60_000) ageLabel = "just now";
  else if (ageMs < 3_600_000) ageLabel = `${Math.floor(ageMs / 60_000)}m ago`;
  else if (ageMs < 86_400_000) ageLabel = `${Math.floor(ageHours)}h ago`;
  else ageLabel = `${Math.floor(ageHours / 24)}d ago`;

  return {
    data,
    error: cache.error,
    source: cache.source,
    stale,
    ageHours,
    ageLabel,
  };
}

// ---- Credential sweep (sandbox-side, for /api/import) ----

// Tier A: credential-prefix regexes (same classes as the host generator)
const CRED_PATTERNS: { pattern: RegExp; label: string }[] = [
  { pattern: /ghp_[A-Za-z0-9]{20,}/, label: "GitHub PAT (ghp_)" },
  { pattern: /github_pat_[A-Za-z0-9_]{20,}/, label: "GitHub PAT (github_pat_)" },
  { pattern: /sk-[A-Za-z0-9]{20,}/, label: "OpenAI-style key (sk-)" },
  { pattern: /hf_[A-Za-z0-9]{20,}/, label: "HuggingFace token (hf_)" },
  { pattern: /fish_[A-Za-z0-9]{20,}/, label: "Sakana key (fish_)" },
  { pattern: /ak_[A-Za-z0-9]{20,}/, label: "LongCat key (ak_)" },
  { pattern: /Bearer\s+[A-Za-z0-9._-]{20,}/i, label: "Bearer token" },
  { pattern: /xox[bap]-[A-Za-z0-9-]{10,}/, label: "Slack token (xox)" },
  { pattern: /AKIA[A-Z0-9]{12,}/, label: "AWS key (AKIA)" },
  { pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/, label: "PEM private key" },
  {
    pattern: /customer-id[A-Za-z0-9_-]{10,}/i,
    label: "Browserless customer-id",
  },
];

export interface SweepResult {
  clean: boolean;
  hits: { label: string; sha8: string; path: string }[];
}

/**
 * Sweep a serialized pack for credential-shaped strings.
 * Used by /api/import to fail-closed (422) if any credential is detected.
 * Per FABLE5 D5 RL-4: sweep gate fail-closed, no in-lane override.
 */
export function sweepPack(jsonStr: string): SweepResult {
  const hits: { label: string; sha8: string; path: string }[] = [];
  for (const { pattern, label } of CRED_PATTERNS) {
    const m = pattern.exec(jsonStr);
    if (m) {
      // Only report sha8 of the matched value, never the value itself
      hits.push({
        label,
        sha8: sha256short(m[0]),
        path: "pack",
      });
    }
  }
  return { clean: hits.length === 0, hits };
}

function sha256short(s: string): string {
  return createHash("sha256").update(s).digest("hex").slice(0, 8);
}
