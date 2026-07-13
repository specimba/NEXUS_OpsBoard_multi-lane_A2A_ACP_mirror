# NEXUS A2A Control Plane — Deep Synthesis & New Ops Board Design

> **Primary deliverable.** Synthesis of 5 expert-role sub-agent analyses (ARCH-1,
> DATA-1, UX-1, INT-1, REL-1) of the 3-part dashboard backup ZIP. Grounded in
> 198 extracted source files + 3 uploaded coordination logs + prior SAGE work.
> This is a multi-session, long-run plan.

## 1. The 3-part dashboard's conceptual structure

### 1.1 What the ZIP actually contained

The 140MB "workspace-f7bb8749" ZIP was **three concatenated ZIP archives**:

| ZIP | Entries | Size | Content |
|-----|---------|------|---------|
| **#1** | 101 files | 104MB | **The main NEXUS OS source** — Prisma schema, 9 tab components, 14 API routes, `nexus_os/` Python backend (67 modules), mini-services, hooks, stores, lib |
| **#2** | 97 files | 11MB | **Fusion-pack docs + additional components** — `NEXUS_FUSION_PACK.md`, `API_CONTRACTS.md`, `WIRED_VS_MOCKED.json`, rate-limit-tab, tokens-tab, ai-assistant, command-palette, diagnostics-panel, + more API routes |
| **#3** | 15 files | 26MB | **GLM5 fusion pack** — 6 markdown docs + 7 screenshots (the audit/handoff pack) |

The first extraction only got ZIP #3 (15 files) because the EOCD search found
the last one. Splitting at the three EOCD boundaries revealed the full source.

### 1.2 Where fusion belongs

Fusion is a **documentation/audit layer**, not a code layer and not a parallel
implementation. It exists in two forms:

