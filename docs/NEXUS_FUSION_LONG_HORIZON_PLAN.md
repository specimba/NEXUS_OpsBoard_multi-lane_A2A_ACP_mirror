# NEXUS A2A Control Plane — Long-Horizon Fusion & Implementation Plan

> **Primary deliverable.** Grounded in the GLM5 Fusion Pack dashboard backup
> (`dashboard-pack/glm5-fusion/`), the SOL/TERRA/kilocode coordination logs
> (`upload/`), and the existing Ops Board + SAGE work in this repo.
> This is a multi-session, long-running plan — not a single-session build.

## 0. Grounding sources (primary truth)

| Source | Location | Role |
|--------|----------|------|
| GLM5 Fusion Pack (3-part ZIP) | `dashboard-pack/glm5-fusion/` | **Primary architecture target** — 9-tab NEXUS OS Command Center, 84% real backend |
| WIRED_VS_MOCKED.md | `dashboard-pack/glm5-fusion/WIRED_VS_MOCKED.md` | **Feature classification** — 52 WIRED, 8 SEED, 10 COMPUTED, 14 MOCK |
| API_ASSUMPTIONS.md | `dashboard-pack/glm5-fusion/API_ASSUMPTIONS.md` | **14 API routes** + external integrations + Nexus 7352 bridge gaps |
| UI_STRUCTURE.md | `dashboard-pack/glm5-fusion/UI_STRUCTURE.md` | **9-tab structure** + global components |
| SOL coordination log | `upload/NEXUSnewSOLcoordinationULTRAonCODEXlog-23.txt` | **Master plan** — ports, 3-tier model architecture, P0–P4 convergence |
| TERRA coordination log | `upload/NEXUSnewTERRAcoordinationULTRAonCODEXlog-27.txt` | **Execution plan** — PR #52, SOL branch P0 sequence, browser/CDP governance |
| kilocode orchestrator log | `upload/NEXUSkilocodeORCHESTRATORagentlogs-07.txt` | **Grounding sweep** — new files/commits, A800 monitor, repo state |
| SAGE v1.1 hardening pack | `sage/reference/v1_1/` | **Gateway contract** — 3-state idempotency, jobs API, security middleware |
| Existing Ops Board | `src/app/`, `src/lib/`, `src/components/` | **Current state** — 4 pages, 7 API routes, MCP mirror |

## 1. Architecture understanding

### 1.1 What the Fusion Pack actually is

The GLM5 Fusion Pack is a **trust-governed multi-agent OS command center** built on
Next.js + Prisma/SQLite. It is NOT the same as this repo's Ops Board — it is a
**richer, production-adjacent dashboard** built by the GLM5 dashboard lane that we
should converge toward. Its thesis (from PACK_MANIFEST.md):

> Every request is authenticated, routed by intent, vetted by trust score, and
> audit-logged immutably — with elastic model supply, parallel worker execution,
> real-time budget enforcement, and constitutional guardrails.

### 1.2 The 8-pillar architecture

| Pillar | Dashboard tab | Role |
|--------|---------------|------|
| Bridge | (global) | Request authentication + intent routing |
| Engine | StressLab | ISC-Bench test execution, collapse detection |
| Governor | Governor | Trust scoring, danger patterns, threshold enforcement |
| Vault | Vault | 5-track immutable memory (EVENT/TRUST/CAP/FAIL/GOV), chain verification |
| GMR | GMR Router | Global Model Relay — model registry, pool management, health checks |
| Swarm | Swarm | Worker pool lifecycle (spawn/terminate/restart/reassign/trust) |
| Monitor | Token Budget + Rate Limit | Budget enforcement, rate-limit tracking |
| Config | Settings | SystemConfig CRUD, constitution rules |

### 1.3 The real backend stack (from SOL log + API_ASSUMPTIONS)

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | Next.js App Router + React + Zustand | `useApiData` polling hook (15–30s) |
| API | 14 Next.js API routes on :3000 | Prisma ORM, no external backend for core |
| Database | Prisma + SQLite | Models: Agent, GovernorDecision, VaultEntry, Paper, ModelEntry, TestTemplate, TestRun, SessionBudget, TokenUsageLog, RateLimitLog, ApiKey, SystemConfig |
| Realtime | WebSocket mini-service on :3003 | Swarm worker status; falls back to polling |
| LLM | z-ai-web-dev-sdk | StressLab tests, GMR health checks, AI Assistant — all real |
| External | Tavily + Jina (Alphaxiv search) | Fallback chain |
| Local models | 3-tier VRAM budget (8GB ceiling) | Tier0 anchors → Tier1 guard → Tier2 SLMs → Tier3 ModelRelay cloud |

