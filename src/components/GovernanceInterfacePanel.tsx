"use client";

import { useNexusFetch } from "@/hooks/use-nexus";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { cn } from "@/lib/utils";
import {
  Brain,
  ShieldCheck,
  Database,
  Network,
  CheckCircle2,
  XCircle,
} from "lucide-react";

interface StateResponse {
  pack: {
    pack_id: string;
    mcp?: {
      status?: string;
      version?: string;
      tool_count?: number;
      registry_schema_hash?: string;
    };
  } | null;
  source: string;
  stale: boolean;
  age_label: string | null;
}

interface McpHealth {
  status: "UP" | "DOWN" | "STUB";
  url: string;
  registry_hash?: string;
}

/**
 * GovernanceInterfacePanel — monitors the Python backend (nexus_os/) governance
 * surface. Per FABLE5 D1: "nexus_os wiring: STUB — no nexus_os python is wired
 * in any mode this rev." This panel makes that STUB status visible and tracks
 * the 5 governance endpoints the host must expose (from 01_PROJECT_STATE.md
 * Canonical P0 Sequence item 5).
 *
 * The panel reads /api/mcp/health to check if the bridge is UP (which would
 * mean the Python backend is reachable) and /api/state to check the pack source.
 * When the bridge is UP and the pack is live (not test), governance is "LIVE".
 * When the bridge is STUB, governance is "STUB" — and the panel shows exactly
 * which endpoints are missing.
 */
export function GovernanceInterfacePanel() {
  const state = useNexusFetch<StateResponse>("/api/state", 30000);
  const health = useNexusFetch<McpHealth>("/api/mcp/health", 10000);

  const bridgeUp = health.data?.status === "UP";
  const packLive = state.data?.source === "pack" && state.data?.pack?.pack_id !== "test-sentinel-0001";
  const governanceLive = bridgeUp && packLive;

  // The 5 governance endpoints the host must expose (01_PROJECT_STATE.md P0 seq item 5)
  const endpoints = [
    { path: "/skills/propose", method: "POST", purpose: "Propose a new skill", component: "engine/skillsmith.py" },
    { path: "/skills/status/{id}", method: "GET", purpose: "Query skill status", component: "engine/skillsmith.py" },
    { path: "/dashboard/stats", method: "GET", purpose: "Dashboard statistics", component: "bridge/server.py" },
    { path: "/governance/proposals", method: "GET", purpose: "List governance proposals", component: "governor/base.py" },
    { path: "/governance/approve/{id}", method: "POST", purpose: "Approve a proposal", component: "governor/base.py" },
  ];

  return (
    <div className="nexus-panel rounded-lg overflow-hidden">
      <header className="flex items-center justify-between border-b border-white/5 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Brain className="h-3.5 w-3.5 text-violet-300" aria-hidden />
          <h2 className="mono text-xs font-semibold uppercase tracking-widest text-foreground">
            Governance Interface — Python Backend
          </h2>
          <DataSourceBadge source="off" panelId="governance-interface" />
        </div>
        <span
          className={cn(
            "mono inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider",
            governanceLive
              ? "bg-emerald-500/10 text-emerald-300"
              : bridgeUp
                ? "bg-amber-500/10 text-amber-300"
                : "bg-slate-500/10 text-slate-400",
          )}
        >
          {governanceLive ? "LIVE" : bridgeUp ? "PARTIAL" : "STUB"}
        </span>
      </header>

      <div className="p-4 space-y-3">
        {/* Status summary */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="nexus-panel rounded-md p-2">
            <div className={cn("mono text-sm font-bold", bridgeUp ? "text-emerald-300" : "text-slate-400")}>
              {bridgeUp ? "UP" : "STUB"}
            </div>
            <div className="mono text-[8px] uppercase tracking-wider text-muted-foreground/60">
              Bridge :7354
            </div>
          </div>
          <div className="nexus-panel rounded-md p-2">
            <div className={cn("mono text-sm font-bold", packLive ? "text-cyan-300" : "text-slate-400")}>
              {packLive ? "LIVE" : "TEST"}
            </div>
            <div className="mono text-[8px] uppercase tracking-wider text-muted-foreground/60">
              Pack Source
            </div>
          </div>
          <div className="nexus-panel rounded-md p-2">
            <div className={cn("mono text-sm font-bold", governanceLive ? "text-emerald-300" : "text-rose-300")}>
              {governanceLive ? "YES" : "NO"}
            </div>
            <div className="mono text-[8px] uppercase tracking-wider text-muted-foreground/60">
              Governance Live
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-[11px] text-muted-foreground leading-snug">
          Per FABLE5 D1: nexus_os is STUB in this rev. The Python governance
          backend (FastAPI on :7352) is the canonical brain per{" "}
          <code className="text-violet-300/70">SOUL.md</code> but is not wired to
          this dashboard. Live truth arrives via STATE_PACK only. These 5
          endpoints must be exposed by the host before governance is LIVE:
        </p>

        {/* Missing endpoints */}
        <div className="space-y-1">
          {endpoints.map((ep) => (
            <div
              key={ep.path}
              className="flex items-center gap-2 rounded bg-white/5 px-2.5 py-1.5"
            >
              {governanceLive ? (
                <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-300" aria-hidden />
              ) : (
                <XCircle className="h-3 w-3 shrink-0 text-slate-500" aria-hidden />
              )}
              <span className="mono text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60 shrink-0">
                {ep.method}
              </span>
              <code className="mono text-[11px] text-cyan-300/70 shrink-0">
                {ep.path}
              </code>
              <span className="text-[10px] text-muted-foreground flex-1 truncate">
                {ep.purpose}
              </span>
              <code className="mono text-[9px] text-violet-300/50 shrink-0 hidden sm:block">
                {ep.component}
              </code>
            </div>
          ))}
        </div>

        {/* What changes when governance goes live */}
        <div className="rounded border border-violet-500/20 bg-violet-500/[0.04] p-2.5">
          <p className="mono text-[9px] uppercase tracking-wider text-violet-300/80 mb-1">
            When governance goes LIVE:
          </p>
          <ul className="space-y-0.5 text-[10px] text-muted-foreground">
            <li>• Trust scores come from TrustEngineV2 (logistic+CDR), not static heuristic</li>
            <li>• KAIJU 4-var authz enforced on every API call (not skipped in dev mode)</li>
            <li>• Vault operations go through VaultManager (5-track, hash-chained)</li>
            <li>• TokenGuard enforces budget (4 budgets, hard-stop at 95%)</li>
            <li>• Circuit breaker protects model routing (3-state, exponential backoff)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