- **In-source fusion-pack** (ZIP #2, `fusion-pack/`): the canonical structured
  assessment — `NEXUS_FUSION_PACK.md` (intake checklist, UI structure, wired-vs-
  mocked map), `API_CONTRACTS.md` (full request/response schemas for 17 routes),
  `WIRED_VS_MOCKED.json` (machine-readable status map). This is the developer's
  own due-diligence audit of their codebase.

- **GLM5 fusion pack** (ZIP #3, `glm5-fusion/`): the team-published snapshot for
  handoff/review — `PACK_MANIFEST.md`, `SCREEN_STRENGTHS.md`,
  `FUSION_RECOMMENDATIONS.md`, + 7 PNG screenshots. This is the same v3.1
  dashboard state documented from a different angle.

**Role:** Fusion maps every UI component to its backend contract and identifies
the biggest gap (Overview tab ignores `/api/system` — entirely simulated). It is
the metadata that should drive the next milestone: wiring the dashboard to the
Python governance API.

### 1.3 The system topology (grounded from source)

```
┌─────────────────────────────────────────────────────────┐
│  Caddy :81 (reverse proxy, XTransformPort routing)       │
│  ├── / → :3000 (Next.js dashboard)                       │
│  ├── /?XTransformPort=3003 → :3003 (Swarm WS)            │
│  └── /?XTransformPort=7352 → :7352 (Python bridge)       │
├─────────────────────────────────────────────────────────┤
│  Next.js :3000                                            │
│  ├── 9 tab components (src/components/nexus/tabs/)       │
│  ├── 19 API routes (src/app/api/)                        │
│  ├── Prisma → SQLite (12 models)                         │
│  ├── z-ai-web-dev-sdk (LLM: StressLab, GMR, AI Assistant)│
│  ├── ai-provider-bridge.ts (8 routes, ZAI→OpenRouter)    │
│  ├── rate-limiter.ts + api-cache.ts + api-key-manager.ts │
│  └── Zustand store (nexus-store.ts)                      │
├─────────────────────────────────────────────────────────┤
│  Swarm WS :3003 (mini-services/swarm-ws/)                │
│  └── 5 channels — ALL FABRICATED (random from hardcoded) │
├─────────────────────────────────────────────────────────┤
│  Python Bridge :7352 (nexus_os/bridge/server.py)         │
│  ├── JSON-RPC 2.0 (5 methods: 2 stubs, 1 hardcoded,      │
│  │   2 functional-but-volatile)                          │
│  ├── HMAC-SHA256 auth (SecretStore)                      │
│  ├── KAIJU 4-var authz (governor.check_access)           │
│  ├── TokenGuard budget enforcement                       │
│  └── ⚠️ NOT WIRED to dashboard — dashboard bypasses it   │
├─────────────────────────────────────────────────────────┤
│  Python nexus_os/ (67 modules, 9 packages)               │
│  ├── bridge/ (server, sdk, secrets, mcpaauth)            │
│  ├── engine/ (executor, router, hermes, forge, skillsmith)│
│  ├── governor/ (trust_engine_v2, compliance, kaiju_auth) │
│  ├── vault/ (manager, memory, poisoning, decay_worker)   │
│  ├── gmr/ (rotator, circuit_breaker, scheduler)          │
│  ├── swarm/ (foreman, worker, auction)                   │
│  ├── monitoring/ (token_guard, strategies)               │
│  └── observability/ (tracing)                            │
│  ⚠️ CANONICAL per SOUL.md but UNWIRED to dashboard       │
└─────────────────────────────────────────────────────────┘
```

### 1.4 The critical architectural split

**The Next.js dashboard does NOT call the Python governance API.** It calls
Prisma/SQLite directly via `/api/*` route handlers. The Python `nexus_os/`
package exists in parallel as the canonical governance brain (per `SOUL.md`) but
is **unwired** — listed as P0 blocker #2 in `01_PROJECT_STATE.md`.

This means there are effectively:
- **TWO governance implementations**: TypeScript `/api/governor/route.ts` + Python `nexus_os/governor/`
- **TWO SQLite stores**: Prisma-managed (12 models) + Python-managed (DatabaseManager v3)
- **THREE trust systems**: Python `trust_engine_v2.py` (logistic+CDR), Python `trust_scoring.py` (Beta-Binomial), TypeScript `/api/trust-engine` (local heuristic)
- **THREE circuit breakers**: `AdaptiveCircuitBreaker` (3-state, dead code), inline `CircuitBreaker` (2-state, also dead), client `CircuitBreaker` in `sdk.py` (3-state, only one used)
- **TWO vault designs**: Python UNIQUE-upsert (current-state cache) vs Prisma append-only (log semantics) — neither implements hash chaining

All four traced user actions (spawn worker, run stress test, adjust governor threshold, fetch paper) **bypass the Python backend entirely**. TypeScript → Prisma → ZAI SDK only.

## 2. New ops board pack design — adapted from the old dashboards

### 2.1 Design principle: evolve, don't invent

The new ops board is **not a new invention**. It is the existing NEXUS OS
dashboard with its gaps fixed, its Python backend wired, and its mock surfaces
replaced with real data. The old dashboard's 16 strengths are preserved; its
29+ gaps are systematically closed.

### 2.2 What to preserve (16 strengths from the old dashboard)

1. ⌘K command palette (cmdk-based, 16 commands)
2. 1-8 number shortcuts for tab navigation (no modifier)
3. ⌘L system logs slide-up panel
4. ⌘E export dialog (CSV/JSON with column mapping) on every tab
5. Per-status color coding (emerald=healthy, yellow=warning, red=error)
6. AnimatedCounter + LiveActivityFeed patterns
7. Per-track color coding in vault (5 distinct color systems)
8. Toast notifications (sonner) for action feedback
9. Worker card status styling (busy=emerald gradient, error=red pulse-border)
10. Decision Timeline horizontal visualization
11. DiagnosticsPanel sequential step execution + latency display
12. Mobile-responsive Sheet sidebar
13. Pillar detail dialog with sparkline history
14. Trust threshold sliders with real-time affected-agent warnings
15. 5-track vault color theming (bgColor + textColor + borderColor + headerGradient)
16. Filter + search combination pattern (vault tab)

### 2.3 What to fix (the 12 highest-priority gaps)

| # | Gap | Fix | Agent finding |
|---|-----|-----|---------------|
| 1 | Overview tab 100% fake | Wire to `/api/system` (already computes real data) | UX-1, DATA-1 |
| 2 | No data source badges in UI | Add `DataSourceBadge` component — green=WIRED, yellow=WIRED+MOCK, red=SIMULATED | UX-1 |
| 3 | Python backend unwired | Wire `/api/*` routes to Python bridge on :7352 via `NexusClient` | ARCH-1, DATA-1 |
| 4 | 3 parallel trust systems | Consolidate to `TrustEngineV2` as canonical; expose via bridge | DATA-1, REL-1 |
| 5 | 3 parallel circuit breakers | Delete inline; wire `AdaptiveCircuitBreaker` (add thread-safe Lock); add `circuit_breaker_state` to ModelEntry | INT-1, REL-1 |
| 6 | Vault chain is fake | Add `prev_hash`/`entry_hash`/`signature` to VaultEntry; implement real SHA-256 chain | DATA-1, REL-1 |
| 7 | Token budget undercounts | All LLM routes (`/api/ai-bridge`, `/api/chat`, `/api/stresslab`) MUST call `TokenGuard.check_and_reserve` pre-call and `.track` post-call | DATA-1, INT-1 |
| 8 | System logs fabricated | Replace 20 hardcoded templates with real `/api/logs` endpoint backed by `system_logs` table | REL-1 |
| 9 | WebSocket events fabricated | Connect `swarm-ws` to real Prisma Agent reads + Python Foreman events | INT-1, REL-1 |
| 10 | 7/12 keyboard shortcuts don't work | Wire ⌘B, ⌘D, ⌘N, R, S, /, P | UX-1 |
| 11 | No real alerting | Add `Alert` Prisma model + `/api/alerts` route; replace notification-center hardcoded data | REL-1 |
| 12 | No incident response | Add `Incident` model + "Declare Incident" button + runbook library | REL-1 |

### 2.4 The 9 missing Prisma models (from DATA-1)

| Model | Purpose | Priority |
|-------|---------|----------|
| `TrustHistory` | Time-series trust score per agent per lane | P0 |
| `ActivityFeed` | Cross-cutting unified timeline (replaces fake activity feed) | P0 |
| `Alert` | Real alerting (severity, source, status, trace_id) | P0 |
| `Incident` | Incident response (SEV1-4, timeline, root cause, action items) | P1 |
| `RotationEvent` | GMR model rotation events (replaces hardcoded) | P1 |
| `FailoverEvent` | Circuit breaker state transitions (replaces hardcoded) | P1 |
| `SageInsight` | SAGE analysis results (active/dismissed/promoted) | P1 |
| `ChatMessage` | AI assistant conversation persistence | P2 |
| `ConstitutionAudit` | Audit trail for SystemConfig changes | P2 |

### 2.5 The layered pack design (MVP → v2 → v3)

```
Layer 0 (EXISTS):     My Ops Board + MCP mirror + Browserless + SAGE gateway
                      + extracted NEXUS OS source (dashboard-pack/nexus-os-source/)

Layer 1 (MVP):        Port the 6 strongest real tabs from NEXUS OS into this repo:
                      Vault, Swarm, Governor, GMR, StressLab, Research.
                      Add the 12-model Prisma schema. Add DataSourceBadge.
                      Wire Python bridge as optional (STUB fallback).
                      Fix the 12 highest-priority gaps.

Layer 2 (v2):         Wire Python backend for real (bridge :7352).
                      Consolidate trust → TrustEngineV2.
                      Consolidate circuit breaker → AdaptiveCircuitBreaker.
                      Real vault hash chain.
                      Real token budget enforcement.
                      Real system logs + real WebSocket events.
                      Real alerting pipeline.

Layer 3 (v3):         SAGE integration (10th tab + SageInsight model + /api/sage).
                      Incident response workflow (Incident model + runbooks).
                      SLO + error budget framework.
                      Time-series metrics + /metrics endpoint.
                      Automated remediation hooks.
                      Postmortem templates.
                      Status page.
```

### 2.6 New ops board layout

```
┌─ Sidebar (left, collapsible w-56/w-16) ──────────────────────┐
│  [1] Overview    [6] Vault                                    │
│  [2] StressLab   [7] Research                                 │
│  [3] GMR         [8] Swarm                                    │
│  [4] Governor    [9] Tokens                                   │
│  [5] Rate Limit  [10] SAGE (coming soon)                      │
│  ───────────                                                 │
│  [⌘K] Command Palette                                        │
│  [⌘L] System Logs                                            │
└───────────────────────────────────────────────────────────────┘
┌─ Header ──────────────────────────────────────────────────────┐
│  Tab Title  |  LIVE Budget: X  |  LIVE Agents: Y  |  Clock    │
│  |  🔔 Alerts (real)  |  ⚙️ Settings  |  📋 Logs  |  🌙 Theme  │
└───────────────────────────────────────────────────────────────┘
┌─ Main Canvas ─────────────────────────────────────────────────┐
│                                                               │
│  Tab content with Framer Motion transitions                  │
│  Every card has a DataSourceBadge (green/yellow/red dot)     │
│                                                               │
└───────────────────────────────────────────────────────────────┘
┌─ Right Rail (NEW, contextual inspector) ──────────────────────┐
│  When entity selected: details in drawer (not modal)         │
│  Shows: metadata, trust score, recent decisions, trace_id    │
└───────────────────────────────────────────────────────────────┘
┌─ Footer (sticky, all REAL data) ──────────────────────────────┐
│  Constitution limits | Pool counts | Error count (5m) |       │
│  Rate limit status | Session uptime | LIVE indicator          │
└───────────────────────────────────────────────────────────────┘
┌─ Floating Overlays ───────────────────────────────────────────┐
│  AI Assistant (bottom-right) | Quick Stats (bottom-left)      │
│  Command Palette (⌘K) | System Logs (⌘L) | Shortcuts (?)     │
│  Global Activity Feed dock (bottom-center, collapsible)       │
└───────────────────────────────────────────────────────────────┘
```

## 3. SAGE + MCP integration sketch (interfaces, not implementation)

### 3.1 MCP tunneling and handshake layer

**Protocol:** JSON-RPC 2.0 over HTTPS

**Handshake sequence (8 steps):**
1. External system acquires `agent_id` + secret from `SecretStore`
2. Generates `trace_id` (SHA-256 of agent_id + counter + timestamp, first 16 hex chars)
3. Builds JSON-RPC payload (`{method, params, kaiju:{scope,intent,impact,clearance}}`)
4. Computes `signature = HMAC-SHA256(secret, "{trace_id}:{payload}")` (canonical form — the current code includes the secret in the message, which is non-standard and should be fixed)
5. POSTs to bridge URL with headers: `X-Nexus-Agent-ID`, `X-Nexus-Project-ID`, `X-Nexus-Trace-ID`, `X-Nexus-Signature`
6. Bridge verifies signature via `hmac.compare_digest` (constant-time)
7. Bridge calls `governor.check_access()` with KAIJU 4 variables → ALLOW/DENY/HOLD
8. Bridge dispatches to handler, returns JSON-RPC envelope with `trace_id` + `token_usage`

**Auth model (to be consolidated):**
- **Transport auth:** HMAC-SHA256 per-agent secret (the only enforced auth today)
- **RBAC (to wire):** `MCPAuth` with 4 roles (ADMIN/OPERATOR/READONLY/GUEST) + method-level permissions — currently dead code, needs to be wired into `server.py` as a second auth layer
- **Rate limiting (to enforce):** `APIKey.rate_limit` field exists but is never checked — needs enforcement in `authenticate()`

**Tunneling options (recommended for production):**

| Option | Use case | Notes |
|--------|----------|-------|
| Cloudflare Tunnel | Production cloud exposure | HTTPS, DDoS protection, no port exposure |
| Caddy named routes | Production local | Replace `XTransformPort` with named routes per service (closes SSRF surface) |
| SSH tunnel | Secure ops | Encrypted, no third party |
| ngrok | Dev demos only | Ephemeral URL, rate limits |

**SSRF posture:** The Caddy `XTransformPort` pattern is a textbook SSRF surface — any client can bounce to `localhost:ANY`. Must be replaced with named routes or a port allow-list (3000, 3003, 7352 only).

### 3.2 SAGE integration contract (interface spec)

**Roles:**
- **NEXUS Control Plane** owns: agent roster, vault, governor decisions, token budgets, swarm, rate limits, AI routing. Calls SAGE `analyze_*` endpoints; consumes SAGE insight stream.
- **SAGE** owns: anomaly detection, recommendations, predictions, insight lifecycle. Calls NEXUS read-only endpoints (vault/governor/tokens); writes to NEXUS via bridge.

**SAGE-exposed routes (NEXUS calls these):**

| Route | Method | Purpose |
|-------|--------|---------|
| `/sage/v1/health` | GET | Liveness probe |
| `/sage/v1/analyze` | POST | Trigger async analysis (target_type, depth, focus) |
| `/sage/v1/analyses/{id}` | GET | Poll analysis result |
| `/sage/v1/insights` | GET | List insights (filterable by target/status/since) |
| `/sage/v1/insights/{id}` | PATCH | Dismiss or promote insight |
| `/sage/v1/stream` | WS | Real-time insight push |
| `/sage/v1/feedback` | POST | Operator feedback for SAGE retraining |

**NEXUS-exposed routes (SAGE calls these):**

| Route | SAGE permission | Purpose |
|-------|-----------------|---------|
| Bridge `vault/read` | `vault:read` | Read TRUST/CAP/FAIL tracks for analysis input |
| Bridge `tasks/submit` | `tasks:write` | Submit analysis task to NEXUS swarm |
| `/api/activity-feed` (NEW) | `activity:write` | Write `sage_insight` events |
| `/api/governor` POST | `governor:write` | Promote insight to GovernorDecision |
| `/api/tokens` POST | `tokens:write` | Log SAGE's LLM token usage |
| `/api/agents` GET | `agents:read` | Read agent roster + trust |
| `/api/vault` GET | `vault:read` | Read latest 100 vault entries |
| `/api/trust-engine` GET | `trust:read` | Read trust matrix + CDR stages |
| `/api/rate-limit/status` GET | `ratelimit:read` | Read provider health |

**SAGE WebSocket events (5 channels):**

| Event | Payload | Consumer |
|-------|---------|----------|
| `sage:insight` | `{insight_id, kind, target_type, target_id, summary, confidence, trace_id}` | `useSageWS()` hook |
| `sage:analysis-started` | `{analysis_id, target_type, target_id, started_at}` | `useSageWS()` |
| `sage:analysis-completed` | `{analysis_id, status, insight_count, duration_ms, tokens_used}` | `useSageWS()` |
| `sage:model-degraded` | `{model_name, reason, confidence, suggested_action}` | `useSageWS()` → GMR tab |
| `sage:budget-warning` | `{budget_remaining, projected_burn_hours, suggested_actions[]}` | `useSageWS()` → Tokens tab |

**Operational guarantees:**
- Insights persist in NEXUS DB even if SAGE goes offline (graceful degradation)
- SAGE's LLM calls MUST log to `TokenUsageLog` (no silent usage)
- `trace_id` propagates NEXUS → SAGE → response → WS events
- Circuit breaker on NEXUS client (failure_threshold=5, recovery_timeout=60s) — falls back to local heuristics when SAGE is OPEN
- SAGE `agent_id` can be revoked via `SecretStore.remove("sage")` — immediate access denial

### 3.3 How to anticipate SAGE without blocking (5-step roadmap)

1. **Reserve 10th sidebar slot NOW** with "Coming Soon" badge (disabled click → toast)
2. **Add SAGE to all color/source maps NOW** (placeholder color: `#14b8a6` teal)
3. **Define `SageInsight` Prisma model NOW** (empty table, no rows)
4. **Stub `/api/sage` route** that returns `{status: "not_implemented", insights: []}`
5. **UI renders gracefully when SAGE is offline** (gray pill, "SAGE offline" tab content)

When SAGE arrives: flip the badge, populate the route, no UI restructuring needed.

## 4. Sub-agent brainstorm summary

### 4.1 Roles invoked

| Agent | Task ID | Focus | Files read | Worklog lines |
|-------|---------|-------|------------|---------------|
| Architecture & Systems Design | ARCH-1 | Topology, 8-pillar mapping, MCP integration, patterns, risks | 17 files | 116–434 |
| Data Modeling & Metrics | DATA-1 | Prisma schema, API routes, trust engine, vault, token budget, GMR | 26 files | 436–836 |
| Dashboard UX / Operator Experience | UX-1 | 9 tabs, global components, operator workflows, visual design, SAGE hooks | 31 files | 837–1186 |
| Integrations & API Contracts | INT-1 | Bridge contract, MCP tunneling, AI provider bridge, rate limiter, WS, SAGE spec | 20 files | (append failed; findings in conversation) |
| Reliability, Observability & Incident Response | REL-1 | Monitoring, tracing, governor/compliance, circuit breaker, vault integrity, poisoning | 22 files | 1186–1736 |

### 4.2 Key conclusions from the brainstorm

**1. The Python backend is canonical but unwired (ARCH-1, DATA-1).**
The `nexus_os/` package (67 modules) is the governance brain per `SOUL.md`, but the dashboard bypasses it entirely — TypeScript routes call Prisma directly. This is P0 blocker #2. All 4 traced user actions (spawn worker, run stress test, adjust threshold, fetch paper) never touch the Python backend. The dashboard is effectively a standalone TypeScript app with a dead Python twin.

**2. Three parallel trust systems must consolidate (DATA-1, REL-1).**
Python `trust_engine_v2.py` (logistic + CDR, scale 0–99.5), Python `trust_scoring.py` (Beta-Binomial, in-memory), and TypeScript `/api/trust-engine` (local heuristic with hardcoded lane modifiers, scale 0–1). The dashboard displays the third; the Python canonical is unwired. Recommendation: consolidate to `TrustEngineV2` as canonical, expose via bridge.

**3. The vault has no real hash chain (DATA-1, REL-1).**
Both Python (UNIQUE-upsert) and Prisma (append-only) vault designs lack `prev_hash`/`entry_hash`/`signature` fields. `/api/vault verify_chain` checks timestamps + JSON parse + score range only — NOT cryptographic. UI chain hashes are fake (computed from entry ID `charCodeAt`). A malicious actor with DB write access could rewrite any vault entry undetected. The "hash-chained" claim is aspirational, not implemented.

**4. The entire WebSocket service is a demo (INT-1, REL-1).**
`mini-services/swarm-ws/index.ts` emits 5 channels of RANDOMLY GENERATED events from hardcoded pools. "Vault integrity check passed — 1792 entries verified" appears regardless of actual vault state. No real swarm telemetry — no Python Foreman connection, no Prisma reads. The "LIVE" indicator is misleading.

**5. Token budget consistently undercounts (DATA-1, INT-1).**
`/api/ai-bridge` and `/api/chat` (the heaviest ZAI consumers) never log to `TokenUsageLog` or update `SessionBudget`. `/api/stresslab` writes `TokenUsageLog` but skips `SessionBudget`. `/api/proxy` logs to `RateLimitLog` but not `SessionBudget`. The Python `TokenGuard` (4 budgets, atomic check_and_reserve, hard-stop at 95%) is NOT wired into any dashboard route. Token estimation is word-count × 1.3 — ~30–50% error vs real BPE tokenization.

**6. Three circuit breakers, none share state (INT-1, REL-1).**
`AdaptiveCircuitBreaker` (3-state, exponential backoff, HALF_OPEN probe — well-designed but dead code), inline `CircuitBreaker` in `rotator.py` (2-state, fixed 60s — also dead, never called by `execute_with_fallback`), client `CircuitBreaker` in `sdk.py` (3-state, thread-safe — only one actually used). `ModelProfile.record_failure()` is a silent no-op (`__getattr__` returns None). No `circuit_breaker_state` field on `ModelEntry`.

**7. Governor thresholds are stored but NEVER enforced (DATA-1, REL-1).**
`/api/governor POST action='update_threshold'` writes `governor_thresholds` JSON to `SystemConfig` — but no route checks "is requester's trust ≥ threshold.impl?". Thresholds are documentation, not policy. The KAIJU 4-var authz exists in `governor/check_access()` but the dashboard never calls it. `BridgeServer` has `governor=None` default → skips authz entirely in dev mode.

**8. Poisoning detection is sophisticated but unwired (REL-1).**
`MinjaDetector v2` (285 lines) implements 3-layer defense: velocity (10 writes/60s), semantic contradiction (pure-Python TF-IDF + cosine similarity), pattern anomaly (>60% identical content). But `validate_write()` is never called from any write path. `context.poison_check_passed` is never set by any caller — defaults to False — so every write would trigger a compliance violation IF compliance were enforced (it isn't). The in-memory index is lost on restart.

**9. No real alerting, no incident response (REL-1).**
Python `logger.warning` goes to stdout. Dashboard notification-center is 100% fabricated (10 hardcoded + 12 simulated templates). No webhook, no email, no Slack, no PagerDuty. No incident declaration, no runbooks, no postmortem template, no error budget, no SLO tracking, no status page. CRITICAL compliance violation or CDR COLLAPSE is invisible unless operator is watching Python stdout.

**10. Fusion is the metadata layer, not the code (ARCH-1).**
The fusion-pack maps every UI component to its backend contract and identifies the biggest gaps. It is the due-diligence audit that should drive the next milestone. The `WIRED_VS_MOCKED.json` is machine-readable and accurate. The dashboard should expose these statuses to the operator via `DataSourceBadge` components — currently the operator cannot tell real data from fabricated.

### 4.3 Composite recommendation (the "best combined plan")

The 5 agents independently converged on the same conclusion: **the highest-value action is not adding new features, but wiring the existing Python backend to the dashboard and consolidating the parallel implementations.** Specifically:

1. **Wire the Python bridge** (`:7352`) into the Next.js API routes as the canonical governance layer (closes P0 blocker #2, enables trust consolidation, enables real authz, enables real vault operations)
2. **Consolidate the 3 trust systems** to `TrustEngineV2` (exposed via bridge)
3. **Consolidate the 3 circuit breakers** to `AdaptiveCircuitBreaker` (with thread-safe Lock + `circuit_breaker_state` on ModelEntry)
4. **Implement real vault hash chain** (add `prev_hash`/`entry_hash`/`signature` to VaultEntry)
5. **Wire TokenGuard** as pre-check in all LLM-calling routes (closes silent-usage gap)
6. **Wire MinjaDetector** into all vault write paths (closes poisoning-detection gap)
7. **Replace fabricated WebSocket events** with real Prisma reads + Python Foreman events
8. **Add real alerting** (Alert model + /api/alerts + replace notification-center)
9. **Add DataSourceBadge** to every card (honest mock/real labeling — the operator's trust foundation)
10. **Reserve SAGE's slot** (10th tab + stub route + SageInsight model) without blocking

This plan respects the original artifacts (the Python backend is canonical per SOUL.md), fixes the root causes (not symptoms), and produces a system that is honest about what's real vs mock — which is the foundation of operational trust.

## 5. Immediate next actions (pending operator confirmation)

**No Layer 1 build until the operator confirms:**

1. **Source code access** — I now have the full source from the 3-part ZIP (198 files in `dashboard-pack/nexus-os-source/`). This is sufficient to begin Layer 1. No additional access needed unless the operator wants me to work from the `nexusalpha` repo directly.
2. **Convergence direction** — Should I port the NEXUS OS tabs into THIS repo (replacing my simpler Ops Board), or should I work within the `nexusalpha` repo? My recommendation: port into this repo as the canonical control plane, since this repo already has the Browserless adapter, SAGE gateway, git backup, and GPG signing wired.
3. **Python backend wiring** — Should I wire the Python bridge as the canonical governance layer (recommended by all 5 agents), or keep the TypeScript-direct-to-Prisma pattern? My recommendation: wire the bridge, but with STUB fallback when the Python backend is unreachable (same pattern as my MCP health route).
4. **SAGE priority** — The user confirmed SAGE is not urgent. I will reserve its slot (10th tab + stub route + model) but not build it.

Everything is backed up to GitHub (the dashboard-pack source + this synthesis). The worklog has 1,736 lines of detailed sub-agent analysis for future sessions to reference.
