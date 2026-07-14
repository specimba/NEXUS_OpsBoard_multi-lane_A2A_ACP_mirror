import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { loadPack } from "@/lib/statePack";
import type { McpQueueSnapshot } from "@/lib/types";

export const dynamic = "force-dynamic";

const SAMPLE_QUEUE_PATH = path.join(
  process.cwd(),
  "data",
  "sample_mcp_queue.json",
);

// GET /api/mcp/queue — queue snapshot.
// Per FABLE5 D3 step 4: de-inlined to data/sample_mcp_queue.json (tsk_seed_*, "sample":true)
// or pack queue when available.
export async function GET() {
  // 1. Try STATE_PACK queue (live truth)
  const pack = await loadPack();
  if (pack.data?.mcp?.queue) {
    const q = pack.data.mcp.queue;
    const snapshot: McpQueueSnapshot = {
      open: q.open ?? 0,
      claimed: q.claimed ?? 0,
      completed: q.completed ?? 0,
      failed: q.failed ?? 0,
      items: (q.items ?? []).map((item) => ({
        id: item.id,
        lane: item.lane,
        title: item.title ?? "",
        state: (item.state as McpQueueSnapshot["items"][0]["state"]) ?? "open",
        created_at: item.created_at ?? "",
      })),
    };
    return NextResponse.json({
      ...snapshot,
      source: "pack",
      pack_id: pack.data.pack_id,
      server_time: new Date().toISOString(),
    });
  }

  // 2. Fallback to sample fixture
  let sample: McpQueueSnapshot & { sample?: boolean } | null = null;
  try {
    const raw = await fs.readFile(SAMPLE_QUEUE_PATH, "utf-8");
    sample = JSON.parse(raw) as McpQueueSnapshot & { sample?: boolean };
  } catch {
    // 3. Last resort: inline mock (clearly labeled)
    sample = {
      open: 3,
      claimed: 2,
      completed: 1,
      failed: 0,
      sample: true,
      items: [
        { id: "tsk_seed_001", lane: "mistral_code", title: "Open PR for handoff store", state: "open", created_at: "2025-01-14T08:27:33Z" },
        { id: "tsk_seed_002", lane: "meta_muse", title: "Fast HTML example for keep_visible banner", state: "open", created_at: "2025-01-14T08:55:14Z" },
        { id: "tsk_seed_003", lane: "qwen_deep", title: "Reasoning over handoff dedup policy", state: "claimed", created_at: "2025-01-14T09:10:33Z" },
        { id: "tsk_seed_004", lane: "deepseek", title: "Review mcp/health proxy SSRF surface", state: "claimed", created_at: "2025-01-14T08:09:30Z" },
        { id: "tsk_seed_005", lane: "minimax", title: "Verifier sign-off on lane registry", state: "completed", created_at: "2025-01-14T08:40:21Z" },
      ],
    };
  }

  return NextResponse.json({
    ...sample,
    source: "sample",
    sample: true,
    note: "v0 sample fixture. Live queue arrives via STATE_PACK when NXM-043 generator runs.",
    server_time: new Date().toISOString(),
  });
}
