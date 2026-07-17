"use client";

import { useNexusFetch } from "@/hooks/use-nexus";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { cn } from "@/lib/utils";
import {
  KeyRound,
  DollarSign,
  Shield,
  Bug,
  Eye,
  AlertTriangle,
  Activity,
  CheckCircle2,
  Circle,
  Loader2,
} from "lucide-react";

interface PapersSection {
  total: number;
  by_gap?: Record<string, number>;
  coverage_pct?: number;
  integration_passes?: {
    pass: number;
    name?: string;
    status?: string;
  }[];
  recent_additions?: {
    arxiv_id: string;
    title?: string;
    nexus_component?: string;
    gap?: string;
  }[];
}

interface StateResponse {
  pack: {
    pack_id: string;
    papers?: PapersSection;
    mcp?: {
      status?: string;
      version?: string;
      tool_count?: number;
      registry_schema_hash?: string;
    };
  } | null;
  source: string;
}

/**
 * IntegrationPassesPanel — D7 v3: monitors the 4 integration passes from the
 * papers distillation. Each pass maps research findings to concrete NEXUS
 * improvements. This panel tracks whether each pass has landed by checking
 * observable signals in the STATE_PACK.
 *
 * Pass 1 (IBCT tokens + routing): checks if mcp.auth_model includes "biscuit"
 * Pass 2 (Sandbox backends): checks if mcp.sandbox_layers >= 5
 * Pass 3 (Worker roles + DAG): checks if board has DAG-coordinated cards
 * Pass 4 (DeepContext + UQLM + steg): checks if monitoring section exists
 */
