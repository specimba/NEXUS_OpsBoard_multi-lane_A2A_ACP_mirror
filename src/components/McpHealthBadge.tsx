"use client";

import { cn } from "@/lib/utils";
import type { McpHealth } from "@/lib/types";
import { CheckCircle2, XCircle, ServerCog } from "lucide-react";

export function McpHealthBadge({ health }: { health: McpHealth | null }) {
  if (!health) {
    return (
      <div className="nexus-panel flex items-center gap-2 rounded-lg px-4 py-3">
        <ServerCog className="h-4 w-4 animate-pulse text-muted-foreground" aria-hidden />
        <span className="mono text-xs text-muted-foreground">
          probing bridge…
        </span>
      </div>
    );
  }

  const up = health.status === "UP";
  const stub = health.status === "STUB";

  const Icon = up ? CheckCircle2 : stub ? ServerCog : XCircle;
  const color = up
    ? "text-emerald-300 border-emerald-500/40 bg-emerald-500/10"
    : stub
      ? "text-amber-300 border-amber-500/40 bg-amber-500/10"
      : "text-rose-300 border-rose-500/40 bg-rose-500/10";

  return (
    <div className={cn("nexus-panel rounded-lg border px-4 py-3", color)}>
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4" aria-hidden />
        <span className="mono text-sm font-bold uppercase tracking-widest">
          {health.status}
        </span>
        <span className="mono ml-auto text-[10px] uppercase tracking-wider opacity-70">
          Grok MCP Bridge v2
        </span>
      </div>
      <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] sm:grid-cols-3">
        <div>
          <dt className="mono uppercase tracking-wider opacity-60">url</dt>
          <dd className="mono truncate text-foreground/90">{health.url}</dd>
        </div>
        <div>
          <dt className="mono uppercase tracking-wider opacity-60">checked</dt>
          <dd className="mono text-foreground/90">
            {new Date(health.checked_at).toLocaleTimeString("en-GB", {
              hour12: false,
            })}
          </dd>
        </div>
        <div>
          <dt className="mono uppercase tracking-wider opacity-60">
            registry hash
          </dt>
          <dd className="mono text-foreground/90">
            {health.registry_hash ?? "—"}
          </dd>
        </div>
      </dl>
      {stub && health.error && (
        <p className="mt-2 mono text-[10px] text-amber-300/70">
          bridge unreachable → {health.error}. Rendering sample payload.
        </p>
      )}
      {health.payload && (
        <details className="mt-2">
          <summary className="mono cursor-pointer text-[10px] uppercase tracking-wider opacity-60 hover:opacity-100">
            raw payload
          </summary>
          <pre className="mt-1 max-h-48 overflow-auto nexus-scroll rounded bg-black/30 p-2 mono text-[10px] text-foreground/70">
            {JSON.stringify(health.payload, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}
