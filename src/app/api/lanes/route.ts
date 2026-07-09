import { NextResponse } from "next/server";
import { LANES, LANE_MAP, statusLabel } from "@/lib/registry";
import type { LaneId } from "@/lib/types";

export const dynamic = "force-dynamic";

// GET /api/lanes — full lane registry with doctrine.
export async function GET() {
  return NextResponse.json({
    count: LANES.length,
    lanes: LANES.map((l) => ({ ...l, status_label: statusLabel(l.status) })),
    ids: LANES.map((l) => l.id) as LaneId[],
    map: LANE_MAP,
    server_time: new Date().toISOString(),
  });
}
