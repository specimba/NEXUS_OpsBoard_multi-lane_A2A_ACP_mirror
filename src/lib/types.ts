// NEXUS A2A Control Plane — Core domain types
// These types encode the reality of the multi-lane A2A stack and the Grok MCP bridge.

/** Every lane (agent) known to the NEXUS control plane. */
export type LaneId =
  | "grok"
  | "chatgpt"
  | "gemini"
  | "qwen_webdev"
  | "qwen_deep"
  | "deepseek"
  | "glm52"
  | "zo"
  | "mimo_claw"
  | "minimax"
  | "mistral_code"
  | "intern_gpu"
  | "meta_muse"
  | "apodex";

/** Operational status of a lane. `preview_mode` is specific to qwen_webdev. */
export type LaneStatus =
  | "ready"
  | "partial"
  | "broken"
  | "unknown"
  | "preview_mode";

/** Lifecycle of a handoff card moving between two lanes. */
export type HandoffStatus = "open" | "accepted" | "blocked" | "done";

/** A token passed from one lane to another, with optional MCP evidence. */
export interface HandoffCard {
  id: string;
  from: LaneId;
  to: LaneId;
  /** Short opaque token identifying the handoff context. */
  token: string;
  /** Human-readable summary of what is being handed off. */
  summary: string;
  /** Artifact references (URLs, paths, doc ids). */
  artifacts: string[];
  status: HandoffStatus;
  created_at: string;
  /** evidence_capture id/hash from the MCP bridge, if captured. */
  mcp_evidence_ref?: string;
  /** Optional budget/credit annotation. */
  budget?: string;
}

/** A row in the continuity ledger (NEXUScontinuity_runs.jsonl). */
export type LedgerRow = Record<string, unknown> & {
  ts?: string;
  kind?: string;
  lane?: string;
  status?: string;
  cycle?: string;
};

/** Operational metadata describing a lane's role + wait policy. */
export interface LaneMeta {
  id: LaneId;
  label: string;
  /** What this lane is responsible for in the mesh. */
  role: string;
  /** The signal that indicates success for this lane. */
  successSignal: string;
  /** How other lanes should wait on this lane. */
  waitPolicy: string;
  /** Default/known status for the dashboard. */
  status: LaneStatus;
  /** Accent color token for the lane (Tailwind class fragment). */
  accent: string;
}

/** Grouping for the 22 Grok MCP tools. */
export type McpToolGroup =
  | "connectivity"
  | "evidence"
  | "queue"
  | "session"
  | "a2a";

/** Risk classification used by the MCP contract / denylist review. */
export type McpToolRisk = "low" | "medium" | "high";

/** Static description of a Grok MCP bridge tool. */
export interface McpToolInfo {
  name: string;
  group: McpToolGroup;
  description: string;
  risk: McpToolRisk;
}

/** Health probe result for the MCP bridge. */
export interface McpHealth {
  status: "UP" | "DOWN" | "STUB";
  url: string;
  checked_at: string;
  /** Raw payload from /health if available. */
  payload?: Record<string, unknown>;
  /** Last registry_debug hash, if known. */
  registry_hash?: string;
  /** Error message when status is DOWN/STUB. */
  error?: string;
}

/** Snapshot of the task queue the MCP bridge exposes. */
export interface McpQueueSnapshot {
  open: number;
  claimed: number;
  completed: number;
  failed: number;
  /** Recent task items (mocked in v0). */
  items: McpQueueItem[];
}

export interface McpQueueItem {
  id: string;
  lane?: LaneId | string;
  title: string;
  state: "open" | "claimed" | "completed" | "failed";
  created_at: string;
}
