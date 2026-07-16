import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET /api/sage/status — SAGE integration stub.
// Per FABLE5 D6: "SAGE: reserved tab + /api/sage/status stub
// {status:'RESERVED', gated_on:'OG-6'} — v2 backlog, not in REV 2."
//
// SAGE is not yet implemented. This route exists so the reserved nav slot
// has a live endpoint to call, and so future sessions can see the interface
// contract without reading docs.
export async function GET() {
  return NextResponse.json({
    status: "RESERVED",
    gated_on: "OG-6",
    message:
      "SAGE integration is reserved. It activates when operator gate OG-6 is resolved. " +
      "Per FABLE5 D6: v2 backlog, not in REV 2. The /board page and /api/state are the " +
      "current truth surfaces; SAGE will add analysis/anomaly/recommendation capabilities.",
    planned_routes: [
      "GET /api/sage/status — this stub",
      "POST /api/sage/analyze — trigger analysis (async)",
      "GET /api/sage/insights — list insights (filterable)",
      "PATCH /api/sage/insights/:id — dismiss/promote insight",
      "WS /api/sage/stream — real-time insight push (future)",
    ],
    planned_model: "SageInsight { id, kind, targetType, targetId, summary, confidence, status, analysisId, traceId, createdAt }",
    server_time: new Date().toISOString(),
  });
}
