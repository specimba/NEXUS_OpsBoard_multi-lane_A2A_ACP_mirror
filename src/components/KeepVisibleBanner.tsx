import { Eye, MonitorDot } from "lucide-react";
import { ENV } from "@/lib/paths";

/**
 * Persistent banner reminding the operator that CDP :9224 is live truth
 * and that keep_visible_daemon must run on the Windows host.
 */
export function KeepVisibleBanner() {
  return (
    <div
      className="nexus-panel rounded-lg border-amber-500/30 bg-amber-500/[0.06] px-4 py-2.5"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
        <span className="flex items-center gap-1.5 text-amber-300">
          <Eye className="h-3.5 w-3.5" aria-hidden />
          <span className="mono font-semibold uppercase tracking-wider">
            Keep Visible
          </span>
        </span>
        <span className="text-amber-100/80">
          CDP <span className="mono text-amber-200">:{ENV.cdpPort}</span> is{" "}
          <strong className="text-amber-200">live truth</strong>. This app is the
          operator mirror.
        </span>
        <span className="hidden text-amber-100/60 sm:inline">
          Run{" "}
          <code className="mono rounded bg-amber-500/10 px-1 py-0.5 text-amber-200">
            keep_visible_daemon
          </code>{" "}
          on the Windows host · <MonitorDot className="inline h-3 w-3" aria-hidden />{" "}
          VISIBLE_LANES=1
        </span>
      </div>
    </div>
  );
}
