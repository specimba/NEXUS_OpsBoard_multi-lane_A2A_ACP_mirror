import { NextResponse } from "next/server";
import { readLedgerTail, computeLedgerChain } from "@/lib/ledger";

export const dynamic = "force-dynamic";

// GET /api/ledger/integrity — computes a SHA-256 hash chain over ledger rows.
// D7 v2: "ledger-integrity panel (host-computed hash chain over ledger rows in pack
// — proof_chain concept at the right layer)".
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(100, Number(searchParams.get("limit") ?? 30));

  const result = await readLedgerTail(limit);
  const chain = computeLedgerChain(result.rows);

  return NextResponse.json({
    source: result.source,
    total_read: result.totalRead,
    chain_head: chain.chainHead,
    chain_valid: chain.chainValid,
    breaks: chain.breaks,
    entry_count: chain.entries.length,
    entries: chain.entries.map((e) => ({
      index: e.index,
      hash: e.hash,
      hash_short: e.hash.slice(0, 12),
      ts: e.ts,
      kind: e.kind,
      lane: e.lane,
    })),
    server_time: new Date().toISOString(),
  });
}
