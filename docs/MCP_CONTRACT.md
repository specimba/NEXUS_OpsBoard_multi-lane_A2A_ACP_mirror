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

## Tool inventory (22)

### Connectivity (3)

| Tool | Risk | Description |
|------|------|-------------|
| `ping` | low | Liveness probe. Returns pong + bridge version. Lowest-risk health check. |
| `echo` | low | Echoes the provided payload back. Verifies transport + serialization. |
| `registry_debug` | low | Dumps the live tool registry (names, schemas, handlers). Hash the payload to detect drift. |

### Evidence (8)

| Tool | Risk | Description |
|------|------|-------------|
| `audit_log` | low | Append an immutable audit entry. Append-only semantics. |
| `evidence_capture` | low | Capture a snapshot (DOM/text/hash) as evidence. Returns an id usable as `mcp_evidence_ref`. |
| `http_diagnostic` | medium | **PUBLIC HTTPS GET/HEAD only.** Private IPs blocked. No cookies. No auth headers. |
| `query_log` | low | Query the audit/evidence log with filters (lane, kind, time range). |
| `comparison_add` | low | Add a comparison entry (before/after, A/B) keyed by topic for regression tracking. |
| `comparison_get` | low | Retrieve a comparison entry by id or topic key. |
| `comparison_export` | low | Export a comparison set (JSON/CSV). Public-safe export of captured diffs. |
| `simulate_probe` | medium | Simulate a probe against a fixture (no live network). Dry-run evidence flows. |

### Queue (6)

| Tool | Risk | Description |
|------|------|-------------|
| `task_add` | low | Enqueue a task for the multi-lane queue. Assigns an id and open state. |
| `task_list` | low | List tasks with optional state filter (open/claimed/completed/failed). |
| `task_claim` | low | Atomically claim an open task for a lane. Sets claimed state + claimant. |
| `task_complete` | low | Mark a claimed task complete with an artifact reference. |
| `task_fail` | medium | Mark a claimed task failed with a reason. Re-enqueue policy is configurable. |
| `coordination_status` | low | Aggregate queue + lane coordination snapshot (open/claimed/failed counts per lane). |

### Session / A2A (5)

| Tool | Risk | Description |
|------|------|-------------|
| `session_heartbeat` | low | Post a heartbeat for a lane session. Keeps the session visible to `coordination_status`. |
| `session_status` | low | Return current session state for a lane (last heartbeat, tokens, active handoffs). |
| `agent_publish_message` | medium | Publish a message to an A2A topic (e.g. `nexus.a2a.handoff`). Fire-and-forget delivery. |
| `agent_retrieve_messages` | low | Retrieve messages from an A2A topic since a cursor. Pull-model inter-lane comms. |
| `agent_list_topics` | low | List known A2A topics and approximate subscriber counts. |

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
