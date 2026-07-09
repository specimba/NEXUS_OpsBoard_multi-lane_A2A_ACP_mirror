"use client";

import { useNexusFetch } from "@/hooks/use-nexus";
import { LaneCard } from "@/components/LaneCard";
import { QwenWebDevNote } from "@/components/QwenWebDevNote";
import type { LaneMeta } from "@/lib/types";
import { Network } from "lucide-react";
import { cn } from "@/lib/utils";

interface LanesResponse {
  lanes: (LaneMeta & { status_label: string })[];
}

const FILTERS = [
  { id: "all", label: "All" },
  { id: "ready", label: "Ready" },
  { id: "partial", label: "Partial" },
  { id: "preview_mode", label: "Preview" },
  { id: "unknown", label: "Unknown" },
] as const;

import { useState } from "react";

export default function LanesPage() {
  const lanes = useNexusFetch<LanesResponse>("/api/lanes", 20000);
  const [filter, setFilter] = useState<string>("all");

  const all = lanes.data?.lanes ?? [];
  const filtered =
    filter === "all" ? all : all.filter((l) => l.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="mono flex items-center gap-2 text-lg font-bold tracking-wide text-foreground sm:text-xl">
            <Network className="h-5 w-5 text-cyan-300" aria-hidden />
            Lane Doctrine
          </h1>
          <p className="mono text-[11px] uppercase tracking-wider text-muted-foreground">
            success signals · wait policies · status
          </p>
        </div>
        <div className="mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {all.length} lanes registered
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => {
          const count =
            f.id === "all" ? all.length : all.filter((l) => l.status === f.id).length;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={cn(
                "mono rounded-md px-2.5 py-1 text-[11px] uppercase tracking-wider transition-colors",
                filter === f.id
                  ? "bg-cyan-500/15 text-cyan-200 ring-1 ring-cyan-500/30"
                  : "bg-white/5 text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label} ({count})
            </button>
          );
        })}
      </div>

      {lanes.loading && !lanes.data ? (
        <div className="nexus-panel rounded-lg p-6 text-center text-xs text-muted-foreground">
          loading lanes…
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((lane) => (
            <LaneCard key={lane.id} lane={lane} />
          ))}
        </div>
      )}

      <QwenWebDevNote />
    </div>
  );
}
