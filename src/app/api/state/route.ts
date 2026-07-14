import { NextResponse } from "next/server";
import { loadPack } from "@/lib/statePack";

export const dynamic = "force-dynamic";

// GET /api/state — reads the STATE_PACK for the frontend.
// Returns {pack, source, stale, ageLabel} or {pack: null, source: "none"} when
// no pack exists (all panels render their SEED/MOCK baseline with honest badges).
export async function GET() {
  const result = await loadPack();
  return NextResponse.json({
    pack: result.data,
    source: result.source,
    stale: result.stale,
    age_hours: result.ageHours,
    age_label: result.ageLabel,
    error: result.error,
    server_time: new Date().toISOString(),
  });
}
