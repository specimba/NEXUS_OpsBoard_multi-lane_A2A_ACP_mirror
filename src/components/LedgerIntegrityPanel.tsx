"use client";

import { useNexusFetch } from "@/hooks/use-nexus";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { cn } from "@/lib/utils";
import { ShieldCheck, ShieldAlert, Link2 } from "lucide-react";

interface ChainEntry {
  index: number;
  hash: string;
  hash_short: string;
  ts?: string;
  kind?: string;
  lane?: string;
}

interface IntegrityResponse {
  source: string;
  total_read: number;
  chain_head: string | null;
  chain_valid: boolean;
  breaks: number[];
  entry_count: number;
  entries: ChainEntry[];
}

/**
 * LedgerIntegrityPanel — D7 v2: hash chain over ledger rows.
 * Displays the SHA-256 chain head + per-entry hashes as a proof_chain visualization.
 */
export function LedgerIntegrityPanel() {
  const data = useNexusFetch<IntegrityResponse>(
    "/api/ledger/integrity?limit=15",
    30000,
  );

  if (!data.data) {
    return (
      <div className="nexus-panel rounded-lg p-4 text-center text-xs text-muted-foreground">
        loading chain…
      </div>
    );
  }

  const { chain_head, chain_valid, entries, source, total_read } = data.data;

  return (
    <div className="nexus-panel rounded-lg overflow-hidden">
      <header className="flex items-center justify-between border-b border-white/5 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Link2 className="h-3.5 w-3.5 text-cyan-300" aria-hidden />
          <h2 className="mono text-xs font-semibold uppercase tracking-widest text-foreground">
            Ledger Integrity Chain
          </h2>
          <DataSourceBadge source="wired" panelId="ledger-integrity-chain" />
        </div>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span
            className={cn(
              "mono inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-semibold uppercase tracking-wider",
              chain_valid
                ? "bg-emerald-500/10 text-emerald-300"
                : "bg-rose-500/10 text-rose-300",
            )}
          >
            {chain_valid ? (
              <ShieldCheck className="h-2.5 w-2.5" aria-hidden />
            ) : (
              <ShieldAlert className="h-2.5 w-2.5" aria-hidden />
            )}
            {chain_valid ? "VALID" : "BROKEN"}
          </span>
          <span className="mono">{entries.length} entries</span>
        </div>
      </header>

      {/* Chain head */}
      {chain_head && (
        <div className="border-b border-white/5 px-4 py-2">
          <span className="mono text-[9px] uppercase tracking-wider text-muted-foreground/60">
            chain head:
          </span>
          <code className="mono ml-2 text-[10px] text-cyan-300 break-all">
            {chain_head.slice(0, 24)}…{chain_head.slice(-8)}
          </code>
        </div>
      )}

      {/* Chain entries */}
      <div className="max-h-64 overflow-y-auto nexus-scroll">
        <ul className="divide-y divide-white/5">
          {entries.map((entry, i) => (
            <li
              key={entry.index}
              className="flex items-center gap-3 px-4 py-1.5 text-xs hover:bg-white/[0.02]"
            >
              <span className="mono shrink-0 text-[9px] text-muted-foreground/40 tabular-nums">
                {String(entry.index).padStart(2, "0")}
              </span>
              {i > 0 && (
                <span className="text-muted-foreground/30 shrink-0" aria-hidden>
                  ↑
                </span>
              )}
              <code className="mono shrink-0 text-[10px] text-cyan-300/70">
                {entry.hash_short}…
              </code>
              {entry.kind && (
                <span className="mono shrink-0 rounded bg-white/5 px-1 py-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">
                  {entry.kind}
                </span>
              )}
              {entry.lane && (
                <span className="mono shrink-0 text-[10px] text-muted-foreground">
                  {entry.lane}
                </span>
              )}
              {entry.ts && (
                <span className="mono ml-auto shrink-0 text-[9px] text-muted-foreground/40">
                  {new Date(entry.ts).toLocaleTimeString("en-GB", { hour12: false })}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>

      <footer className="border-t border-white/5 px-4 py-1.5">
        <span className="mono text-[9px] text-muted-foreground/40">
          SHA-256 chain over {total_read} rows · source: {source}
        </span>
      </footer>
    </div>
  );
}
