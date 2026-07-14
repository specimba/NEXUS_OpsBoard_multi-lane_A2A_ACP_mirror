"use client";

/**
 * DataSourceBadge — NEXUS A2A Control Plane honesty rail (NXM-038 REV 2 Step 1).
 *
 * Adapted from the nexusDASHv1 donor's data-source-badge.tsx, extended with the
 * PACK and OFF states required by the FABLE5 plan (D3 step 1):
 *   - WIRED  : connected to a live backend (real API + persistent DB)
 *   - PACK   : data sourced from the operator-published STATE_PACK (live truth
 *              via the one-way git-bus; shows staleness age)
 *   - SEED   : real DB structure, preset/seeded values (no live source yet)
 *   - MOCK   : hardcoded placeholder — NOT connected to any real source
 *   - OFF    : feature disabled in this mode (e.g. Browserless in sandbox)
 *
 * Every badge carries a `panelId` so the badge-tally grep gate (G2) can verify
 * every panel is badged and the manifest matches. No panel may render without
 * one (D-005: no fabricated data presented as real).
 *
 * Per FABLE5 D-005: the badge is the operator's trust foundation. A panel that
 * shows data without a badge is a D-005 violation.
 */

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Database,
  Wifi,
  FlaskConical,
  FileText,
  Package,
  Power,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type DataSourceState =
  | "wired"
  | "pack"
  | "seed"
  | "mock"
  | "off";

interface DataSourceBadgeProps {
  /** Which honesty state this panel's data is in. */
  source: DataSourceState | string;
  /** Required: the panel this badge belongs to (for the manifest grep gate). */
  panelId: string;
  /** Optional override label (defaults to the state's canonical label). */
  label?: string;
  /** For PACK state: age of the pack in human-readable form (e.g. "2h"). */
  packAge?: string;
  /** Show the icon (default true). */
  showIcon?: boolean;
  className?: string;
}

const SOURCE_CONFIG: Record<
  DataSourceState,
  {
    icon: React.ElementType;
    label: string;
    className: string;
    tooltip: string;
  }
> = {
  wired: {
    icon: Wifi,
    label: "WIRED",
    className:
      "bg-emerald-600/15 text-emerald-400 border-emerald-600/20",
    tooltip:
      "Data fetched from a live backend API with persistent storage. Real-time or near-real-time.",
  },
  pack: {
    icon: Package,
    label: "PACK",
    className: "bg-cyan-600/15 text-cyan-300 border-cyan-600/20",
    tooltip:
      "Data sourced from the operator-published STATE_PACK via the one-way git-bus. Live host truth, refreshed on pull.",
  },
  seed: {
    icon: Database,
    label: "SEED",
    className: "bg-blue-600/15 text-blue-400 border-blue-600/20",
    tooltip:
      "Real DB structure with preset/seeded values. No live source connected yet. Editable but not authoritative.",
  },
  mock: {
    icon: FileText,
    label: "MOCK",
    className: "bg-orange-600/15 text-orange-400 border-orange-600/20",
    tooltip:
      "Hardcoded placeholder. NOT connected to any real data source. For visual layout only.",
  },
  off: {
    icon: Power,
    label: "OFF",
    className: "bg-slate-600/15 text-slate-400 border-slate-600/20",
    tooltip:
      "Feature disabled in this mode. Renders nothing or a stub. No data shown.",
  },
};

export function DataSourceBadge({
  source,
  panelId,
  label,
  packAge,
  showIcon = true,
  className = "",
}: DataSourceBadgeProps) {
  const config =
    SOURCE_CONFIG[source as DataSourceState] ?? SOURCE_CONFIG.mock;
  const Icon = config.icon;
  const displayLabel = label ?? config.label;
  const fullLabel =
    source === "pack" && packAge ? `${displayLabel} · ${packAge}` : displayLabel;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            data-panel-id={panelId}
            data-source-state={source}
            variant="outline"
            className={cn(
              "text-[8px] px-1.5 py-0 font-bold tracking-wider gap-1 cursor-help",
              config.className,
              className,
            )}
          >
            {showIcon && <Icon className="h-2.5 w-2.5" aria-hidden />}
            {fullLabel}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-xs">
          <p className="font-medium mono uppercase tracking-wider">
            {config.label} · {panelId}
          </p>
          <p className="text-muted-foreground mt-0.5">{config.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
