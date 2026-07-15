# MCP Contract — Grok MCP Bridge v2

> Source of truth for the 22 tools exposed by the Grok MCP Bridge v2 on
> `http://127.0.0.1:7354`. Mirrored in code at `src/lib/mcpTools.ts`.
> The NEXUS control-plane dashboard renders this inventory at `/mcp`.

## Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET http://127.0.0.1:7354/health` | Liveness + registry hash. Probed by `/api/mcp/health`. |
| `GET http://127.0.0.1:7354/sse`   | SSE stream for connector events. (Documented; not driven in v0.) |

> **CDP :9224 is live truth.** The bridge does **not** drive Chrome. This app is
> the operator mirror only.

## Hardening facts (non-negotiable)

- `http_diagnostic` is **public HTTPS GET/HEAD only**.
  - Private IPs are **blocked**.
  - **No cookies. No auth headers.** No credential forwarding.
- There are **no delete / shell / local-FS tools** on the bridge.
- The bridge **does not drive Chrome CDP** (`:9224`).
- Runtime may fall back to `scratch/browser_ai_mcp_runtime`.
- The control-plane's `/api/mcp/health` proxy uses a **fixed env URL** (never
  request input), does **not follow redirects**, and has a 4s timeout. It
  degrades to `STUB` with a sample payload when the bridge is unreachable.

## Tool inventory

<!-- BEGIN contract:sync (auto-generated from STATE_PACK by scripts/contract-sync.sh) -->
<!-- Source: test-sentinel-0001, generated 2026-07-14T22:00:00Z -->
<!-- Registry schema hash: 102aca727ff0b7ce -->
<!-- Tool count: 25 (was 22; drift = continuity_append, continuity_tail, cdp_window_probe) -->

| # | Tool | Group |
|---|------|-------|
| 1 | `ping` | connectivity |
| 2 | `echo` | connectivity |
| 3 | `registry_debug` | connectivity |
| 4 | `audit_log` | evidence |
| 5 | `evidence_capture` | evidence |
| 6 | `http_diagnostic` | evidence |
| 7 | `query_log` | evidence |
| 8 | `comparison_add` | evidence |
| 9 | `comparison_get` | evidence |
| 10 | `comparison_export` | evidence |
| 11 | `simulate_probe` | evidence |
| 12 | `task_add` | queue |
| 13 | `task_list` | queue |
| 14 | `task_claim` | queue |
| 15 | `task_complete` | queue |
| 16 | `task_fail` | queue |
| 17 | `coordination_status` | queue |
| 18 | `session_heartbeat` | session |
| 19 | `session_status` | session |
| 20 | `agent_publish_message` | a2a |
| 21 | `agent_retrieve_messages` | a2a |
| 22 | `agent_list_topics` | a2a |
| 23 | `continuity_append` | connectivity |
| 24 | `continuity_tail` | connectivity |
| 25 | `cdp_window_probe` | connectivity |

<!-- END contract:sync. Prose descriptions below are human-owned (not regenerated). -->

### Tool descriptions (human-owned)

#### Connectivity

| Tool | Risk | Description |
|------|------|-------------|
| `ping` | low | Liveness probe. Returns pong + bridge version. |
| `echo` | low | Echoes payload back. Verifies transport + serialization. |
| `registry_debug` | low | Dumps live tool registry. Hash to detect drift. |
| `continuity_append` | low | Append to the continuity ledger. (New in v2.4.0-p0-continuity) |
| `continuity_tail` | low | Read the continuity ledger tail. (New in v2.4.0-p0-continuity) |
| `cdp_window_probe` | low | Probe a CDP browser window. (New in v2.4.0-p0-continuity) |

#### Evidence

| Tool | Risk | Description |
|------|------|-------------|
| `audit_log` | low | Append an immutable audit entry. Append-only semantics. |
| `evidence_capture` | low | Capture a snapshot (DOM/text/hash) as evidence. |
| `http_diagnostic` | medium | **PUBLIC HTTPS GET/HEAD only.** Private IPs blocked. No cookies. |
| `query_log` | low | Query the audit/evidence log with filters. |
| `comparison_add` | low | Add a comparison entry (before/after, A/B). |
| `comparison_get` | low | Retrieve a comparison entry by id or topic. |
| `comparison_export` | low | Export a comparison set (JSON/CSV). |
| `simulate_probe` | medium | Simulate a probe against a fixture (no live network). |

#### Queue

| Tool | Risk | Description |
|------|------|-------------|
| `task_add` | low | Enqueue a task for the multi-lane queue. |
| `task_list` | low | List tasks with optional state filter. |
| `task_claim` | low | Atomically claim an open task for a lane. |
| `task_complete` | low | Mark a claimed task complete. |
| `task_fail` | medium | Mark a claimed task failed with a reason. |
| `coordination_status` | low | Aggregate queue + lane coordination snapshot. |

#### Session / A2A

| Tool | Risk | Description |
|------|------|-------------|
| `session_heartbeat` | low | Post a heartbeat for a lane session. |
| `session_status` | low | Return current session state for a lane. |
| `agent_publish_message` | medium | Publish a message to an A2A topic. |
| `agent_retrieve_messages` | low | Retrieve messages from an A2A topic since a cursor. |
| `agent_list_topics` | low | List known A2A topics and subscriber counts. |

## Denylist — capabilities NOT on the bridge

These capabilities do **not** exist on the Grok bridge and the UI must never
imply they do:

- shell / command execution
- local filesystem write/delete
- cookies / auth header forwarding
- private IP / internal network access via `http_diagnostic`
- Chrome CDP drive (the bridge does not drive `:9224`)
- model switch / provider fallback (handled by lane runtime, not bridge)

## Health states

| Status | Meaning |
|--------|---------|
| `UP`   | Bridge `/health` returned 2xx with a JSON payload. |
| `DOWN` | Bridge responded with a non-2xx status. |
| `STUB` | Bridge unreachable (sandbox / host offline). UI renders sample payload + tool inventory. |

The tool inventory at `/api/mcp/tools` is **static** and always available,
even when the bridge is `STUB`. The queue snapshot at `/api/mcp/queue` is a v0
mock; wire it to `coordination_status` when the bridge is live.

## SSRF review checklist (for DeepSeek)

- [x] `/api/mcp/health` target URL is fixed by `NEXUS_MCP_HEALTH_URL` env, not request input.
- [x] `redirect: "error"` — no redirect following.
- [x] 4s `AbortController` timeout.
- [x] No cookies/auth headers forwarded to the bridge.
- [x] Graceful `STUB` degradation — no stack traces leaked to the client.
