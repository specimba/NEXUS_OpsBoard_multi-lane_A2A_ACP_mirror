import { cn } from "@/lib/utils";
import { accentClasses, statusLabel } from "@/lib/registry";
import type { LaneMeta } from "@/lib/types";
import { ArrowRight, CheckCircle2, AlertTriangle, XCircle, HelpCircle, Eye } from "lucide-react";

function StatusIcon({ status }: { status: LaneMeta["status"] }) {
  const cls = "h-3.5 w-3.5";
  switch (status) {
    case "ready":
      return <CheckCircle2 className={cn(cls, "text-emerald-400")} aria-hidden />;
    case "partial":
      return <AlertTriangle className={cn(cls, "text-amber-400")} aria-hidden />;
    case "broken":
      return <XCircle className={cn(cls, "text-rose-400")} aria-hidden />;
    case "preview_mode":
      return <Eye className={cn(cls, "text-violet-300")} aria-hidden />;
    case "unknown":
    default:
      return <HelpCircle className={cn(cls, "text-slate-400")} aria-hidden />;
  }
}

export function LaneCard({ lane }: { lane: LaneMeta }) {
  const a = accentClasses(lane.accent);

  return (
    <article
      className={cn(
        "nexus-panel nexus-panel-hover rounded-lg p-4 transition-colors",
        a.border,
      )}
    >
      <header className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={cn("h-2 w-2 rounded-full", a.dot)} aria-hidden />
          <h3 className={cn("mono text-sm font-bold tracking-wide", a.text)}>
            {lane.label}
          </h3>
        </div>
        <span
          className={cn(
            "mono inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
            a.bg,
            a.text,
          )}
        >
          <StatusIcon status={lane.status} />
          {statusLabel(lane.status)}
        </span>
      </header>

      <p className="mt-2 text-xs text-muted-foreground">{lane.role}</p>

      <dl className="mt-3 space-y-2 text-[11px]">
        <div>
          <dt className="mono uppercase tracking-wider text-muted-foreground/70">
            Success signal
          </dt>
          <dd className="mt-0.5 text-foreground/90">{lane.successSignal}</dd>
        </div>
        <div>
          <dt className="mono uppercase tracking-wider text-muted-foreground/70">
            Wait policy
          </dt>
          <dd className="mt-0.5 flex items-start gap-1 text-foreground/80">
            <ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" aria-hidden />
            <span>{lane.waitPolicy}</span>
          </dd>
        </div>
      </dl>

      <footer className="mt-3 border-t border-white/5 pt-2">
        <span className="mono text-[10px] uppercase tracking-widest text-muted-foreground/50">
          lane_id: <span className={a.text}>{lane.id}</span>
        </span>
      </footer>
    </article>
  );
}
