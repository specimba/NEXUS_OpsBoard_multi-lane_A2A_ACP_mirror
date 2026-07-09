import { NextResponse } from "next/server";
import type { McpQueueSnapshot } from "@/lib/types";

export const dynamic = "force-dynamic";

// GET /api/mcp/queue — mock queue snapshot.
// In v0 the bridge queue is not wired; this returns a deterministic snapshot
// derived from the sample ledger cycle so the dashboard renders counts.
export async function GET() {
  const snapshot: McpQueueSnapshot = {
    open: 3,
    claimed: 2,
    completed: 1,
    failed: 0,
    items: [
      {
        id: "tsk_001",
        lane: "mistral_code",
        title: "Open PR for handoff store",
        state: "open",
        created_at: "2025-01-14T08:27:33Z",
      },
      {
        id: "tsk_002",
        lane: "meta_muse",
        title: "Fast HTML example for keep_visible banner",
        state: "open",
        created_at: "2025-01-14T08:55:14Z",
      },
      {
        id: "tsk_003",
        lane: "qwen_deep",
        title: "Reasoning over handoff dedup policy",
        state: "claimed",
        created_at: "2025-01-14T09:10:33Z",
      },
      {
        id: "tsk_004",
        lane: "deepseek",
        title: "Review mcp/health proxy SSRF surface",
        state: "claimed",
        created_at: "2025-01-14T08:09:30Z",
      },
      {
        id: "tsk_005",
        lane: "minimax",
        title: "Verifier sign-off on lane registry",
        state: "completed",
        created_at: "2025-01-14T08:40:21Z",
      },
      {
        id: "tsk_006",
        title: "Awaiting lane assignment — GPU job spec",
        state: "open",
        created_at: "2025-01-14T09:16:02Z",
      },
    ],
  };

  return NextResponse.json({
    ...snapshot,
    server_time: new Date().toISOString(),
    note: "v0 mock snapshot; wire to coordination_status when bridge is live.",
  });
}
