"use client";

import { useNexusFetch } from "@/hooks/use-nexus";
import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

interface ToolsResponse {
  count: number;
  source: string;
  drift?: {
    added: string[];
    removed: string[];
    note: string;
  };
  registry_schema_hash?: string;
}

/**
 * DriftBanner — warns when pack tool inventory ≠ static contract baseline.
 * Per FABLE5 D6: "UI drift banner when pack ≠ contract."
 *
 * Shows on the MCP page when the pack has a different tool count or different
 * tool names than the static 22-tool baseline in src/lib/mcpTools.ts.
 */
export function DriftBanner() {
  const tools = useNexusFetch<ToolsResponse>("/api/mcp/tools", 30000);

  if (!tools.data || !tools.data.drift) return null;

  const { added, removed, note } = tools.data.drift;
  const hasDrift = (added?.length ?? 0) > 0 || (removed?.length ?? 0) > 0;

  if (!hasDrift) {
    return (
      <div className="nexus-panel flex items-center gap-2 rounded-lg border-emerald-500/20 bg-emerald-500/[0.04] px-4 py-2">
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" aria-hidden />
        <span className="mono text-[11px] text-emerald-300">
          No drift — pack tool inventory matches static contract baseline ({tools.data.count} tools).
        </span>
      </div>
    );
  }

  return (
    <div className="nexus-panel rounded-lg border-amber-500/30 bg-amber-500/[0.06] p-3">
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" aria-hidden />
        <div className="space-y-1.5 text-xs">
          <p className="mono font-semibold uppercase tracking-wider text-amber-300">
            Drift detected: {added.length} added, {removed.length} removed
          </p>
          <p className="text-muted-foreground">{note}</p>
          {added.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mono text-[10px] uppercase tracking-wider text-muted-foreground/60">
                added:
              </span>
              {added.map((name) => (
                <span
                  key={name}
                  className="mono rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] text-emerald-300"
                >
                  {name}
                </span>
              ))}
            </div>
          )}
          {removed.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mono text-[10px] uppercase tracking-wider text-muted-foreground/60">
                removed:
              </span>
              {removed.map((name) => (
                <span
                  key={name}
                  className="mono rounded bg-rose-500/10 px-1.5 py-0.5 text-[10px] text-rose-300"
                >
                  {name}
                </span>
              ))}
            </div>
          )}
          {tools.data.registry_schema_hash && (
            <p className="mono text-[10px] text-muted-foreground/50">
              registry_schema_hash: {tools.data.registry_schema_hash}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
