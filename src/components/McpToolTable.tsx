"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { McpToolGroup, McpToolInfo, McpToolRisk } from "@/lib/types";
import { ShieldAlert, ShieldCheck, Shield } from "lucide-react";

const GROUP_LABEL: Record<McpToolGroup, string> = {
  connectivity: "Connectivity",
  evidence: "Evidence",
  queue: "Queue",
  session: "Session",
  a2a: "A2A",
};

const GROUPS: McpToolGroup[] = [
  "connectivity",
  "evidence",
  "queue",
  "session",
  "a2a",
];

const RISK_STYLE: Record<McpToolRisk, string> = {
  low: "text-emerald-300 bg-emerald-500/10",
  medium: "text-amber-300 bg-amber-500/10",
  high: "text-rose-300 bg-rose-500/10",
};

function RiskIcon({ risk }: { risk: McpToolRisk }) {
  const cls = "h-3 w-3";
  if (risk === "low") return <ShieldCheck className={cls} aria-hidden />;
  if (risk === "medium") return <Shield className={cls} aria-hidden />;
  return <ShieldAlert className={cls} aria-hidden />;
}

interface McpToolTableProps {
  tools: McpToolInfo[];
  denylist?: string[];
}

export function McpToolTable({ tools, denylist }: McpToolTableProps) {
  const [filter, setFilter] = useState<McpToolGroup | "all">("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tools.filter((t) => {
      if (filter !== "all" && t.group !== filter) return false;
      if (q && !t.name.toLowerCase().includes(q) && !t.description.toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [tools, filter, query]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: tools.length };
    for (const g of GROUPS) c[g] = tools.filter((t) => t.group === g).length;
    return c;
  }, [tools]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={cn(
            "mono rounded-md px-2.5 py-1 text-[11px] uppercase tracking-wider transition-colors",
            filter === "all"
              ? "bg-cyan-500/15 text-cyan-200 ring-1 ring-cyan-500/30"
              : "bg-white/5 text-muted-foreground hover:text-foreground",
          )}
        >
          All ({counts.all})
        </button>
        {GROUPS.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setFilter(g)}
            className={cn(
              "mono rounded-md px-2.5 py-1 text-[11px] uppercase tracking-wider transition-colors",
              filter === g
                ? "bg-cyan-500/15 text-cyan-200 ring-1 ring-cyan-500/30"
                : "bg-white/5 text-muted-foreground hover:text-foreground",
            )}
          >
            {GROUP_LABEL[g]} ({counts[g] ?? 0})
          </button>
        ))}
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="filter tools…"
          aria-label="Filter tools"
          className="mono ml-auto w-40 rounded-md border border-white/10 bg-black/30 px-2.5 py-1 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-cyan-500/50 focus:outline-none sm:w-56"
        />
      </div>

      <div className="nexus-panel overflow-hidden rounded-lg">
        <div className="max-h-[32rem] overflow-auto nexus-scroll">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 z-10 bg-[oklch(0.205_0.008_260/0.98)] backdrop-blur">
              <tr className="mono text-[10px] uppercase tracking-wider text-muted-foreground/70">
                <th className="px-3 py-2 font-semibold">tool</th>
                <th className="px-3 py-2 font-semibold">group</th>
                <th className="px-3 py-2 font-semibold">risk</th>
                <th className="px-3 py-2 font-semibold">description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((t) => (
                <tr
                  key={t.name}
                  className="hover:bg-white/[0.02]"
                >
                  <td className="px-3 py-2 align-top">
                    <span className="mono font-semibold text-cyan-200">
                      {t.name}
                    </span>
                  </td>
                  <td className="px-3 py-2 align-top">
                    <span className="mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {GROUP_LABEL[t.group]}
                    </span>
                  </td>
                  <td className="px-3 py-2 align-top">
                    <span
                      className={cn(
                        "mono inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                        RISK_STYLE[t.risk],
                      )}
                    >
                      <RiskIcon risk={t.risk} />
                      {t.risk}
                    </span>
                  </td>
                  <td className="px-3 py-2 align-top text-foreground/80">
                    {t.description}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-3 py-6 text-center text-muted-foreground"
                  >
                    No tools match the filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {denylist && denylist.length > 0 && (
        <div className="nexus-panel rounded-lg border-rose-500/30 bg-rose-500/[0.05] p-3">
          <h3 className="mono flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-rose-300">
            <ShieldAlert className="h-3.5 w-3.5" aria-hidden />
            Denylist — capabilities NOT on the bridge
          </h3>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {denylist.map((d) => (
              <li
                key={d}
                className="mono rounded bg-rose-500/10 px-2 py-0.5 text-[10px] text-rose-200/90"
              >
                {d}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
