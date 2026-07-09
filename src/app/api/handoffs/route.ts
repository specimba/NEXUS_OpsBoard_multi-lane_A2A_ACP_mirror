import { NextResponse } from "next/server";
import { listHandoffs, recentHandoffs, addHandoff } from "@/lib/handoffBus";
import type { HandoffStatus, LaneId } from "@/lib/types";
import { LANE_MAP } from "@/lib/registry";

export const dynamic = "force-dynamic";

const VALID_STATUS: HandoffStatus[] = [
  "open",
  "accepted",
  "blocked",
  "done",
];

function isLaneId(x: string): x is LaneId {
  return x in LANE_MAP;
}

// GET /api/handoffs?limit=5 — list handoffs newest first.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Math.max(1, Math.min(200, Number(limitParam) || 0)) : undefined;

  const handoffs = limit ? await recentHandoffs(limit) : await listHandoffs();

  return NextResponse.json({
    count: handoffs.length,
    handoffs,
    server_time: new Date().toISOString(),
  });
}

// POST /api/handoffs — create a handoff card.
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: "invalid JSON body" },
      { status: 400 },
    );
  }

  const from = String(body.from ?? "");
  const to = String(body.to ?? "");
  const token = String(body.token ?? "");
  const summary = String(body.summary ?? "");

  if (!isLaneId(from) || !isLaneId(to)) {
    return NextResponse.json(
      { error: "`from` and `to` must be valid LaneId values" },
      { status: 400 },
    );
  }
  if (!token.trim() || !summary.trim()) {
    return NextResponse.json(
      { error: "`token` and `summary` are required" },
      { status: 400 },
    );
  }

  const status = VALID_STATUS.includes(body.status as HandoffStatus)
    ? (body.status as HandoffStatus)
    : "open";

  const artifacts = Array.isArray(body.artifacts)
    ? body.artifacts.map(String)
    : [];

  const card = await addHandoff({
    from,
    to,
    token: token.trim(),
    summary: summary.trim(),
    artifacts,
    status,
    mcp_evidence_ref: body.mcp_evidence_ref ? String(body.mcp_evidence_ref) : undefined,
    budget: body.budget ? String(body.budget) : undefined,
  });

  return NextResponse.json({ ok: true, handoff: card }, { status: 201 });
}
