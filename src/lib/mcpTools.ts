// NEXUS Grok MCP Bridge v2 — Tool inventory (22 tools, real names).
// Source of truth for docs/MCP_CONTRACT.md and the MCP dashboard page.
//
// HARDENING FACTS (must never be contradicted by the UI):
//  - http_diagnostic is PUBLIC HTTPS GET/HEAD only; private IPs blocked; no cookies/auth headers.
//  - No delete / shell / local-FS tools exist on the Grok bridge.
//  - Runtime may fall back to scratch/browser_ai_mcp_runtime.

import type { McpToolInfo } from "./types";

export const MCP_TOOLS: McpToolInfo[] = [
  // --- Connectivity (3) ---
  {
    name: "ping",
    group: "connectivity",
    description: "Liveness probe. Returns pong + bridge version. Lowest-risk health check.",
    risk: "low",
  },
  {
    name: "echo",
    group: "connectivity",
    description: "Echoes the provided payload back. Used to verify transport + serialization.",
    risk: "low",
  },
  {
    name: "registry_debug",
    group: "connectivity",
    description: "Dumps the live tool registry (names, schemas, handlers). Hash the payload to detect drift.",
    risk: "low",
  },

  // --- Evidence (8) ---
  {
    name: "audit_log",
    group: "evidence",
    description: "Append an immutable audit entry. Read-only callers cannot mutate; append-only semantics.",
    risk: "low",
  },
  {
    name: "evidence_capture",
    group: "evidence",
    description: "Capture a snapshot (DOM/text/hash) as evidence. Returns an id usable as mcp_evidence_ref.",
    risk: "low",
  },
  {
    name: "http_diagnostic",
    group: "evidence",
    description:
      "PUBLIC HTTPS GET/HEAD only. Private IPs blocked. No cookies. No auth headers. Used to fetch public probe targets.",
    risk: "medium",
  },
  {
    name: "query_log",
    group: "evidence",
    description: "Query the audit/evidence log with filters (lane, kind, time range).",
    risk: "low",
  },
  {
    name: "comparison_add",
    group: "evidence",
    description: "Add a comparison entry (before/after, A/B) keyed by topic for regression tracking.",
    risk: "low",
  },
  {
    name: "comparison_get",
    group: "evidence",
    description: "Retrieve a comparison entry by id or topic key.",
    risk: "low",
  },
  {
    name: "comparison_export",
    group: "evidence",
    description: "Export a comparison set (JSON/CSV). Public-safe export of captured diffs.",
    risk: "low",
  },
  {
    name: "simulate_probe",
    group: "evidence",
    description: "Simulate a probe against a fixture (no live network). Used to dry-run evidence flows.",
    risk: "medium",
  },

  // --- Queue (6) ---
  {
    name: "task_add",
    group: "queue",
    description: "Enqueue a task for the multi-lane queue. Assigns an id and open state.",
    risk: "low",
  },
  {
    name: "task_list",
    group: "queue",
    description: "List tasks with optional state filter (open/claimed/completed/failed).",
    risk: "low",
  },
  {
    name: "task_claim",
    group: "queue",
    description: "Atomically claim an open task for a lane. Sets claimed state + claimant.",
    risk: "low",
  },
  {
    name: "task_complete",
    group: "queue",
    description: "Mark a claimed task complete with an artifact reference.",
    risk: "low",
  },
  {
    name: "task_fail",
    group: "queue",
    description: "Mark a claimed task failed with a reason. Re-enqueue policy is configurable.",
    risk: "medium",
  },
  {
    name: "coordination_status",
    group: "queue",
    description: "Aggregate queue + lane coordination snapshot (open/claimed/failed counts per lane).",
    risk: "low",
  },

  // --- Session / A2A (5) ---
  {
    name: "session_heartbeat",
    group: "session",
    description: "Post a heartbeat for a lane session. Keeps the session visible to coordination_status.",
    risk: "low",
  },
  {
    name: "session_status",
    group: "session",
    description: "Return current session state for a lane (last heartbeat, tokens, active handoffs).",
    risk: "low",
  },
  {
    name: "agent_publish_message",
    group: "a2a",
    description: "Publish a message to an A2A topic (e.g. nexus.a2a.handoff). Fire-and-forget delivery.",
    risk: "medium",
  },
  {
    name: "agent_retrieve_messages",
    group: "a2a",
    description: "Retrieve messages from an A2A topic since a cursor. Pull-model inter-lane comms.",
    risk: "low",
  },
  {
    name: "agent_list_topics",
    group: "a2a",
    description: "List known A2A topics and approximate subscriber counts.",
    risk: "low",
  },
];

/** Denylist — capabilities explicitly NOT present on the Grok bridge. */
export const MCP_DENYLIST: string[] = [
  "shell / command execution",
  "local filesystem write/delete",
  "cookies / auth header forwarding",
  "private IP / internal network access via http_diagnostic",
  "Chrome CDP drive (the bridge does not drive :9224)",
  "model switch / provider fallback (handled by lane runtime, not bridge)",
];

/** Count tools by group (for the MCP dashboard summary). */
export function toolCountsByGroup(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const t of MCP_TOOLS) {
    counts[t.group] = (counts[t.group] ?? 0) + 1;
  }
  return counts;
}

/** Total tool count (sanity = 22). */
export const MCP_TOOL_COUNT = MCP_TOOLS.length;
