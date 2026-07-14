import { NextResponse } from "next/server";
import { LANES, LANE_MAP, statusLabel } from "@/lib/registry";
import { loadPack, type LanePackEntry } from "@/lib/statePack";
import type { LaneId, LaneStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

// Merge pack statuses over the SEED baseline.
// Per FABLE5 D3 step 3: registry.ts statuses become SEED baseline + applyPackStatuses().
function applyPackStatuses(
  baseLanes: typeof LANES,
  packLanes: LanePackEntry[] | undefined,
): { lanes: (typeof LANES[0] & { status_label: string; pack_status?: LaneStatus })[]; source: "pack" | "seed" } {
  if (!packLanes || packLanes.length === 0) {
    return {
      lanes: baseLanes.map((l) => ({ ...l, status_label: statusLabel(l.status) })),
      source: "seed",
    };
  }
  const packMap = new Map<string, LanePackEntry>();
  for (const pl of packLanes) {
    packMap.set(pl.id, pl);
  }
  return {
    lanes: baseLanes.map((l) => {
      const pl = packMap.get(l.id);
      const mergedStatus = pl?.status as LaneStatus | undefined;
      return {
        ...l,
        status: mergedStatus ?? l.status,
        status_label: statusLabel(mergedStatus ?? l.status),
        pack_status: mergedStatus,
      };
    }),
    source: "pack",
  };
}

// GET /api/lanes — full lane registry with doctrine.
// Returns {lanes, source} where source is "pack" (live STATE_PACK) or "seed" (baseline).
export async function GET() {
  const pack = await loadPack();
  const { lanes, source } = applyPackStatuses(
    LANES,
    pack.data?.lanes,
  );

  return NextResponse.json({
    count: LANES.length,
    lanes,
    ids: LANES.map((l) => l.id) as LaneId[],
    map: LANE_MAP,
    source,
    pack_id: pack.data?.pack_id ?? null,
    pack_age: pack.ageLabel,
    pack_stale: pack.stale,
    server_time: new Date().toISOString(),
  });
}
