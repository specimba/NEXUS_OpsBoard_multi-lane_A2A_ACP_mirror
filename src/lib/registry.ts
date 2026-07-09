// NEXUS Lane Registry — single source of truth for lane doctrine.
// Encodes the success signals + wait policies from the NEXUS stack spec.
// UI must reflect these without implying shell/root capabilities.

import type { LaneId, LaneMeta, LaneStatus } from "./types";

/**
 * The canonical lane registry. Order matters for dashboard layout:
 * core coordinator lanes first, then specialists, then compute/collab.
 */
export const LANES: LaneMeta[] = [
  {
    id: "grok",
    label: "Grok",
    role: "MCP + synth + Drive work folder coordinator",
    successSignal: "MCP tools respond; synth artifacts land in Drive work folder",
    waitPolicy: "Coordinator — orchestrates others, does not block on chat essays",
    status: "ready",
    accent: "emerald",
  },
  {
    id: "glm52",
    label: "GLM-5.2",
    role: "This sandbox — NEXUS control-plane runtime",
    successSignal: "App compiles, boards render, STATE.md advances per milestone",
    waitPolicy: "Retries only. Model lock. No model switch / no flash fallback.",
    status: "ready",
    accent: "cyan",
  },
  {
    id: "qwen_webdev",
    label: "Qwen WebDev",
    role: "Frontend preview/code/deploy lane",
    successSignal: "Preview / Code / Deploy DOM appears (NOT a chat essay)",
    waitPolicy: "No chat-essay wait — success = preview DOM, stop waiting for prose",
    status: "preview_mode",
    accent: "violet",
  },
  {
    id: "qwen_deep",
    label: "Qwen Deep",
    role: "Deep reasoning lane",
    successSignal: "Structured reasoning output committed",
    waitPolicy: "Standard queue wait",
    status: "partial",
    accent: "violet",
  },
  {
    id: "deepseek",
    label: "DeepSeek",
    role: "Fast code / review lane",
    successSignal: "Assistant markdown grows with concrete code/review deltas",
    waitPolicy: "Fast code/review — short wait, expect deltas",
    status: "ready",
    accent: "blue",
  },
  {
    id: "mimo_claw",
    label: "MiMo Claw",
    role: "Red-team / adversarial gate",
    successSignal: "Daily 4h red-team VERDICT issued",
    waitPolicy: "Paranoid gate — do not pass lanes until verdict clears",
    status: "partial",
    accent: "rose",
  },
  {
    id: "zo",
    label: "Zo",
    role: "Ubuntu host + NEXUS agents",
    successSignal: "Resume summary produced after every pause",
    waitPolicy: "Resume summary required after pause — NOT hide-stress",
    status: "ready",
    accent: "amber",
  },
  {
    id: "gemini",
    label: "Gemini",
    role: "Canvas + Drive storage bridge",
    successSignal: "Drive package published / Canvas artifact shared",
    waitPolicy: "Storage bridge — async, poll for package",
    status: "ready",
    accent: "teal",
  },
  {
    id: "chatgpt",
    label: "ChatGPT",
    role: "Multi-lane browser truth (CDP :9224)",
    successSignal: "Browser lane responsive under CDP",
    waitPolicy: "Standard queue wait",
    status: "partial",
    accent: "green",
  },
  {
    id: "minimax",
    label: "MiniMax",
    role: "general / coder / verifier team cycles",
    successSignal: "Team cycle completes with verifier sign-off",
    waitPolicy: "Team cycles — rotate general/coder/verifier",
    status: "ready",
    accent: "orange",
  },
  {
    id: "mistral_code",
    label: "Mistral Code",
    role: "GitHub + Drive implementation coder",
    successSignal: "PR opened + Drive artifact committed",
    waitPolicy: "Implementation — wait for PR",
    status: "ready",
    accent: "indigo",
  },
  {
    id: "intern_gpu",
    label: "Intern GPU",
    role: "Shanghai A800 notebook GPU jobs",
    successSignal: "GPU job completes on A800 notebook",
    waitPolicy: "GPU jobs — long wait, poll status",
    status: "partial",
    accent: "fuchsia",
  },
  {
    id: "meta_muse",
    label: "Meta Muse",
    role: "Fast HTML examples / tricky collab",
    successSignal: "HTML example rendered + shared",
    waitPolicy: "Tricky collab — short iterative cycles",
    status: "ready",
    accent: "pink",
  },
  {
    id: "apodex",
    label: "Apodex",
    role: "Auxiliary lane (reserved)",
    successSignal: "TBD — reserved lane",
    waitPolicy: "Unknown — not yet integrated",
    status: "unknown",
    accent: "slate",
  },
];

