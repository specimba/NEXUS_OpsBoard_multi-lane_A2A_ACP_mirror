"use client";

import { useNexusFetch } from "@/hooks/use-nexus";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { Sparkles, Lock } from "lucide-react";

interface SageStatus {
  status: string;
  gated_on: string;
  message: string;
  planned_routes: string[];
  planned_model: string;
  server_time: string;
}

export default function SagePage() {
  const sage = useNexusFetch<SageStatus>("/api/sage", 60000);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="mono flex items-center gap-2 text-lg font-bold tracking-wide text-foreground sm:text-xl">
          <Sparkles className="h-5 w-5 text-violet-300" aria-hidden />
          SAGE
          <DataSourceBadge source="off" panelId="sage-status" />
        </h1>
        <p className="mono text-[11px] uppercase tracking-wider text-muted-foreground">
          synthesis · audit · governance · evidence
        </p>
      </div>

      <div className="nexus-panel rounded-lg border-violet-500/20 bg-violet-500/[0.04] p-6 text-center">
        <Lock className="mx-auto h-8 w-8 text-violet-400 mb-3" aria-hidden />
        <p className="mono text-sm font-semibold uppercase tracking-wider text-violet-300">
          RESERVED — Gated on OG-6
        </p>
        <p className="mono text-xs text-muted-foreground mt-2 max-w-md mx-auto">
          SAGE integration is reserved for a future revision. It activates when
          the operator resolves gate OG-6. Per FABLE5 D6: v2 backlog, not in
          REV 2. The current truth surfaces are{" "}
          <code className="text-violet-300">/board</code> and{" "}
          <code className="text-violet-300">/api/state</code>.
        </p>
      </div>

      {sage.data && (
        <div className="nexus-panel rounded-lg p-4 space-y-3">
          <h2 className="mono text-xs font-semibold uppercase tracking-widest text-foreground">
            Stub Response
          </h2>
          <pre className="mono max-h-64 overflow-auto nexus-scroll rounded bg-black/30 p-3 text-[10px] text-foreground/70">
{JSON.stringify(sage.data, null, 2)}
          </pre>

          <div className="space-y-2">
            <h3 className="mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Planned Routes (interface contract)
            </h3>
            <ul className="space-y-1">
              {sage.data.planned_routes.map((route, i) => (
                <li key={i} className="mono text-[11px] text-muted-foreground">
                  <code className="text-violet-300">{route}</code>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Planned Data Model
            </h3>
            <p className="mono text-[11px] text-muted-foreground">
              <code className="text-violet-300">{sage.data.planned_model}</code>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
