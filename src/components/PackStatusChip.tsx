"use client";

import { useNexusFetch } from "@/hooks/use-nexus";
import { cn } from "@/lib/utils";
import { Package, AlertTriangle } from "lucide-react";

interface StateResponse {
  pack: {
    pack_id: string;
    generated_at: string;
    pack_schema: string;
  } | null;
  source: "pack" | "test" | "none";
  stale: boolean;
  age_label: string | null;
  error: string | null;
}

/**
 * PackStatusChip — shows STATE_PACK status in the nav.
 * Per FABLE5 D3 step 3: "PACK v1 · 2h" when a live pack exists, "NO PACK — SEED MODE" when none.
 */
export function PackStatusChip() {
  const state = useNexusFetch<StateResponse>("/api/state", 30000);

  if (!state.data) {
    return (
      <span className="mono flex items-center gap-1 text-[9px] uppercase tracking-wider text-muted-foreground/50">
        <Package className="h-3 w-3" aria-hidden />
        …
      </span>
    );
  }

  const { pack, source, stale, age_label } = state.data;

  if (source === "none" || !pack) {
    return (
      <span
        className="mono flex items-center gap-1 rounded bg-orange-500/10 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-orange-300"
        title="No STATE_PACK imported. All panels show SEED/MOCK baseline. Run NXM-043 generator on host, then POST /api/import."
      >
        <AlertTriangle className="h-2.5 w-2.5" aria-hidden />
        NO PACK — SEED
      </span>
    );
  }

  const isTest = source === "test";
  return (
    <span
      className={cn(
        "mono flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] uppercase tracking-wider",
        stale
          ? "bg-amber-500/10 text-amber-300"
          : isTest
            ? "bg-blue-500/10 text-blue-300"
            : "bg-cyan-500/10 text-cyan-300",
      )}
      title={
        isTest
          ? `TEST FIXTURE (sentinel). pack_id=${pack.pack_id}. Replace with real pack via /api/import.`
          : stale
            ? `STALE pack (age ${age_label}, exceeds TTL). pack_id=${pack.pack_id}. Refresh via NXM-043.`
            : `Live STATE_PACK. pack_id=${pack.pack_id}, age ${age_label}.`
      }
    >
      <Package className="h-2.5 w-2.5" aria-hidden />
      {isTest ? "TEST" : "PACK"} · {age_label ?? "?"}
      {stale && " ⚠"}
    </span>
  );
}
