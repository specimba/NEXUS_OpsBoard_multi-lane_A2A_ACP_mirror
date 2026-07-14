import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET /api — API index. Replaces the hello-world stub per FABLE5 D3 step 6.
export async function GET() {
  return NextResponse.json({
    service: "nexus-a2a-control-plane",
    version: "nxm-038-r2",
    description: "Operator mirror for the NEXUS multi-lane A2A mesh + Grok MCP Bridge v2",
    endpoints: {
      health: "GET /api/health",
      state: "GET /api/state — STATE_PACK reader (pack | test | none)",
      import: "POST /api/import — STATE_PACK import (sweep-gated, 1.5MB cap)",
      lanes: "GET /api/lanes — lane registry (pack-driven when available)",
      ledger: "GET /api/ledger?limit=30 — continuity ledger tail (JSONL)",
      handoffs: "GET /api/handoffs | POST /api/handoffs — handoff bus (file-backed)",
      mcp: {
        health: "GET /api/mcp/health — probes 127.0.0.1:7354/health (STUB fallback)",
        tools: "GET /api/mcp/tools — 22 static + 25 pack-driven tool inventory",
        queue: "GET /api/mcp/queue — pack | sample fixture",
      },
      browserless: {
        content: "POST /api/browserless/content — cloud headless chrome (host-mode only)",
      },
    },
    directives: {
      D005: "No fabricated data presented as real (DataSourceBadge on every panel)",
      D014: "No credential rotations — accepted risk, structural containment",
      D015: "No GitHub payments — free tier only",
      D016: "No NEXUS secret enters the sandbox surface",
    },
    pack_status: "GET /api/state to check",
    server_time: new Date().toISOString(),
  });
}
