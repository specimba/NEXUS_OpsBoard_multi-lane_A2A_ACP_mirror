import { Info, Eye } from "lucide-react";

/**
 * Helper note for the qwen_webdev lane: success = Preview DOM, not a chat essay.
 * Do not wait for prose output from this lane.
 */
export function QwenWebDevNote({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <p className="flex items-center gap-1.5 text-[11px] text-violet-300/80">
        <Eye className="h-3 w-3 shrink-0" aria-hidden />
        <span>
          success = <strong className="text-violet-200">Preview</strong> DOM,
          not chat essay
        </span>
      </p>
    );
  }

  return (
    <div className="nexus-panel rounded-md border-violet-500/30 bg-violet-500/[0.06] p-3">
      <div className="flex items-start gap-2">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" aria-hidden />
        <div className="space-y-1 text-xs text-violet-100/80">
          <p className="font-semibold text-violet-200">
            Qwen WebDev lane doctrine
          </p>
          <p>
            Success signal is the{" "}
            <strong className="text-violet-200">Preview / Code / Deploy DOM</strong>{" "}
            appearing — <strong>not</strong> a chat essay. Stop waiting for prose
            output from this lane.
          </p>
          <p className="text-violet-300/60">
            No chat-essay wait policy. Treat preview DOM presence as completion.
          </p>
        </div>
      </div>
    </div>
  );
}
