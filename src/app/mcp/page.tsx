"use client";

import { useNexusFetch } from "@/hooks/use-nexus";
import { McpHealthBadge } from "@/components/McpHealthBadge";
import { McpToolTable } from "@/components/McpToolTable";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { DriftBanner } from "@/components/DriftBanner";
import type { McpHealth, McpToolInfo, McpQueueSnapshot } from "@/lib/types";
import { Wrench, ListChecks, Radio } from "lucide-react";
import { cn } from "@/lib/utils";
import { ENV } from "@/lib/paths";

interface ToolsResponse {
  count: number;
  groups: Record<string, number>;
  tools: McpToolInfo[];
  denylist: string[];
}

interface QueueResponse extends McpQueueSnapshot {
  note?: string;
  server_time: string;
}

function QueueCard({ queue }: { queue: QueueResponse | null }) {
  const cells: { label: string; value: number; cls: string }[] = [
    { label: "open", value: queue?.open ?? 0, cls: "text-sky-300" },
    { label: "claimed", value: queue?.claimed ?? 0, cls: "text-amber-300" },
    { label: "completed", value: queue?.completed ?? 0, cls: "text-emerald-300" },
    { label: "failed", value: queue?.failed ?? 0, cls: "text-rose-300" },
  ];

  return (
    <div className="nexus-panel rounded-lg overflow-hidden">
      <header className="flex items-center justify-between border-b border-white/5 px-4 py-2.5">
        <h2 className="mono flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-foreground">
          <ListChecks className="h-3.5 w-3.5 text-cyan-300" aria-hidden />
          Queue Snapshot
        </h2>
        <span className="mono text-[10px] uppercase tracking-wider text-muted-foreground/60">
          coordination_status (mock v0)
        </span>
      </header>
      <div className="grid grid-cols-4 divide-x divide-white/5 border-b border-white/5">
        {cells.map((c) => (
          <div key={c.label} className="px-3 py-2.5 text-center">
            <div className={cn("mono text-xl font-bold tabular-nums", c.cls)}>
              {c.value}
            </div>
            <div className="mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {c.label}
            </div>
          </div>
        ))}
      </div>
      <ul className="max-h-64 divide-y divide-white/5 overflow-y-auto nexus-scroll">
        {(queue?.items ?? []).map((item) => (
          <li
            key={item.id}
            className="flex items-center gap-3 px-4 py-2 text-xs hover:bg-white/[0.02]"
          >
            <span className="mono shrink-0 text-[10px] text-muted-foreground/60">
              {item.id}
            </span>
            <span className="min-w-0 flex-1 truncate text-foreground/80">
              {item.title}
            </span>
            {item.lane && (
              <span className="mono shrink-0 text-[10px] text-muted-foreground">
                {item.lane}
              </span>
            )}
            <span
              className={cn(
                "mono shrink-0 rounded px-1.5 py-0.5 text-[10px] uppercase tracking-wider",
                item.state === "open" && "bg-sky-500/10 text-sky-300",
                item.state === "claimed" && "bg-amber-500/10 text-amber-300",
                item.state === "completed" && "bg-emerald-500/10 text-emerald-300",
                item.state === "failed" && "bg-rose-500/10 text-rose-300",
              )}
            >
              {item.state}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function McpPage() {
  const health = useNexusFetch<McpHealth>("/api/mcp/health", 10000);
  const tools = useNexusFetch<ToolsResponse>("/api/mcp/tools", 60000);
  const queue = useNexusFetch<QueueResponse>("/api/mcp/queue", 10000);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="mono flex items-center gap-2 text-lg font-bold tracking-wide text-foreground sm:text-xl">
            <Wrench className="h-5 w-5 text-cyan-300" aria-hidden />
            MCP Control Panel
          </h1>
          <p className="mono text-[11px] uppercase tracking-wider text-muted-foreground">
            Grok MCP Bridge v2 · 22 tools · SSE connector
          </p>
        </div>
        <div className="mono flex items-center gap-2 text-[10px] text-muted-foreground">
          <Radio className="h-3 w-3" aria-hidden />
          sse: {ENV.mcpSseUrl.replace(/^https?:\/\//, "")}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <McpHealthBadge health={health.data} />
        <DataSourceBadge source="wired" panelId="mcp-health-badge" />
      </div>

      {health.error && (
        <p className="mono text-[10px] text-rose-300/70">
          health probe error: {health.error}
        </p>
      )}

      <DriftBanner />

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <DataSourceBadge source="mock" panelId="mcp-queue" />
        </div>
        <QueueCard queue={queue.data} />
      </div>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="mono text-xs font-semibold uppercase tracking-widest text-foreground">
              Tool Inventory
            </h2>
            <DataSourceBadge source="seed" panelId="mcp-tool-table" />
          </div>
          <span className="mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {tools.data?.count ?? "—"} tools · static (always available)
          </span>
        </div>
        {tools.data ? (
          <McpToolTable tools={tools.data.tools} denylist={tools.data.denylist} />
        ) : (
          <div className="nexus-panel rounded-lg p-6 text-center text-xs text-muted-foreground">
            loading tool inventory…
          </div>
        )}
      </section>

      {/* SSE note (Milestone E stretch) */}
      <section className="nexus-panel rounded-lg border-cyan-500/20 bg-cyan-500/[0.04] p-4">
        <h2 className="mono flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-cyan-300">
          <Radio className="h-3.5 w-3.5" aria-hidden />
          SSE Connector — documented, not driven in v0
        </h2>
        <div className="mt-2 space-y-1.5 text-xs text-muted-foreground">
          <p>
            The Grok MCP Bridge v2 exposes an SSE stream at{" "}
            <code className="mono rounded bg-white/5 px-1.5 py-0.5 text-cyan-200">
              {ENV.mcpSseUrl}
            </code>{" "}
            for connector events. This control plane is the{" "}
            <strong className="text-foreground/90">operator mirror</strong> — it
            does not drive the bridge or consume the stream directly.
          </p>
          <p>
            To wire live SSE: subscribe to the stream from a mini-service and
            forward events to{" "}
            <code className="mono rounded bg-white/5 px-1.5 py-0.5 text-cyan-200">
              agent_publish_message
            </code>{" "}
            topic{" "}
            <code className="mono rounded bg-white/5 px-1.5 py-0.5 text-cyan-200">
              nexus.a2a.handoff
            </code>
            . See <code className="mono text-cyan-200">docs/MCP_CONTRACT.md</code>{" "}
            for the full connector contract.
          </p>
          <p className="mono text-[10px] uppercase tracking-wider text-muted-foreground/60">
            cdp :9224 is live truth · keep_visible_daemon on Windows host
          </p>
        </div>
      </section>
    </div>
  );
}
