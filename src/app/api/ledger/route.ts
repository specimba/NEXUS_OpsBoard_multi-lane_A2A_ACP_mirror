import { NextResponse } from "next/server";
import { readLedgerTail, summarizeLedger } from "@/lib/ledger";

export const dynamic = "force-dynamic";

// GET /api/ledger?limit=30 — tail of the continuity ledger.
// Reads the real path if NEXUS_LEDGER_PATH is set, else bundled sample.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limitParam = searchParams.get("limit");
  const limit = Math.max(1, Math.min(200, Number(limitParam ?? 30) || 30));

  const result = await readLedgerTail(limit);
  const summary = summarizeLedger(result.rows);

  return NextResponse.json({
    limit,
    source: result.source,
    total_read: result.totalRead,
    returned: result.rows.length,
    summary,
    rows: result.rows,
    error: result.error,
    server_time: new Date().toISOString(),
  });
}
