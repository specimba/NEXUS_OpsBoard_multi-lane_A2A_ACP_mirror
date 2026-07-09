"use client";

import { cn } from "@/lib/utils";
import { LANE_MAP, accentClasses } from "@/lib/registry";
import type { LedgerRow } from "@/lib/types";
import { Loader2, AlertTriangle, FileWarning } from "lucide-react";

const KIND_STYLE: Record<string, string> = {
  handoff: "text-cyan-300 bg-cyan-500/10",
  heartbeat: "text-emerald-300 bg-emerald-500/10",
  task: "text-sky-300 bg-sky-500/10",
  evidence: "text-violet-300 bg-violet-500/10",
  probe: "text-amber-300 bg-amber-500/10",
};

function laneDot(lane?: string): string {
  if (!lane) return "bg-slate-500";
  const meta = LANE_MAP[lane as keyof typeof LANE_MAP];
  return meta ? accentClasses(meta.accent).dot : "bg-slate-500";
}

interface LedgerTailProps {
  rows: LedgerRow[] | null;
  loading: boolean;
  error: string | null;
  source?: "env" | "sample" | null;
  totalRead?: number;
  limit?: number;
}

export function LedgerTail({
  rows,
  loading,
  error,
  source,
  totalRead,
  limit = 15,
}: LedgerTailProps) {
  const shown = rows?.slice(0, limit) ?? [];

  return (
    <div className="nexus-panel rounded-lg overflow-hidden">
      <header className="flex items-center justify-between border-b border-white/5 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <h2 className="mono text-xs font-semibold uppercase tracking-widest text-foreground">
            Ledger Tail
          </h2>
          <span className="mono text-[10px] uppercase tracking-wider text-muted-foreground">
            NEXUScontinuity_runs.jsonl
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          {source && (
            <span
              className={cn(
                "mono rounded px-1.5 py-0.5 uppercase tracking-wider",
                source === "env"
                  ? "bg-emerald-500/15 text-emerald-300"
                  : "bg-white/5 text-muted-foreground",
              )}
            >
              {source === "env" ? "live env" : "sample"}
            </span>
          )}
          {typeof totalRead === "number" && (
            <span className="mono">{totalRead} total</span>
          )}
          {loading && <Loader2 className="h-3 w-3 animate-spin" aria-hidden />}
        </div>
      </header>

      {error && (
        <div className="flex items-center gap-2 border-b border-rose-500/20 bg-rose-500/5 px-4 py-2 text-[11px] text-rose-300">
          <FileWarning className="h-3.5 w-3.5" aria-hidden />
          <span className="mono">read error: {error}</span>
        </div>
      )}

      <div className="max-h-96 overflow-y-auto nexus-scroll">
        {shown.length === 0 && !loading && (
          <div className="flex items-center gap-2 px-4 py-6 text-xs text-muted-foreground">
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
            No ledger rows.
          </div>
        )}
        <ul className="divide-y divide-white/5">
          {shown.map((row, i) => {
            const ts = row.ts ? new Date(row.ts as string) : null;
            const kind = (row.kind as string) ?? "row";
            return (
              <li
                key={`${row.ts ?? i}-${i}`}
                className="flex items-start gap-3 px-4 py-2 text-xs hover:bg-white/[0.02]"
              >
                <span className="mono shrink-0 text-muted-foreground/60 tabular-nums">
                  {ts
                    ? ts.toLocaleTimeString("en-GB", { hour12: false })
                    : "--:--:--"}
                </span>
                <span
                  className={cn(
                    "mono shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                    KIND_STYLE[kind] ?? "text-slate-300 bg-white/5",
                  )}
                >
                  {kind}
                </span>
                {row.lane && (
                  <span className="flex shrink-0 items-center gap-1">
                    <span
                      className={cn("h-1.5 w-1.5 rounded-full", laneDot(row.lane as string))}
                      aria-hidden
                    />
                    <span className="mono text-muted-foreground">{row.lane}</span>
                  </span>
                )}
                <span className="min-w-0 flex-1 truncate text-foreground/80">
                  {(row.summary as string) ??
                    (row.note as string) ??
                    (row.task as string) ??
                    (row.verdict as string) ??
                    JSON.stringify(row)}
                </span>
                {row.status && (
                  <span className="mono shrink-0 text-[10px] uppercase tracking-wider text-muted-foreground/60">
                    {String(row.status)}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
