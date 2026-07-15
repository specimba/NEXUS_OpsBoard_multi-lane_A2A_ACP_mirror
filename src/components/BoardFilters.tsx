"use client";

import { cn } from "@/lib/utils";

/**
 * BoardFilters — executor/priority/gate filters for the Mission Board.
 * Per FABLE5 D3 step 5: "MissionCard/BoardFilters components".
 * Plain divs, no recharts. Filters are client-side over the cards array.
 */

export type FilterState = {
  executor: string;
  priority: string;
  gate: string;
  search: string;
};

export const DEFAULT_FILTERS: FilterState = {
  executor: "all",
  priority: "all",
  gate: "all",
  search: "",
};

interface BoardFiltersProps {
  filters: FilterState;
  onChange: (f: FilterState) => void;
  counts: {
    executors: Record<string, number>;
    priorities: Record<string, number>;
    gates: Record<string, number>;
  };
}

const FILTER_BTN_BASE =
  "mono rounded px-2 py-0.5 text-[10px] uppercase tracking-wider transition-colors";

export function BoardFilters({ filters, onChange, counts }: BoardFiltersProps) {
  const executors = Object.entries(counts.executors).sort((a, b) => b[1] - a[1]);
  const priorities = Object.entries(counts.priorities).sort(
    (a, b) => (a[0] < b[0] ? -1 : 1),
  );
  const gates = Object.entries(counts.gates).sort((a, b) => b[1] - a[1]);

  return (
    <div className="nexus-panel space-y-3 rounded-lg p-3">
      {/* Search */}
      <input
        type="search"
        value={filters.search}
        onChange={(e) => onChange({ ...filters, search: e.target.value })}
        placeholder="search cards by id or title…"
        aria-label="Search mission cards"
        className="mono w-full rounded-md border border-white/10 bg-black/30 px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-cyan-500/50 focus:outline-none"
      />

      {/* Executor filters */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mono text-[9px] uppercase tracking-wider text-muted-foreground/60">
          executor:
        </span>
        <button
          type="button"
          onClick={() => onChange({ ...filters, executor: "all" })}
          className={cn(
            FILTER_BTN_BASE,
            filters.executor === "all"
              ? "bg-cyan-500/15 text-cyan-200 ring-1 ring-cyan-500/30"
              : "bg-white/5 text-muted-foreground hover:text-foreground",
          )}
        >
          all
        </button>
        {executors.map(([name, count]) => (
          <button
            key={name}
            type="button"
            onClick={() => onChange({ ...filters, executor: name })}
            className={cn(
              FILTER_BTN_BASE,
              filters.executor === name
                ? "bg-cyan-500/15 text-cyan-200 ring-1 ring-cyan-500/30"
                : "bg-white/5 text-muted-foreground hover:text-foreground",
            )}
          >
            {name} ({count})
          </button>
        ))}
      </div>

      {/* Priority filters */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mono text-[9px] uppercase tracking-wider text-muted-foreground/60">
          priority:
        </span>
        <button
          type="button"
          onClick={() => onChange({ ...filters, priority: "all" })}
          className={cn(
            FILTER_BTN_BASE,
            filters.priority === "all"
              ? "bg-cyan-500/15 text-cyan-200 ring-1 ring-cyan-500/30"
              : "bg-white/5 text-muted-foreground hover:text-foreground",
          )}
        >
          all
        </button>
        {priorities.map(([name, count]) => (
          <button
            key={name}
            type="button"
            onClick={() => onChange({ ...filters, priority: name })}
            className={cn(
              FILTER_BTN_BASE,
              filters.priority === name
                ? "bg-cyan-500/15 text-cyan-200 ring-1 ring-cyan-500/30"
                : "bg-white/5 text-muted-foreground hover:text-foreground",
            )}
          >
            {name} ({count})
          </button>
        ))}
      </div>

      {/* Gate filters */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mono text-[9px] uppercase tracking-wider text-muted-foreground/60">
          gate:
        </span>
        <button
          type="button"
          onClick={() => onChange({ ...filters, gate: "all" })}
          className={cn(
            FILTER_BTN_BASE,
            filters.gate === "all"
              ? "bg-cyan-500/15 text-cyan-200 ring-1 ring-cyan-500/30"
              : "bg-white/5 text-muted-foreground hover:text-foreground",
          )}
        >
          all
        </button>
        {gates.map(([name, count]) => (
          <button
            key={name}
            type="button"
            onClick={() => onChange({ ...filters, gate: name })}
            className={cn(
              FILTER_BTN_BASE,
              filters.gate === name
                ? "bg-cyan-500/15 text-cyan-200 ring-1 ring-cyan-500/30"
                : "bg-white/5 text-muted-foreground hover:text-foreground",
            )}
          >
            {name === "—" ? "none" : name} ({count})
          </button>
        ))}
      </div>
    </div>
  );
}
