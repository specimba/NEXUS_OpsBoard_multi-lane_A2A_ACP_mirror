"use client";

import { useMemo } from "react";
import type { HandoffCard as HandoffCardType, LedgerRow } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Link2 } from "lucide-react";
import { DataSourceBadge } from "@/components/DataSourceBadge";

interface HandoffLedgerLinkProps {
  handoffs: HandoffCardType[];
  ledgerRows: LedgerRow[] | null;
}

/**
 * HandoffLedgerLink — D7 v2: "handoff↔ledger cross-linking (frontend join)".
 * Joins HandoffCard.token with LedgerRow fields that reference the same token
 * or the same lane pair (from→to). Shows which handoffs have ledger evidence
 * and which don't.
 */
export function HandoffLedgerLink({ handoffs, ledgerRows }: HandoffLedgerLinkProps) {
  const links = useMemo(() => {
    if (!ledgerRows || ledgerRows.length === 0) return [];

    return handoffs.map((h) => {
      // Find ledger rows that reference this handoff's token
      const tokenMatches = ledgerRows.filter((r) => {
        const summary = (r.summary as string) ?? "";
        const note = (r.note as string) ?? "";
        const task = (r.task as string) ?? "";
        return summary.includes(h.token) || note.includes(h.token) || task.includes(h.token);
      });

      // Also find ledger rows with kind=handoff involving the same lanes
      const laneMatches = ledgerRows.filter((r) => {
        if (r.kind !== "handoff") return false;
        const from = (r.from as string) ?? "";
        const to = (r.to as string) ?? "";
        return (from === h.from && to === h.to) || (from === h.to && to === h.from);
      });

      const allMatches = [...tokenMatches, ...laneMatches];
      const uniqueMatches = allMatches.filter(
        (r, i, self) => i === self.findIndex((s) => s.ts === r.ts && r.kind === s.kind),
      );

      return {
        handoffId: h.id,
        token: h.token,
        from: h.from,
        to: h.to,
        status: h.status,
        ledgerMatches: uniqueMatches.length,
        matchTs: uniqueMatches[0]?.ts ?? uniqueMatches[0]?.timestamp ?? null,
        matchKind: uniqueMatches[0]?.kind ?? null,
      };
    });
  }, [handoffs, ledgerRows]);

  if (links.length === 0) return null;

  const linked = links.filter((l) => l.ledgerMatches > 0).length;
  const unlinked = links.length - linked;

  return (
    <div className="nexus-panel rounded-lg p-3">
      <div className="flex items-center gap-2 mb-2">
        <Link2 className="h-3.5 w-3.5 text-cyan-300" aria-hidden />
        <h3 className="mono text-xs font-semibold uppercase tracking-widest text-foreground">
          Handoff ↔ Ledger Cross-Link
        </h3>
        <DataSourceBadge source="wired" panelId="handoff-ledger-crosslink" />
        <span className="mono text-[10px] text-muted-foreground ml-auto">
          {linked} linked · {unlinked} unlinked
        </span>
      </div>
      <ul className="space-y-1">
        {links.map((link) => (
          <li
            key={link.handoffId}
            className="flex items-center gap-2 text-[11px] py-0.5"
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full shrink-0",
                link.ledgerMatches > 0 ? "bg-emerald-400" : "bg-slate-500",
              )}
              aria-hidden
            />
            <code className="mono text-cyan-300/70 shrink-0">{link.token}</code>
            <span className="mono text-muted-foreground shrink-0">
              {link.from}→{link.to}
            </span>
            {link.ledgerMatches > 0 ? (
              <span className="mono text-emerald-300/70 text-[10px]">
                {link.ledgerMatches} ledger {link.ledgerMatches === 1 ? "row" : "rows"}
                {link.matchKind && ` · ${link.matchKind}`}
                {link.matchTs && ` · ${new Date(link.matchTs).toLocaleTimeString("en-GB", { hour12: false })}`}
              </span>
            ) : (
              <span className="mono text-slate-500 text-[10px]">no ledger evidence</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
