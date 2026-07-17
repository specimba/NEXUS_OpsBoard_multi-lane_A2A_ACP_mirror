"use client";

import { useNexusFetch } from "@/hooks/use-nexus";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { cn } from "@/lib/utils";
import { BookOpen, FlaskConical, Shield, Bug, Eye, AlertTriangle } from "lucide-react";

interface PapersSection {
  total: number;
  by_gap?: Record<string, number>;
  coverage_pct?: number;
  integration_passes?: { pass: number; name?: string; status?: string }[];
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
  } | null;
  source: string;
}

const GAP_META: Record<string, { label: string; icon: React.ElementType; cls: string }> = {
  G1_A2A_Protocol: { label: "A2A Protocol", icon: Shield, cls: "text-cyan-300" },
  G2_Token_Economics: { label: "Token Economics", icon: FlaskConical, cls: "text-amber-300" },
  G3_Sandboxing: { label: "Sandboxing", icon: Shield, cls: "text-emerald-300" },
  G4_Swarm_Coordination: { label: "Swarm Coordination", icon: Bug, cls: "text-violet-300" },
  G5_Steganography: { label: "Steganography", icon: AlertTriangle, cls: "text-rose-300" },
  G6_Hallucination_Monitoring: { label: "Hallucination Monitoring", icon: Eye, cls: "text-sky-300" },
};

const PASS_STATUS_CLS: Record<string, string> = {
  NOT_STARTED: "text-slate-400 bg-slate-500/10",
  IN_PROGRESS: "text-amber-300 bg-amber-500/10",
  DONE: "text-emerald-300 bg-emerald-500/10",
};

/**
 * ResearchCoveragePanel — D7 v3: papers section display.
 * Shows papers library stats, gap-area coverage, integration passes, and
 * highest-impact paper-to-component mappings from the STATE_PACK.
 */
export function ResearchCoveragePanel() {
  const state = useNexusFetch<StateResponse>("/api/state", 30000);
  const papers = state.data?.pack?.papers;

  if (!papers) {
    return (
      <div className="nexus-panel rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
          <h2 className="mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Research Coverage
          </h2>
          <DataSourceBadge source="off" panelId="research-coverage" />
        </div>
        <p className="text-xs text-muted-foreground/60">
          No papers section in STATE_PACK. The papers database (~646 PDFs) is
          not connected to the dashboard. Run NXM-043 with papers collection
          to populate this panel.
        </p>
      </div>
    );
  }

  return (
    <div className="nexus-panel rounded-lg overflow-hidden">
      <header className="flex items-center justify-between border-b border-white/5 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <BookOpen className="h-3.5 w-3.5 text-cyan-300" aria-hidden />
          <h2 className="mono text-xs font-semibold uppercase tracking-widest text-foreground">
            Research Coverage
          </h2>
          <DataSourceBadge source="pack" panelId="research-coverage" />
        </div>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="mono">{papers.total} papers</span>
          {papers.coverage_pct !== undefined && (
            <span
              className={cn(
                "mono rounded px-1.5 py-0.5 font-semibold",
                papers.coverage_pct >= 90
                  ? "bg-emerald-500/10 text-emerald-300"
                  : papers.coverage_pct >= 70
                    ? "bg-amber-500/10 text-amber-300"
                    : "bg-rose-500/10 text-rose-300",
              )}
            >
              {papers.coverage_pct}% coverage
            </span>
          )}
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Gap area breakdown */}
        {papers.by_gap && Object.keys(papers.by_gap).length > 0 && (
          <div className="space-y-2">
            <h3 className="mono text-[10px] uppercase tracking-wider text-muted-foreground/60">
              Gap Areas (6 filled)
            </h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {Object.entries(papers.by_gap).map(([gap, count]) => {
                const meta = GAP_META[gap] ?? { label: gap, icon: BookOpen, cls: "text-muted-foreground" };
                const Icon = meta.icon;
                return (
                  <div
                    key={gap}
                    className="flex items-center gap-2 rounded-md bg-white/5 px-2.5 py-1.5"
                  >
                    <Icon className={cn("h-3 w-3 shrink-0", meta.cls)} aria-hidden />
                    <span className="mono text-[10px] text-muted-foreground flex-1 truncate">
                      {meta.label}
                    </span>
                    <span className={cn("mono text-xs font-bold tabular-nums", meta.cls)}>
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Integration passes */}
        {papers.integration_passes && papers.integration_passes.length > 0 && (
          <div className="space-y-2">
            <h3 className="mono text-[10px] uppercase tracking-wider text-muted-foreground/60">
              Integration Passes (Phase 2)
            </h3>
            <div className="space-y-1">
              {papers.integration_passes.map((p) => (
                <div
                  key={p.pass}
                  className="flex items-center gap-2 text-[11px]"
                >
                  <span className="mono shrink-0 text-[9px] text-muted-foreground/40 tabular-nums">
                    P{p.pass}
                  </span>
                  <span className="flex-1 text-foreground/80 truncate">
                    {p.name ?? `(pass ${p.pass})`}
                  </span>
                  <span
                    className={cn(
                      "mono rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider",
                      PASS_STATUS_CLS[p.status ?? "NOT_STARTED"] ?? PASS_STATUS_CLS.NOT_STARTED,
                    )}
                  >
                    {p.status ?? "NOT_STARTED"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Highest-impact papers */}
        {papers.recent_additions && papers.recent_additions.length > 0 && (
          <div className="space-y-2">
            <h3 className="mono text-[10px] uppercase tracking-wider text-muted-foreground/60">
              Highest-Impact Papers (paper → NEXUS component)
            </h3>
            <ul className="space-y-1">
              {papers.recent_additions.map((paper) => (
                <li
                  key={paper.arxiv_id}
                  className="flex items-start gap-2 text-[11px]"
                >
                  <code className="mono shrink-0 text-cyan-300/70 text-[10px]">
                    {paper.arxiv_id}
                  </code>
                  <span className="flex-1 text-foreground/80 leading-snug">
                    {paper.title ?? "(no title)"}
                  </span>
                  {paper.nexus_component && (
                    <code className="mono shrink-0 text-[9px] text-violet-300/60 max-w-[140px] truncate">
                      {paper.nexus_component}
                    </code>
                  )}
                  {paper.gap && (
                    <span className="mono shrink-0 rounded bg-white/5 px-1 py-0.5 text-[8px] text-muted-foreground">
                      {paper.gap}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
