import { cn } from "@/lib/utils";
import { LANE_MAP, accentClasses } from "@/lib/registry";
import type { HandoffCard as HandoffCardType, HandoffStatus } from "@/lib/types";
import { ArrowRight, Paperclip, ShieldCheck, Coins } from "lucide-react";

const STATUS_STYLE: Record<HandoffStatus, string> = {
  open: "bg-sky-500/15 text-sky-300 ring-sky-500/30",
  accepted: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
  blocked: "bg-rose-500/15 text-rose-300 ring-rose-500/30",
  done: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
};

function laneLabel(id: string): { label: string; cls: string } {
  const meta = LANE_MAP[id as keyof typeof LANE_MAP];
  if (!meta) return { label: id, cls: "text-slate-300" };
  return { label: meta.label, cls: accentClasses(meta.accent).text };
}

export function HandoffCard({ handoff }: { handoff: HandoffCardType }) {
  const from = laneLabel(handoff.from);
  const to = laneLabel(handoff.to);
  const created = new Date(handoff.created_at);

  return (
    <article className="nexus-panel nexus-panel-hover rounded-lg p-4 transition-colors">
      <header className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs">
          <span className={cn("mono font-semibold", from.cls)}>{from.label}</span>
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
          <span className={cn("mono font-semibold", to.cls)}>{to.label}</span>
        </div>
        <span
          className={cn(
            "mono ml-auto inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1",
            STATUS_STYLE[handoff.status],
          )}
        >
          {handoff.status}
        </span>
      </header>

      <p className="mt-2 text-sm text-foreground/90">{handoff.summary}</p>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
        <span className="mono inline-flex items-center gap-1">
          <span className="uppercase tracking-wider text-muted-foreground/60">
            token
          </span>
          <span className="rounded bg-white/5 px-1.5 py-0.5 text-cyan-300">
            {handoff.token}
          </span>
        </span>
        {handoff.budget && (
          <span className="mono inline-flex items-center gap-1">
            <Coins className="h-3 w-3" aria-hidden />
            {handoff.budget}
          </span>
        )}
        {handoff.mcp_evidence_ref && (
          <span className="mono inline-flex items-center gap-1 text-emerald-300/80">
            <ShieldCheck className="h-3 w-3" aria-hidden />
            ev:{handoff.mcp_evidence_ref}
          </span>
        )}
        <span className="mono ml-auto text-muted-foreground/60">
          {created.toLocaleString("en-GB", { hour12: false })}
        </span>
      </div>

      {handoff.artifacts.length > 0 && (
        <footer className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-white/5 pt-2">
          <Paperclip className="h-3 w-3 text-muted-foreground" aria-hidden />
          {handoff.artifacts.map((art, i) => (
            <span
              key={`${art}-${i}`}
              className="mono truncate max-w-[220px] rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-muted-foreground"
              title={art}
            >
              {art}
            </span>
          ))}
        </footer>
      )}

      <div className="mt-2 mono text-[10px] uppercase tracking-widest text-muted-foreground/40">
        id: {handoff.id}
      </div>
    </article>
  );
}