/** Quick lookup map by lane id. */
export const LANE_MAP: Record<LaneId, LaneMeta> = LANES.reduce(
  (acc, lane) => {
    acc[lane.id] = lane;
    return acc;
  },
  {} as Record<LaneId, LaneMeta>,
);

/** Human-readable label for a lane status. */
export function statusLabel(status: LaneStatus): string {
  switch (status) {
    case "ready":
      return "READY";
    case "partial":
      return "PARTIAL";
    case "broken":
      return "BROKEN";
    case "preview_mode":
      return "PREVIEW MODE";
    case "unknown":
      return "UNKNOWN";
  }
}

/** Map accent token to a concrete Tailwind text/border/bg combo (dark ops). */
export function accentClasses(accent: string): {
  text: string;
  border: string;
  bg: string;
  dot: string;
} {
  switch (accent) {
    case "emerald":
      return {
        text: "text-emerald-400",
        border: "border-emerald-500/40",
        bg: "bg-emerald-500/10",
        dot: "bg-emerald-400",
      };
    case "cyan":
      return {
        text: "text-cyan-300",
        border: "border-cyan-500/40",
        bg: "bg-cyan-500/10",
        dot: "bg-cyan-400",
      };
    case "violet":
      return {
        text: "text-violet-300",
        border: "border-violet-500/40",
        bg: "bg-violet-500/10",
        dot: "bg-violet-400",
      };
    case "blue":
      return {
        text: "text-sky-300",
        border: "border-sky-500/40",
        bg: "bg-sky-500/10",
        dot: "bg-sky-400",
      };
    case "rose":
      return {
        text: "text-rose-300",
        border: "border-rose-500/40",
        bg: "bg-rose-500/10",
        dot: "bg-rose-400",
      };
    case "amber":
      return {
        text: "text-amber-300",
        border: "border-amber-500/40",
        bg: "bg-amber-500/10",
        dot: "bg-amber-400",
      };
    case "teal":
      return {
        text: "text-teal-300",
        border: "border-teal-500/40",
        bg: "bg-teal-500/10",
        dot: "bg-teal-400",
      };
    case "green":
      return {
        text: "text-green-300",
        border: "border-green-500/40",
        bg: "bg-green-500/10",
        dot: "bg-green-400",
      };
    case "orange":
      return {
        text: "text-orange-300",
        border: "border-orange-500/40",
        bg: "bg-orange-500/10",
        dot: "bg-orange-400",
      };
    case "indigo":
      return {
        text: "text-indigo-300",
        border: "border-indigo-500/40",
        bg: "bg-indigo-500/10",
        dot: "bg-indigo-400",
      };
    case "fuchsia":
      return {
        text: "text-fuchsia-300",
        border: "border-fuchsia-500/40",
        bg: "bg-fuchsia-500/10",
        dot: "bg-fuchsia-400",
      };
    case "pink":
      return {
        text: "text-pink-300",
        border: "border-pink-500/40",
        bg: "bg-pink-500/10",
        dot: "bg-pink-400",
      };
    case "slate":
    default:
      return {
        text: "text-slate-300",
        border: "border-slate-500/40",
        bg: "bg-slate-500/10",
        dot: "bg-slate-400",
      };
  }
}