### 1.4 The real NEXUS port map (from SOL log, confirmed)

| Port | Component | Status |
|------|-----------|--------|
| 7350 | ModelRelay | Cloud frontier elevation (GLM-5.2, DeepSeek-V4, Kimi-K2.7, MiniMax-M3) |
| 7352 | Brain API | Not MCP — Nexus backend |
| 7354 | MCP Bridge v2 | **Now 25 tools** (was 22), version 2.4.0-p0-continuity |
| 9224 | Chrome CDP | Multi-lane browser truth |
| 3003 | Swarm WS | Mini-service (this pattern matches our repo's mini-services/) |

### 1.5 How this relates to my current Ops Board

| Aspect | My Ops Board (current) | Fusion Pack (target) |
|--------|------------------------|----------------------|
| Pages | 4 (ops, mcp, lanes, handoffs, browserless) | 9 tabs + global components |
| API routes | 7 (health, ledger, lanes, handoffs, mcp/*, browserless) | 14 + external (alphaxiv, chat, ai-bridge, claude) |
| Data layer | JSONL file + in-memory handoff bus | Prisma/SQLite with 12 models |
| Real LLM | None | z-ai-web-dev-sdk (StressLab, GMR, AI Assistant) |
| Trust/governance | Lane status only | Trust Engine v2.2 with CDR stages, Governor, danger patterns |
| Audit | Ledger tail (read-only) | Vault with 5 tracks + chain verification |
| Model management | MCP tool inventory (static) | GMR with real health checks + pool rotation |
| Realtime | Polling only | WebSocket + polling fallback |

**Gap:** My Ops Board is ~15% of the Fusion Pack's functional surface. The Fusion
Pack is the convergence target.

## 2. Feature mapping — real vs mock vs partial

*Distilled from `WIRED_VS_MOCKED.md` (the ground-truth classification).*

### 2.1 Summary statistics (from the pack)

| Status | Count | % |
|--------|-------|---|
| WIRED (real DB CRUD) | 52 | 62% |
| SEED (real DB, initial data) | 8 | 10% |
| COMPUTED (derived from real data) | 10 | 12% |
| MOCK (hardcoded/placeholder) | 14 | 16% |

**84% real backend connection. The 16% mock is primarily WebSocket/time-series fallbacks.**

### 2.2 Real, non-mock functionalities (the assets to integrate)

| Function | API | Why it's real |
|----------|-----|---------------|
| Swarm worker CRUD (spawn/terminate/restart/reassign/trust) | `POST /api/swarm` | Full DB CRUD + VaultEntry audit trail on every action |
| Governor decisions + threshold adjustment | `GET/POST /api/governor` | Real DB upsert, affected-agent warnings |
| Vault 5-track browser + chain verification | `GET/POST /api/vault` | Real integrity checks on entries |
| Research paper CRUD + Alphaxiv fetch | `GET/POST/PUT /api/research` + `/api/alphaxiv` | Tavily/Jina → DB persistence, priority/status updates (DB cuid bug fixed) |
| StressLab real LLM execution | `POST /api/stresslab` | z-ai-web-dev-sdk completion + keyword validation |
| GMR model health checks | `POST /api/models` | Real z-ai-web-dev-sdk pings, latency/health tracking |
| Token budget + usage logs | `GET/POST /api/tokens` | SessionBudget + TokenUsageLog, per-agent/per-model |
| Rate limit status | `GET /api/rate-limit/status` | DB RateLimitLog + in-memory cache/dedup/queue |
| Trust Engine matrix + CDR | `GET /api/trust-engine` | Computed from real agent + decision data |
| System config CRUD | `GET/PUT/DELETE /api/settings` | SystemConfig full CRUD |
| AI Assistant chat | `POST /api/chat` | z-ai-web-dev-sdk LLM with NEXUS system prompt |
| Data source badges | (UI) | Honest REAL/SEED/MOCK/COMPUTED/WS labels per widget |

### 2.3 Mock / partial functionalities (the upgrade targets)

| Function | Current state | What's missing | Upgrade path |
|----------|---------------|----------------|--------------|
| Swarm task queue | 4 hardcoded entries (WS fallback) | Real task queue | Wire to WebSocket :3003 or DB-backed queue |
| Swarm recent completions | 5 hardcoded entries | Real completion stream | WS event stream or DB query |
| Swarm worker performance | Deterministic fallback arrays | Real time-series | TokenUsageLog aggregation per worker |
| Overview live activity feed | Client-side simulated | Real event stream | VaultEntry stream via WS or polling |
| Overview health timeline | Seeded pseudo-random | Real time-series storage | New TimeSeries model + periodic sampling |
| Overview token history | Simulated when no logs | Real historical | TokenUsageLog grouped by hour |
| Overview collapse rate trend | Hardcoded when <2 runs | Real bucket computation | StressLab run aggregation (auto-flips to WIRED at ≥2 runs) |
| GMR rotation analytics | Hardcoded counts | DB tracking | New RotationEvent model |
| GMR failover log | Hardcoded events | DB tracking | New FailoverEvent model |
| GMR model sparklines | Deterministic arrays | Real latency history | HealthCheck time-series |
| Token cost optimization | Hardcoded suggestions | Analysis engine | Rule engine over usage logs |
| Token model trend sparklines | Deterministic | Real per-model time-series | TokenUsageLog aggregation |
| System logs panel | Client-side simulated | Real log stream | Backend log streaming (WS or tail) |
| Notification center | 10 hardcoded | Real event connection | VaultEntry + Governor decision → notification |
| Research practice session | Timed simulation | Real pipeline | Connect to actual research execution |

### 2.4 External bridge gaps (to Nexus 7352 backend)

From `API_ASSUMPTIONS.md` — routes the Fusion Pack lacks but Nexus 7352 exposes:

| Nexus 7352 route | Fusion Pack equivalent | Gap | Priority |
|------------------|------------------------|-----|----------|
| `GET /health` | — | Missing health endpoint | HIGH |
| `POST /tasks/heartbeat` | — | Missing task heartbeat bridge | HIGH |
| `POST /tasks/result` | — | Missing task result submission | HIGH |
| `GET /tasks/status/{id}` | — | Missing task status query | MEDIUM |
| `GET /governance/proposals` | `GET /api/governor` (different shape) | Need adapter | MEDIUM |
| `POST /governance/approve/{id}` | `POST /api/governor` appeal | Different approval flow | MEDIUM |
| `POST /skills/propose` | — | Missing skill proposal | LOW |
| `GET /skills/status/{id}` | — | Missing skill status | LOW |

## 3. Integration strategy

### 3.1 Decision: converge, don't fork

The Fusion Pack is a richer dashboard than my Ops Board. The strategy is **not**
to build a third dashboard, but to **port the Fusion Pack's real functionalities
into this repo** as the canonical NEXUS A2A control plane, absorbing my Ops
Board's MCP-mirror + handoff-bus + Browserless adapter as additional tabs.

### 3.2 Modular component distillation

Distill each Fusion Pack tab into reusable modules:

```
src/
  lib/
    nexus/                      # NEW — Fusion Pack core
      db.ts                     # Prisma client (already exists, extend schema)
      trustEngine.ts            # Trust Engine v2.2 + CDR stages
      gmr.ts                    # Global Model Relay client
      swarm.ts                  # Worker lifecycle + audit trail
      vault.ts                  # 5-track memory + chain verification
      governor.ts               # Decisions + thresholds + danger patterns
      stresslab.ts              # ISC-Bench execution via z-ai-web-dev-sdk
      research.ts               # Paper CRUD + Alphaxiv integration
      tokens.ts                 # Session budget + usage logging
      rateLimit.ts              # Rate limiter + cache/dedup
      apiCache.ts               # In-memory cache (from Fusion Pack)
      dedup.ts                  # Request deduplication
      apiKeyManager.ts          # In-memory key rotation
    browserless.ts              # EXISTING — keep
    sage/                       # EXISTING (SAGE gateway) — keep
    mcpTools.ts, registry.ts, … # EXISTING — keep, integrate as tabs
  components/
    nexus/                      # NEW — Fusion Pack UI components
      PillarHealthGrid.tsx
      TrustScoreCard.tsx
      VaultEntryBrowser.tsx
      WorkerGrid.tsx
      GovernorThresholdSlider.tsx
      StressLabRunner.tsx
      GmrPoolCard.tsx
      TokenBudgetGauge.tsx
      RateLimitStatus.tsx
      DataSourceBadge.tsx       # CRITICAL — honest mock/real labeling
      CommandPalette.tsx
      AIAssistant.tsx
  app/
    (existing pages kept)
    stresslab/page.tsx          # NEW tabs
    gmr/page.tsx
    governor/page.tsx
    vault/page.tsx
    research/page.tsx
    swarm/page.tsx
    tokens/page.tsx
    rate-limit/page.tsx
```

### 3.3 Data model (Prisma schema extensions)

The Fusion Pack uses 12 Prisma models. Add to `prisma/schema.prisma`:

```prisma
model Agent { id, name, type, domain, status, trustScore, totalTokens, … }
model GovernorDecision { id, agentId, action, scope, impact, reason, ts, … }
model VaultEntry { id, track (EVENT|TRUST|CAP|FAIL|GOV), payload, hash, prevHash, score, ts, … }
model Paper { id, cuid, title, externalId, priorityTier (P0|P1|P2), status, domain, relevance, … }
model ModelEntry { id, name, pool (PREMIUM|MID|FAST|FREE_RESEARCH), active, health, latency, … }
model TestTemplate { id, domain, difficulty, sourceId, prompt, keywords, … }
model TestRun { id, templateId, modelName, mode, passed, collapsed, durationMs, output, ts, … }
model SessionBudget { id, totalTokens, usedTokens, resetAt, … }
model TokenUsageLog { id, model, agentId, promptTokens, completionTokens, ts, … }
model RateLimitLog { id, provider, endpoint, status, ts, … }
model ApiKey { id, provider, key, active, … }
model SystemConfig { key, value, category, … }
```

### 3.4 For real features: reliability + modularization improvements

| Real feature | Improvement |
|--------------|-------------|
| Swarm CRUD | Add WebSocket reconnection logic; persist task queue to DB |
| StressLab LLM | Add retry + timeout + fallback model; persist every run |
| GMR health | Auto-schedule periodic health checks; store latency time-series |
| Vault | Add periodic chain-verification cron; hash-indexing for fast lookup |
| Governor | Persist threshold-change audit trail; add batch decision replay |
| Token budget | Auto-enforce budget cutoff (reject API calls when exhausted) |
| Rate limit | Auto-log ALL API calls via middleware (not manual) |
| Research | Cache Alphaxiv results; add dedup by externalId |

### 3.5 For mock features: concrete upgrade path

Each mock → real upgrade follows the same pattern:

1. **Identify the data source** (DB model, WS event, external API, or computed)
2. **Add the Prisma model** if none exists (e.g., `RotationEvent`, `FailoverEvent`, `TimeSeriesPoint`)
3. **Write the API route** that reads/writes that model
4. **Replace the hardcoded fallback** with `useApiData` polling
5. **Add a DataSourceBadge** showing the new status (WIRED/WS/COMPUTED)
6. **Add a seed** for initial data if needed
7. **Test**: fresh DB → seed → verify real CRUD → verify badge flips

## 4. NEXUS A2A usefulness improvement plan

### 4.1 What "usefulness" means here

For the NEXUS A2A control plane, usefulness = **operational clarity + faster
incident response + better debugging + decision support + automation hooks**.
Concretely: an operator looking at the dashboard can, within 10 seconds, answer
"are the lanes healthy, is anything blocked, what should I do next, and what
happened in the last hour" — and can act on it without leaving the dashboard.

### 4.2 Prioritized roadmap (MVP → v2 → v3)

#### MVP — Fuse the 6 strongest real tabs (highest usefulness, lowest risk)

| # | Item | Problem | Solution | Steps | Validation |
|---|------|---------|----------|-------|------------|
| 1 | **Prisma schema + seed** | No DB | Add 12 models + seed route | Write schema, `db:push`, port seed script | `/api/seed` returns seeded counts; fresh DB non-empty |
| 2 | **Vault tab** | No audit trail | Port 5-track browser + chain verification | `vault.ts` lib + `/api/vault` route + `VaultEntryBrowser` component | Create entry → verify chain → hash mismatch detected |
| 3 | **Swarm tab** | No worker management | Port worker CRUD + audit trail | `swarm.ts` + `/api/swarm` + `WorkerGrid` | Spawn → terminate → verify VaultEntry logged |
| 4 | **Governor tab** | No trust scoring | Port trust scores + threshold sliders | `governor.ts` + `/api/governor` + `GovernorThresholdSlider` | Adjust threshold → affected-agent warning shows |
| 5 | **GMR tab** | Static MCP tool list | Port model registry + real health checks | `gmr.ts` + `/api/models` + `GmrPoolCard` | Health check → latency updates in DB |
| 6 | **StressLab tab** | No LLM testing | Port real LLM execution + validation | `stresslab.ts` + `/api/stresslab` + `StressLabRunner` | Run test → real z-ai completion → pass/fail recorded |
| 7 | **DataSourceBadge** | No honest labeling | Port the badge system globally | `DataSourceBadge.tsx` + apply to every widget | Every widget shows REAL/SEED/MOCK/COMPUTED |

#### v2 — Wire the bridge gaps + kill the worst mocks

| # | Item | Problem | Solution | Steps | Validation |
|---|------|---------|----------|-------|------------|
| 8 | **Nexus 7352 health bridge** | No `/health` | Add `/api/nexus/health` proxy | Fetch 7352/health, degrade gracefully | Returns UP/DOWN/STUB like existing mcp/health |
| 9 | **Task heartbeat bridge** | Swarm isolated | Bridge Swarm → Nexus `POST /tasks/heartbeat` | Adapter in `swarm.ts`, call on spawn/terminate | Nexus receives heartbeat |
| 10 | **Task result bridge** | StressLab isolated | Bridge test runs → Nexus `POST /tasks/result` | Adapter in `stresslab.ts` | Nexus receives results |
| 11 | **Governance proposal bridge** | Governor isolated | Bridge decisions → Nexus `GET/POST /governance/proposals` | Adapter in `governor.ts` | Proposals sync bidirectionally |
| 12 | **WebSocket swarm queue** | 4 hardcoded tasks | WS mini-service :3003 + DB queue | Port `mini-services/swarm-ws/`, add Task model | Real tasks appear, no hardcoded fallback |
| 13 | **Auto rate-limit logging** | Manual only | Middleware that logs every API call | `rate-limiter.ts` middleware wrapper | RateLimitLog populates automatically |
| 14 | **Token budget enforcement** | Display only | Reject API calls when budget exhausted | Budget-check middleware | Calls return 429 when over budget |
| 15 | **Research tab + Alphaxiv** | No research pipeline | Port full Research tab | `research.ts` + `/api/research` + `/api/alphaxiv` + UI | Search → papers saved to DB → priority CRUD works |

#### v3 — Time-series, rotation events, full observability

| # | Item | Problem | Solution |
|---|------|---------|----------|
| 16 | **Time-series storage** | Health timeline mocked | New `TimeSeriesPoint` model + periodic sampler cron |
| 17 | **Rotation + failover events** | Hardcoded GMR analytics | New `RotationEvent` + `FailoverEvent` models, logged by GMR |
| 18 | **Real activity feed** | Simulated | WS stream of VaultEntry + GovernorDecision events |
| 19 | **System logs streaming** | Client-side only | WS log tail or server-sent events |
| 20 | **Cost optimization engine** | Hardcoded suggestions | Rule engine over TokenUsageLog (e.g., "model X costs 3x model Y for same pass rate") |
| 21 | **Trust Engine v2.2 full** | Partial | CDR stages computed from real agent data, multi-dimensional trust |
| 22 | **Command palette + AI assistant** | — | Port Ctrl+K palette + z-ai-web-dev-sdk chat with NEXUS system prompt |
| 23 | **Constitution enforcement** | — | Max-agent limit in Swarm, pool guard in GMR, threshold lines in Governor |
| 24 | **SAGE gateway integration** | Disconnected | Wire SAGE v1.1 Action Gateway as the governance plane; handoffs flow via `agent_publish_message` |

### 4.3 Per-item validation + monitoring

Every item ships with:
- **Functional test**: the action produces a DB record + the UI reflects it
- **DataSourceBadge**: honestly labeled REAL/SEED/MOCK/COMPUTED/WS
- **Audit trail**: mutating actions log a VaultEntry
- **Budget tracking**: LLM calls log TokenUsageLog
- **Rate-limit tracking**: API calls auto-log to RateLimitLog

## 5. Long-run collaboration structure

### 5.1 Layered design (each layer independently shippable)

```
Layer 0 (exists):  Ops Board + MCP mirror + Browserless + SAGE gateway
Layer 1 (MVP):     Prisma schema + 6 real tabs (Vault, Swarm, Governor, GMR, StressLab, Research) + DataSourceBadge
Layer 2 (v2):      Nexus 7352 bridges + WS swarm queue + auto rate-limit + budget enforcement
Layer 3 (v3):      Time-series + rotation events + real feeds + cost engine + Trust Engine v2.2 full
Layer 4 (future):  SAGE governance integration + multi-operator auth + PostgreSQL migration + HTTPS
```

### 5.2 Iterative loop (per session)

```
1. ANALYZE artifacts (logs / dashboard pack / current repo state)
2. PROPOSE changes (which layer, which items, which files)
3. GET operator feedback (confirm before touching governance/registry design)
4. REFINE + implement (small file batches, lint after each)
5. VERIFY (Agent Browser self-verify on every UI change; curl on every API)
6. DOCUMENT (update STATE.md + worklog.md + this plan's checklist)
7. COMMIT (GPG-signed, pushed to GitHub anti-wipe backup)
8. Loop to 1
```

### 5.3 Developer checklist (TODO — copy into STATE.md per session)

```
[ ] Prisma schema: 12 models added, db:push succeeds
[ ] Seed route: /api/seed populates all models
[ ] Vault: create → verify → hash-mismatch test passes
[ ] Swarm: spawn → terminate → VaultEntry audit trail confirmed
[ ] Governor: threshold slider → affected-agent warning renders
[ ] GMR: health check → latency updates in DB
[ ] StressLab: real z-ai completion → pass/fail recorded
[ ] Research: Alphaxiv search → papers saved to DB → priority CRUD
[ ] DataSourceBadge: every widget labeled honestly
[ ] Nexus 7352 health bridge: /api/nexus/health returns UP/DOWN/STUB
[ ] WebSocket swarm queue: no hardcoded fallback when WS connected
[ ] Auto rate-limit: middleware logs every API call
[ ] Token budget enforcement: 429 when over budget
[ ] SAGE gateway: 3-state idempotency, /v1/jobs durable, no /v1/program
[ ] Agent Browser self-verify: all tabs render, no console errors
[ ] Lint clean
[ ] GPG-signed commit + pushed to GitHub
```

### 5.4 Assumptions + open questions (flagged honestly)

| # | Assumption / Question | Resolution path |
|---|----------------------|-----------------|
| A1 | The Fusion Pack's Prisma schema is not in the ZIP — only the docs describe it | Ask operator for the `prisma/schema.prisma` from the nexusalpha repo, OR reverse-engineer from API_ASSUMPTIONS.md (12 models are fully described) |
| A2 | The actual Fusion Pack source code (components, API routes) is not in the ZIP — only screenshots + docs | Ask operator to share the `nexusalpha` repo (or the `nexus-glm5-fusion-pack/` source), OR rebuild from the exhaustive docs |
| A3 | The 3-part ZIP was a workspace export, not the source repo | The `nexus-os-v0.12` shared folder in the same Drive may contain the source — worth fetching next |
| A4 | z-ai-web-dev-sdk is available in this sandbox (confirmed — it's in package.json) | No action needed; StressLab/GMR/AI Assistant will work |
| A5 | The Nexus 7352 backend is not reachable from this sandbox | Bridges will degrade to STUB (same pattern as mcp/health); operator must run the bridge on the Windows host |
| A6 | The SAGE gateway I built (mini-services/sage-gateway/) is v1; v1.1 upgrade pending operator decision | Decision needed: upgrade in-place vs dedicated NEXUS_SAGE repo |
| A7 | PostgreSQL migration is a v4 concern; SQLite is fine for MVP | Monitor DB size; migrate when >1GB or multi-operator |

### 5.5 What I need from the operator to proceed

1. **Source code access** — the Fusion Pack docs are exhaustive, but the actual
   React components + Prisma schema + API route implementations would let me
   port faithfully rather than rebuild from docs. Options:
   - Share the `nexusalpha` repo (best — I can read the real code)
   - Share the `nexus-os-v0.12` folder from the same Drive
   - Share the `FALLOUT_NEXUS_SHELLv2.tar` (also in the Drive folder)
2. **Confirm the convergence direction** — should I absorb my Ops Board into the
   Fusion Pack's architecture (recommended), or keep them separate?
3. **SAGE v1.1 gateway decision** — upgrade in-place vs dedicated NEXUS_SAGE repo?
4. **Nexus 7352 reachability** — is the backend reachable from anywhere I can
   hit, or only from the Windows host? (Affects whether bridges can be live-tested.)

## 6. Immediate next action (pending operator confirmation)

**Do not build Layer 1 until the operator confirms items in §5.5.** The highest-
value, lowest-risk action I can take unilaterally right now is:

- **Back up the dashboard pack + this plan to GitHub** (anti-wipe protection)
- **Fetch the `nexus-os-v0.12` folder** from the same Drive to check for source code
- **Update STATE.md** with the Layer roadmap + checklist

No fusion code will be written until the operator confirms the convergence
direction + source-code access. This avoids the prior mistake of building ahead
of confirmation.
