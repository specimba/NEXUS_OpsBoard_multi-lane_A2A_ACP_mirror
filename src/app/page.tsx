"use client";

import { useNexusFetch } from "@/hooks/use-nexus";
import { KeepVisibleBanner } from "@/components/KeepVisibleBanner";
import { LaneCard } from "@/components/LaneCard";
import { HandoffCard } from "@/components/HandoffCard";
import { LedgerTail } from "@/components/LedgerTail";
import { QwenWebDevNote } from "@/components/QwenWebDevNote";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { LedgerIntegrityPanel } from "@/components/LedgerIntegrityPanel";
import type { LaneMeta, HandoffCard as HandoffCardType, LedgerRow } from "@/lib/types";
import { Activity, ArrowLeftRight, Network, Server } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LanesResponse {
  lanes: (LaneMeta & { status_label: string })[];
}
interface HandoffsResponse {
  count: number;
  handoffs: HandoffCardType[];
}
interface LedgerResponse {
  rows: LedgerRow[];
  source: "env" | "sample";
  total_read: number;
  error?: string;
}
interface HealthResponse {
  status: string;
  cdp_port: number;
  lanes: number;
  mcp_tools: number;
  mcp_health_url: string;
  server_time: string;
}

function Stat({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  accent: string;
}) {
  return (
    <div className="nexus-panel flex items-center gap-3 rounded-lg px-4 py-3">
      <span className={cn("flex h-8 w-8 items-center justify-center rounded-md", accent)}>
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <div className="mono text-lg font-bold tabular-nums text-foreground">
          {value}
        </div>
        <div className="mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
      </div>
    </div>
  );
}

export default function OpsBoard() {
  const lanes = useNexusFetch<LanesResponse>("/api/lanes", 15000);
  const handoffs = useNexusFetch<HandoffsResponse>("/api/handoffs?limit=5", 8000);
  const ledger = useNexusFetch<LedgerResponse>("/api/ledger?limit=15", 8000);
  const health = useNexusFetch<HealthResponse>("/api/health", 15000);

  const readyCount = (lanes.data?.lanes ?? []).filter(
    (l) => l.status === "ready",
  ).length;
  const partialCount = (lanes.data?.lanes ?? []).filter(
    (l) => l.status === "partial" || l.status === "preview_mode",
  ).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="mono text-lg font-bold tracking-wide text-foreground sm:text-xl">
            Ops Board
          </h1>
          <p className="mono text-[11px] uppercase tracking-wider text-muted-foreground">
            multi-lane A2A mirror · realtime polling
          </p>
        </div>
        <div className="mono flex items-center gap-2 text-[10px] text-muted-foreground">
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              health.data?.status === "ok" ? "bg-emerald-400 nexus-pulse" : "bg-rose-400",
            )}
            aria-hidden
          />
          {health.data
            ? `app ${health.data.status} · ${new Date(health.data.server_time).toLocaleTimeString("en-GB", { hour12: false })}`
            : "probing app…"}
        </div>
      </div>

      <KeepVisibleBanner />

      {/* Stats row */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <DataSourceBadge source="wired" panelId="ops-board-stats" />
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          icon={Network}
          label="lanes tracked"
          value={health.data?.lanes ?? "—"}
          accent="bg-cyan-500/15 text-cyan-300"
        />
        <Stat
          icon={Activity}
          label="ready / partial"
          value={lanes.data ? `${readyCount} / ${partialCount}` : "—"}
          accent="bg-emerald-500/15 text-emerald-300"
        />
        <Stat
          icon={Server}
          label="MCP tools"
          value={health.data?.mcp_tools ?? "—"}
          accent="bg-violet-500/15 text-violet-300"
        />
        <Stat
          icon={ArrowLeftRight}
          label="recent handoffs"
          value={handoffs.data?.count ?? "—"}
          accent="bg-amber-500/15 text-amber-300"
        />
        </div>
      </div>

      {/* Lane grid */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="mono text-xs font-semibold uppercase tracking-widest text-foreground">
              Lane Grid
            </h2>
            <DataSourceBadge source="seed" panelId="ops-board-lane-grid" />
          </div>
          <Link
            href="/lanes"
            className="mono text-[10px] uppercase tracking-wider text-cyan-300 hover:text-cyan-200"
          >
            view all →
          </Link>
        </div>
        {lanes.loading && !lanes.data ? (
          <div className="nexus-panel rounded-lg p-6 text-center text-xs text-muted-foreground">
            loading lanes…
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {lanes.data?.lanes.map((lane) => (
              <LaneCard key={lane.id} lane={lane} />
            ))}
          </div>
        )}
      </section>

      {/* Qwen note */}
      <QwenWebDevNote />

      {/* Handoffs + Ledger */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="mono text-xs font-semibold uppercase tracking-widest text-foreground">
                Recent Handoffs
              </h2>
              <DataSourceBadge source="wired" panelId="ops-board-recent-handoffs" />
            </div>
            <Link
              href="/handoffs"
              className="mono text-[10px] uppercase tracking-wider text-cyan-300 hover:text-cyan-200"
            >
              open bus →
            </Link>
          </div>
          <div className="max-h-[28rem] space-y-3 overflow-y-auto nexus-scroll pr-1">
            {handoffs.loading && !handoffs.data ? (
              <div className="nexus-panel rounded-lg p-6 text-center text-xs text-muted-foreground">
                loading handoffs…
              </div>
            ) : handoffs.data && handoffs.data.handoffs.length > 0 ? (
              handoffs.data.handoffs.map((h) => (
                <HandoffCard key={h.id} handoff={h} />
              ))
            ) : (
              <div className="nexus-panel rounded-lg p-6 text-center text-xs text-muted-foreground">
                no handoffs
              </div>
            )}
          </div>
        </section>

        <section className="space-y-2">
          <LedgerTail
            rows={ledger.data?.rows ?? null}
            loading={ledger.loading}
            error={ledger.error ?? ledger.data?.error ?? null}
            source={ledger.data?.source ?? null}
            totalRead={ledger.data?.total_read}
            limit={15}
          />
          <LedgerIntegrityPanel />
        </section>
      </div>
    </div>
  );
}