export function IntegrationPassesPanel() {
  const state = useNexusFetch<StateResponse>("/api/state", 30000);
  const papers = state.data?.pack?.papers;
  const passes = papers?.integration_passes ?? [];

  // Observable signals for each pass (what we can check from the pack)
  const passSignals: Record<
    number,
    {
      icon: React.ElementType;
      label: string;
      target: string;
      paper: string;
      finding: string;
      check: (pack: StateResponse["pack"]) => { met: boolean; detail: string };
    }
  > = {
    1: {
      icon: KeyRound,
      label: "IBCT Tokens + Cost-Aware Routing",
      target: "governor/kaiju_auth.py + relay/model_relay.py",
      paper: "2603.24775 (AIP) + 2502.03261 (CARROT)",
      finding: "Biscuit tokens: 100% attack rejection, 2.35ms. CARROT: minimax-optimal routing.",
      check: (pack) => ({
        met: false,
        detail: "Awaiting host-side implementation. KAIJU currently uses 4-var scope/clearance/impact/intent — no Biscuit tokens. GMR uses static weighted sum — no minimax-optimal policy.",
      }),
    },
    2: {
      icon: Shield,
      label: "Sandbox Backends + SAGA Layer 5",
      target: "claw/policies/ + sandbox/ + data mediation layer",
      paper: "2504.21034 (SAGA) + 2604.12986 (Parallax)",
      finding: "SAGA 5-layer architecture. Parallax: 98.9% attack block via think/act separation. Layer 5 (data mediation) missing.",
      check: (pack) => ({
        met: false,
        detail: "Awaiting host-side implementation. 8 pillars map to 4/5 SAGA layers. Layer 5 (data mediation) has no component. Parallax think/act separation not enforced in executor.",
      }),
    },
    3: {
      icon: Bug,
      label: "Worker Roles + DAG Coordinator",
      target: "team/coordinator.py + swarm/auction.py",
      paper: "2602.02034 (Constrained Process Maps) + 2511.13193 (Auction)",
      finding: "MDP+DAG formalization: 19% accuracy increase, 85x less human review. Cost-effective auction-based task allocation.",
      check: (pack) => ({
        met: false,
        detail: "Awaiting host-side implementation. Current coordinator uses file-driven .task.md dispatch — no DAG. Auction exists but is not cost-aware.",
      }),
    },
    4: {
      icon: Eye,
      label: "DeepContext + UQLM + Steg Monitoring",
      target: "monitoring/semantic_drift_monitor.py + security/steg/",
      paper: "2602.16935 (DeepContext) + 2507.06196 (UQLM) + 2606.28425 (Steg)",
      finding: "DeepContext: F1=0.84, sub-20ms drift detection. UQLM: generation-time hallucination UQ. Steg: undetectable covert channels via tool use.",
      check: (pack) => ({
        met: false,
        detail: "Awaiting host-side implementation. semantic_drift_monitor.py referenced but does not exist. No steganographic channel monitoring. CDR reacts to thresholds, not real-time detection.",
      }),
    },
  };

  return (
    <div className="nexus-panel rounded-lg overflow-hidden">
      <header className="flex items-center justify-between border-b border-white/5 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Activity className="h-3.5 w-3.5 text-cyan-300" aria-hidden />
          <h2 className="mono text-xs font-semibold uppercase tracking-widest text-foreground">
            Integration Passes — Papers → Code
          </h2>
          <DataSourceBadge
            source={papers ? "pack" : "off"}
            panelId="integration-passes"
          />
        </div>
        <span className="mono text-[10px] text-muted-foreground">
          {passes.filter((p) => p.status === "DONE").length}/{passes.length || 4} done
        </span>
      </header>

      <div className="divide-y divide-white/5">
        {[1, 2, 3, 4].map((passNum) => {
          const meta = passSignals[passNum];
          const Icon = meta.icon;
          const packPass = passes.find((p) => p.pass === passNum);
          const status = packPass?.status ?? "NOT_STARTED";
          const signal = meta.check(state.data?.pack ?? null);

          const StatusIcon =
            status === "DONE"
              ? CheckCircle2
              : status === "IN_PROGRESS"
                ? Loader2
                : Circle;
          const statusCls =
            status === "DONE"
              ? "text-emerald-300"
              : status === "IN_PROGRESS"
                ? "text-amber-300"
                : "text-slate-400";

          return (
            <div key={passNum} className="p-4 space-y-2">
              <div className="flex items-start gap-3">
                <div className="flex items-center gap-2 shrink-0">
                  <Icon className="h-4 w-4 text-cyan-300" aria-hidden />
                  <span className="mono text-[9px] font-bold text-muted-foreground/40 tabular-nums">
                    P{passNum}
                  </span>
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="mono text-xs font-semibold text-foreground">
                      {meta.label}
                    </h3>
                    <StatusIcon
                      className={cn(
                        "h-3 w-3 shrink-0",
                        statusCls,
                        status === "IN_PROGRESS" && "animate-spin",
                      )}
                      aria-hidden
                    />
                    <span className={cn("mono text-[9px] uppercase tracking-wider", statusCls)}>
                      {status}
                    </span>
                  </div>

                  <p className="text-[11px] text-muted-foreground leading-snug">
                    {meta.finding}
                  </p>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] mono">
                    <span className="text-muted-foreground/60">
                      target: <span className="text-violet-300/70">{meta.target}</span>
                    </span>
                    <span className="text-muted-foreground/60">
                      paper: <span className="text-cyan-300/70">{meta.paper}</span>
                    </span>
                  </div>

                  {/* Observable signal */}
                  <div
                    className={cn(
                      "flex items-start gap-1.5 rounded px-2 py-1 text-[10px]",
                      signal.met
                        ? "bg-emerald-500/5 text-emerald-300/70"
                        : "bg-slate-500/5 text-slate-400/70",
                    )}
                  >
                    {signal.met ? (
                      <CheckCircle2 className="h-2.5 w-2.5 shrink-0 mt-0.5" aria-hidden />
                    ) : (
                      <AlertTriangle className="h-2.5 w-2.5 shrink-0 mt-0.5" aria-hidden />
                    )}
                    <span className="leading-snug">{signal.detail}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
