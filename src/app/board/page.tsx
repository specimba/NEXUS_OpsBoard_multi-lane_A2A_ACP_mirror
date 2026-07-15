"use client";

import { useState, useMemo } from "react";
import { useNexusFetch } from "@/hooks/use-nexus";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { BoardFilters, DEFAULT_FILTERS, type FilterState } from "@/components/BoardFilters";
import { cn } from "@/lib/utils";
import {
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
  Circle,
  Loader2,
  Ban,
} from "lucide-react";

interface BoardCard {
  id: string;
  title?: string;
  executor?: string;
  priority?: string;
  status?: string;
  gate?: string;
  rev?: number;
}

interface StateResponse {
  pack: {
    pack_id: string;
    generated_at: string;
    board?: { cards?: BoardCard[] };
  } | null;
  source: "pack" | "test" | "none";
  stale: boolean;
  age_label: string | null;
}

const STATUS_CONFIG: Record<
  string,
  { icon: React.ElementType; cls: string }
> = {
  DONE: { icon: CheckCircle2, cls: "text-emerald-300 bg-emerald-500/10" },
  READY: { icon: Circle, cls: "text-sky-300 bg-sky-500/10" },
  IN_PROGRESS: {
    icon: Loader2,
    cls: "text-amber-300 bg-amber-500/10",
  },
  BLOCKED: { icon: AlertTriangle, cls: "text-rose-300 bg-rose-500/10" },
  PARKED: { icon: Ban, cls: "text-slate-400 bg-slate-500/10" },
};

const PRIORITY_CLS: Record<string, string> = {
  P0: "text-rose-300 ring-rose-500/30",
  P1: "text-amber-300 ring-amber-500/30",
  P2: "text-sky-300 ring-sky-500/30",
  P3: "text-slate-400 ring-slate-500/30",
};

const EXECUTOR_CLS: Record<string, string> = {
  CODEX: "text-emerald-300",
  "SONNET5-CLI": "text-violet-300",
  HERMES: "text-cyan-300",
  GLM52: "text-cyan-200",
  KILO: "text-orange-300",
  LEANLABS: "text-pink-300",
  FABLE5: "text-amber-300",
  OPERATOR: "text-foreground",
  GROK420: "text-teal-300",
};

// D3 step 5: no pack → 6 watermarked NXM-SEED-* fallback cards + import banner
const NO_PACK_FALLBACK_CARDS: BoardCard[] = [
  { id: "NXM-SEED-001", title: "credential-containment-and-accepted-risk", executor: "OPERATOR", priority: "P0", status: "BLOCKED", gate: "—", rev: 2 },
  { id: "NXM-SEED-017", title: "dashboard-fusion-mvp", executor: "GLM52", priority: "P2", status: "IN_PROGRESS", gate: "OG-2", rev: 2 },
  { id: "NXM-SEED-022", title: "hermes-401-fix", executor: "SONNET5-CLI", priority: "P0", status: "READY", gate: "—", rev: 1 },
  { id: "NXM-SEED-029", title: "doppelground-leak-triage", executor: "OPERATOR", priority: "P0", status: "IN_PROGRESS", gate: "—", rev: 1 },
  { id: "NXM-SEED-031", title: "governance-api-endpoints", executor: "CODEX", priority: "P0", status: "READY", gate: "—", rev: 1 },
  { id: "NXM-SEED-036", title: "external-handoff-gates", executor: "OPERATOR", priority: "P0", status: "BLOCKED", gate: "NXM-029", rev: 1 },
];

function MissionCard({ card }: { card: BoardCard }) {
  const sc = STATUS_CONFIG[card.status ?? ""] ?? STATUS_CONFIG.READY;
  const Icon = sc.icon;
  return (
    <article className="nexus-panel nexus-panel-hover rounded-lg p-3 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <span className="mono text-[10px] font-bold uppercase tracking-wider text-cyan-300">
          {card.id}
        </span>
        <span
          className={cn(
            "mono inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider",
            sc.cls,
          )}
        >
          <Icon
            className={cn("h-2.5 w-2.5", card.status === "IN_PROGRESS" && "animate-spin")}
            aria-hidden
          />
          {card.status ?? "UNKNOWN"}
        </span>
      </div>
      <p className="mt-1.5 text-xs text-foreground/90 leading-snug">
        {card.title ?? "(no title)"}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px]">
        {card.executor && (
          <span
            className={cn(
              "mono font-semibold",
              EXECUTOR_CLS[card.executor] ?? "text-muted-foreground",
            )}
          >
            {card.executor}
          </span>
        )}
        {card.priority && (
          <span
            className={cn(
              "mono rounded px-1 py-0.5 font-semibold ring-1",
              PRIORITY_CLS[card.priority] ?? PRIORITY_CLS.P3,
            )}
          >
            {card.priority}
          </span>
        )}
        {card.gate && card.gate !== "—" && (
          <span className="mono rounded bg-white/5 px-1 py-0.5 text-muted-foreground">
            gate: {card.gate}
          </span>
        )}
        {card.rev && card.rev > 1 && (
          <span className="mono text-muted-foreground/60">REV {card.rev}</span>
        )}
      </div>
    </article>
  );
}

export default function BoardPage() {
  const state = useNexusFetch<StateResponse>("/api/state", 30000);
  const rawCards = state.data?.pack?.board?.cards ?? [];
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  // Compute filter counts from raw cards
  const counts = useMemo(() => {
    const executors: Record<string, number> = {};
    const priorities: Record<string, number> = {};
    const gates: Record<string, number> = {};
    for (const c of rawCards) {
      if (c.executor) executors[c.executor] = (executors[c.executor] ?? 0) + 1;
      if (c.priority) priorities[c.priority] = (priorities[c.priority] ?? 0) + 1;
      if (c.gate) gates[c.gate] = (gates[c.gate] ?? 0) + 1;
    }
    return { executors, priorities, gates };
  }, [rawCards]);

  // Apply filters
  const cards = useMemo(() => {
    return rawCards.filter((c) => {
      if (filters.executor !== "all" && c.executor !== filters.executor) return false;
      if (filters.priority !== "all" && c.priority !== filters.priority) return false;
      if (filters.gate !== "all" && c.gate !== filters.gate) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const id = c.id.toLowerCase();
        const title = (c.title ?? "").toLowerCase();
        if (!id.includes(q) && !title.includes(q)) return false;
      }
      return true;
    });
  }, [rawCards, filters]);

  const byStatus = (s: string) => cards.filter((c) => c.status === s);
  const done = byStatus("DONE").length;
  const ready = byStatus("READY").length;
  const inProgress = byStatus("IN_PROGRESS").length;
  const blocked = byStatus("BLOCKED").length;
  const parked = byStatus("PARKED").length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="mono flex items-center gap-2 text-lg font-bold tracking-wide text-foreground sm:text-xl">
            <ClipboardList className="h-5 w-5 text-cyan-300" aria-hidden />
            Mission Board
            <DataSourceBadge
              source={state.data?.pack ? "pack" : "seed"}
              panelId="mission-board-cards"
              packAge={state.data?.age_label ?? undefined}
            />
          </h1>
          <p className="mono text-[11px] uppercase tracking-wider text-muted-foreground">
            {state.data?.pack
              ? `pack ${state.data.pack.pack_id} · ${state.data.age_label}${state.data.stale ? " · STALE" : ""}`
              : "no pack loaded — showing seed watermarked cards"}
          </p>
        </div>
        <div className="mono flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="text-emerald-300">{done} done</span>
          <span className="text-amber-300">{inProgress} wip</span>
          <span className="text-sky-300">{ready} ready</span>
          <span className="text-rose-300">{blocked} blocked</span>
          <span className="text-slate-400">{parked} parked</span>
        </div>
      </div>

      {/* Import banner when no pack */}
      {!state.data?.pack && (
        <div className="nexus-panel rounded-lg border-amber-500/30 bg-amber-500/[0.06] p-3">
          <p className="mono text-xs text-amber-200/80">
            NO STATE_PACK imported. Showing 42 NXM-SEED-* sentinel cards (watermarked).
            To load live mission board: run the NXM-043 generator on the host, then
            <code className="mx-1 rounded bg-amber-500/10 px-1.5 py-0.5 text-amber-200">POST /api/import</code>
            with the swept STATE_PACK JSON.
          </p>
        </div>
      )}

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: "Done", value: done, cls: "text-emerald-300 bg-emerald-500/10" },
          { label: "In Progress", value: inProgress, cls: "text-amber-300 bg-amber-500/10" },
          { label: "Ready", value: ready, cls: "text-sky-300 bg-sky-500/10" },
          { label: "Blocked", value: blocked, cls: "text-rose-300 bg-rose-500/10" },
          { label: "Parked", value: parked, cls: "text-slate-400 bg-slate-500/10" },
        ].map((s) => (
          <div key={s.label} className={cn("nexus-panel rounded-lg p-3 text-center", s.cls)}>
            <div className="mono text-2xl font-bold tabular-nums">{s.value}</div>
            <div className="mono text-[9px] uppercase tracking-wider opacity-70">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      {rawCards.length > 0 && (
        <BoardFilters filters={filters} onChange={setFilters} counts={counts} />
      )}

      {/* Cards grid — no pack → 6 watermarked NXM-SEED-* fallback cards (D3 step 5) */}
      {rawCards.length === 0 ? (
        <div className="space-y-3">
          <div className="nexus-panel rounded-lg border-amber-500/30 bg-amber-500/[0.06] p-3">
            <p className="mono text-xs text-amber-200/80">
              NO STATE_PACK imported. Showing 6 watermarked NXM-SEED-* fallback cards.
              To load the live mission board: run the NXM-043 generator on the host, then
              <code className="mx-1 rounded bg-amber-500/10 px-1.5 py-0.5 text-amber-200">POST /api/import</code>
              with the swept STATE_PACK JSON.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {NO_PACK_FALLBACK_CARDS.map((card) => (
              <MissionCard key={card.id} card={card} />
            ))}
          </div>
        </div>
      ) : cards.length === 0 ? (
        <div className="nexus-panel rounded-lg p-6 text-center text-xs text-muted-foreground">
          No cards match the current filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {cards.map((card) => (
            <MissionCard key={card.id} card={card} />
          ))}
        </div>
      )}
    </div>
  );
}
