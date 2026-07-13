# NEXUS A2A Control Plane — Worklog

Shared work log for all agents working on the NEXUS control plane.
Primary continuity file for GLM-5.2 sessions is `STATE.md`; this file records
concrete per-task steps.

---
Task ID: 1
Agent: GLM-5.2 (main orchestrator)
Task: Milestone A — Scaffold (README, STATE.md, .env.example, lib foundation)

Work Log:
- Explored existing Next.js 16 project at /home/z/my-project (dev server already running on :3000).
- Created src/lib/types.ts with LaneId (14 lanes), LaneStatus, HandoffCard, LedgerRow, McpToolInfo, McpHealth, McpQueueSnapshot.
- Created src/lib/registry.ts — 14 lanes with success signals + wait policies + accent color helpers (dark ops palette).
- Created src/lib/mcpTools.ts — all 22 Grok MCP tools (3 connectivity, 8 evidence, 6 queue, 5 session/a2a) + denylist (no shell/cookies/private IP/CDP drive).
- Created src/lib/paths.ts — env resolution (NEXUS_LEDGER_PATH injectable, sample fallback), sample data paths.
- Created src/lib/ledger.ts — JSONL tail reader + summarizer (byLane/byKind/byStatus).
- Created src/lib/handoffBus.ts — in-memory global singleton + file-backed persist to data/handoffs.json.
- Created .env.example, README.md, STATE.md.

Stage Summary:
- Domain foundation complete. 14 lanes + 22 MCP tools modeled with hardening facts encoded.
- STATE.md marks Milestone A DONE, B IN PROGRESS.
- Next: sample data files + all API routes (Milestone B).

---
Task ID: 2
Agent: GLM-5.2 (main orchestrator)
Task: Milestone B — Domain + APIs (sample data + all API routes)

Work Log:
- Created data/sample_ledger.jsonl (24 JSONL rows across cycles cyc_1042-1044, varied lanes/kinds/statuses).
- Created data/sample_handoffs.json (6 seed handoff cards spanning grok/qwen_webdev/gemini/deepseek/zo/intern_gpu).
- Created data/sample_mcp_health.json (bridge v2.4.1 payload, registry_hash 0xab12cd34, denied list).
- API routes: /api/health (app liveness), /api/ledger (?limit tail + summary), /api/lanes (registry), /api/handoffs (GET + POST with LaneId/status validation), /api/mcp/health (fetch 7354 → STUB fallback w/ sample payload, redirect:error, 4s timeout), /api/mcp/tools (22 + denylist), /api/mcp/queue (mock coordination_status snapshot).

Stage Summary:
- All 7 API routes return 200 in dev.log. mcp/health degrades to STUB in sandbox (bridge unreachable) but still serves sample payload. SSRF surface reviewed: fixed env URL, no redirect following, no cookie forwarding.

---
Task ID: 3
Agent: GLM-5.2 (main orchestrator)
Task: Milestone C — UI boards (layout, components, pages)

Work Log:
- Added dark-ops CSS to globals.css (nexus-bg grid, nexus-panel, mono, custom scrollbar, nexus-pulse animation).
- Created src/hooks/use-nexus.ts — polling fetch hook (configurable interval, abort-safe, lint-clean).
- Created src/components/OpsNav.tsx — sticky top nav with active link highlighting + CDP live-truth indicator.
- Created src/components/KeepVisibleBanner.tsx, QwenWebDevNote.tsx, LaneCard.tsx, HandoffCard.tsx, LedgerTail.tsx, McpHealthBadge.tsx, McpToolTable.tsx.
- Updated layout.tsx — forced dark theme, OpsNav, sticky footer (mt-auto), sonner + radix toasters.
- Pages: src/app/page.tsx (ops board: stats + lane grid + recent handoffs + ledger tail), src/app/mcp/page.tsx (health badge + queue + tool table), src/app/lanes/page.tsx (lane doctrine grid w/ status filter), src/app/handoffs/page.tsx (create form w/ shadcn Select/Input/Textarea + status/lane filters).

Stage Summary:
- All 4 pages render and poll their APIs. Home page confirmed live in dev.log (lane grid, handoffs, ledger all 200). Lint passes (fixed react-hooks/refs + set-state-in-effect rules). Handoff create form POSTs to /api/handoffs with sonner toasts.

---
Task ID: 4
Agent: GLM-5.2 (main orchestrator)
Task: Milestone D — MCP contract docs + RESUME

Work Log:
- Created docs/MCP_CONTRACT.md — 22-tool table (connectivity/evidence/queue/session-a2a), hardening facts, denylist, health states, SSRF checklist.
- Created docs/LANE_DOCTRINE.md — 14 lanes with role/success-signal/wait-policy, critical notes (qwen preview, mimo 4h gate, zo resume, glm52 lock), Hermes VISIBLE_LANES=1 constraint.
- Created docs/RESUME.md — next-session resume protocol, file map, retry protocol, integration HANDOFF block.
- Updated STATE.md → "READY FOR LONG RUN".

Stage Summary:
- Docs complete and consistent with src/lib/mcpTools.ts + registry.ts. STATE.md marks A-D DONE, E PARTIAL (file-backed store + filter UI done; SSE note page pending). Next: Agent Browser self-verify.

---
Task ID: 5+6
Agent: GLM-5.2 (main orchestrator)
Task: Milestone E (SSE note) + Agent Browser self-verification

Work Log:
- Added SSE connector note section to /mcp page (documents 7354/sse stream + wiring path via agent_publish_message topic nexus.a2a.handoff).
- Agent Browser verification: opened /, /mcp, /lanes, /handoffs — all render with no console errors.
- Found + fixed bug: /api/mcp/health returned {} because downStub (async) was not awaited in NextResponse.json. Now returns proper STUB payload with registry_hash 0xab12cd34 + sample bridge payload.
- Tested handoff create flow end-to-end: filled summary + artifacts + budget → POST /api/handoffs → 201 → card hof_mre5y357_kybow7 (token nx_7DHT) persisted to data/handoffs.json + rendered in list + propagated to home page Recent Handoffs via polling.
- Tested lanes page PARTIAL filter → correctly shows 4 partial lanes (Qwen Deep, MiMo Claw, ChatGPT, Intern GPU).
- Verified mobile (390px) nav scrolls horizontally; desktop (1280px) content pushes footer naturally (1889px > 800px viewport, sticky-footer layout correct).
- Final lint: clean. Dev log: only harmless cross-origin + fast-refresh warnings, all API routes 200.

Stage Summary:
- All milestones A–E complete. STATE.md = READY FOR LONG RUN.
- Agent Browser self-verify PASSED. App is interactive and runnable.

---
Task ID: 7
Agent: GLM-5.2 (main orchestrator)
Task: Git version control + GitHub backup + GPG commit signing (anti-wipe)

Work Log:
- Inspected existing git state: 3 prior sandbox auto-commits, no remote, placeholder identity.
- Fetched GitHub identity via API: login specimba, id 32012089, name Canberk Karaerkek.
- Hardened .gitignore: added /db/*.db, /.zscripts/dev.pid, /data/handoffs.json (runtime-mutated), .env.local.
- Untracked runtime/binary/secret files: .env, db/custom.db, .zscripts/dev.pid, data/handoffs.json (kept on disk).
- Configured git identity: name "Canberk 'specimba' Karaerkek", email 32012089+specimba@users.noreply.github.com (noreply, links to specimba account).
- Set up credential store: token written to ~/.git-credentials (mode 600, OUTSIDE repo, never tracked); git config --global credential.helper store; remote URL is clean (no embedded token).
- Added remote origin → specimba/NEXUS_OpsBoard_multi-lane_A2A_ACP_mirror.git.
- Resolved unrelated-histories divergence: merged origin/main (had .gitignore/LICENSE/README) with -X ours → kept NEXUS README/.gitignore, added LICENSE.
- Pushed all NEXUS work (87 tracked files) to GitHub main. Verified remote tree contains src/lib/*, docs/*, data/sample_*.
- Created scripts/git-backup.sh: idempotent commit + pull(merge) + push. Tested no-op case.
- GPG commit signing: generated ed25519 signing key (no passphrase, headless-safe, ~/.gnupg/gpg.conf pinentry-mode loopback). Key ID 8D8015A4E4C4AF93, fingerprint C9F613A0F088BE4E5CD8FDD48D8015A4E4C4AF93. Uploaded to GitHub via API (gpg key id 5177423). Configured git user.signingkey + commit.gpgsign=true + gpg.program=/usr/bin/gpg.
- Tested signed commit: "Good signature" verified locally; GitHub API reports "verified": true.
- Created docs/GIT_BACKUP.md documenting remote, auth, identity, signing, gitignore policy, backup workflow, wipe-recovery.
- Updated STATE.md with git-backup section.

Stage Summary:
- Full anti-wipe backup operational: every commit is GPG-signed (Verified on GitHub) + pushed to specimba/NEXUS_OpsBoard_multi-lane_A2A_ACP_mirror main.
- Token stays in ~/.git-credentials (never tracked). Runtime state gitignored. Fresh clones start clean from sample seed.
- Recovery path documented in docs/GIT_BACKUP.md + docs/RESUME.md.
- NOTE: ssh-keygen unavailable in sandbox (no sudo); used GPG signing instead of SSH signing. GPG works headlessly via pinentry-mode loopback + no-passphrase key.

---
Task ID: ARCH-1
Agent: Architecture & Systems Design
Task: Analyze NEXUS OS architecture from extracted 3-part ZIP source

Work Log:
- Read strategic docs: NEXUS_OS_STATUS_REPORT.md (787 lines, full), nexus_os/CANONICAL_STRUCTURE.txt, SOUL.md, 01_PROJECT_STATE.md, HEARTBEAT.md, worklog.md (source-tree copy).
- Read bridge layer: nexus_os/bridge/{server.py (681L), sdk.py (465L), secrets.py (321L), mcpaauth.py (256L)}.
- Read engine layer: nexus_os/engine/{executor.py, router.py, hermes.py, forge.py, skillsmith.py}.
- Read team/coordinator.py (1085L — first 600 lines), package.json, Caddyfile (port 81 reverse proxy with dynamic port redirect).
- Read fusion-pack/: NEXUS_FUSION_PACK.md, API_CONTRACTS.md, WIRED_VS_MOCKED.json. Cross-checked sibling glm5-fusion/ pack (PACK_MANIFEST.md).
- Spot-checked supporting modules: governor/{base.py, trust_engine_v2.py}, vault/manager.py, swarm/foreman.py, gmr/rotator.py, db/manager.py, cron/agent_cycle.py, nexus-scan.py.

Key Findings:
- Bridge = JSON-RPC 2.0 over HTTP, HMAC-SHA256 auth (SecretStore), KAIJU 4-var authz, FastAPI mount via create_app(). Methods: tasks/submit, tasks/status, vault/read, vault/write, a2a/agent-card.
- Two parallel auth systems declared but only one live: bridge/server.py uses SecretStore (HMAC); bridge/mcpaauth.py declares RBAC + API keys + rate-limit fields but is NOT wired into server.py. Rate-limit field in APIKey is declared, never enforced.
- BridgeServer vault/read and vault/write handlers are stubs (return empty records / fake record_id) — VaultManager is NOT wired into the bridge.
- AsyncBridgeExecutor.execute() returns "not implemented" (TODO at executor.py:117). Only MockExecutor + SyncCallbackExecutor actually run.
- EngineRouter implements DFS-based DAG cycle detection for task dependencies. SQLite-backed.
- HermesRouter has TWO ModelProfile classes (one in hermes.py, one in gmr/rotator.py) — both with flexible __getattr__ for V2/V3 legacy compat. Migration incomplete.
- SkillSmith (skillsmith.py) is a compat shim over skill_smith.py (canonical). Auto-forges skills after 3+ executions at >=0.85 success rate, using first-2-words prompt prefix as regex pattern.
- Forge = Qualixar-inspired YAML declarative team design (team + agents + workflow). TeamSpec.validate() checks role refs + sequential steps.
- TeamCoordinator dispatches via .task.md files to OpenClaw worker queues (~/.openclaw/agents/{worker}/tasks/{pending,done,failed}/). Two default workers: glm5-worker-1 (code/analysis/reasoning), glm5-worker-2 (code/operations/security).
- Frontend/Backend split: Next.js dashboard (port 3000) talks DIRECTLY to Prisma/SQLite (12 models), bypassing the Python backend. Python governance API (port 7352 per state doc) is NOT wired to dashboard — listed as P0 blocker.
- fusion-pack/ is a documentation/audit pack (not code). Sibling glm5-fusion/ is the team-published variant with screenshots. Both map every component to backend contract + wired-vs-mocked status. Biggest gap documented: Overview Tab ignores real /api/system endpoint.
- DB strategy: SQLite via Prisma (frontend) + sqlite3 via DatabaseManager v3 (Python). Both can use SQLCipher for encryption. threading.local() per-thread connections (fixes FastAPI crash). WAL mode + NORMAL sync.
- 7-agent roster: SPECI (architect, branch protect), CODEX (bridge/db/scripts), NEO (vault/OPUSman), GLM5.1 (dashboard wiring), OSMAN (audit), GROK420 (false-completion detection), OPENcode (swarm/OpenClaw). Workspace model: main PROTECTED + per-agent experimental branches (.codex/, .openclaw/, .pi/, .research/).

Stage Summary:

A. SYSTEM TOPOLOGY
==================

The NEXUS OS stack is a 4-process topology behind a reverse proxy:

| Process | Port | Tech | Role |
|---|---|---|---|
| Next.js Dashboard | 3000 | Next.js 16.1.3 + React 19 + Prisma + SQLite | Frontend + 19 API routes |
| Swarm WebSocket | 3003 | Socket.io mini-service (mini-services/swarm-ws/index.ts) | Real-time swarm event push (5 channels, 3-8s intervals) |
| Python Governance API | 7352 (target) / 8000 (default in code) | FastAPI via bridge/server.py::create_app() | Canonical governance brain (JSON-RPC 2.0) |
| TWAVE wrapper | 7353 | HTTP | Low-VRAM execution wrapper (HOLD status) |
| Ollama | 11434 | HTTP | Local model inference (internal only) |
| Caddy | 81 | Reverse proxy | Routes via XTransformPort query param or default to :3000 |

CRITICAL ARCHITECTURAL SPLIT: The Next.js dashboard does NOT call the Python governance API. It calls Prisma/SQLite directly via /api/* route handlers. The Python nexus_os/ package exists in parallel as the canonical governance brain but is unwired — listed as P0 blocker #2 in 01_PROJECT_STATE.md ("Dashboard/relay still needs real governance API wiring"). This means there are effectively TWO governance implementations (TypeScript /api/governor/route.ts + Python nexus_os/governor/) and TWO SQLite stores (Prisma-managed + Python-managed) with no synchronization.

The bridge layer (nexus_os/bridge/) is the Python-side ingress: a JSON-RPC 2.0 server with HMAC-SHA256 auth + KAIJU 4-variable authz + TaskExecutor dispatch. It is designed to be the A2A protocol boundary for external agents. Currently the bridge is reachable in tests but the production dashboard bypasses it entirely.

B. 8-PILLAR ARCHITECTURE -> PYTHON MODULES
==========================================

| Pillar | Python Package | Key Modules | Implementation Status |
|---|---|---|---|
| Bridge | nexus_os/bridge/ | server.py (JSON-RPC FastAPI), sdk.py (NexusClient + CircuitBreaker + RetryPolicy), secrets.py (SecretStore + per-provider API key pools), mcpaauth.py (MCPAuth RBAC, NOT wired), vault.py (referenced) | Auth/routing scaffolding complete; vault/read+write handlers are STUBS; AsyncBridgeExecutor TODO |
| Engine | nexus_os/engine/ | executor.py (TaskExecutor + 3 backends), router.py (DAG w/ cycle detection), hermes.py (intent+experience routing w/ GMR), forge.py (YAML team design), skillsmith.py (compat shim), skill_smith.py (canonical), skill_adapter.py, tool_discipline.py, hermes_experience.py, heartbeat.py | Real Executor v2 with pluggable backends; Bayesian-smoothed experience scoring; cost-aware model selection |
| Governor | nexus_os/governor/ | base.py (NexusGovernor), trust_engine_v2.py (HARDWALL + 6-stage CDR), trust_scoring.py, compliance.py, kaiju_auth.py (4-var authz), proof_chain.py (VAP), autoharness.py | TrustEngine v2.2 operational; logistic scaling + non-compensatory CRITICAL + adaptive temporal decay |
| Vault | nexus_os/vault/ | manager.py (5-track: event/trust/capability/failure_pattern/governance), memory.py, memory_tracks.py, memory_adapter.py (Mem0), trust.py, trust_store.py, cache.py, decay_worker.py, poisoning.py | Canonical 5-track schema verified; hash-chained entries; SQLCipher hard-fail encryption |
| GMR | nexus_os/gmr/ | rotator.py (GeniusModelRotator dual-pool FAST/PREMIUM), scheduler.py, circuit_breaker.py, savings.py, domain_mapping.py, telemetry.py, trust_adapter.py, context_packet.py | Dual-pool zero-context-loss rotator; intent classifier with 6 categories |
| Swarm | nexus_os/swarm/ | foreman.py (Worker pool + 15min heartbeat), worker.py, auction.py (task bidding), openclaw_spawner.py | v3.1: process() distributes tasks to ALL idle workers concurrently |
| Monitor | nexus_os/monitoring/ + nexus_os/observability/ | token_guard.py (TokenGuard + quick_track), counters.py, strategies.py, trust_scorer.py; tracing.py, squeez.py (log compression) | TokenGuard integrated into BridgeServer (budget gate + tracking headers) |
| Config | (implicit) | No dedicated package — config via SystemConfig DB table + env vars + SecretStore JSON file + HEARTBEAT.md moveable strategy | Distributed across packages; no single config service |

C. MULTI-AGENT TEAM STRUCTURE
==============================

7-AGENT ROSTER (v3.2 aligned, per STATUS_REPORT section 2.1):

| Team | Agent | Role | Owns |
|---|---|---|---|
| SPECI | speci (human) | Architecture, branch protection, Phase 0 gate | All canonical paths (READ+WRITE main) |
| CODEX | CODEX | Port standardization, pre-commit hooks, benchmarks | nexus_os/bridge/, nexus_os/db/, scripts/ |
| NEO | NEO | OPUSman v6.2 integration, Vault/5-track wiring | nexus_os/governor/, nexus_os/vault/ |
| GLM5.1 | GLM | Dashboard wiring to real NEXUS API data | src/components/nexus/tabs/, src/app/api/ |
| OSMAN | Qwen3.6 | Architectural audit, Phase 0 blockers | Review only |
| GROK420 | Grok 4.3 | Task verification, false-completion detection | tasks/pending/, tasks/done/ |
| OPENcode | OPENcode | OpenClaw spawner, swarm management | nexus_os/swarm/openclaw_spawner.py |

WORKSPACE/BRANCH MODEL (per CANONICAL_STRUCTURE.txt):
- main <- CANONICAL, SPECI-only (PROTECTED)
- codex/specimba/* <- CODEX experimental (merged)
- codex/experimental <- CODEX new experiments
- openclaw/experimental, pi/experimental, research/experimental <- per-team branches
- All agents READ from src/nexus_os/ (READ-ONLY for non-SPECI agents)
- All agents WRITE to own workspace (.codex/, .openclaw/, .pi/, research/)
- Commit to own experimental branch -> PR -> SPECI reviews -> merge to main
- Git workflow: COMMIT after feature/bugfix/test/doc; TAG v3.0.0-beta current

AGENT INTERACTION MODEL:
- TeamCoordinator (team/coordinator.py) is the central dispatch hub
- dispatch() pipeline: (1) query mem0 for past experience -> (2) classify via Hermes (domain+complexity) -> (3) check skill registry for fast-path -> (4) select worker by availability+ability -> (5) write .task.md to worker's pending queue -> (6) monitor for completion -> (7) record outcome to Hermes + mem0
- Default workers: glm5-worker-1 (code/analysis/reasoning), glm5-worker-2 (code/operations/security)
- File-driven coordination: tasks live in ~/.openclaw/agents/{worker}/tasks/{pending,done,failed}/*.task.md — NOT in prompts. Token-efficient.
- Trust scoring: worker.trust_score *= 0.9 + 0.1 on success; *= 0.8 on failure (incremental decay toward 1.0 / 0.0)
- Stalled-task detection: STALL_THRESHOLD = 10 minutes
- SOUL.md constraint: cloud agent CANNOT use local GPUs — must delegate to Local Agent via .task.md files in handoff/to_local/, using Git as the communication bus (no direct localhost connections)

D. MCP INTEGRATION ARCHITECTURE
================================

The MCP (Model Context Protocol) access layer is defined across three files:

1. bridge/mcpaauth.py — RBAC + API key authentication
   - 4 roles: ADMIN / OPERATOR / READONLY / GUEST
   - 6 AuthResults: OK / INVALID_KEY / EXPIRED / RATE_LIMITED / FORBIDDEN / NOT_FOUND
   - APIKey dataclass: key_id, key_value, role, agent_id, created_at, expires_at, rate_limit (declared but UNUSED), request_count
   - Permission map (method-based): tasks/submit->tasks:write, tasks/status->tasks:read, vault/write->vault:write, vault/read->vault:read, a2a/agent-card->a2a:read
   - Role permissions (with wildcard support): ADMIN={*}, OPERATOR={tasks:*, vault:*, a2a:*}, READONLY={tasks:read, vault:read, status:*}, GUEST={status:read}
   - 3 default keys hardcoded: admin-001, operator-001, readonly-001
   - Singleton via get_mcp_auth() with double-checked locking (threading.Lock)
   - GAP: rate_limit field is declared but authenticate() never enforces it
   - GAP: mcpaauth.py is NOT imported by bridge/server.py — two parallel auth systems exist

2. bridge/server.py — JSON-RPC 2.0 governance server
   - BridgeServer wraps FastAPI via create_app()
   - 5 methods: tasks/submit, tasks/status, vault/read, vault/write, a2a/agent-card (A2A v1.1)
   - Endpoints: POST /tasks/submit, POST /tasks/status, POST /vault/read, POST /vault/write, POST / (JSON-RPC router), GET /health
   - Auth: HMAC-SHA256 signature via X-Nexus-Signature header (uses SecretStore, NOT MCPAuth API keys)
   - Authz: KAIJU 4-variable (scope x clearance, impact x clearance, intent x action) via NexusGovernor.check_access()
   - Token guard: pre-check 1000-token budget -> 429 if exceeded; tracks input/output tokens via TokenGuard; non-blocking on failure
   - JSON-RPC errors: -32700 ParseError, -32600 Method Not Allowed, -32601 Unknown Method, -32602 Invalid Params, -32603 Internal Error; HeldError -> HTTP 202 with hold_ticket
   - Response envelope: {jsonrpc: "2.0", result, trace_id, x-nexus-input-tokens, x-nexus-output-tokens}

3. bridge/sdk.py — NexusClient client SDK
   - HMAC-SHA256 request signing: signature = HMAC-SHA256(secret, "{secret}:{trace_id}:{payload}")
   - X-Nexus-* headers: Agent-ID, Project-ID, Trace-ID, Signature, Lineage-ID (optional)
   - RetryPolicy: max_retries=3, base_delay=1.0s, max_delay=30s, backoff_factor=2.0, retryable_codes=[429, 500, 502, 503, 504]
   - CircuitBreaker: states CLOSED/OPEN/HALF_OPEN, failure_threshold=5, recovery_timeout=60s, thread-safe via threading.Lock
   - Public API: submit_task, query_status, read_memory, write_memory
   - Uses urllib (not aiohttp) — sync-only by default; async mentioned as optional in docstring

HOW AN EXTERNAL MCP SYSTEM WOULD CONNECT:
1. Acquire an agent_id + secret from SecretStore (env var NEXUS_SECRET_{AGENT_ID} or secrets.json file or master-key derivation)
2. Register an API key with MCPAuth.register_key() — currently optional since server.py doesn't enforce it
3. POST to http://bridge-host:7352/ with body {"method": "tasks/submit", "description": "...", "context": {...}, "kaiju": {scope, intent, impact, clearance}}
4. Headers required: X-Nexus-Agent-ID, X-Nexus-Project-ID, X-Nexus-Trace-ID, X-Nexus-Signature, Content-Type: application/json
5. Response: JSON-RPC 2.0 envelope with task_id + status + token_usage

A2A v1.1: query via POST / with method="a2a/agent-card" returns AgentCard with capabilities, trust_band, negotiation_policies, status. NOTE: current _exec_agent_card() returns HARDCODED capabilities (code_generation, swarm_orchestration, governance_audit, memory_query, skill_discovery) — the docstring says "In production, this queries the Vault/Governor for dynamic, verified capabilities" but that wiring is not implemented.

E. KEY ARCHITECTURAL PATTERNS
==============================

1. DEPENDENCY INJECTION — All major subsystems accept their dependencies as constructor params:
   - BridgeServer(secret_store, governor, executor, token_guard)
   - TaskExecutor(db_manager, backend, trust_scorer, max_workers)
   - NexusGovernor(db, kaiju, compliance_engine, enable_cva, token_guard)
   - TeamCoordinator(project_root, db, openclaw_base)
   Defaults provided for optional deps, enabling standalone usage.

2. STRATEGY / PLUGGABLE BACKENDS — ExecutorBackend ABC with 3 implementations:
   - SyncCallbackExecutor (in-process Python callables, registered by task_type)
   - AsyncBridgeExecutor (REMOTE via Bridge — TODO, returns "not implemented")
   - MockExecutor (configurable delay + failure_rate, for testing)
   TaskExecutor.set_backend() allows runtime swap.

3. SINGLETON PATTERN — get_mcp_auth() in mcpaauth.py uses double-checked locking with threading.Lock() (lines 240-247).

4. THREAD SAFETY — Comprehensive:
   - CircuitBreaker: threading.Lock() around state mutations
   - Foreman: threading.Lock() around worker registry
   - MCPAuth: threading.RLock() around key registry
   - DatabaseManager v3: threading.local() for per-thread SQLite connections (fixes FastAPI crash)
   - VaultManager: threading.local() for per-thread connections
   - TaskExecutor: ThreadPoolExecutor(max_workers=4) for parallel task execution
   - All SQLite connections use check_same_thread=False + WAL journal mode + NORMAL synchronous

5. FORGE — DECLARATIVE TEAM DESIGN (Qualixar-inspired, arXiv:2604.06392):
   - ForgeLoader.load_file(path) / load_string(yaml) -> TeamSpec
   - TeamSpec: team_name + List[AgentSpec] + List[WorkflowStep] + metadata
   - AgentSpec: role, model, traits, clearance, agent_id (resolved at runtime)
   - WorkflowStep: step_number, agent_role, action, output_to (next|result), input_from (previous|step#)
   - TeamSpec.validate() checks: role references valid, steps sequential, >=1 agent, >=1 step
   - WorkflowStep.build_context() threads previous step results into next step's context
   - Usage: for step in team.workflow: result = engine.execute(...); step.set_result(result)

6. SKILL AUTO-DISCOVERY (SkillSmith):
   - skillsmith.py is a COMPAT SHIM — canonical impl lives in skill_smith.py
   - Auto-forges SkillRecord after min_executions (default 3) tasks with success_rate >= success_threshold (default 0.85)
   - Pattern extraction: takes first 2 words of prompt -> ^{word1} {word2}.* regex
   - HermesRouter.route() checks skills first as fast-path (bypasses GMR selection if matched_skill found)
   - SkillRecord stored in skill_registry dict + _task_history tracks per-(task_type, model) success history

7. BAYESIAN SMOOTHING (ExperienceScorer):
   - PRIOR_SUCCESS=10, PRIOR_FAILURE=2 prevent small-sample overfitting
   - score = (PRIOR_SUCCESS + successes) / (PRIOR_SUCCESS + successes + PRIOR_FAILURE + failures)
   - Falls back to model.quality_score (default 0.5) when no DB data
   - record_outcome() upserts into model_performance table (model_id, task_class, success_count, failure_count, total_latency_ms)

8. COST-AWARE MODEL SELECTION (CostOptimizer):
   - Trivial/Standard complexity -> cost-optimized (cheapest above quality_threshold=0.5)
   - Critical complexity -> prefer local models if available above threshold, else quality-first
   - Default -> highest score
   - Fallback: if no candidates above threshold, use highest-score model with "below threshold" reason

9. DAG-BASED TASK ROUTING (EngineRouter):
   - Tasks table: task_id, project_id, description, status, priority, context (JSON), heartbeat, timestamps
   - task_dependencies table: parent_task_id -> child_task_id
   - get_ready_tasks(): tasks with no deps OR all parent deps completed, ordered by priority DESC + created_at ASC
   - DFS-based cycle detection (_would_create_cycle) before adding dependencies — raises ValueError on cycle
   - Self-loop detection: parent_task_id == child_task_id rejected
   - Status states: PENDING, IN_PROGRESS, COMPLETED, FAILED, BLOCKED, CANCELLED

10. GRACEFUL DEGRADATION:
    - TeamCoordinator uses try/except ImportError for Mem0Adapter and SkillRegistry — falls back to Hermes-only routing
    - SecretStore lookup chain: in-memory overrides -> file secrets -> env vars -> master-key HMAC derivation -> SecretNotFoundError
    - TokenGuard tracking in BridgeServer is non-blocking: failures logged but never break requests
    - Vault read/write in BridgeServer return stubs (empty records / fake record_id) rather than 500

11. HARD-FAIL ENCRYPTION (db/manager.py v3):
    - EncryptedAdapter raises ImportError if pysqlcipher3 not installed
    - No silent fallback to plaintext unless allow_unencrypted=True explicitly passed
    - Production stance: encryption is mandatory; dev mode opts in to plaintext

F. WHERE FUSION BELONGS
========================

The fusion-pack is a DOCUMENTATION/AUDIT pack, NOT a code layer and NOT a parallel implementation.

Two fusion packs exist in the extracted dashboard-pack:
1. nexus-os-source/fusion-pack/ — INSIDE the source ZIP, alongside the code:
   - NEXUS_FUSION_PACK.md (350 lines): intake checklist, UI structure, strongest screens tier ranking, wired-vs-mocked map, API assumptions, differentiators, public-safe vs mock-dependent classification, known issues
   - API_CONTRACTS.md (208 lines): full request/response schemas for all 17 API routes
   - WIRED_VS_MOCKED.json (193 lines): machine-readable status map (14 components x {status, data_source, mutations_persist, backend_contract, public_safe, issues})
2. glm5-fusion/ — OUTSIDE the source ZIP (sibling directory at dashboard-pack/glm5-fusion/):
   - PACK_MANIFEST.md, UI_STRUCTURE.md, SCREEN_STRENGTHS.md, FUSION_RECOMMENDATIONS.md, API_ASSUMPTIONS.md, WIRED_VS_MOCKED.md
   - + screenshots/ directory with 8 PNG screenshots (00_overview, 01_governor, 02_research, 04_vault, 05_stresslab, 06_gmr, 07_tokens)

RELATIONSHIP: Both packs document the SAME v3.1 dashboard state from different angles. The in-source fusion-pack/ is the canonical structured assessment (with machine-readable JSON); the glm5-fusion/ is the GLM5 team-published snapshot (with screenshots) for handoff/review purposes.

ROLE: Fusion is a layer of METADATA about the source, not a code layer. It maps every UI component to its backend contract and identifies the biggest gap (Overview Tab ignores /api/system — entirely simulated). It is the due-diligence audit that should drive the next milestone: wiring the dashboard to the Python governance API.

G. ARCHITECTURE RISKS
=====================

1. PYTHON+TYPESCRIPT SPLIT (HIGHEST RISK):
   - Two languages, two runtimes, two type systems
   - Dashboard (Next.js) talks DIRECTLY to Prisma/SQLite — bypasses Python governance brain
   - Python backend (FastAPI on 7352) is canonical per SOUL.md but UNWIRED to dashboard
   - Effectively TWO governance implementations: TypeScript /api/governor/route.ts + Python nexus_os/governor/
   - Effectively TWO SQLite stores: Prisma-managed (12 models) + Python-managed (DatabaseManager v3)
   - HIGH RISK of drift, data inconsistency, duplicated business logic, divergent auth models
   - Listed as P0 blocker #2 in 01_PROJECT_STATE.md

2. SINGLE POINTS OF FAILURE:
   - SPECI is the only human who can merge to main — entire team's git workflow bottlenecks on one person
   - BridgeServer holds _task_results in-memory (Dict[str, Any]) — process restart loses all task state
   - No HA clustering, no replica, no failover for any service

3. SQLITE CHOICE:
   - Good: zero-config, file-based, encryption via SQLCipher, perfect for single-instance governance OS
   - Bad: writer is single-threaded, no read replicas, no clustering, won't scale beyond one node
   - threading.local() + check_same_thread=False is a workaround, not a real connection pool
   - WAL mode helps read concurrency but doesn't solve write contention
   - Two SQLite databases (Prisma + Python) risk schema drift

4. AUTH MODEL GAP (MCP INTEGRATION):
   - mcpaauth.py declares RBAC + API keys + rate limiting but is NOT wired into bridge/server.py
   - server.py uses only HMAC-SHA256 SecretStore auth — no role checks, no rate limiting
   - APIKey.rate_limit field is declared but never enforced in authenticate()
   - Two parallel auth systems will confuse external MCP integrators

5. STUB IMPLEMENTATIONS PRESENT:
   - BridgeServer._exec_vault_read returns empty records (line 564)
   - BridgeServer._exec_vault_write returns fake record_id without touching VaultManager (line 567)
   - AsyncBridgeExecutor.execute returns "not implemented" (executor.py:117)
   - _exec_agent_card returns hardcoded capabilities, not dynamic Vault/Governor query (server.py:520-532)
   - get_agent_card defined TWICE in server.py (lines 282 and 293) — dead code / merge artifact

6. PORT INCONSISTENCY:
   - 01_PROJECT_STATE.md: governance API on 7352
   - bridge/server.py: defaults to FastAPI's 8000
   - STATUS_REPORT: 7352 vs 7353 confusion flagged as TASK-007
   - Caddyfile uses port 81 with XTransformPort query param to redirect to arbitrary ports — flexible but unconventional; bypasses standard reverse proxy config; potential SSRF surface if XTransformPort is attacker-controllable

7. TOKEN ESTIMATION IS ROUGH:
   - input_tokens = len(body) // 4 (char-count heuristic)
   - output_tokens = len(str(response).encode()) // 4
   - Will drift from provider billing; not suitable for cost accounting

8. DUPLICATE ModelProfile:
   - hermes.py defines ModelProfile (lines 429-449)
   - gmr/rotator.py ALSO defines ModelProfile (lines 30-55)
   - Both use flexible __getattr__ for V2/V3 legacy compat
   - Code smell: V2->V3 migration incomplete; risk of behavior divergence depending on which ModelProfile is imported

9. WORKFLOW DELEGATION VIA GIT (HIGH LATENCY):
   - SOUL.md mandates "No direct localhost connections — use Git as the communication bus"
   - Cloud agent writes .task.md to handoff/to_local/, pushes; local agent pulls, executes, pushes back
   - Round-trip latency in minutes, not milliseconds — unsuitable for real-time control
   - File-driven dispatch (TeamCoordinator) is brittle: no acknowledgment, no retry, no idempotency guarantees
   - If local agent is offline, tasks pile up indefinitely with no escalation

10. TEST SUITE DRIFT:
    - 586 tests collected, 2 collection errors (trust_scoring, token_guard import path issues)
    - COLDSTART_BOOT.txt shows 635->622 test count drift (per STATUS_REPORT section 8.3)
    - 1919 DoppelGround gitleaks unresolved (per STATUS_REPORT section 8.3)
    - Phase 0 not yet closed; 8 blockers listed

11. SECRET ROTATION PARTIAL:
    - SecretStore.rotate_api_key() rotates within a pool (round-robin)
    - No time-based rotation, no leak detection, no automated revocation on compromise
    - Master-key derivation is HMAC-SHA256 — fast but no per-agent salt; vulnerable if master key leaks

12. NO REAL EXTERNAL MCP INTEGRATION YET:
    - A2A v1.1 agent-card endpoint exists but returns hardcoded capabilities
    - No external MCP client has been demonstrated against the bridge
    - The bridge is technically reachable but production traffic is zero (dashboard bypasses it)

RECOMMENDED NEXT ACTIONS (priority order):
1. Wire dashboard /api/* routes to Python governance API on 7352 (closes P0 blocker #2)
2. Consolidate auth: wire mcpaauth.py into bridge/server.py OR remove it (eliminate dual-auth confusion)
3. Implement AsyncBridgeExecutor.execute() (currently TODO) — needed for Milestone 4+
4. Wire BridgeServer._exec_vault_read/write to VaultManager.store_track/retrieve_track
5. Standardize port: pick 7352 (per state doc) everywhere; update Caddyfile + bridge defaults
6. Consolidate ModelProfile — single canonical class in gmr/rotator.py, import from hermes.py
7. Replace char-count token estimation with real tokenizer (tiktoken or provider-native)
8. Add rate-limit enforcement to MCPAuth.authenticate() (field exists, logic missing)
9. Resolve DoppelGround gitleaks before any public repo flip (P0 blocker #1)
10. Add integration tests that exercise the bridge end-to-end with a real NexusClient

---
Task ID: DATA-1
Agent: Data Modeling & Metrics
Task: Audit Prisma schema, API routes, trust engine, vault, token monitoring, GMR, and metrics gaps for NEXUS OS dashboard

Work Log:
- Read prior ARCH-1 section (worklog.md lines 116-434) for context on dual-stack architecture.
- Read prisma/schema.prisma (203L, 12 models) — full schema audit.
- Listed src/app/api/ — found 15 route files (route.ts, proxy/route.ts, ai-bridge/route.ts, ai-bridge/providers/route.ts, rate-limit/status/route.ts + 10 top-level).
- Read all 16 API route handlers (system, governor, vault, swarm, models, stresslab, research, tokens, trust-engine, rate-limit/status, seed, settings, agents, ai-bridge, ai-bridge/providers, chat, proxy, root).
- Read nexus_os/governor/trust_engine_v2.py (548L — TrustEngineV2 + DangerLevel + CDRStage).
- Read nexus_os/governor/trust_scoring.py (259L — compute_score + LaneParams + MemoryTracks in-process).
- Read nexus_os/vault/manager.py (86L — VaultManager SQLite store).
- Read nexus_os/vault/memory_tracks.py (426L — 5-track MemoryTracker + CapabilityProfile + FailurePattern).
- Read nexus_os/monitoring/token_guard.py (599L — TokenGuard + AuditEntry + semantic cache + model routing).
- Read nexus_os/monitoring/strategies.py (63L — hot_path/warm_path decorators + SemanticCache). NOTE: counters.py NOT FOUND in extracted source — gap.
- Read nexus_os/gmr/rotator.py (463L — GeniusModelRotator + IntentClassifier + ModelProfile + GMRSelection + CircuitBreaker inline).
- Read nexus_os/gmr/circuit_breaker.py (59L — AdaptiveCircuitBreaker with 3-state machine + exponential backoff).
- Read nexus_os/gmr/domain_mapping.py (54L — 6-domain → primary+fallback map with real model names from registry).
- Read fusion-pack/WIRED_VS_MOCKED.json (192L — 14 components × {status, data_source, mutations_persist, backend_contract, public_safe, issues} + 19 api_routes + summary).

Key Findings:

A. PRISMA SCHEMA AUDIT (12 models, 203 lines)
==============================================

ALL 12 MODELS:
1. Agent — id (cuid), name, type (worker/coordinator/specialist), status (idle/busy/error/offline), domain?, trustScore (Float default 0.5), totalTokens, tasksDone, tasksFailed, lastActive, createdAt, updatedAt. Relations: vaultEntries[], decisions[], testRuns[]. NO INDEX on status/domain/trustScore.
2. VaultEntry — id, agentId, agent (FK), track (EVENT/TRUST/CAP/FAIL/GOV), category, key, value (JSON string), score (Float), createdAt. NO prevHash/chainHash field — NOT actually hash-chained at DB level. NO INDEX on track/agentId/createdAt.
3. GovernorDecision — id, agentId, agent (FK), action, scope (SELF/PROJECT/CROSS/SYSTEM), impact (LOW/MED/HIGH/CRIT), decision (ALLOW/DENY/HOLD), reason?, trustAtTime, createdAt. NO INDEX on agentId/createdAt/decision.
4. ModelEntry — id, name, provider, tier, domain, health, latencyMs, costPer1k, isFree, isActive, totalCalls, successRate, lastChecked, createdAt, updatedAt. NO INDEX on provider/domain/isActive. NO pool field (FAST/PREMIUM) — missing GMR pool concept.
5. TestTemplate — id, name, domain, tvdPrompt, validatorCode, skillGuide?, difficulty, sourceId?, isActive, createdAt, testRuns[]. NO INDEX on domain/isActive.
6. TestRun — id, templateId (FK), agentId? (FK), modelName, mode (single/icl/agentic), status (pending/running/passed/failed/error), output?, validatorResult?, tokensUsed, durationMs, collapseDetected, vapProofHash?, createdAt, completedAt?. NO INDEX on templateId/agentId/status/createdAt.
7. Paper — id, externalId?, type, title, pdfUrl?, repoUrl?, abstractSummary?, conclusionTakeaway?, relevanceScore, priorityTier (P0/P1/P2), nexusMapping? (JSON), keyNumbers? (JSON), implementationTask?, deliverable?, isVetted, createdAt, updatedAt. NO INDEX on priorityTier/externalId/type.
8. TokenUsageLog — id, agentId?, model, promptTokens, completionTokens, totalTokens, cost, apiEndpoint?, createdAt. NO INDEX on agentId/model/createdAt.
9. SessionBudget — id, totalBudget (100000 default), usedBudget (0), remainingBudget (100000), isActive, startedAt, endedAt?. NO unique constraint on isActive — risk of multiple active budgets. NO INDEX on isActive.
10. SystemConfig — id, key (@unique), value (JSON string), updatedAt. Properly indexed via @unique on key. Used for: constitution, nexus_state, governor_thresholds, danger_patterns, OPENROUTER_API_KEY, etc.
11. RateLimitLog — id, provider, endpoint, method, statusCode, wasRateLimited, wasCached, wasDeduped, responseTimeMs, tokensUsed, keyId?, errorMessage?, requestBody?, createdAt. NO INDEX on provider/createdAt/statusCode — performance risk for /api/rate-limit/status aggregations.
12. ApiKey — id, provider, keyPrefix (8 chars), keySuffix (4 chars), isActive, health (healthy/degraded/rate_limited/error/no_key), totalRequests, total429s, successRate, lastError?, cooldownUntil?, lastUsed?, createdAt, updatedAt. NO INDEX on provider/isActive. Key material is NOT stored (only prefix/suffix for identification) — security-positive design.

WELL-DESIGNED:
- SystemConfig (key/value JSON pattern flexible enough for any config; @unique constraint correct)
- Paper (rich metadata, separates paper vs repo types, JSON for nexusMapping/keyNumbers, priorityTier enum-validated in route)
- TestRun (collapses pass/fail/collapse/error semantics well; vapProofHash present; nullable completedAt allows in-flight tracking)
- ApiKey (prefix/suffix pattern never stores the actual key — proper secret hygiene)

NEEDS IMPROVEMENT:
- VaultEntry: claims 5-track schema but lacks chainHash/prevHash fields — vault chain verification in route.ts only checks timestamp monotonicity + JSON parse + score range, NOT cryptographic chaining. Python VaultManager uses UNIQUE(agent_id, lane, track_type, key) upserts — NOT append-only chain. Two parallel vault designs.
- SessionBudget: no enforcement that exactly one row has isActive=true; /api/tokens POST uses findFirst({where:{isActive:true}}) — silently uses first match if multiple. No historical budget tracking (endedAt populated but never queried for trends).
- RateLimitLog: no indexes — full-table scans on /api/rate-limit/status getAllStatus() loop over all providers with findMany({take:100, orderBy:createdAt:desc}). Will degrade as logs grow.
- Agent: trustScore is single Float — does NOT model lane-scoped trust (Python trust_engine_v2 has per-lane TrustRecord:score with separate convergence/regression/cdr per lane). Dashboard displays ONE score per agent — loses lane resolution.
- ModelEntry: missing pool (FAST/PREMIUM) field — GMR tab has to hardcode pool assignments because schema doesn't model them. Missing circuit_breaker_state field for tracking OPEN/HALF_OPEN/CLOSED per model.
- GovernorDecision: missing lane field — decisions can't be filtered by governance lane (research/review/audit/impl). missing CDR stage at decision time. missing danger_level (SAFE/CAUTION/RESTRICTED/HIGH_RISK/CRITICAL).
- TestRun: missing actualTokens vs tokensUsed distinction. tokensUsed is `output.split(/\s+/).length * 1.3` heuristic (word-count * 1.3) — NOT real tokens. Missing model_pool field (FAST/PREMIUM) — can't slice "did PREMIUM pool handle X% of test runs".
- TokenUsageLog: missing operation_type (Task delegation / Skill / Memory query / Inference / Governance / Audit) — Python OperationType enum has 6 categories; Prisma has none.

MISSING MODELS (high-priority gaps):
1. TrustHistory (time-series) — agent_id, lane, score, delta, cdr_stage, danger_level, regression_events, convergence_turns, recorded_at. Currently the dashboard /api/trust-engine recomputes lane trust from Agent.trustScore with hard-coded lane modifiers (-0.05/+0.0/+0.02/-0.03). Python trust_engine_v2 keeps history_delta list in-memory + persists only "current" key to vault. NO time-series table for charting trust trajectory over hours/days.
2. RotationEvent — task_id, agent_id, intent_category, pool_selected, primary_model, fallback_models[], model_used, handoff_count, success, tokens_used, cost_saved, savings_reason, trace_id, recorded_at. GMR rotator.execute_with_fallback already calls savings.record() but no Prisma persistence. GMR tab hardcodes rotation log because no model exists.
3. FailoverEvent — model_name, failure_count_at_trip, circuit_state_before, circuit_state_after, cooldown_seconds, recovery_attempts, recovered_at, recorded_at. Python AdaptiveCircuitBreaker logs to Python logger but no Prisma table. GMR tab hardcodes failover log.
4. ActivityFeed — id, kind (decision/vault/rotation/failover/test_run/token_warning/rate_limit/seed), actor_id, summary, severity, payload (JSON), created_at. Overview tab pillar activity feed is SIMULATED because no unified activity table exists. Each /api/* could write to ActivityFeed for a real cross-cutting timeline.
5. ProviderHealthSnapshot — provider, latency_p50_ms, latency_p95_ms, success_rate_5m, success_rate_1h, rate_limit_remaining, cooldown_active, recorded_at. Currently /api/rate-limit/status does live aggregation over RateLimitLog on every GET — should be pre-aggregated into 1-minute/5-minute/1-hour snapshots for chart performance.
6. SkillRecord — agent_id, lane, pattern (regex), success_count, failure_count, success_rate, sample_prompts[], auto_forged, last_matched_at. Python SkillSmith tracks this in-memory + skill_registry dict; no Prisma persistence. Means skills are lost on Next.js process restart.
7. ConstitutionAudit — change_id, key, old_value, new_value, changed_by, changed_at, ip, user_agent. Settings PUT mutates SystemConfig with no audit trail — any operator can change OPENROUTER_API_KEY or governor_thresholds silently.
8. ChatMessage — session_id, role, content, model_used, tokens_in, tokens_out, latency_ms, created_at. WIRED_VS_MOCKED.json confirms "Chat messages in Zustand only (not DB)". Conversation context lost on page refresh.
9. VaultChainEntry (or augment VaultEntry) — add prev_hash, entry_hash, signature fields for actual cryptographic chain. Current vault verify_chain endpoint just checks timestamps + JSON parses — NOT a tamper-evident chain.

B. API ROUTE INVENTORY (15 files, 19 endpoints per WIRED_VS_MOCKED summary)
==========================================================================

| Route | Method(s) | Prisma Models Touched | Wired/Mock Per JSON | Notes |
|---|---|---|---|---|
| /api (root) | GET | none | n/a | Hello world stub |
| /api/system | GET | Agent, ModelEntry, TestTemplate, Paper, SessionBudget, SystemConfig, GovernorDecision, TestRun, VaultEntry, TokenUsageLog (11 of 12 models) | WIRED (real data) but consumed_by: NONE — biggest fusion-pack gap | Computes pillars/stats/agentActivity/tokenHistory/healthTimeline/collapseRateTrend; some functions (computeAgentActivity, computeHealthTimeline) use sin-wave + seededRandom to fake weekly hourly time-series from point-in-time data |
| /api/agents | GET | Agent | WIRED | Bare list, no relations |
| /api/governor | GET, POST | GovernorDecision (R+W), Agent (R), SystemConfig (R+W for governor_thresholds, danger_patterns) | WIRED | POST actions: appeal, update_threshold, add_pattern. Appeal creates HOLD decision referencing original. No actual TrustEngine computation — thresholds are pure JSON config; decisions are pre-existing seed rows |
| /api/vault | GET, POST | VaultEntry (R+W via include Agent) | WIRED | GET returns latest 100 entries. POST action: verify_chain (only action). Verification is weak: checks timestamp monotonicity, JSON parse, score range — NO cryptographic chain. No filter by track/agent in GET (always returns latest 100) |
| /api/swarm | GET, POST | Agent (R+W), VaultEntry (W), SystemConfig (R for maxAgents) | WIRED | POST actions: reassign_task, terminate_worker, restart_worker, spawn_worker, update_trust. spawn_worker enforces maxAgents limit from constitution. Every action writes a VaultEntry (EVENT track) for audit trail. update_trust clamps to [0,1]; computes delta = newScore - oldScore. NO circuit breaker, NO skill verification, NO real Python swarm Foreman dispatch — these are DB-only state changes |
| /api/models | GET, POST | ModelEntry (R+W) | WIRED | POST actions: toggle, health_check, batch_health_check. health_check actually pings ZAI SDK with "respond with OK" prompt, measures latency, updates health/latencyMs/successRate/totalCalls. Batch is sequential (for loop). ZAI is the only provider exercised — does NOT test OpenRouter/Cerebras/Jina models even though they're in seed data |
| /api/stresslab | GET, POST | TestTemplate (R), TestRun (R+W), Agent (R for idle agent), TokenUsageLog (W) | WIRED — "strongest component" per fusion-pack | POST actions: run_test, batch_run. Real ZAI SDK call. validateResponse() does refusal-pattern detection + word-count scoring + domain-keyword matching (heuristic, not the validatorCode field which is unused). vapProofHash = `vap-{runId.slice(0,8)}-{Date.now().toString(36)}` — NOT a cryptographic hash, just a unique ID. tokensUsed = `output.split(/\s+/).length * 1.3` — word-count heuristic (1.3x multiplier). |
| /api/research | GET, PUT | Paper (R+W) | WIRED | GET returns papers + P0/P1/P2 bucketed. PUT updates priorityTier/isVetted/implementationTask only. No POST to add new papers, no DELETE, no Alphaxiv fetch despite docs suggesting research pipeline. NO external arXiv/Alphaxiv API call — papers must be seeded manually |
| /api/tokens | GET, POST | SessionBudget (R+W), TokenUsageLog (R+W), Agent (R+W) | WIRED | POST action: log_usage. Updates budget.usedBudget/remainingBudget. Updates Agent.totalTokens. NO budget enforcement — caller is trusted to log AFTER use. No pre-check endpoint. No cost computation (cost: 0 default in stresslab). |
| /api/trust-engine | GET | Agent (R), GovernorDecision (R) | WIRED | Returns trust_matrix + cdr_stages + cdr_distribution + danger_levels + health_summary + hardwall_config. Computes lane trust via `trust + lane_modifier` (audit=-0.05, review=0.0, impl=+0.02, research=-0.03) — PURELY LOCAL HEURISTIC, not Python trust_engine_v2 logic. CDR thresholds: <0.15=COLLAPSE, <0.30+5 regressions=HALLUCINATION, <0.30=DEGRADED, 3+ regressions + <0.50=MEMORY_CORRUPTION. hardwall_config returned is constant dict (baseline=0.25, max=0.995, success_delta=0.04, failure=-0.10, critical=-0.20, logistic_center=0.50, steepness=0.10, decay_lambda=0.02, collapse=0.15, escalation=0.30). The Python class USES the same constants but the dashboard never calls it. |
| /api/rate-limit/status | GET | RateLimitLog (R), plus in-memory rate-limiter/api-key-manager/api-cache | WIRED | Aggregates by provider, computes hourlyUsage via groupByHour. cacheStats/dedupStats/queueDetails come from in-memory modules (lost on restart). N+1 query pattern: loops over PROVIDER_RATE_LIMITS keys doing findMany per provider (6 providers × 100 rows each). |
| /api/seed | POST | Agent, ModelEntry, TestTemplate, Paper, SessionBudget, SystemConfig (all W) | WIRED | Seeds 5 agents, 8 models, 5 templates, 6 papers, 1 budget, 2 system configs. NOT idempotent (no upsert — calling twice creates duplicates). Seeds OPENROUTER_API_KEY placeholder? Actually no — only constitution and nexus_state |
| /api/settings | GET, PUT, DELETE | SystemConfig (R+W+D) | WIRED | Generic key/value store. PUT upserts by key. DELETE removes by key. Stores OPENROUTER_API_KEY, OPENAI_API_KEY, CEREBRAS_API_KEY, JINA_API_KEY, KILOCODE_API_KEY as plaintext JSON values — NO ENCRYPTION at rest. (Prisma SQLite by default is unencrypted.) |
| /api/ai-bridge | GET, POST | none directly (uses in-memory ai-provider-bridge module) | WIRED | GET: route list + provider statuses + summary. POST: routes chat through z-ai (direct SDK) OR openrouter (fetch with API key from api-key-manager). Falls back to ZAI on OpenRouter 429/error. Updates route health (in-memory). Does NOT log to TokenUsageLog or RateLimitLog — silent usage. |
| /api/ai-bridge/providers | GET, POST | none directly | WIRED | GET: provider statuses + summary. POST: health check single provider via healthCheckProvider(). |
| /api/chat | POST | none | WIRED | Single ZAI SDK call with hardcoded NEXUS system prompt. No message persistence. No token logging. No rate limit. |
| /api/proxy | GET, POST | RateLimitLog (W via logToDatabase) | WIRED | POST: external API proxy with cache→dedup→rate-limit→forward→log pipeline. Logs to RateLimitLog. recordKey429/recordKeyError/recordKeySuccess mutate in-memory api-key-manager state. processQueue() drains queue on successful response. extractTokensUsed() reads response.usage.total_tokens. |

Wired/Mock Classification Per fusion-pack/WIRED_VS_MOCKED.json:
- WIRED (8): stresslab-tab, governor-tab, vault-tab, research-tab, swarm-tab, tokens-tab, rate-limit-tab, ai-assistant, command-palette
- WIRED+MOCK (1): gmr-tab (real /api/models + hardcoded pools/rotation/failover/AI bridge routes)
- SIMULATED (2): overview-tab (ignores /api/system entirely), system-logs (hardcoded templates)
- MOCK (1): notification-center
- 17 of 19 API routes serve real data; 15 are actually consumed by UI; /api/system is the biggest gap (real but unused)

C. TRUST ENGINE v2.2 DEEP DIVE
==============================

PYTHON CANONICAL (nexus_os/governor/trust_engine_v2.py — TrustEngineV2 class):
- Constants: BASELINE_SCORE=25.0, MAX_SCORE=99.5 (asymptotic plateau — never reaches 100), MIN_SCORE=0.0, SUCCESS_BASE_DELTA=4.0, FAILURE_DELTA=-10.0, CRITICAL_DELTA=-20.0, LOGISTIC_CENTER=50.0, LOGISTIC_STEEPNESS=10.0, BASE_DECAY_LAMBDA=0.02, CONVERGENCE_THRESHOLD=0.5, CDR_ESCALATION_TRUST=30.0, CDR_COLLAPSE_TRUST=15.0, MAX_HISTORY_LENGTH=100
- 5-STEP UPDATE PIPELINE (update_trust method, lines 240-349):
  1. ADAPTIVE TEMPORAL DECAY: lambda(t) = base_lambda * (1 + validator_disagreement_rate). decay_amount = lambda * (score - baseline). new_score = max(baseline, min(MAX_SCORE, score - decay)). Decay NEVER pulls below baseline (only excess decays).
  2. DELTA CALCULATION: if !success: delta = -10 (FAILURE_DELTA), regression_events++. else: delta = SUCCESS_BASE_DELTA * logistic_scale(score, difficulty). logistic_scale: 1/(1+exp(-(T-50)/10)) * difficulty. At T=25 (baseline), logistic = 1/(1+exp(2.5)) ≈ 0.075 → success gain ≈ 0.3 points. At T=50, logistic = 0.5 → gain = 2 points. At T=90, logistic = 1/(1+exp(-4)) ≈ 0.98 → gain = 3.92 points. **WAIT — this means gains are SMALL at low trust and LARGER at high trust, contradicting the docstring "logistic scaling prevents gaming"**. The actual behavior is the opposite: low-trust agents barely recover, high-trust agents accelerate. The "anti-gaming" framing is questionable.
  3. NON-COMPENSATORY CRITICAL: if danger == CRITICAL: delta = -20 (CRITICAL_DELTA, hard block), regression_events++, force cdr_stage to at least CASCADE. This overrides any success — even a successful CRITICAL action reduces trust by 20. This is the "non-compensatory" property.
  4. APPLY DELTA + TRACK PEAK: new_score = max(MIN, min(MAX, score+delta)). Update peak_score. Append delta to history_delta (kept at last 100).
  5. CDR STATE MACHINE (_update_cdr_stage): if score < 15 → COLLAPSE. Else if should_escalate(current_stage, score, regressions) → next_stage(). should_escalate rules: NORMAL+score<30 → DEGRADED; DEGRADED+regressions>=3 → MEMORY_CORRUPTION; MEMORY_CORRUPTION+score<20 → HALLUCINATION; HALLUCINATION+regressions>=5 → CASCADE. Recovery: if score>50 AND cdr_stage>NORMAL AND regression_events==0 AND convergence_turns>5 → step down one stage.
- VELOCITY CALC (_calculate_velocity): weighted average of last 10 history_delta values, weights 1..10 (more recent = higher weight). Returns absolute value.
- VAULT PERSISTENCE: store_track(agent_id, lane, "trust", "current", payload) where payload = {score, last_updated, convergence_turns, regression_events, cdr_stage, validator_disagreement_rate, total_validations, peak_score, history_delta[-20:]}. NOTE: "current" is a SINGLE KEY per agent:lane — overwrites prior state. Only last 20 deltas persisted. So the vault is NOT a chain — it's a current-state cache.
- TRUST MATRIX OUTPUT: agent_id, lane, trust (rounded 2dp), cdr_stage, cdr_severity, convergence_turns, regression_events, total_validations, peak_score, trust_velocity.

CDR 6 STAGES (CDRStage enum):
  0=Normal, 1=Degraded Reasoning, 2=Memory Corruption, 3=Output Hallucination, 4=Cascade, 5=Collapse. Severity = index in order.

DANGER 5 LEVELS (DangerLevel enum):
  0=SAFE, 1=CAUTION, 2=RESTRICTED, 3=HIGH_RISK, 4=CRITICAL. CRITICAL is the only one with hard-block semantics.

PARALLEL trust_scoring.py (HOT-PATH IMPL — 259 lines):
- compute_score(inp, lane_params) — separate formula using LANE_PARAMS (qmin, n0, Rcrit, alpha, beta, gamma, eta, kappa, delta, epsilon) per lane (RESEARCH, REVIEW, AUDIT_SECURITY, COMPLIANCE, IMPLEMENTATION, ORCHESTRATION, SYNTHESIS).
- Formula: q_gated = (Q - qmin) / (1 - qmin); Qeff = q_gated * (1 - exp(-n/n0)); P = alpha*U + gamma*D_plus - beta*R - eta*D_minus; raw_score = tanh(kappa * Qeff^delta * P); score = 0 if |raw_score| < epsilon else raw_score. Invariant: -1 <= score <= 1.
- INVARIANTS: inv1 (blocked/unassigned/not_applicable → None), inv2 (hard_fail → -1 + ESCALATED), inv3 (score in [-1, 1]).
- MemoryTracks class is in-process (no DB persistence). update_trust uses Beta-Binomial: alpha += Qeff*max(score,0); beta += Qeff*(max(-score,0) + 0.5*hard_fail). get_trust = alpha/(alpha+beta).
- Authority band: >0.8 trust + strong capability = "elevated"; <0.3 or >5 failure patterns = "restricted"; else "standard".
- THREE PARALLEL TRUST SYSTEMS:
  1. trust_engine_v2.py (TrustEngineV2) — logistic + decay + CDR, persisted to vault
  2. trust_scoring.py (compute_score + TrustScoringGate) — Beta-Binomial + lane params, in-memory only
  3. /api/trust-engine/route.ts — dashboard computes lane trust with hard-coded `trust + modifier` heuristic, returns CDR via simple thresholds

DASHBOARD TRUST DISPLAY (/api/trust-engine):
- Reads Agent.trustScore (single Float) + GovernorDecision history.
- Computes regressions = denied_count + high_impact_count.
- Computes lane_trust = clamp(trust + lane_modifier, 0, 0.995) where audit=-0.05, review=0.0, impl=+0.02, research=-0.03.
- Computes CDR via simple if-tree (matching Python thresholds).
- Returns hardwall_config as static dict — dashboard claims to expose Python constants but doesn't actually run Python.
- agentActivity, peak_trust = min(0.995, trust + 0.05) — fake "peak" computation.
- disagreement_rate = min(1, regressions / total_decisions) — close to Python's validator_disagreement_rate concept but derived differently.

HOW TRUST FEEDS MODEL SELECTION (Python path):
- GeniusModelRotator.select() does NOT use trust directly. It uses budget_remaining + intent_category + domain_mapping to pick a cascade.
- TeamCoordinator (Python) uses worker.trust_score *= 0.9 + 0.1 on success; *= 0.8 on failure — DIFFERENT formula than trust_engine_v2 (which uses logistic scaling). Two trust update formulas in the Python codebase alone.
- /api/swarm route's update_trust action uses Math.max(0, Math.min(1, agent.trustScore + delta)) — third formula, additive with manual clamp.

GOVERNANCE FEED:
- /api/governor POST action 'appeal' creates a HOLD GovernorDecision referencing the original.
- /api/governor POST action 'update_threshold' writes governor_thresholds JSON to SystemConfig — read by GET but NOT enforced anywhere (no route checks "agent.trustScore < threshold.research → deny").
- Danger patterns are similarly stored but not matched against incoming requests — they're documentation, not enforcement.

D. VAULT 5-TRACK MODEL
=====================

PYTHON CANONICAL (vault/manager.py + memory_tracks.py):
- 5 TRACKS (MemoryTrack enum): EVENT (raw task outcomes), TRUST (per-lane Bayesian reputation), CAPABILITY (what agent is good at), FAILURE_PATTERN (recurring weaknesses), GOVERNANCE (behavior under rules).
- VAULT SCHEMA (vault/manager.py): SQLite table `agent_memory_tracks` with columns: id (autoincrement), agent_id, lane, track_type (CHECK in ('event','trust','capability','failure_pattern','governance')), key, value (JSON), updated_at. UNIQUE constraint on (agent_id, lane, track_type, key). UPSERT pattern: INSERT ... ON CONFLICT ... DO UPDATE.
- 5-TRACK IN-MEMORY (memory_tracks.py MemoryTracker class):
  - EVENT: append_event(agent_id, content, outcome, duration_ms, token_count, trace_id, project_id). Stored in _buffers[agent_id][EVENT][].
  - TRUST: append_trust(agent_id, lane, trust_score, evidence_count, content, trace_id). Lane validated against VALID_LANES = {research, audit, compliance, implementation, orchestration, general}.
  - CAPABILITY: append_capability(agent_id, skill_tags, confidence, content). Updates CapabilityProfile via EMA: store[tag] = 0.7*old + 0.3*confidence. Categories: languages (python/javascript/rust/go/typescript), domains (code/research/analysis/security), tools (everything else).
  - FAILURE_PATTERN: append_failure(agent_id, failure_type, lane, content, trace_id). Cached in _failures[agent_id][failure_type] with frequency counter. Severity: >=5="high", >=2="medium", else="low".
  - GOVERNANCE: append_governance(agent_id, rule_violated, severity, content, trace_id).
- SINGLETON: get_tracker() returns global _tracker.

PRISMA VAULT (VaultEntry model):
- Fields: id, agentId (FK to Agent), track (String: EVENT/TRUST/CAP/FAIL/GOV — NOTE: short codes vs Python's full names), category, key, value (JSON string), score (Float), createdAt.
- CRITICAL MISMATCH: Python vault uses (agent_id, lane, track_type, key) composite key — UPSERT semantics. Prisma vault uses id (cuid) — APPEND semantics. Two completely different data models.
- NO CHAIN HASH: Prisma VaultEntry has no prev_hash/hash/signature fields. Python vault has no chain either (UNIQUE upsert). So "hash-chained" claim in fusion-pack/docs is ASPIRATIONAL not IMPLEMENTED.

CHAIN VERIFICATION (/api/vault POST action=verify_chain):
- Reads all VaultEntry rows ordered by createdAt ASC.
- Checks: entries exist, each has agentId, track, key, JSON-parseable value.
- Checks: timestamps monotonically non-decreasing.
- Checks: scores in [0, 1].
- Returns: {valid, entryCount, issues[]}.
- DOES NOT: recompute hashes, verify signatures, detect tampering, verify track-specific schema, verify lane references, check agent existence.
- This is NOT cryptographic verification — it's basic structural validation. A malicious actor with DB write access could rewrite any vault entry undetected.

BROWSE/FILTER (/api/vault GET):
- Returns latest 100 entries ordered by createdAt DESC.
- NO filter parameters (track, agentId, category, dateRange) — UI must filter client-side.
- Includes agent.name via Prisma relation.

POISONING DETECTION (nexus_os/vault/poisoning.py per ARCH-1):
- PoisoningError exception class declared in manager.py as minimal stub.
- Per ARCH-1 listing, vault/ contains poisoning.py file (54-line file in source tree). NOT WIRED into /api/vault route. Dashboard has no poisoning detection UI.

E. TOKEN BUDGET + MONITORING
============================

PRISMA MODELS:
- SessionBudget: totalBudget (default 100000), usedBudget (0), remainingBudget (100000), isActive (Boolean), startedAt, endedAt?. Only one row expected to be active. Mutated by /api/tokens POST log_usage.
- TokenUsageLog: agentId?, model, promptTokens, completionTokens, totalTokens, cost, apiEndpoint?, createdAt. Written by /api/tokens POST and /api/stresslab POST (run_test). NOT written by /api/ai-bridge, /api/chat, /api/proxy.

BUDGET ENFORCEMENT:
- /api/tokens POST log_usage: caller passes promptTokens + completionTokens. Route computes total = sum, inserts TokenUsageLog, fetches active SessionBudget, computes newUsed = oldUsed + total, newRemaining = max(0, totalBudget - newUsed), updates both fields. Updates Agent.totalTokens if agentId provided.
- /api/stresslab POST run_test: writes TokenUsageLog with promptTokens = round(tokenCount * 0.3), completionTokens = round(tokenCount * 0.7), totalTokens = round(tokenCount), cost = 0. Then writes its own budget update? Actually NO — stresslab only writes TokenUsageLog; it does NOT update SessionBudget. **INCONSISTENCY**: /api/tokens updates budget on log_usage, /api/stresslab writes TokenUsageLog but does NOT update budget. So SessionBudget.usedBudget undercounts stresslab usage.
- /api/ai-bridge POST: ZAI call, NO TokenUsageLog, NO SessionBudget update. **SILENT USAGE** — these tokens are never counted.
- /api/chat POST: ZAI call, NO TokenUsageLog, NO SessionBudget update. **SILENT USAGE**.
- /api/proxy POST: logs to RateLimitLog with tokensUsed (from response.usage.total_tokens), but does NOT update SessionBudget.

TOKEN ESTIMATION HEURISTIC:
- /api/stresslab: tokenCount = output.split(/\s+/).length * 1.3 (word count × 1.3). This is OUTPUT tokens only — no input tokens counted.
- Python TokenGuard.track(agent_id, tokens, ...) — accepts tokens as parameter (caller responsibility).
- Python TokenGuard.check_and_reserve(): atomic check + reserve with reservation_id hash.
- z-ai-web-dev-sdk does NOT return token counts in completion object — so callers can't get real prompt/completion tokens from ZAI. They must estimate.
- ACCURACY RISK: word count × 1.3 has ~30-50% error vs real BPE tokenization for English (varies by language — CJK is much higher). Provider billing will diverge from internal accounting. ARCH-1 already flagged this as risk #7.

TOKENGUARD PYTHON (monitoring/token_guard.py):
- 4 default budgets: agent=50000, skill=10000, swarm=200000, session=500000 (different from Prisma SessionBudget.totalBudget=100000).
- _get_budget_key(agent_id): if agent_id in budgets → that key; elif 'skill' in agent_id.lower() → 'skill'; elif 'swarm'/'foreman' in agent_id.lower() → 'swarm'; else → 'agent'. So a Prisma Agent named "coordinator" or "worker-1" maps to 'agent' budget (50000), NOT to per-agent tracking.
- WARNING_THRESHOLD=80%, HARD_STOP_THRESHOLD=95%. check() returns False if remaining < required OR percentage >= hard_stop.
- Audit trail: in-memory list of AuditEntry (timestamp, actor, action, input_tokens, output_tokens, context, outcome, signature). Signature = SHA-256(f"{actor}:{action}:{input}:{output}:{time.time()}")[:16]. _audit capped at 10000 entries.
- semantic_cache_get/set: warm-path cache by query_hash with similarity threshold 0.85 (but no actual embedding similarity — just exact hash match with score field).
- route(task_type, complexity, budget_remaining): rule-based model recommendation (low/code → qwen3:4b-thinking; low/other → osman-speed; medium/code → osman-coder; medium/research → osman-reasoning; medium/other → osman-agent; high + budget>50000 → gemini-3.1-pro; high + budget<=50000 → osman-reasoning).
- trigger_fallback(agent_id): hardcoded model_map for 4 OSMAN agents + frontier.
- analyze_trends(agent_id, period): splits audit into halves, compares sums; increasing/decreasing/stable. savings_potential hardcoded "8-18%" (SkillSmith target).
- **TOKENGUARD IS NOT WIRED INTO ANY DASHBOARD API ROUTE**. /api/tokens/route.ts does its own budget math directly against Prisma. /api/ai-bridge, /api/chat, /api/proxy do not call TokenGuard at all.

EXECUTION BOUNDARIES (monitoring/strategies.py):
- @hot_path decorator: enforces sync (<20ms target). Raises RuntimeError if wrapped function is async.
- @warm_path decorator: offloads to threading.Thread(daemon=True). Returns immediately with {status:"queued", path:"warm"}. **BUG**: caller can't get the actual return value — fire-and-forget only.
- SemanticCache class: in-memory dict with RLock. get() is @hot_path (sync). set() is @warm_path (background thread) — but set() acquires the same RLock as get(), so warm writes can block hot reads under contention. warm_cache() bulk pre-load (cold path).

F. GMR MODEL ROTATION
=====================

GENIUS MODEL ROTATOR (gmr/rotator.py — GeniusModelRotator class):
- DUAL POOL (ModelPool enum): FAST (local, cheap, <500ms latency), PREMIUM (cloud, capable, >500ms latency).
- INTENT CLASSIFICATION (IntentClassifier.classify): keyword scoring across 6 categories (CODE, RESEARCH, REASONING, SPEED, SECURITY, GENERAL). Each category has 8-12 keywords. Metadata boosts: is_code_task +5 CODE, requires_deep_reasoning +5 REASONING, time_sensitive +3 SPEED. Returns highest score or GENERAL if all zero.
- POOL RULES: SPEED→FAST, CODE→FAST, RESEARCH→PREMIUM, REASONING→PREMIUM, SECURITY→PREMIUM, GENERAL→None (either). Budget override: if budget_remaining < 50000 → always FAST regardless of intent.
- WEIGHTS for composite score: success_rate=0.10, throughput=0.05, latency_inverse=0.30, cost_inverse=0.25, intent_match=0.30. Composite = success_rate*w + (tokens_per_sec/100)*w + (1000/(latency+1))*w + (1/(cost+0.01))*w + intent_match_bonus. Preferred pool bonus: if model.pool == preferred_pool → score *= 1.1.
- DOMAIN MAPPING (gmr/domain_mapping.py): 6 domains (code, reasoning, research, fast, security, general). Each has primary[] (5-2 models with provider/tier/latency/cost/status) + fallback_chain[]. Real model names: osman-coder, Devstral 2 123B, Qwen3 Coder 480B, GPT OSS 120B, Codestral, Trinity Large Preview, Kimi K2 Thinking, GLM 5, Kimi K2.5, Nemotron 3 Super, MiniMax M2.5, etc.
- CASCADE GENERATION (get_routing_cascade): returns top 3 candidates sorted by composite score. Falls back to DOMAIN_MAPPING fallback_chain if no candidates. Returns ContextPacket for zero-context-loss handoff (task_id, original_prompt, intent, budget_remaining, core_facts, decisions_made, pending_actions, tool_state, trace_id).
- EXECUTE WITH FALLBACK (execute_with_fallback): iterates cascade. On attempt i>0, prepends context.to_prompt_prefix() to original_prompt (zero-context-loss handoff). On success: models[model].reset_failure_count(), token_guard.track("gmr", tokens_used), savings.record(...). On failure: models[model].record_failure(), continue to next. If all fail: return {success:False, error:"All models failed"}.

CIRCUIT BREAKER (gmr/circuit_breaker.py — AdaptiveCircuitBreaker):
- 3-STATE machine: CLOSED (normal), OPEN (failing, blocked), HALF_OPEN (testing recovery).
- Failure threshold: 3 failures → OPEN. Base cooldown: 60s.
- Exponential backoff on HALF_OPEN failure: cooldown = min(cooldown * 2, 3600) — max 1 hour.
- record_success() resets to CLOSED with cooldown = base.
- can_execute() returns True if state is CLOSED or HALF_OPEN.
- State property: lazy evaluation — if OPEN and time >= open_until → transition to HALF_OPEN.

INLINE CIRCUIT BREAKER (gmr/rotator.py — CircuitBreaker class, lines 116-135):
- DIFFERENT, simpler implementation than AdaptiveCircuitBreaker. _failures dict + _cooldowns dict per model. 3 failures → 60s cooldown. should_open(model) checks time. reset(model) clears both. NO HALF_OPEN state, NO exponential backoff. **DUPLICATE IMPLEMENTATION** — both classes exist in the codebase, neither is wired into /api/models route.

GMR DASHBOARD ROUTE (/api/models):
- GET: returns ModelEntry[] ordered by tier DESC.
- POST actions: toggle (isActive flip), health_check (ZAI ping → update health/latency/successRate), batch_health_check (loop all active models).
- HEALTH CHECK: ZAI SDK call with system prompt "You are a health check endpoint. Respond with exactly: OK" + user prompt "Health check: respond with OK". responseTime = Date.now() - startTime. If response.length > 0: alive=true. Health delta: <2s → +2, <5s → +1, else -5. On exception: -10 health, -1 successRate. Auto-deactivate if newHealth < 30.
- BATCH HEALTH CHECK: sequential for-loop over all active models. NO concurrency. NO OpenRouter/Cerebras/Jina testing — only ZAI (because all models route through ZAI SDK regardless of "provider" field).
- NO ROTATION EVENT LOGGING — GMR tab has to hardcode rotation log because /api/models doesn't write to any rotation/failover table.
- NO CIRCUIT BREAKER STATE EXPOSURE — Prisma ModelEntry has no circuit_breaker_state field.

COST OPTIMIZER (per ARCH-1 section B bullet 8):
- Trivial/Standard complexity → cost-optimized (cheapest above quality_threshold=0.5).
- Critical complexity → prefer local if available, else quality-first.
- Default → highest score.
- NOT EXPOSED via API route — runs inside Python HermesRouter only. Dashboard GMR tab has no "run cost optimizer" button.

G. METRICS GAPS
==============

GAP 1: TIME-SERIES TRUST TRAJECTORY
- Need: TrustHistory model (agent_id, lane, score, delta, cdr_stage, danger_level, regression_events, convergence_turns, recorded_at). Index on (agent_id, lane, recorded_at).
- API: /api/trust-engine/history?agent=X&lane=Y&range=24h. Reads TrustHistory.
- UI: governor-tab needs trust-over-time sparkline per agent per lane. Currently /api/trust-engine returns only "current" snapshot (peak_trust = min(0.995, trust + 0.05) — fake peak).
- Python wiring: TrustEngineV2._persist_to_vault currently stores only "current" key. Need to also append a TrustHistory row on every update.

GAP 2: ROTATION EVENTS
- Need: RotationEvent model (id, task_id, agent_id, intent_category, pool_selected, primary_model, fallback_models JSON, model_used, handoff_count, success, tokens_used, cost_saved, savings_reason, trace_id, recorded_at). Index on (recorded_at, agent_id, model_used).
- API: /api/rotation-events?agent=X&range=24h. GET only.
- UI: gmr-tab "Rotation Log" panel (currently hardcoded per WIRED_VS_MOCKED).
- Python wiring: GeniusModelRotator.savings.record() needs to ALSO write to Prisma via bridge call. Currently SavingsTracker is in-memory only.

GAP 3: FAILOVER EVENTS
- Need: FailoverEvent model (id, model_name, failure_count_at_trip, circuit_state_before, circuit_state_after, cooldown_seconds, recovery_attempts, recovered_at, recorded_at). Index on (model_name, recorded_at).
- API: /api/failover-events?model=X&range=24h. GET only.
- UI: gmr-tab "Failover Log" panel (currently hardcoded).
- Python wiring: AdaptiveCircuitBreaker.record_failure() and record_success() state transitions need to write to Prisma.

GAP 4: REAL ACTIVITY FEED (CROSS-CUTTING)
- Need: ActivityFeed model (id, kind enum[decision, vault, rotation, failover, test_run, token_warning, rate_limit, seed, chat, settings_change], actor_id, summary, severity enum[info, warn, error, crit], payload JSON, created_at). Index on (created_at, kind, severity).
- API: /api/activity?limit=50&kinds=decision,vault&severity=warn,error,crit. GET only.
- UI: overview-tab "Activity Feed" (currently SIMULATED) + system-logs panel (currently hardcoded templates per WIRED_VS_MOCKED).
- Implementation: every /api/* route that mutates DB also writes an ActivityFeed row. Or: Prisma middleware/extension that auto-writes on create/update of specific models.

GAP 5: COST OPTIMIZATION ENGINE UI
- Need: CostOptimizer already exists in Python (per ARCH-1) — HermesRouter uses it for model selection. Need to expose via API.
- API: /api/cost-optimizer/analyze?task_class=code&complexity=standard. Returns recommended model + reason + estimated savings.
- API: /api/cost-optimizer/history?range=7d. Returns past optimization decisions with realized savings.
- UI: gmr-tab "Cost Optimizer" panel showing daily/weekly savings + recommended actions. tokens-tab currently has hardcoded "Optimization suggestions" — should call this API.
- New model: CostOptimizationEvent (id, task_id, original_model, recommended_model, adopted, estimated_savings_tokens, estimated_savings_cost, actual_savings_tokens, actual_savings_cost, reason, recorded_at).

GAP 6: CHAT MESSAGE PERSISTENCE
- Need: ChatMessage model (id, session_id, role enum[user, assistant, system], content, model_used, tokens_in, tokens_out, latency_ms, created_at). Index on (session_id, created_at). Index on (created_at).
- API: /api/chat POST should write user message + assistant response to ChatMessage.
- API: /api/chat/sessions GET — list sessions. /api/chat/sessions/:id GET — full history.
- UI: ai-assistant should load prior conversation on page refresh (currently Zustand-only per WIRED_VS_MOCKED).
- Tokens: chat tokens should be logged to TokenUsageLog and counted against SessionBudget.

GAP 7: CONSTITUTION AUDIT TRAIL
- Need: ConstitutionAudit model (id, key, old_value, new_value, changed_by, changed_at, ip_address, user_agent). Index on (key, changed_at).
- API: /api/settings/audit?key=governor_thresholds&range=30d. GET only.
- UI: settings page shows audit history per key.
- Implementation: /api/settings PUT should write ConstitutionAudit row alongside SystemConfig upsert.

GAP 8: PROVIDER HEALTH SNAPSHOTS (pre-aggregated)
- Need: ProviderHealthSnapshot model (id, provider, latency_p50_ms, latency_p95_ms, success_rate_5m, success_rate_1h, rate_limit_remaining, cooldown_active, recorded_at). Index on (provider, recorded_at).
- API: /api/provider-health?provider=openrouter&range=24h. GET only.
- Implementation: cron/worker computes 1-minute snapshots from RateLimitLog. /api/rate-limit/status reads snapshots instead of live aggregation (current N+1 query pattern: 6 providers × findMany of 100 rows each on every GET).

GAP 9: SKILL REGISTRY PERSISTENCE
- Need: SkillRecord model (id, agent_id, lane, pattern_regex, success_count, failure_count, success_rate, sample_prompts JSON, auto_forged Boolean, last_matched_at, created_at). Index on (agent_id, lane, last_matched_at).
- API: /api/skills?agent=X. GET only. /api/skills/:id/forget DELETE.
- UI: New "Skills" tab showing auto-forged skills per agent.
- Python wiring: SkillSmith currently uses in-memory dict — needs to persist to Prisma.

GAP 10: VAULT CHAIN CRYPTOGRAPHY
- Need: Either augment VaultEntry with prev_hash, entry_hash, signature fields, OR create VaultChainEntry model.
- API: /api/vault/verify-chain POST should recompute SHA-256(prev_hash + canonical_json(value) + secret) and compare to entry_hash. Detect tampering.
- UI: vault-tab "Chain Integrity" badge showing ✅ verified / ❌ tampered.
- Python wiring: vault/manager.py store_track should compute and persist hashes.

H. DATA FLOW MAP — 4 KEY USER ACTIONS
======================================

ACTION 1: SPAWN WORKER (via /api/swarm POST action=spawn_worker)
- UI: swarm-tab → "Spawn Worker" form → POST /api/swarm {action:"spawn_worker", name, type, domain}
- API: src/app/api/swarm/route.ts POST handler
- Validation: name + type required; maxAgents limit enforced from SystemConfig.constitution
- DB writes (Prisma):
  1. db.agent.create({name, type, status:'idle', domain, trustScore:0.5}) → Agent row
  2. db.vaultEntry.create({agentId, track:'CAP', category:'worker_spawn', key:`spawn:${name}`, value: JSON of {type, domain, initialTrust:0.5}, score:0.5}) → VaultEntry
- Response: {worker: newAgent, message:"Worker X spawned successfully"}, HTTP 201
- **NO PYTHON BACKEND INVOLVED**. TeamCoordinator.spawn_worker (Python) is NOT called. The worker exists only in Prisma DB; no OpenClaw agent directory created, no .task.md queue initialized. Swarm-tab is a DB-only simulation of swarm.
- Token cost: 0 (no LLM call).

ACTION 2: RUN STRESS TEST (via /api/stresslab POST action=run_test)
- UI: stresslab-tab → select template + model + mode (single/icl/agentic) → "Run Test" → POST /api/stresslab {action:"run_test", templateId, modelName, mode}
- API: src/app/api/stresslab/route.ts POST handler
- Validation: templateId + modelName + mode required; mode in [single, icl, agentic]; template must exist
- Agent selection: db.agent.findFirst({where:{status:'idle'}, orderBy:{trustScore:'desc'}}) — picks highest-trust idle agent
- DB writes (Prisma):
  1. db.testRun.create({templateId, agentId, modelName, mode, status:'running'}) → TestRun row
- LLM call:
  - Selects prompt from TVD_PROMPTS[template.domain] (hardcoded array of 3 prompts per domain — IGNORES template.tvdPrompt field)
  - System prompt varies by mode: single='You are an expert analyst. Provide a thorough, well-structured analysis.' / icl=adds example output format / agentic='You are an autonomous research agent...'
  - ZAI SDK call: zai.chat.completions.create({messages:[systemMsg, userMsg], thinking:{type:'disabled'}})
- Validation: validateResponse(output, domain, templateName) — refusal pattern detection (5 regex patterns), word-count scoring, domain-keyword matching (10 keywords per domain), structure scoring (paragraphs + numbered lists), vocabulary diversity. Returns {passed, collapseDetected, score, details}.
- Token estimation: tokenCount = output.split(/\s+/).length * 1.3 (word count × 1.3, heuristic)
- VAP proof hash: vapProofHash = `vap-${testRun.id.slice(0,8)}-${Date.now().toString(36)}` (NOT a real hash, just unique ID)
- DB updates (Prisma):
  2. db.testRun.update({where:{id}, data:{status:passed/failed, output, validatorResult, tokensUsed, durationMs, collapseDetected, vapProofHash, completedAt:new Date()}})
  3. db.tokenUsageLog.create({agentId, model:modelName, promptTokens: round(tokenCount*0.3), completionTokens: round(tokenCount*0.7), totalTokens: round(tokenCount), cost:0, apiEndpoint:'/api/stresslab'}) — best-effort, wrapped in try/catch
- Response: {testRun: updatedRun}, HTTP 201
- **NO PYTHON BACKEND INVOLVED**. ZAI SDK is called directly from TypeScript route. Python SkillSmith/HermesRouter/GMR rotator all bypassed. Validator code in template.validatorCode field IGNORED — dashboard uses its own validateResponse heuristics. **SessionBudget NOT updated** — stresslab writes TokenUsageLog but skips budget update; /api/tokens GET will show stale budget.

ACTION 3: ADJUST GOVERNOR THRESHOLD (via /api/governor POST action=update_threshold)
- UI: governor-tab → "Thresholds" panel → adjust sliders for research/review/audit/impl → "Save" → POST /api/governor {action:"update_threshold", thresholds:{research:0.40, review:0.55, audit:0.75, impl:0.65}}
- API: src/app/api/governor/route.ts POST handler
- Validation: thresholds must be object
- DB writes (Prisma):
  1. db.systemConfig.upsert({where:{key:'governor_thresholds'}, update:{value:JSON.stringify(thresholds)}, create:{key:'governor_thresholds', value:JSON.stringify(thresholds)}})
- Response: {config: updatedConfig}, HTTP 200
- **NO ENFORCEMENT ANYWHERE**. The thresholds are stored as JSON but no route reads them to gate decisions. /api/swarm spawn_worker doesn't check "is requester's trust >= threshold.impl?". /api/stresslab run_test doesn't check "is agent.trustScore >= threshold.research?". The thresholds are documentation, not policy.
- **NO AUDIT TRAIL**. No ConstitutionAudit row written. Operator can change thresholds with no record of who changed what when.
- **NO PYTHON BACKEND INVOLVED**. Python NexusGovernor.check_access (KAIJU 4-var authz) is NOT called.

ACTION 4: FETCH ALPHAXIV PAPER (NOT IMPLEMENTED)
- UI: research-tab → search input → ... (no fetch button visible in current UI per fusion-pack)
- API: /api/research GET returns seeded Paper rows; /api/research PUT updates priority/vetting. **NO POST endpoint to add new papers. NO external arXiv/Alphaxiv API integration.**
- Current data flow: Papers were seeded by /api/seed POST once at install time. Six papers from seed script (isc-bench-2603.23509, or-bench-2405.20947, dual-pool-2502.00409, deer-flow repo, routing-survey-2604.08075, shieldgemma-2407.21772). No way to add more without re-running seed or direct DB manipulation.
- To implement:
  - API: /api/research/fetch POST {arxiv_id OR query} → fetches from arxiv API (https://export.arxiv.org/api/query) OR Alphaxiv, extracts title/abstract/PDF URL, runs ZAI summarization, computes relevanceScore, writes Paper row, returns paper.
  - DB writes: db.paper.create({...}). Plus ActivityFeed entry.
  - Python backend integration: would call bridge a2a/agent-card to verify research-agent's capabilities, then delegate via tasks/submit with kaiju scope=research intent=fetch_paper impact=LOW clearance=standard.
- **Currently a dead-end UI**: research-tab displays seeded papers but cannot discover new ones.

Stage Summary:
- 12 Prisma models audited; 4 well-designed (SystemConfig, Paper, TestRun, ApiKey), 5 need improvement (VaultEntry missing chain hash, SessionBudget no unique active, RateLimitLog no indexes, Agent single trust not lane-scoped, ModelEntry no pool field), 3 are missing critical fields (GovernorDecision no lane/danger_level, TokenUsageLog no operation_type, TestRun no model_pool).
- 9 missing models identified: TrustHistory, RotationEvent, FailoverEvent, ActivityFeed, ProviderHealthSnapshot, SkillRecord, ConstitutionAudit, ChatMessage, VaultChainEntry.
- 19 API routes inventoried; 17 serve real data; biggest gap is /api/system exists but Overview tab ignores it (per WIRED_VS_MOCKED).
- 3 parallel trust systems: Python trust_engine_v2 (logistic + decay + CDR), Python trust_scoring (Beta-Binomial + lane params), TypeScript /api/trust-engine (heuristic lane modifiers). Dashboard displays the third; Python canonical is unwired.
- 2 parallel vault designs: Python (UNIQUE upsert on agent_id+lane+track_type+key) vs Prisma (append-only with cuid id). Neither implements hash chaining. /api/vault verify_chain only checks timestamps + JSON parse + score range — NOT cryptographic.
- 2 parallel circuit breakers: AdaptiveCircuitBreaker (3-state, exponential backoff) and inline CircuitBreaker (2-state, fixed 60s). Neither wired into /api/models.
- Token budget undercounts: /api/stresslab writes TokenUsageLog but skips SessionBudget update; /api/ai-bridge and /api/chat consume tokens silently with no logging at all. TokenGuard Python module exists but is not called from any dashboard route.
- 4 user-action data flows traced. None of them involve the Python backend (swarm spawn, stress test, governor threshold, paper fetch). All 4 are TypeScript → Prisma → ZAI SDK only.
- 10 metrics gaps identified with concrete model + API + UI recommendations.

RECOMMENDED NEXT ACTIONS (priority order):
1. Add 9 missing Prisma models (highest priority: TrustHistory, ActivityFeed, RotationEvent — these unblock 3 SIMULATED/HARDCODED UI panels).
2. Add indexes to RateLimitLog (provider, createdAt, statusCode), VaultEntry (track, agentId, createdAt), TestRun (templateId, status, createdAt), TokenUsageLog (agentId, model, createdAt), Agent (status, domain).
3. Wire TokenGuard.check_and_reserve() as a pre-check in /api/ai-bridge, /api/chat, /api/stresslab before LLM calls. Update SessionBudget in all 3 routes after success.
4. Implement /api/research/fetch POST endpoint with arXiv API integration (closes dead-end research pipeline).
5. Wire /api/system GET into overview-tab (closes biggest fusion-pack gap).
6. Add ConstitutionAudit writes to /api/settings PUT (closes security gap on threshold/key changes).
7. Replace /api/vault verify_chain timestamp check with cryptographic hash chain (add prev_hash, entry_hash, signature fields to VaultEntry).
8. Consolidate the 3 trust systems: pick trust_engine_v2 (logistic + CDR) as canonical, expose via /api/trust-engine by calling Python bridge, deprecate the local heuristic in route.ts.
9. Wire AdaptiveCircuitBreaker state into ModelEntry.circuit_state field; expose via /api/models GET.
10. Add ChatMessage persistence so AI assistant conversations survive page refresh.

---
Task ID: UX-1
Agent: Dashboard UX / Operator Experience
Task: Analyze NEXUS OS dashboard UI components, operator workflows, and UX patterns (9 tabs + global components)

Work Log:
- Read prior worklog entries ARCH-1 (lines 116-434) and DATA-1 (lines 436-836) for architectural and data-modeling context.
- Read all 9 tab components in src/components/nexus/tabs/: overview-tab.tsx (1850L), stresslab-tab.tsx (1454L), gmr-tab.tsx (2054L), governor-tab.tsx (2088L), vault-tab.tsx (1049L), research-tab.tsx (1315L), swarm-tab.tsx (1858L), tokens-tab.tsx (956L), rate-limit-tab.tsx (463L).
- Read 14 global components in src/components/nexus/: header.tsx (358L), sidebar.tsx (205L), footer.tsx (179L), command-palette.tsx (161L), ai-assistant.tsx (394L), notification-center.tsx (249L), system-logs.tsx (244L), diagnostics-panel.tsx (382L), charts.tsx (222L), export-button.tsx (154L), global-export-dialog.tsx (469L), quick-stats-widget.tsx (128L), session-timeline.tsx (138L), system-architecture.tsx (238L), keyboard-shortcuts.tsx (144L), tab-content.tsx (84L).
- Read app entry: src/app/page.tsx (62L), src/app/layout.tsx (50L), src/app/globals.css (1137L) for design system tokens.
- Read state mgmt: src/store/nexus-store.ts (117L Zustand), src/hooks/use-api-data.ts (80L polling), src/hooks/use-swarm-ws.ts (163L Socket.IO), src/hooks/use-mounted.ts (20L SSR guard).
- Read fusion-pack/NEXUS_FUSION_PACK.md (350L) — canonical WIRED/MOCK/SIM badge map + tech stack + differentiators.
- Cross-referenced UI claims with DATA-1 backend reality (3 parallel trust systems, no ActivityFeed model, /api/system ignored by overview-tab, hardcoded rotation/failover events, fake vault chain hashes).

Key Findings:

A. TAB-BY-TAB UX AUDIT
======================

1. OVERVIEW-TAB (1850L) — SIMULATED (worst offender)
   - Purpose: 8-pillar health grid + activity feed + governance stats + system timeline
   - Key widgets: 8 pillar cards (Bridge/Engine/Governor/Vault/GMR/Swarm/Monitor/Config), 24h Health Timeline (NexusStackedAreaChart w/ 6h/12h/24h toggle), LiveActivityFeed (rotating 12 canned messages every 3s), SystemUptimeCard (starts at 3d 14h 27m 52s hardcoded), SystemNotificationsCard, SystemArchitectureMiniMap (8 nodes in circle w/ SVG animateMotion dots), QuickStatsBar (requestCount random increment), AnimatedCounter, Pillar Detail Dialog w/ 8-point sparkline, Diagnostics trigger, View All Pillars dialog
   - Data source: 100% MOCK — pillarDetails/pillarSparklines/pillarHealthHistory/initialActivities/newActivities/systemStatusExport/collapseRateTrend/systemNotificationsData/recentDecisions all hardcoded arrays. seededRandom() fakes timeline variability. /api/system endpoint (which computes real pillar health from 11 Prisma models per DATA-1) is NEVER called.
   - Operator workflow: open dashboard → land here → see what looks like real-time system but isn't
   - Strongest: visual polish, pillar detail dialog, 8-pt sparkline history, diagnostic modal with sequential execution
   - Weakest: TOTAL fake. Header token budget "73,450" hardcoded. Uptime counter resets on reload. Activity feed cycles same 12 messages. "Live" badge is misleading.

2. STRESSLAB-TAB (1454L) — WIRED (strongest component per fusion-pack)
   - Purpose: ISC-Bench test execution + model comparison + collapse-rate analytics
   - Key widgets: Templates sub-tab (12 templates, difficulty pie chart, domain coverage), Runs sub-tab (history table, collapse-rate trend chart), Compare sub-tab (model comparison dialog), Arena sub-tab (5-model leaderboard), RunTestDialog (model + mode select, progress bar stalls at 90%), BatchRunDialog (multi-select templates + single model), TestHistoryChart (10/20/all toggle)
   - Data source: WIRED — useApiData('/api/stresslab', 15s). POST action=run_test makes real ZAI SDK call. BUT allTestHistoryData (20-pt collapse rate) and domainCoverage (6 domains) and arenaData (5 models) are HARDCODED fallbacks. Per DATA-1: token count is word×1.3 heuristic, vapProofHash is `vap-${runId}-${Date.now().toString(36)}` (NOT cryptographic), SessionBudget NOT updated by /api/stresslab.
   - Operator workflow: Templates → Run Test → select model+mode → Execute → toast → run appears in Runs tab (3 clicks + 2 selects)
   - Strongest: full lifecycle (DB → LLM → validation → persist), batch runs, model compare dialog, polished progress UI
   - Weakest: token estimation is heuristic, validatorCode field ignored (uses own validateResponse heuristics), budget undercounts stresslab usage, hardcoded collapse-rate baseline series

3. GMR-TAB (2054L) — WIRED+MOCK
   - Purpose: model registry + dual-pool (FAST/PREMIUM) + rotation analytics + AI bridge routing
   - Key widgets: 6 sub-tabs (Registry/Pool Status/Rotation Log/Failover Log/Analytics/AI Bridge), ProviderRoute cards w/ tier icons (reasoning/balanced/fast/free), LatencyHistoryChart (3 models 10m→now), Failover log w/ severity badges, Optimization stats (4 categories)
   - Data source: WIRED+MOCK — /api/models real (toggle + health_check actually pings ZAI). MOCK_BRIDGE_DATA (4 hardcoded routes), failoverLog (5 events), rotationAnalytics (mostRotatedTo/From), latencyHistory, OPTIMIZATION_STATS all hardcoded. Per DATA-1: no RotationEvent/FailoverEvent Prisma models, no circuit_breaker_state field on ModelEntry.
   - Operator workflow: Registry → toggle model on/off → health check → view pool status
   - Strongest: dual-pool visualization, fallback chain display, latency trend chart, failover severity color-coding
   - Weakest: rotation/failover events are fabricated, no circuit breaker state exposed, AI Bridge routes are mock, pool assignments hardcoded in footer (PREMIUM=['trinity-large-preview','minimax-m2.5'] etc.)

4. GOVERNOR-TAB (2088L) — WIRED
   - Purpose: trust scoring + threshold management + danger patterns + decision audit
   - Key widgets: Decisions table (real), TrustStats per agent (real), 4 threshold sliders (research/review/audit/impl), DangerPatterns add dialog, ConstitutionRules card (built from API config + decisions), LiveDecisionFeed (4-8s simulated cadence), DecisionTimeline horizontal, DecisionDistribution pie (real), ImpactDistribution pie (real), Agent Risk Matrix scatter
   - Data source: WIRED — useApiData('/api/governor', 15s). POST actions: appeal, update_threshold, add_pattern. BUT getLaneForAgent() is heuristic (infers lane from agent name + trust score). Per DATA-1: thresholds stored but NEVER enforced anywhere, no ConstitutionAudit, no TrustHistory time-series, CDR stage is local heuristic not Python canonical trust_engine_v2.
   - Operator workflow: Agents → select agent → adjust threshold sliders → Save → toast (2 clicks + drags)
   - Strongest: threshold sliders with impact warnings, decision timeline with hover tooltips, appeal workflow, decision distribution charts
   - Weakest: thresholds are documentation not policy (no enforcement), lane is inferred from name not modeled, no trust trajectory sparkline (only current snapshot), LiveDecisionFeed uses fake reasons (liveFeedReasons array of 10 canned strings)

5. VAULT-TAB (1049L) — WIRED (but chain is decorative)
   - Purpose: 5-track memory browser (EVENT/TRUST/CAP/FAIL/GOV) + chain verification
   - Key widgets: 5-track tabbed browser with track-specific color theming (bgColor/textColor/borderColor/headerGradient), search across key+agent+value+id, entry detail dialog with JSON pretty-print + copy, Verify Chain button with result modal, pie chart (real from trackCounts), VAP chain visualization (10 most-recent blocks w/ hash+prev+type+summary+ts), Recent activity timeline
   - Data source: WIRED — useApiData('/api/vault', 15s). POST action=verify_chain. BUT chain block hashes are FAKE: `0x${e.id.slice(0,4)}...${String(Math.abs(e.rawEntry.id.charCodeAt(0)*31+i*17)).slice(0,4)}`. Per DATA-1: verify_chain only checks timestamps + JSON parse + score range — NOT cryptographic. No filter params in GET (always returns latest 100, UI filters client-side). No prev_hash/entry_hash/signature fields on VaultEntry.
   - Operator workflow: filter by track OR search → click entry → detail dialog → verify chain (3 clicks)
   - Strongest: 5-track color theming is consistent and beautiful, JSON formatter, search breadth (4 fields), verify UX with issue list
   - Weakest: chain hashes are decorative (computed from ID), no real tamper detection, no server-side filtering, no poisoning detection UI (Python poisoning.py exists but unwired per ARCH-1)

6. RESEARCH-TAB (1315L) — WIRED (but pipeline dead-ends)
   - Purpose: paper priority queue (P0/P1/P2) + 5-step intake pipeline visualization
   - Key widgets: 3-column P0/P1/P2 layout with priority color coding (red/orange/emerald), paper detail dialog w/ arXiv link + copy-to-clipboard + mark-in-progress, Add-to-queue dialog (local-only), daily practice timer (local-only), 5-step INTAKE/VETTING/MANIFEST/PRIORITY/DELIVER pipeline w/ time estimates, domain options
   - Data source: WIRED — useApiData('/api/research', 15s). PUT updates priorityTier/isVetted/implementationTask. BUT per DATA-1: NO POST endpoint to add new papers, NO external arXiv/Alphaxiv API call. 6 seeded papers only. Practice timer resets on tab switch (no localStorage). Add-to-queue is client-side only.
   - Operator workflow: view P0 papers → click paper → mark in-progress (2 clicks)
   - Strongest: P0/P1/P2 column layout is scannable, arxiv link auto-detection from ID regex, priority color coding
   - Weakest: NO way to discover new papers (dead-end UI per DATA-1), practice timer doesn't persist, 5-step pipeline is aspirational not functional

7. SWARM-TAB (1858L) — WIRED with WS
   - Purpose: worker pool management + task queue + WebSocket live updates
   - Key widgets: Worker grid with status-specific card styling (busy=emerald gradient, error=red pulse-border, offline=opacity-60), stats cards (total/busy/idle/error/offline), TaskQueue (HARDCODED fallback), RecentCompleted (HARDCODED fallback), SpawnWorkerDialog, ReassignTaskDialog, Worker detail dialog w/ sparkline + task history, useSwarmWS hook integration
   - Data source: WIRED — useApiData('/api/swarm', 15s) + useSwarmWS() for live updates. POST actions: spawn_worker, reassign_task, terminate_worker, restart_worker, update_trust. BUT per DATA-1: spawn_worker creates Agent row + VaultEntry audit but NO Python TeamCoordinator dispatch, NO OpenClaw agent directory, NO .task.md queue. taskQueue and recentCompleted are hardcoded fallbacks even when API has workers data.
   - Operator workflow: Spawn Worker button → fill name/type/domain → Spawn (3 clicks + form). Per worker: click card → detail dialog → Reassign/Restart/Terminate
   - Strongest: per-status card styling is exemplary, WebSocket live updates, trust score display, 5 worker types + 7 domains
   - Weakest: spawn is DB-only (no real process), task queue and recent completed are hardcoded, reassign_task doesn't actually move a task

8. TOKENS-TAB (956L) — WIRED with hardcoded extras
   - Purpose: token budget + usage logs + per-agent/model breakdown + heatmap
   - Key widgets: Budget progress bar, HourlyUsage area chart, PerAgentUsage bar chart, PerModelUsage table, Agent×Hour heatmap, 4 Optimization suggestions (HARDCODED), Dismissable alerts, model usage trend sparklines (computed from log data)
   - Data source: WIRED — useApiData('/api/tokens', 30s). Real budget, usageLogs, agentUsage. BUT burnRate = 142 (hardcoded constant), optimizationSuggestions (4 items hardcoded), avgLatency = 0 (TokenUsageLog doesn't track latency). Per DATA-1: SessionBudget undercounts because /api/stresslab writes TokenUsageLog but skips budget update; /api/ai-bridge and /api/chat consume tokens silently with no logging.
   - Operator workflow: view budget → check per-agent breakdown → dismiss optimization suggestion (1 click to dismiss)
   - Strongest: heatmap visualization, per-agent/model breakdown, dismissal interaction
   - Weakest: burn rate is hardcoded 142, optimization suggestions are fabricated (no /api/cost-optimizer), avgLatency always 0, budget undercounts silently

9. RATE-LIMIT-TAB (463L) — WIRED (cleanest)
   - Purpose: 5-provider rate limit monitoring (openrouter/jina/kilocode/cerebras/openai)
   - Key widgets: ProviderCard (5 cards) w/ RPM/RPD usage bars, CooldownTimer (live countdown), key health badge, last error display, 4-stat mini-grid (Total/Rejected/429s/Queue), Summary card, NexusBarChart for provider stats
   - Data source: WIRED — manual fetch('/api/rate-limit/status') with 10s polling. Real rate-limiter/api-key-manager/api-cache in-memory state. Per DATA-1: N+1 query pattern (6 providers × findMany 100 rows each on every GET), no time-series (just current snapshot).
   - Operator workflow: view provider cards → check cooldown timer → wait for recovery (read-only, 0 clicks)
   - Strongest: live cooldown countdown, color-coded health (green<50%/yellow<80%/red), real infrastructure data, no fake elements
   - Weakest: no historical 429 trend chart, N+1 query on every poll, no per-key drill-down

B. GLOBAL COMPONENT PATTERNS
============================

LAYOUT MODEL (page.tsx):
- flex h-screen overflow-hidden
- Left: NexusSidebar (desktop: inline collapsible w-56/w-16, mobile: Sheet)
- Right column: NexusHeader (top h-14) → main TabContent (flex-1 overflow-auto) → NexusFooter (bottom h-9)
- Floating overlays: NexusAssistant (bottom-right slide-in), QuickStatsWidget (bottom-left desktop only), NexusCommandPalette (⌘K dialog), SystemLogsPanel (⌘L slide-up), KeyboardShortcuts (? dialog), DiagnosticsPanel (overview dialog), NotificationCenter (header popover), GlobalExportDialog (⌘E dialog)

NAVIGATION MODEL:
- 9 tabs in sidebar: overview/stresslab/gmr/governor/vault/research/swarm/tokens/ratelimit
- Each tab has numbered index shown in sidebar (1-9) but ONLY 1-8 wired to keyboard shortcuts (ratelimit is 9th, no shortcut — GAP)
- Tab switching methods:
  1. Click sidebar item (activeTab in Zustand)
  2. Number keys 1-8 (no modifier, command-palette.tsx listener)
  3. ⌘K command palette → nav command
  4. Sidebar tooltips (in collapsed mode) show shortcut
- Framer Motion AnimatePresence mode="wait" with staggerContainer/staggerItem variants on tab change

SHORTCUTS (declared in keyboard-shortcuts.tsx help vs ACTUALLY WIRED):
- ⌘K: command palette — WIRED ✓ (command-palette.tsx)
- 1-8: tab nav — WIRED ✓ (command-palette.tsx)
- ⌘L: system logs — WIRED ✓ (header.tsx)
- ⌘E: export dialog — WIRED ✓ (header.tsx)
- ?: keyboard shortcuts help — WIRED ✓ (page.tsx)
- Esc: close dialog — WIRED ✓ (Dialog onOpenChange)
- ⌘B: toggle sidebar — DECLARED but NOT WIRED ✗
- ⌘D: theme toggle — DECLARED but NOT WIRED ✗ (header has button only)
- ⌘N: notifications — DECLARED but NOT WIRED ✗ (header bell click only)
- R: run diagnostic — DECLARED but NOT WIRED ✗
- S: open AI assistant — DECLARED but NOT WIRED ✗
- /: focus search — DECLARED but NOT WIRED ✗
- P: pause activity feed — DECLARED but NOT WIRED ✗
- GAP: 7 of 12 documented shortcuts don't work. Operator muscle-memory breaks.

ZUSTAND STORE (nexus-store.ts, 117L):
- State: activeTab, sidebarOpen, isChatOpen, chatMessages[], notifications[], isNotificationCenterOpen, isExportDialogOpen
- 10 initial hardcoded notifications (mock data seeded on app start)
- chatMessages NOT persisted (lost on refresh — per DATA-1 GAP 6)
- notifications use counter for ID generation (no UUID)
- No middleware (no persist, no devtools) — vanilla Zustand
- Single store for ALL UI state (no slicing)

C. OPERATOR WORKFLOW ANALYSIS (5 KEY TASKS)
============================================

(1) CHECK SYSTEM HEALTH
- Path: dashboard loads → overview tab (default)
- Clicks: 0 (auto-loaded)
- Data shown: 8 pillar cards (hardcoded health 88-100), uptime "3d 14h 27m 52s" (hardcoded start), 24h timeline (seededRandom), 12 rotating activities (canned), 5 notifications (hardcoded), 5 recent decisions (hardcoded), quick stats (requestCount random +5s)
- What's missing: real pillar health from /api/system (already computes it), real ActivityFeed (DATA-1 GAP 4), real notifications derived from events, real uptime from server startup, real request count

(2) SPAWN + MANAGE A WORKER
- Path: sidebar Swarm → "Spawn Worker" → SpawnWorkerDialog → name + type + domain → "Spawn Worker"
- Clicks: 3 (tab, spawn-btn, submit) + 3 form fields
- Data shown: 5 worker cards w/ status/trust/tokens/tasksDone, stats cards, task queue (hardcoded T-0850..T-0853), recent completed (hardcoded T-0842..T-0847), WS live updates (5 channels: worker-update, task-complete, task-queued, metrics, activity)
- What's missing: real TeamCoordinator dispatch (per DATA-1: just DB row), real OpenClaw agent directory (~/.openclaw/agents/{worker}/tasks/pending/), real task movement on reassign, real worker process health, per-worker skill registry (DATA-1 GAP 9)

(3) RUN A STRESS TEST
- Path: sidebar StressLab → Templates → "Run Test" → RunTestDialog → model + mode → "Execute Test"
- Clicks: 3 (tab, run-btn, submit) + 2 selects
- Data shown: 12 templates w/ difficulty badges, domain coverage pie (hardcoded), collapse rate trend (hardcoded 20-pt series), arena leaderboard (5 models hardcoded), progress bar stalls at 90% until API responds
- What's missing: real validatorCode execution (route uses own heuristics), real token counting (word×1.3), real VAP hash (just unique ID), budget update (skipped per DATA-1), Python HermesRouter/GMR/SkillSmith involvement

(4) ADJUST GOVERNANCE THRESHOLDS
- Path: sidebar Governor → "Thresholds" section → 4 sliders → "Save Changes"
- Clicks: 2 (tab, save) + 4 slider drags
- Data shown: 4 threshold sliders (research/review/audit/impl), impact warnings per lane, danger patterns list, appeal workflow, live decision feed (simulated cadence)
- What's missing: ENFORCEMENT (per DATA-1: thresholds stored as JSON but no route checks them), audit trail (no ConstitutionAudit), real KAIJU authz, real TrustEngineV2 (uses local heuristic instead)

(5) INVESTIGATE A VAULT ENTRY
- Path: sidebar Vault → click track tab OR search box → click entry row → detail dialog
- Clicks: 3 (tab, filter, entry)
- Data shown: 5-track color-coded browser, 100 latest entries, JSON-pretty-printed value, score/agent/timestamp, track-specific gradient headers, VAP chain visualization (10 blocks w/ hash+prev+type+summary), Verify Chain button with issue list
- What's missing: real cryptographic chain (hashes are fake per DATA-1), server-side filtering (always returns latest 100), tamper detection (verify only checks timestamps + JSON parse), poisoning detection UI (Python poisoning.py unwired), prev_hash/entry_hash/signature fields on VaultEntry model

D. DATA SOURCE BADGE SYSTEM
===========================

CANONICAL MAP (fusion-pack/NEXUS_FUSION_PACK.md §4.1):
- 🟢 WIRED (8): stresslab-tab, governor-tab, vault-tab, research-tab, swarm-tab, tokens-tab, rate-limit-tab, ai-assistant, command-palette
- 🟡 WIRED+MOCK (1): gmr-tab
- 🟡 SIMULATED (2): overview-tab, system-logs
- 🔴 MOCK (1): notification-center

CONSISTENCY: The fusion-pack MAPS this clearly as a developer artifact. BUT the dashboard UI itself does NOT expose these badges to the operator. There is no visual indicator on a card saying "WIRED" vs "MOCK". The operator cannot tell that the Overview tab's pillar health is fake while the Governor tab's decisions are real.

WHERE IT BREAKS:
1. Overview tab presents identically to real tabs (no disclaimer, no badge, no dimmed styling)
2. Footer error count: 8% random chance per 5s — fake but presented as real
3. Footer rate limit status: random walk every 15s — fake
4. Header token budget "73,450" hardcoded — fake
5. Header "3 agents" badge hardcoded — fake
6. Quick Stats Widget: token budget from real API but uptime starts at "0d 3h 42m" hardcoded — partial fake
7. Notification Center: 10 initial notifications hardcoded + simulated ones added every 30-60s from 12 templates — fake
8. System Logs: entirely fabricated from 20 hardcoded templates — fake
9. Governor Live Decision Feed: real decisions but FAKE reasons (liveFeedReasons array of 10 canned strings)
10. Vault chain blocks: fake hashes computed from entry ID charCodeAt — fake
11. Tokens optimization suggestions: hardcoded 4 items — fake
12. GMR rotation log/failover log/rotation analytics: hardcoded — fake
13. Research practice timer: resets on tab switch — partial fake
14. Tokens burn rate "142 tok/min": hardcoded constant — fake

CRITICAL UX GAP: For an ops board where trust in data is paramount, the operator-facing badge system is absent. The fusion-pack is the source of truth but it's a developer artifact, not an operator-facing affordance.

E. VISUAL DESIGN SYSTEM
=======================

COLOR PALETTE (globals.css, OKLCH-based):
- Primary: oklch(0.508 0.164 155) light / oklch(0.65 0.2 155) dark — emerald-teal (hue 155)
- Nexus accent: --nexus, --nexus-foreground, --nexus-dim, --nexus-glow (all hue 155)
- Background: oklch(0.985 0.002 155) light / oklch(0.11 0.005 155) dark
- Card: white / oklch(0.155 0.008 155)
- Charts: 5 chart-N colors (varied hues)
- Status colors (charts.tsx COLORS): emerald #34d399, red #f87171, orange #fb923c, yellow #facc15, blue #60a5fa, purple #a78bfa, pink #f472b6
- Pillar colors: Bridge=emerald, Engine=blue, Governor=red, Vault=purple, GMR=orange, Swarm=yellow, Monitor=pink, Config=emerald (per overview-tab.tsx pillarColors)
- Track colors (vault-tab.tsx): EVENT=emerald, TRUST=blue, CAP=orange, FAIL=red, GOV=purple

"NEXUS-BG" AESTHETIC:
- Dark OKLCH background with emerald glow accents
- Custom CSS classes: .nexus-pulse (opacity 1↔0.5 / 2s), .nexus-glow-effect (box-shadow 2px↔8px / 3s), .gradient-text (linear-gradient emerald, webkit-background-clip:text), .shimmer (background-position animation), .pulse-border (border-color 20%↔60% / 2s), .hover-lift (translateY(-2px) + scale(1.01) + emerald-tinted shadow), .custom-scrollbar (4px, transparent track), .status-glow-green/yellow/red, .glass-card (frosted glass effect)

CHART LIBRARY: Recharts (AreaChart, BarChart, PieChart, RadialBarChart, LineChart) wrapped in /components/nexus/charts.tsx with 4 primitives: MiniAreaChart, NexusBarChart, NexusGauge, NexusStackedAreaChart. All use hsl(var(--card)) for tooltip backgrounds — theme-aware. RechartsTooltip contentStyle standardized across charts.

RESPONSIVE BREAKPOINTS:
- useMediaQuery('(min-width: 768px)') for mobile/desktop sidebar (Sheet vs inline)
- useMediaQuery('(min-width: 1024px)') for QuickStatsWidget visibility (lg)
- sm: header hides token budget + export label below sm
- md: footer hides center section below md
- Sidebar collapses from w-56 to w-16 (logo + icons only) — TooltipProvider shows labels on hover

DARK/LIGHT THEME:
- next-themes ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange
- Sun/Moon icon swap in header (rotate-0 scale-100 → dark:-rotate-90 dark:scale-0 transition)
- OKLCH light palette: near-white background, white card
- OKLCH dark palette: oklch(0.11) background, oklch(0.155) card
- Dark theme is primary (light theme "needs polish" per fusion-pack §8 issue #8)

TYPOGRAPHY: Geist Sans + Geist Mono (next/font/google). tabular-nums used heavily for numeric alignment. font-mono for IDs/timestamps.

ANIMATIONS: Framer Motion (tab transitions w/ staggerContainer/staggerItem, AnimatePresence mode="wait"). SVG animateMotion for SystemArchitecture data-flow dots (deterministic durations to avoid hydration mismatch).

F. UX GAPS FOR NEW OPS BOARD
============================

DO WELL (PRESERVE):
1. ⌘K command palette (cmdk-based) — fast operator navigation, 16 commands across 2 groups
2. 1-8 number shortcuts for tabs (no modifier) — power-user speed
3. System Logs slide-up panel (⌘L) — log investigation without leaving tab
4. ExportButton on every tab + GlobalExportDialog (⌘E) — CSV/JSON with column header mapping
5. Per-status color coding (emerald=healthy, yellow=warning, red=error) — consistent semantic across tabs
6. AnimatedCounter + LiveActivityFeed — gives "alive" feeling
7. Per-track color coding in vault (5 distinct color systems per track)
8. Toast notifications (sonner) for action feedback — consistent
9. Worker card status styling (busy=emerald gradient, error=red pulse-border, offline=opacity-60)
10. Decision Timeline horizontal viz with hover tooltips
11. DiagnosticsPanel sequential step execution + latency display
12. Mobile-responsive Sheet sidebar
13. Pillar detail dialog with sparkline history
14. Trust threshold sliders with impact warnings
15. 5-track vault color theming (bgColor + textColor + borderColor + borderLeftColor + headerGradient)
16. Filter + search combination pattern (vault tab)

DO POORLY (FIX):
1. **Overview tab 100% fake** — biggest trust killer. FIX: wire to /api/system (already computes real pillar health).
2. **No data source badges in UI** — operator can't tell real from mock. FIX: subtle "WIRED/MOCK/SIM" dot badges on card headers, color-coded.
3. **Hardcoded activity feed** — should come from real ActivityFeed table (DATA-1 GAP 4).
4. **Hardcoded notifications** — should derive from real system events.
5. **System Logs entirely fabricated** — should query VaultEntry + RateLimitLog.
6. **Footer error count is random** — should be real error count from last 5m.
7. **Footer rate limit status is random walk** — should be real from /api/rate-limit/status.
8. **Header token budget hardcoded 73,450** — should be from /api/tokens.
9. **Header "3 agents" badge hardcoded** — should be from /api/agents.
10. **SystemConfigDialog "Save" just shows toast** — doesn't persist to /api/settings.
11. **Chat messages not persisted** — lost on refresh (DATA-1 GAP 6).
12. **No filter params in /api/vault GET** — always latest 100, UI filters client-side.
13. **Vault chain hashes are fake** — computed from entry ID char codes.
14. **No time-series trust data** — no TrustHistory model, no sparkline per agent per lane.
15. **No real rotation/failover events** — GMR tab hardcodes these (DATA-1 GAP 2, 3).
16. **No real cost optimization** — Tokens tab hardcodes 4 suggestions (DATA-1 GAP 5).
17. **No real WebSocket for non-Swarm tabs** — only Swarm has live updates.
18. **Token budget undercounts** — /api/stresslab, /api/ai-bridge, /api/chat don't all update SessionBudget.
19. **No audit trail on settings changes** — operator can change OPENROUTER_API_KEY silently.
20. **7 of 12 keyboard shortcuts documented in help don't actually work** (⌘B, ⌘D, ⌘N, R, S, /, P).
21. **No "rate-limit" tab number shortcut** — only 1-8 work, rate-limit is 9th tab.
22. **No global search across entities** — command palette only navigates, doesn't search agents/models/papers.
23. **No breadcrumb or context retention** — switching tabs loses scroll position and filters.
24. **No bulk operations** — can't select multiple workers to terminate, multiple papers to re-prioritize.
25. **No comparison views** — can't compare two agents' trust trajectories side-by-side.
26. **Modals block workflow** — every entity detail is a Dialog instead of a right-rail drawer.
27. **No empty states** — most loading states show fake data instead of "no data yet".
28. **Light theme unpolished** — fusion-pack §8 issue #8.
29. **No SAGE accommodation** — see section G.

SPECIFIC OPS BOARD LAYOUT RECOMMENDATIONS:
- **Left rail**: persistent sidebar with 9 tabs + SAGE (10th) + collapse toggle (keep current pattern)
- **Top bar**: tab title (keep) + LIVE token budget from /api/tokens + LIVE agent count from /api/agents + clock + notifications + export + logs + settings + theme (replace all hardcoded values)
- **Main canvas**: tab content with framer-motion transitions (keep)
- **Right rail (NEW)**: contextual inspector — when entity selected (agent/model/paper/vault entry), show details in right drawer instead of modal dialog. Modals block workflow.
- **Bottom rail**: footer with REAL constitution limits from /api/system + REAL pool counts from /api/models + REAL error count from RateLimitLog + REAL rate limit status + session uptime + Live indicator
- **Floating overlays**: AI Assistant (bottom-right), Quick Stats (bottom-left desktop), Command Palette (⌘K), System Logs (⌘L slide-up), Keyboard Shortcuts (?)
- **NEW: Global Activity Feed dock** — bottom-center collapsible dock showing real cross-cutting ActivityFeed entries (DATA-1 GAP 4)
- **NEW: Data Source Badge** — every card has tiny dot in corner: green=WIRED, yellow=WIRED+MOCK, red=SIMULATED/MOCK. Hover for details.
- **NEW: SAGE Panel** — see section G

G. SAGE ACCOMMODATION
====================

WHERE WOULD A SAGE PANEL FIT?
Recommended: 10th sidebar tab + header pill. Tab shows: SAGE status, current analysis queue, recent insights, integration health. Header pill shows: SAGE online/offline + active analyses count.

Alternative placements considered:
- Right-rail contextual inspector (when SAGE is analyzing an entity) — complementary, not primary
- Header widget alone (no tab) — too cramped for insight history
- System Logs filter source only — insufficient visibility

OBSERVABILITY HOOKS SAGE NEEDS:
1. **ActivityFeed write access** — SAGE writes insights/events to ActivityFeed table (DATA-1 GAP 4) so they appear in global activity dock. New kind: 'sage_insight'.
2. **Vault read access** — SAGE reads TRUST/CAP/FAIL tracks. Should use bridge vault/read (currently a stub per ARCH-1).
3. **GovernorDecision write access** — SAGE recommendations that affect trust write GovernorDecision rows with action="sage_recommendation" so they appear in Governor tab.
4. **TokenUsageLog write access** — SAGE's LLM calls must log tokens (currently /api/ai-bridge and /api/chat don't log per DATA-1).
5. **WebSocket channel** — SAGE publishes to `sage:insight` socket event consumed by useSageWS hook (parallel to useSwarmWS).
6. **/api/sage route** — GET returns SAGE status + recent insights; POST actions: analyze_entity, dismiss_insight, promote_to_decision.
7. **Prisma model: SageInsight** — id, kind (anomaly/recommendation/prediction), target_type (agent/model/lane/vault_entry), target_id, summary, confidence, payload JSON, status (active/dismissed/promoted), created_at. Index on (target_type, target_id, status, created_at).
8. **Notification source** — add "SAGE" to notification-center.tsx sourceColors map (currently has Governor/GMR/Swarm/Vault/StressLab/Research/Tokens/Monitor).
9. **LogSource** — add "SAGE" to LogSource union in system-logs.tsx (currently BRIDGE/ENGINE/GOVERNOR/VAULT/GMR/SWARM/MONITOR/CONFIG).
10. **Command Palette** — add "Ask SAGE" action command.

HOW TO ANTICIPATE WITHOUT BLOCKING:
- Reserve 10th sidebar slot NOW with "Coming Soon" badge (disabled click → toast "SAGE integration pending")
- Add SAGE to all color/source maps NOW (placeholder color: #14b8a6 teal)
- Define SageInsight Prisma model NOW (empty table, no rows)
- Stub /api/sage route that returns {status: "not_implemented", insights: []} NOW
- UI renders gracefully when SAGE is offline (gray pill, "SAGE offline" tab content, empty state in activity dock)
- When SAGE arrives: flip the badge, populate the route, no UI restructuring needed

Stage Summary:
- 9 tabs audited. Wired status matches fusion-pack: 8 WIRED + 1 WIRED+MOCK + 2 SIMULATED + 1 MOCK (notifications). Per-tab data source honesty varies wildly: rate-limit-tab is 100% real; overview-tab is 100% fake.
- 14 global components audited. Layout is sidebar+header+main+footer with 6 floating overlays. Zustand store is 117L vanilla (no middleware, no persistence). 7 of 12 documented keyboard shortcuts don't actually work.
- 5 operator workflows traced: check health (0 clicks, all fake), spawn worker (3 clicks, DB-only no real dispatch), run stress test (3 clicks, real LLM but fake metrics), adjust thresholds (2 clicks, no enforcement), investigate vault (3 clicks, fake chain hashes).
- Data source badge system EXISTS in fusion-pack but is NOT exposed to operator. 14 specific fake-data locations identified in UI.
- Visual design system: OKLCH-based emerald-teal palette, Recharts, dark-theme-primary, framer-motion, custom CSS effects (pulse/glow/shimmer/hover-lift). Strong aesthetic, consistent semantic colors.
- 29 specific UX gaps identified for new ops board. 16 strengths to preserve, 13 layout recommendations.
- SAGE accommodation plan: 10th tab + header pill + 10 observability hooks + 5-step "anticipate without blocking" roadmap.

RECOMMENDED NEXT ACTIONS (priority order):
1. Wire overview-tab to /api/system (closes biggest fusion-pack gap, biggest UX trust issue).
2. Add Data Source Badge component — tiny dot on every card header: green=WIRED, yellow=WIRED+MOCK, red=SIMULATED/MOCK. Hover tooltip shows fusion-pack status.
3. Replace hardcoded header values (token budget, agent count) with live /api/tokens and /api/agents polling.
4. Replace hardcoded footer values (error count, rate limit status) with real /api/rate-limit/status aggregation.
5. Wire 7 documented-but-missing keyboard shortcuts (⌘B sidebar, ⌘D theme, ⌘N notifications, R diagnostic, S assistant, / search, P pause).
6. Add "9" keyboard shortcut for rate-limit tab.
7. Add right-rail contextual inspector pattern — convert entity-detail Dialogs to drawers (preserve modals only for destructive confirmations).
8. Implement ActivityFeed model + Global Activity Feed dock (closes DATA-1 GAP 4 + enables real overview activity feed).
9. Implement ChatMessage persistence (closes DATA-1 GAP 6).
10. Reserve 10th sidebar slot for SAGE + stub /api/sage + add SAGE to all color/source maps.
11. Add empty-state pattern across all tabs (replace fake fallbacks with "no data yet" + retry CTA).
12. Polish light theme (fusion-pack §8 issue #8).

---
Task ID: REL-1
Agent: Reliability, Observability & Incident Response
Task: Analyze reliability, observability, and incident-response capabilities of NEXUS OS dashboard

Work Log:
- Read prior worklog entries ARCH-1 (lines 116-434), DATA-1 (lines 436-836), UX-1 (lines 838-1186) for architectural, data-modeling, and UX context.
- Read monitoring layer: nexus_os/monitoring/token_guard.py (599L — TokenGuard + AuditEntry + SemanticCache + quick_track), monitoring/strategies.py (63L — hot_path/warm_path decorators + SemanticCache).
- Read observability layer: nexus_os/observability/tracing.py (108L — TraceContext thread-local). NOTE: observability/squeez.py NOT PRESENT in extracted source — referenced in STATUS_REPORT section 2.3 and tests but missing from snapshot.
- Read governor layer: nexus_os/governor/base.py (352L — NexusGovernor + _CVAVerifier stub), governor/compliance.py (604L — ComplianceEngine + 12 default rules across OWASP/CSA/IMDA/IETF/KAIJU/Internal), governor/trust_engine_v2.py (548L — TrustEngineV2 + DangerLevel + CDRStage + HARDWALL defense stack).
- NOTE: governor/kaiju_auth.py, governor/proof_chain.py, governor/autoharness.py — all three are imported by base.py/compliance.py/STATUS_REPORT but MISSING from extracted source. Importing NexusGovernor or ComplianceEngine would raise ImportError.
- Read GMR layer: nexus_os/gmr/circuit_breaker.py (59L — AdaptiveCircuitBreaker 3-state machine + exponential backoff), gmr/rotator.py (463L — GeniusModelRotator + inline CircuitBreaker class — DUPLICATE), gmr/scheduler.py (62L — RefreshScheduler 5min interval).
- Read swarm layer: nexus_os/swarm/foreman.py (444L — Foreman worker pool + 15min heartbeat + monitor_loop), swarm/worker.py (294L — Worker file-driven task processing + simulated execute_task).
- Read vault layer: nexus_os/vault/poisoning.py (285L — MinjaDetector v2 with TF-IDF + velocity + pattern anomaly), vault/manager.py (86L — VaultManager 5-track UPSERT schema). NOTE: vault/decay_worker.py MISSING from extracted source — referenced in STATUS_REPORT.
- Read engine layer: nexus_os/engine/executor.py (261L — TaskExecutor + 3 backends), engine/router.py (352L — DAG + DFS cycle detection). NOTE: engine/heartbeat.py MISSING from extracted source — referenced in STATUS_REPORT section 2.3.
- Read dashboard components: src/components/nexus/diagnostics-panel.tsx (382L — 5-step sequential health check, auto-run on open), src/components/nexus/system-logs.tsx (244L — ENTIRELY FABRICATED from 20 hardcoded templates), src/components/nexus/notification-center.tsx (249L — 12 hardcoded simulated notifications cycling every 30-60s).
- Read docs: HEARTBEAT.md (68L — moveable strategy doc for cloud-orchestrator 30-min cycle), NEXUS_OS_STATUS_REPORT.md sections 4-8 (simulations, problems, status, Phase 0 readiness), 01_PROJECT_STATE.md (128L — 5 critical blockers, P0 sequence).
- Read mini-services/swarm-ws/index.ts (261L — Socket.io service emitting 5 channels of FABRICATED events every 3-8s), src/hooks/use-swarm-ws.ts (163L — client consuming those fabricated events), src/hooks/use-api-data.ts (80L — polling hook).
- Cross-referenced dashboard observability claims with Python reality: dashboard system-logs panel reports fake log entries while Python backend has real logging.getLogger calls; dashboard diagnostics checks 4 endpoints but skips Python backend (port 7352) and WebSocket (port 3003); dashboard notification-center fabricates incidents while Python backend has no incident emission mechanism.

Key Findings:

A. MONITORING ARCHITECTURE
==========================

WHAT'S MONITORED (claims vs reality):

| Surface | Python (canonical) | Dashboard (Next.js) | Wired Together? |
|---|---|---|---|
| Token budget | TokenGuard: 4 budgets (agent=50k, skill=10k, swarm=200k, session=500k), warning@80%, hard-stop@95%, atomic check_and_reserve() | /api/tokens reads SessionBudget.total=100k (DIFFERENT default), updates usedBudget on log_usage only | NO — Python TokenGuard not called from any /api/* route; /api/ai-bridge and /api/chat consume tokens SILENTLY (no logging) |
| Trust score | TrustEngineV2: per-(agent,lane) logistic+decay+CDR with 6-stage machine, persisted to vault "current" key (UPSERT, not chain) | /api/trust-engine recomputes from Agent.trustScore with hard-coded lane modifiers (-0.05/+0.0/+0.02/-0.03) — completely separate formula | NO — three parallel trust systems (per DATA-1); dashboard ignores Python canonical |
| Worker health | Foreman: 15-min heartbeat, monitor_loop checks every heartbeat_interval/4 (~3.75min), marks unhealthy after 2 missed (30min), removes dead after 4 missed (60min) | /api/swarm creates Agent DB row on spawn — NO real Foreman, NO real OpenClaw spawner, NO .task.md queue | NO — dashboard swarm is DB-only simulation; Python Foreman is unwired |
| Rate limits | (Python: not modeled — mcpaauth.py rate_limit field declared but never enforced per ARCH-1) | /api/rate-limit/status aggregates RateLimitLog per provider — REAL in-memory rate-limiter.ts + api-key-manager.ts + api-cache.ts | PARTIAL — TS rate-limit infra is real but N+1 query pattern (6 providers × findMany 100 rows each on every GET) |
| Vault integrity | VaultManager: 5-track UPSERT (agent_id, lane, track_type, key) — NOT a hash chain; MinjaDetector v2 (velocity + TF-IDF + pattern anomaly) exists but UNWIRED | /api/vault verify_chain checks timestamp monotonicity + JSON parse + score range only — NOT cryptographic; chain hashes in UI are FAKE (computed from entry ID charCodeAt) | NO — two parallel vault designs (Python UPSERT vs Prisma append); neither implements real chain; poisoning.py not called from any write path |
| Model health | GeniusModelRotator: dual-pool (FAST/PREMIUM), composite scoring (success/throughput/latency/cost/intent), AdaptiveCircuitBreaker 3-state + exp backoff | /api/models POST health_check pings ZAI SDK only (not OpenRouter/Cerebras/Jina); NO circuit breaker state field on ModelEntry; GMR tab hardcodes rotation/failover logs | NO — Python GMR not wired; dashboard uses its own inline CircuitBreaker (2-state, fixed 60s cooldown, NO HALF_OPEN, NO exp backoff) — DUPLICATE implementation |
| Process health | AgentCycleRunner (cron/agent_cycle.py): runs pytest + canary HTTP GET to localhost:8000/health + git auto-backup + log rotation; cycle count persisted to cycle_report.json | /api/system computes pillar health from 11 Prisma models — REAL but UNCONSUMED by overview-tab (per UX-1) | NO — AgentCycleRunner is CLI-only (`python agent_cycle.py --root .`), not scheduled; dashboard doesn't read cycle_report.json |
| Bridge health | BridgeServer exposes GET /health; cron canary hits localhost:8000/health; canary_enabled flag default False | Diagnostics panel checks /api/system, /api/models, /api/agents, /api/tokens — does NOT check Python bridge (port 7352) or WebSocket (port 3003) | NO — bridge health not surfaced to dashboard |

DATA COLLECTION MECHANISMS:
1. POLLING — 9 tabs use useApiData(url, refreshInterval) hook with 10-30s intervals (rate-limit=10s, swarm=15s, governor=15s, vault=15s, stresslab=15s, models=15s, research=30s, tokens=30s, system=30s). All HTTP GET → Prisma/SQLite.
2. WEBSOCKET — only Swarm tab via useSwarmWS hook (Socket.io on port 3003, 5 channels: worker-update/task-complete/task-queued/metrics/activity). ALL EVENTS ARE FABRICATED — generated by mini-services/swarm-ws/index.ts using pick() random selection from hardcoded arrays every 3-8s. No real backend event emission.
3. CRON — only AgentCycleRunner (cron/agent_cycle.py) — but it's a CLI tool, not a scheduled daemon. Can be invoked manually via `python agent_cycle.py`. Default config: enable_canary=False, git_backup_enabled=True, max_log_size=10MB. Logs to cron/cycle.log.
4. HOOKS — Python backend uses logging.getLogger() extensively (governor, monitoring, gmr, swarm, vault) but logs go to Python stdout/stderr only — there is NO log shipper, NO syslog forwarder, NO log aggregation service. Dashboard system-logs panel does NOT ingest these logs.
5. FILE-BASED — Worker.send_heartbeat() writes JSON to .heartbeats/{worker_id}.json every 15min. Foreman reads them via monitor_loop. NOT exposed to dashboard.

IN-MEMORY vs PERSISTED:
- IN-MEMORY ONLY (lost on process restart):
  - TokenGuard._audit (capped 10000 AuditEntry)
  - TokenGuard._cache (semantic cache, no TTL, no eviction)
  - SemanticCache._cache (monitoring/strategies.py)
  - TrustEngineV2._cache (Dict[str, TrustRecord] per agent:lane)
  - MinjaDetector._project_indexes (TF-IDF) + _write_history + _agent_writes
  - ComplianceEngine._check_history (List[ComplianceResult])
  - Foreman._workers + _task_assignments + _task_queue + _results
  - BridgeServer._task_results (Dict[str, Any])
  - ai-provider-bridge.ts route health, rate-limiter.ts state, api-key-manager.ts state, api-cache.ts (per UX-1/DATA-1)
  - nexus-store.ts chatMessages + notifications (Zustand, no persist middleware)
- PERSISTED (SQLite):
  - Prisma: 12 models (Agent, VaultEntry, GovernorDecision, ModelEntry, TestTemplate, TestRun, Paper, TokenUsageLog, SessionBudget, SystemConfig, RateLimitLog, ApiKey)
  - Python VaultManager: agent_memory_tracks table (5-track UPSERT)
  - Python audit_logs table (governor decisions + compliance evaluations)
  - Python tasks + task_dependencies tables (engine router)
  - cron/cycle_report.json (cycle count + last result)
- CRITICAL GAP: TokenGuard audit, MinjaDetector indexes, TrustEngineV2 cache — all are in-memory only. Process restart LOSES audit history, poisoning detection baseline, and trust state cache (must be reloaded from vault "current" key).

MONITORING COVERAGE GAPS:
1. NO real-time alerting — no webhook, no email, no Slack, no PagerDuty, no OpsGenie integration anywhere in codebase.
2. NO SLO tracking — no ServiceLevelObjective model, no error budget, no burn-rate tracking.
3. NO uptime tracking — overview-tab "3d 14h 27m 52s" uptime is hardcoded (per UX-1).
4. NO error rate monitoring — footer error count is random 8% chance per 5s (per UX-1).
5. NO Python process health monitoring in dashboard — bridge on 7352, Ollama on 11434, TWAVE on 7353, swarm-ws on 3003 all unchecked.
6. NO disk/memory/CPU metrics — no node_exporter, no psutil, no system stats.
7. NO log aggregation — Python logs to stdout, Next.js logs to stdout, no shared log surface.
8. NO metric time-series — /api/rate-limit/status does live aggregation over RateLimitLog on every GET (N+1 pattern); /api/system uses sin-wave + seededRandom to fake time-series from point-in-time data (per DATA-1).
9. NO worker process monitoring — Worker.execute_task() is simulated (time.sleep(0.5), fake output) — there is no real LLM call in the Python worker path.
10. NO canary/synthetic monitoring — agent_cycle.py has enable_canary flag but it's default False and runs canary against localhost:8000/health (which is the WRONG port — should be 7352 per 01_PROJECT_STATE.md).

B. OBSERVABILITY STACK
======================

TRACING (trace_id propagation):
- TraceContext class (observability/tracing.py): thread-local trace_id storage via threading.local()
- generate_trace_id(): "trace-{uuid4().hex[:16]}" — 16 hex chars = 64 bits entropy
- with_trace_id(tid): contextmanager that sets + clears trace_id on enter/exit
- Module-level singleton: `trace_context = TraceContext()`
- WIRED INTO: governor/base.py check_access() accepts trace_id param and passes to _audit_log; bridge/server.py reads X-Nexus-Trace-ID header and propagates through AuthResult
- NOT WIRED INTO: any /api/* dashboard route (TypeScript handlers don't generate/propagate trace IDs); system-logs panel doesn't display trace_id; no OpenTelemetry, no Jaeger, no Zipkin, no Honeycomb integration
- GAP: trace_id is generated by client (X-Nexus-Trace-ID header) — no server-side generation, no propagation to downstream calls, no parent/child span tracking. This is request-scoped tracing, NOT distributed tracing.

LOGGING:
- Python: extensive logging.getLogger() calls across all 9 packages (governor, monitoring, gmr, swarm, vault, bridge, engine, db, cron). Log format: standard `%(asctime)s [%(levelname)s] %(name)s: %(message)s`. Log destination: stdout/stderr only — no file handler configured, no rotation, no remote shipping.
- TypeScript: Next.js default logging (console.log/error), no structured logger (no pino, no winston, no bunyan).
- Dashboard System Logs Panel (system-logs.tsx): ENTIRELY FABRICATED from 20 hardcoded logMessages templates. generateLogEntry() cycles through templates with `logCounter++` modulo, stamps them with current timestamp. Auto-emits every 1.5-3.5s. The "Live" badge is misleading. NO real log ingestion. Filters by level (DEBUG/INFO/WARN/ERROR/CRITICAL) and source (BRIDGE/ENGINE/GOVERNOR/VAULT/GMR/SWARM/MONITOR/CONFIG) operate on the fake data.
- GAP: the dashboard shows 100% fake logs while the Python backend produces real logs that vanish into stdout. An operator investigating an incident via the system-logs panel sees nothing real.

METRICS:
- WHAT'S COUNTED:
  - Agent: totalTokens, tasksDone, tasksFailed (Prisma)
  - GovernorDecision: decision enum (ALLOW/DENY/HOLD), impact enum (LOW/MED/HIGH/CRIT) (Prisma)
  - TokenUsageLog: promptTokens, completionTokens, totalTokens, cost, apiEndpoint (Prisma)
  - TestRun: tokensUsed, durationMs, collapseDetected, vapProofHash (Prisma)
  - ModelEntry: totalCalls, successRate, health, latencyMs (Prisma)
  - RateLimitLog: statusCode, wasRateLimited, wasCached, wasDeduped, responseTimeMs, tokensUsed (Prisma)
  - ApiKey: totalRequests, total429s, successRate, lastError (Prisma)
  - Foreman: tasks_assigned, tasks_completed per worker (in-memory)
  - TokenGuard: budget.used, budget.warnings_issued (in-memory)
- WHAT'S NOT COUNTED:
  - No request latency histogram (no p50/p95/p99 tracking)
  - No error rate by endpoint (no per-route success/error counter)
  - No queue depth over time (Foreman._task_queue length not persisted)
  - No model rotation event log (per DATA-1 GAP 2: no RotationEvent Prisma model — GMR tab hardcodes the log)
  - No failover event log (per DATA-1 GAP 3: no FailoverEvent Prisma model — GMR tab hardcodes)
  - No circuit breaker state transitions (no state_change events emitted)
  - No trust score trajectory (per DATA-1 GAP 1: no TrustHistory model — only "current" snapshot in vault)
  - No cost optimization tracking (per DATA-1 GAP 5: no CostOptimizationEvent model)
  - No poisoning detection stats (MinjaDetector runs but counts not exposed)
  - No vault write/read counts
  - No CDR stage transition counts (escalation/recovery events logged via logger.warning but not persisted)
- GAP: metrics are scattered across 7 Prisma models with no unified metric registry, no /metrics endpoint (no Prometheus exposition format), no metric labels, no histograms.

DASHBOARDS (which tabs serve as observability surfaces):
- overview-tab: SIMULATED — pillar health grid is hardcoded (88-100), activity feed is 12 rotating canned messages, uptime "3d 14h 27m 52s" is hardcoded, /api/system is NEVER called (per UX-1)
- governor-tab: WIRED — real decisions table, real trust stats, real threshold sliders (but thresholds not enforced anywhere), LiveDecisionFeed uses fake reasons (liveFeedReasons array)
- vault-tab: WIRED — real entries, real verify_chain call (but verification is weak: timestamp+JSON+score range, NOT cryptographic)
- stresslab-tab: WIRED — real ZAI SDK calls, real TestRun persistence (but token count is word×1.3 heuristic, vapProofHash is just unique ID not crypto hash)
- tokens-tab: WIRED — real budget, real usage logs, real per-agent/model breakdown (but burn rate "142 tok/min" is hardcoded, optimization suggestions are 4 hardcoded items, avgLatency always 0)
- rate-limit-tab: WIRED (cleanest per UX-1) — real provider cards, real cooldown countdowns, real health badges (but N+1 query on every poll, no historical 429 trend chart)
- swarm-tab: WIRED + WS — real /api/swarm + WS overlay (but spawn is DB-only, task queue and recent completed are hardcoded fallbacks even when API has data)
- gmr-tab: WIRED+MOCK — real /api/models (toggle + health_check), MOCK_BRIDGE_DATA + failover log + rotation analytics all hardcoded
- research-tab: WIRED but dead-end — 6 seeded papers only, NO way to discover new ones (no POST endpoint, no arXiv API)

THE SQUEEZ LOG COMPRESSION SYSTEM:
- DOES NOT EXIST in extracted source. STATUS_REPORT section 2.3 lists `nexus_os/observability/squeez.py` and section 6.3 mentions "Integration Tests: Compliance, bridge, heartbeat, Hermes, Squeez" — but the file is MISSING from the dashboard-pack/nexus-os-source/ snapshot.
- Likely scenario: Squeez was implemented in an earlier/canonical branch but not included in this ZIP extraction, OR it was a planned module that was never written. Either way: NO log compression system is operational in this snapshot.

C. INCIDENT RESPONSE WORKFLOW
==============================

HOW DOES THE OPERATOR DETECT AN INCIDENT?
- PRIMARY PATH: operator opens dashboard → overview tab → sees 8 pillar health cards (HARDCODED 88-100), 24h health timeline (seededRandom), live activity feed (12 rotating canned messages), system notifications (5 hardcoded), recent decisions (hardcoded), quick stats (requestCount random +5s).
- REAL DETECTION: operator must manually navigate to governor-tab (real DENY decisions visible), vault-tab (real entries but fake chain hashes), tokens-tab (real budget), rate-limit-tab (real provider health), swarm-tab (real agent rows but fake task queue), and click "Run Diagnostic" in overview-tab (real sequential fetch of 4 endpoints).
- WEAKNESS: there is NO anomaly detection, NO threshold-based alerting, NO error rate spike detection. Operator must visually scan 9 tabs to discover issues. The dashboard's most prominent indicators (overview pillar health, system notifications, activity feed) are FAKE — they will never reflect real incidents.

WHAT ALERTS EXIST?
- DASHBOARD NOTIFICATIONS (notification-center.tsx): 10 initial hardcoded notifications + simulated ones added every 30-60s from 12 templates. 100% FABRICATED. Operator sees alerts that look real but never correlate to actual system events.
- TOAST NOTIFICATIONS (sonner): real, fired on API call success/failure (e.g., "Worker X spawned successfully", "Diagnostics complete: System health X%"). These ARE tied to real API responses but only fire on user-initiated actions — no background monitoring.
- PYTHON LOGGER WARNING: governor logs warnings on CRITICAL danger escalation, CDR stage escalation, budget warnings. But these go to stdout — NOT visible to dashboard operator unless they have a separate terminal open watching the Python process.
- COMPLIANCEENGINE: evaluate() returns status BLOCKED when critical violations found. Logged to audit_logs table. NOT surfaced to dashboard.
- TRUSTENGINEV2: CDR escalation logged via logger.warning(). NOT surfaced to dashboard except via /api/trust-engine GET which returns cdr_stages + cdr_distribution snapshots.
- TOKENGUARD: _issue_warning() is just `print(f"[TokenGuard] WARNING: ...")` — NO event emission despite docstring claiming "In production: emit event for Governor/SkillSmith".
- AGENTCYCLERUNNER: run_canary() returns (bool, str) tuple — printed to stdout by main(). No alert on canary failure.
- BRIDGE HELD STATE: HeldError raises HTTP 202 with hold_ticket — surfaced as JSON response to API caller. NOT displayed in dashboard.

WHAT REMEDIATION ACTIONS ARE AVAILABLE FROM THE DASHBOARD?
- SWARM-TAB: spawn_worker, terminate_worker, restart_worker, reassign_task, update_trust (POST /api/swarm) — but spawn only creates DB row (no real OpenClaw process), terminate/restart just flip DB status, reassign doesn't actually move a task.
- GOVERNOR-TAB: appeal (creates HOLD decision), update_threshold (writes JSON to SystemConfig — NOT enforced), add_pattern (writes to danger_patterns JSON — NOT matched against requests).
- VAULT-TAB: verify_chain (weak — timestamps + JSON parse only).
- GMR-TAB: toggle (flips ModelEntry.isActive), health_check (pings ZAI SDK), batch_health_check (sequential ZAI pings).
- STRESSLAB-TAB: run_test (real ZAI call), batch_run (sequential ZAI calls).
- TOKENS-TAB: log_usage (manual entry, no enforcement).
- DIAGNOSTICS-PANEL: Run Diagnostic (read-only — no remediation actions, just displays results).
- AI-ASSISTANT: chat with ZAI SDK (can ask for help but assistant has no system-modification powers).
- GLOBAL EXPORT (⌘E): JSON/CSV download of current state — useful for postmortem evidence preservation.
- EXPORT-BUTTON per tab: same JSON/CSV export.
- NOTHING ELSE: no "restart Python backend" button, no "flush TokenGuard cache" button, no "force CDR reset" button, no "rotate API keys" button, no "kill stuck task" button, no "trigger canary" button.

WHAT'S MISSING FOR A PROPER INCIDENT RESPONSE LOOP:
1. NO ALERTING PIPELINE — no Alertmanager, no PagerDuty integration, no Slack webhooks, no email-on-critical. Real Python warnings (CRITICAL danger escalation, CDR COLLAPSE, budget hard-stop, compliance BLOCKED) are invisible to dashboard operator.
2. NO PAGING — no on-call rotation, no escalation policy, no after-hours notification.
3. NO RUNBOOKS — no documented incident response procedures. HEARTBEAT.md describes a 30-min cloud-orchestrator strategy but not operator-facing runbooks for "worker unresponsive", "vault chain broken", "trust score collapsed", "token budget exhausted", "rate limit 429 storm", "compliance violation triggered".
4. NO POSTMORTEM TEMPLATE — no Postmortem Prisma model, no incident timeline, no root-cause-analysis field, no action-items tracking.
5. NO INCIDENT DECLARATION — no "declare incident" button, no severity level assignment, no incident channel, no war-room coordination.
6. NO AUTOMATED REMEDIATION — no auto-restart on worker failure (Worker.stop() doesn't trigger restart; Foreman marks unhealthy but doesn't auto-spawn replacement), no auto-failover on model degradation (circuit breaker exists but isn't wired to switch models in /api/models), no auto-budget-refill, no auto-trust-reset on COLLAPSE.
7. NO ERROR BUDGET — no SLO definition, no burn-rate tracking, no policy "stop deploying when budget exhausted".
8. NO STATUS PAGE — no external-facing status.nexus.os page.
9. NO CHRONOLOGICAL INCIDENT LOG — no IncidentEvent model. Activity feed is fake. Audit logs table exists but is operator-invisible.
10. NO METRIC-TO-INCIDENT LINKAGE — when governor DENYs an action, no incident is created. When circuit breaker OPENs, no incident is created. When worker dies, no incident is created.

D. GOVERNOR + COMPLIANCE ENFORCEMENT
=====================================

KAIJU 4-VARIABLE AUTHZ IN PRACTICE:
- DECLARED: NexusGovernor.check_access() takes agent_id, project_id, action, scope (SELF/PROJECT/CROSS/SYSTEM), intent (free text), impact (LOW/MED/HIGH/CRIT), clearance (reader/contributor/maintainer/admin), trace_id, context.
- IMPLEMENTATION: builds AuthRequest, calls KaijuAuthorizer.authorize(), returns AuthResult (ALLOW/DENY/HOLD).
- ACTUAL ENFORCEMENT: KaijuAuthorizer class is in nexus_os/governor/kaiju_auth.py — FILE IS MISSING from extracted source. Per STATUS_REPORT it has KaijuAuthorizer + AuthRequest + AuthResult + ScopeLevel + ImpactLevel + ClearanceLevel + Decision. Per ARCH-1: 4-var authz = scope×clearance + impact×clearance + intent×action. But the implementation is not loadable in this snapshot — importing NexusGovernor raises ImportError.
- BRIDGE WIRING: bridge/server.py _authorize() calls governor.check_access() with kaiju dict from request payload. Method→action map: tasks/submit→execute, tasks/status→read, vault/read→read, vault/write→write. BridgeServer has `governor=None` default → SKIPS authz entirely in dev mode.
- DASHBOARD WIRING: ZERO. /api/governor route reads/writes GovernorDecision table directly. /api/swarm, /api/stresslab, /api/vault, /api/tokens — none call Python governor. The 4-var authz is documentation, not policy, on the dashboard side.
- HOLD QUEUE: governor.get_hold_queue() delegates to kaiju.get_hold_queue(). resolve_hold(trace_id, decision) delegates to kaiju.resolve_hold(). Both fail because kaiju_auth.py is missing.
- CRITICAL GAP: per DATA-1, governor_thresholds stored in SystemConfig but NEVER enforced — no route checks "is requester trust >= threshold.impl?".

HOW TRUST THRESHOLDS ARE (OR AREN'T) ENFORCED:
- PYTHON TrustEngineV2: implements HARDWALL defenses — logistic scaling (gains harder at high trust — though DATA-1 notes the docstring claim is questionable since at T=25 success gain is only 0.3 points while at T=90 it's 3.92 points), adaptive temporal decay (lambda × (1 + disagreement_rate)), non-compensatory CRITICAL (-20 delta regardless of success), asymptotic plateau (max 99.5), 6-stage CDR state machine.
- ESCALATION: NORMAL+score<30 → DEGRADED; DEGRADED+3 regressions → MEMORY_CORRUPTION; MEMORY_CORR+score<20 → HALLUCINATION; HALLUCINATION+5 regressions → CASCADE; score<15 → COLLAPSE. Recovery: score>50 + 0 regressions + 5+ convergence turns → step down ONE stage. CRITICAL danger forces CDR to ≥ CASCADE.
- BUT: TrustEngineV2.update_trust() is called BY WHOM? Searching the extracted source — only the file itself defines the method. There's no scheduler, no hook, no /api endpoint that calls update_trust(). The engine exists but is NOT invoked anywhere in the dashboard flow.
- DASHBOARD /api/trust-engine: returns cdr_stages + danger_levels + hardwall_config but uses LOCAL HEURISTIC (trust + lane_modifier) — does NOT call Python trust_engine_v2. CDR thresholds: <0.15=COLLAPSE, <0.30+5 regressions=HALLUCINATION, <0.30=DEGRADED, 3+ regressions + <0.50=MEMORY_CORRUPTION. (Note: dashboard scale is 0-1; Python scale is 0-99.5 — they don't even share units.)
- ENFORCEMENT: NONE. The thresholds are stored as JSON in SystemConfig. They're displayed in governor-tab. They're editable via sliders. But NO route reads them to gate any action. Spawn worker doesn't check "is requester trust >= threshold.impl?". Run stress test doesn't check "is agent.trustScore >= threshold.research?". They're documentation, not policy.

THE HARDWALL MECHANISM:
- The "hard wall" concept from the research papers (arXiv:2603.15973 "Safety is Non-Compositional", arXiv:2603.13325 "Auditing Cascading Risks in MAS") is implemented in trust_engine_v2.py as the non-compensatory CRITICAL block: `if danger == DangerLevel.CRITICAL: delta = -20; record.cdr_stage = at least CASCADE`. A successful CRITICAL-classified action still costs 20 trust points — there is no offset for success.
- DANGER LEVELS: SAFE=0, CAUTION=1, RESTRICTED=2, HIGH_RISK=3, CRITICAL=4. Only CRITICAL has hard-block semantics in trust_engine_v2. The other 4 levels are informational.
- COMPLIANCE NEXUS-01 RULE: `if trust < 0.3 and action in (write, delete, execute): WARNING (not blocked)`. This is the closest thing to a trust threshold enforcement — but it's a WARNING, not a BLOCK. The remediation says "Consider restricting this agent to read-only" — passive voice, no automated restriction.
- HARDSTOP IN GOVERNOR: `_check_token_budget` returns DENY at 95% budget usage. This is a real hard-stop, but it's only enforced via governor.check_access() — which the dashboard doesn't call.
- HARDSTOP IN COMPLIANCE: `evaluate()` returns ComplianceStatus.BLOCKED if TokenGuard.check() fails OR if any CRITICAL-level rule is violated. The BLOCKED status propagates back through governor → BridgeServer → HTTP 403.
- HARDSTOP IN BRIDGE: handle_request() and handle_submit() do pre-check `if not self.token_guard.check(agent_id, 1000): return 429`. Returns JSON-RPC error with code 429.

HOW CDR ESCALATION WORKS AS A RELIABILITY MECHANISM:
- THEORY: as an agent's trust degrades, it progresses through 6 cognitive-degradation stages. COLLAPSE = agent pulled from rotation. This is the reliability escape valve — bad agents self-quarantine.
- IMPLEMENTATION: _update_cdr_stage() is called at end of update_trust(). Transitions are logged via logger.warning("CDR escalation: %s -> %s"). Trust record persisted to vault "current" key with new cdr_stage field.
- RELIABILITY USE: NONE in current dashboard. The CDR stages are DISPLAYED in governor-tab (6-stage pipeline visualization, CDR distribution pie chart) — but no action is taken when an agent enters CASCADE or COLLAPSE. The agent isn't pulled from the worker pool. The agent isn't restricted to read-only. The operator isn't paged.
- RECOVERY: from CASCADE → HALLUCINATION → MEMORY_CORRUPTION → DEGRADED → NORMAL via score>50 + 0 regressions + 5+ convergence turns. From COLLAPSE: NO automatic recovery — manual reset_agent() call required (and no API endpoint exposes this).

THE COMPLIANCE CHECKER:
- 12 default rules across 5 frameworks:
  - OWASP ASI 2026 (5 rules): authentication, prompt injection defense, data provenance, supply chain verification, excessive agency prevention
  - CSA Agentic Trust (2 rules): zero-trust access, cross-project isolation
  - IMDA Singapore (1 rule): human oversight for high-impact actions
  - IETF VAP (1 rule): verifiable AI provenance (audit chain)
  - KAIJU (1 rule): intent-gated execution
  - Internal (2 rules): trust score threshold, memory encryption
- STATUS LEVELS: COMPLIANT / WARNING / NON_COMPLIANT / BLOCKED. Critical violations → BLOCKED. Non-critical violations → NON_COMPLIANT. Warnings → WARNING. Clean → COMPLIANT.
- CRITICAL DEPENDENCY: each check_fn depends on context.* fields the caller MUST set:
  - check_authentication needs `signature_verified` OR `has_secret`
  - check_poisoning_defense needs `poison_check_passed` (only checked for write actions)
  - check_provenance needs `trace_id` OR `lineage_id`
  - check_clearance_enforcement needs `kaiju_authorized`
  - check_deny_default needs `is_registered`
  - check_project_isolation needs `project_id` + `target_project_id` + `clearance`
  - check_human_oversight needs `impact` + `human_hold_required`
  - check_audit_chain needs `trace_id`
  - check_intent_gating needs `intent` (must be ≥10 chars for delete/execute/write)
  - check_trust_threshold needs `trust_score`
  - check_encryption needs `classification` + `encryption_enabled`
- BRIDGE WIRING: bridge/server.py _authorize() passes context={"signature_verified": True, "has_secret": True, "is_registered": True} — but NOT poison_check_passed, NOT response_validated, NOT trace_id (uses trace_id from request line, not in context), NOT trust_score, NOT classification, NOT encryption_enabled. So most compliance checks will silently pass or skip.
- DASHBOARD WIRING: ZERO. /api/* routes don't call compliance_engine.evaluate(). The 12 rules are documentation.
- VAUDIT TRAIL: _log_evaluation writes to audit_logs (actor_id="compliance-engine", action="evaluate", resource_id=agent_id, decision=status, details=JSON, trace_id). PERSISTED — but only via Python path, never queried by dashboard.
- generate_badge(): returns compliance_rate based on _check_history length — but _check_history is in-memory, lost on restart. Badge always shows 100% compliance on fresh start.

E. CIRCUIT BREAKER + FAILURE CASCADE
=====================================

ADAPTIVECIRCUITBREAKER (gmr/circuit_breaker.py):
- 3-STATE MACHINE:
  - CLOSED: normal operation, requests flow, failures counted
  - OPEN: tripped after failure_threshold (default 3) failures, requests blocked, cooldown timer starts (default 60s)
  - HALF_OPEN: cooldown elapsed, next request is a "probe" — if it succeeds, transition to CLOSED; if it fails, exponential backoff and return to OPEN
- EXPONENTIAL BACKOFF: `cooldown = min(cooldown * 2, 3600)` — doubles on each HALF_OPEN failure, max 1 hour
- STATE TRANSITIONS:
  - CLOSED → OPEN: failure_count >= failure_threshold
  - OPEN → HALF_OPEN: lazy on `state` property access when time.time() >= open_until
  - HALF_OPEN → CLOSED: record_success()
  - HALF_OPEN → OPEN: record_failure() (with exponential backoff)
- THREAD SAFETY: NONE — no Lock around _state, _failure_count, _cooldown, _open_until. Concurrent record_failure() calls could double-count failures and double-trip the breaker. This is a correctness bug under concurrent load.
- LOGGING: logger.info on HALF_OPEN entry, logger.warning on recovery-failed (HALF_OPEN → OPEN), logger.error on initial trip (CLOSED → OPEN), logger.info on full recovery.
- CAN_EXECUTE(): returns True if state is CLOSED or HALF_OPEN, False if OPEN.

HOW IT PREVENTS FAILURE CASCADES IN THE GMR:
- INTENDED USE: GeniusModelRotator.execute_with_fallback() iterates a cascade of 3 models. On failure, calls model.record_failure() (inline CircuitBreaker, NOT AdaptiveCircuitBreaker). On success, calls model.reset_failure_count(). The AdaptiveCircuitBreaker class EXISTS but is NOT instantiated anywhere in rotator.py.
- INLINE CircuitBreaker (rotator.py lines 116-135): 2-state (open/closed implied via should_open), fixed 60s cooldown, NO HALF_OPEN, NO exponential backoff. _failures dict + _cooldowns dict per model. 3 failures → 60s cooldown.
- DUPLICATE IMPLEMENTATION: both classes exist in the codebase, neither is the canonical one. The rotator uses the inline one. The AdaptiveCircuitBreaker (with proper 3-state machine) is dead code in this snapshot.
- ZERO-CASCADE-LOSS HANDOFF: execute_with_fallback() prepends ContextPacket.to_prompt_prefix() to original_prompt on attempt i>0 — preserves task_id, intent, budget_remaining, core_facts, decisions_made, pending_actions, tool_state, trace_id across model switches.

HOW IT RECOVERS:
- INLINE CircuitBreaker: 60s cooldown, then should_open() returns False → next request goes through. NO probe — first request after cooldown is real traffic. If it fails, another 60s cooldown.
- AdaptiveCircuitBreaker: HALF_OPEN state — next request is a probe. Success → CLOSED. Failure → OPEN with doubled cooldown.
- MODEL PROFILE: `reset_failure_count()` and `record_failure()` are methods on ModelProfile — but ModelProfile in rotator.py doesn't actually have these methods defined (only flexible __getattr__ that returns None for unknown attrs). So `self.models[model_name].record_failure()` silently does nothing. Same for `reset_failure_count()`.
- GAP: the inline CircuitBreaker is dead code — its record_failure/should_open/reset methods are defined but NEVER called by execute_with_fallback(). The cascade just iterates and catches exceptions, never consulting the breaker.

WHETHER IT'S WIRED INTO THE DASHBOARD:
- /api/models: GET returns ModelEntry list (no circuit_breaker_state field). POST actions: toggle, health_check, batch_health_check. NO circuit breaker interaction.
- ModelEntry Prisma model: NO circuit_breaker_state field, NO failure_count field, NO cooldown_until field (per DATA-1).
- GMR-TAB UI: hardcodes failover log (5 events) and rotation log — no real circuit breaker events shown. "Circuit Breaker Status" panel does not exist.
- CIRCUIT BREAKER IN SDK: bridge/sdk.py has its own client-side CircuitBreaker (3-state, failure_threshold=5, recovery_timeout=60s, thread-safe via threading.Lock) — a THIRD implementation. Used by NexusClient to protect against bridge server failures.
- SUMMARY: 3 circuit breaker implementations exist (AdaptiveCircuitBreaker in gmr/circuit_breaker.py, inline CircuitBreaker in gmr/rotator.py, client CircuitBreaker in bridge/sdk.py). None are wired into the dashboard. None share state. The AdaptiveCircuitBreaker (best design) is dead code.

F. VAULT INTEGRITY + POISONING DETECTION
==========================================

THE 5-TRACK VAULT AS A RELIABILITY SURFACE:
- 5 TRACKS (MemoryTrack enum, per DATA-1):
  - EVENT: raw task outcomes (append_event)
  - TRUST: per-lane Bayesian reputation (append_trust)
  - CAPABILITY: what agent is good at (append_capability with EMA: store[tag] = 0.7*old + 0.3*confidence)
  - FAILURE_PATTERN: recurring weaknesses (append_failure, severity ≥5=high/≥2=medium/else=low)
  - GOVERNANCE: behavior under rules (append_governance)
- VAULT SCHEMA (Python vault/manager.py): SQLite table `agent_memory_tracks` — id, agent_id, lane, track_type (CHECK constraint enforces 5 values), key, value (JSON), updated_at. UNIQUE(agent_id, lane, track_type, key) → UPSERT semantics.
- VAULT SCHEMA (Prisma VaultEntry): id (cuid), agentId (FK), track (String short codes: EVENT/TRUST/CAP/FAIL/GOV), category, key, value (JSON string), score (Float), createdAt. APPEND semantics (no UNIQUE constraint).
- CRITICAL MISMATCH: Python vault uses UPSERT (last-write-wins per key). Prisma vault uses APPEND (full history). They are DIFFERENT DATA MODELS. An agent's "current" trust score in Python overwrites the prior; in Prisma, every trust update is a new row.

CHAIN VERIFICATION (REAL vs FAKE per DATA-1):
- PYTHON: NO chain. VaultManager.store_track() does INSERT...ON CONFLICT DO UPDATE — no prev_hash, no entry_hash, no signature. The "current" key is overwritten.
- PRISMA: NO chain. VaultEntry has no prev_hash/hash/signature fields. createdAt is auto-generated.
- /api/vault POST action=verify_chain: reads all VaultEntry rows ordered by createdAt ASC. Checks: entries exist, each has agentId/track/key/JSON-parseable value, timestamps monotonically non-decreasing, scores in [0,1]. Returns {valid, entryCount, issues[]}. DOES NOT: recompute hashes, verify signatures, detect tampering, verify track-specific schema, verify lane references, check agent existence.
- VAULT-TAB UI: chain block hashes are FAKE — `0x${e.id.slice(0,4)}...${String(Math.abs(e.rawEntry.id.charCodeAt(0)*31+i*17)).slice(0,4)}`. Computed from entry ID char codes — NOT a cryptographic hash of content. Verify Chain button calls real /api/vault verify_chain but the verification itself is structural-only.
- A malicious actor with DB write access could rewrite any vault entry undetected — the chain provides ZERO tamper-evidence.

POISONING DETECTION (EXISTS BUT UNWIRED):
- MINJA v2 (vault/poisoning.py MinjaDetector): 3-layer poisoning detection
  - LAYER 1: Velocity guard — 10 writes/60s default per agent. deque per agent, evicts entries older than window_seconds.
  - LAYER 2: Semantic contradiction via TF-IDF cosine similarity — pure Python (no sklearn/numpy). Per-project _TfidfIndex with add_document() and find_similar(). Threshold 0.4 default, negation boost 0.15. _negation_signals set (not, no, never, incorrect, wrong, false, instead, contradict, deny, reject, dispute, actually, retract, undo, revoke, overwrite) + 8 regex patterns (is not, isn't, was not, does not, should not, replace X with, change X to, correction).
  - LAYER 3: Pattern anomaly — if agent's last 50 writes have >60% identical content, block.
- VALIDATE_WRITE LOGIC:
  - Short bare negation from low-trust agent (<0.5 trust, <20 chars, has negation): direct block
  - Lowered threshold if has negation: search_threshold = 0.4 - 0.15 = 0.25
  - If sim > 0.7 and doc_agent != agent_id and len_ratio extreme (<0.3 or >3.0): block if agent_trust < 0.7
- COMPLIANCE RULE OWASP-ASI-02: "Memory writes must pass poisoning detection (MINJA v2)" — check_poisoning_defense() returns violation if `poison_check_passed` is False. But this context field is NEVER set by any caller — defaults to False — so EVERY write would trigger the violation IF compliance were enforced. Since compliance isn't wired in, this is moot.
- WIRING STATUS: validate_write() is NEVER called from any dashboard route. BridgeServer._exec_vault_write returns fake record_id without calling MinjaDetector. /api/vault POST action=verify_chain doesn't run poisoning checks. /api/swarm update_trust doesn't validate. Python VaultManager.store_track() doesn't call validate_write().
- IN-MEMORY INDEX: _project_indexes Dict — TF-IDF indexes are per-project, in-memory only. Process restart LOSES the entire poisoning detection baseline. Agent could write 9 entries, restart, write 9 more — never trip the 10/60s velocity because the deque is empty.

THE DECAY WORKER:
- vault/decay_worker.py — DOES NOT EXIST in extracted source. STATUS_REPORT section 2.3 lists it. Likely planned but never implemented (or implemented in canonical branch not in this snapshot).
- Without decay worker: vault entries persist forever. No automatic TTL. No archival of old EVENT entries. No trust score decay (TrustEngineV2.adaptive_decay runs only on update_trust() call — which nothing triggers).
- IMPACT: vault will grow unbounded. TokenUsageLog already has no indexes (per DATA-1) — full-table scans on /api/rate-limit/status. RateLimitLog same. As the vault grows, /api/vault GET (latest 100) stays fast but verify_chain (full table scan) will degrade.

G. RELIABILITY GAPS FOR THE NEW OPS BOARD
===========================================

DOES WELL (PRESERVE):
1. **TrustEngine v2.2 design** — logistic scaling + adaptive temporal decay + non-compensatory CRITICAL + 6-stage CDR + asymptotic plateau is mathematically defensible and grounded in real research (arXiv:2603.15973, arXiv:2603.13325, CSA 2025). The non-compensatory CRITICAL hard-block is the right primitive.
2. **CDR state machine** — 6 stages with explicit escalation triggers (score thresholds + regression counts) and explicit recovery criteria (score>50 + 0 regressions + 5+ convergence turns) is a thoughtful reliability progression. Forcing CRITICAL danger to ≥CASCADE stage is correct.
3. **AdaptiveCircuitBreaker design** — 3-state machine with exponential backoff (max 1 hour) is textbook circuit breaker pattern. HALF_OPEN probe is the right primitive.
4. **Compliance framework coverage** — 12 rules across 5 frameworks (OWASP ASI 2026, CSA Agentic Trust, IMDA Singapore, IETF VAP, KAIJU) is comprehensive. The remediation strings are actionable.
5. **MinjaDetector v2** — pure-Python TF-IDF + velocity + pattern anomaly is a clever no-dependency poisoning detector. 3-layer defense in depth.
6. **Foreman heartbeat design** — 15min heartbeat, monitor_loop checks 4x per interval, marks unhealthy after 2 missed (30min), removes dead after 4 missed (60min) — conservative and correct.
7. **TokenGuard atomic check_and_reserve** — atomic check + reserve with reservation_id hash is the right primitive for budget enforcement.
8. **DatabaseManager v3 hard-fail encryption** — refuses to fall back to plaintext unless allow_unencrypted=True is explicit. Production-stance security.
9. **BridgeServer error envelope** — JSON-RPC 2.0 with explicit HeldError (HTTP 202 + hold_ticket) for HOLD decisions is a clean way to surface "needs human review" without failing the request.
10. **DAG-based cycle detection** in EngineRouter — DFS-based _would_create_cycle before adding dependencies. Self-loop detection. Correct.
11. **Worker file-driven task processing** — .task.md files in pending/done/failed dirs is a clean audit trail (per ARCH-1 SOUL.md mandate of Git-as-bus).
12. **Zero-context-loss handoff** in GMR — ContextPacket.to_prompt_prefix() preserves task_id, intent, budget, decisions_made, pending_actions, tool_state, trace_id across model switches.
13. **TraceContext thread-local** — clean trace_id propagation primitive (even if under-used).
14. **AgentCycleRunner canary** — Canary health check pattern is correct (even if canary_enabled defaults to False and points to wrong port).
15. **VAP audit signature** — SHA-256(actor:action:input:output:time) is the right shape for audit entries (though 16-char truncation is weak — should be full hash).

DOES POORLY (FIX):
1. **NO REAL ALERTING** — Python logger.warning() goes to stdout. Dashboard notification-center is 100% fabricated. No webhook, no email, no Slack, no PagerDuty. A CRITICAL compliance violation or CDR COLLAPSE is invisible to the operator unless they're watching the Python process stdout in a terminal.
2. **NO PAGING** — no on-call rotation, no escalation policy, no severity-based notification routing.
3. **NO RUNBOOKS** — zero documented procedures for any incident type. HEARTBEAT.md is a 30-min cloud-orchestrator strategy, not operator-facing runbooks.
4. **FAKE SYSTEM LOGS** — system-logs.tsx generates entries from 20 hardcoded templates every 1.5-3.5s. Operator investigating an incident sees synthetic noise, not real logs.
5. **FAKE WEBSOCKET EVENTS** — mini-services/swarm-ws/index.ts generates 5 channels of fake events every 3-8s using pick() random selection. Swarm-tab "LIVE" indicator is misleading.
6. **NO ERROR BUDGET** — no SLO definition, no error budget policy, no burn-rate tracking, no "stop deploying when budget exhausted" rule.
7. **NO SLO TRACKING** — no ServiceLevelObjective model, no latency p50/p95/p99, no availability target, no error rate target.
8. **THREE PARALLEL TRUST SYSTEMS** — Python trust_engine_v2 (logistic + decay + CDR), Python trust_scoring (Beta-Binomial + lane params), TypeScript /api/trust-engine (heuristic lane modifiers). Dashboard displays the third; Python canonical is unwired. (Per DATA-1.)
9. **THREE PARALLEL CIRCUIT BREAKERS** — AdaptiveCircuitBreaker (3-state, dead code), inline CircuitBreaker (2-state, also dead code in rotator), client CircuitBreaker (3-state, in sdk.py). None share state. None wired to /api/models.
10. **TWO PARALLEL VAULT DESIGNS** — Python UPSERT vs Prisma APPEND. Neither implements hash chain. /api/vault verify_chain is structural-only. UI chain hashes are fake. (Per DATA-1.)
11. **TOKEN BUDGET UNDERCOUNTS** — /api/stresslab writes TokenUsageLog but skips SessionBudget update. /api/ai-bridge and /api/chat consume tokens SILENTLY (no logging at all). /api/proxy logs to RateLimitLog but not SessionBudget. TokenGuard Python is unwired. (Per DATA-1.)
12. **NO AUTOMATED REMEDIATION** — Worker.stop() doesn't trigger restart. Foreman marks unhealthy but doesn't auto-spawn replacement. Circuit breaker OPEN doesn't switch models. CDR COLLAPSE doesn't pull agent from rotation. Compliance BLOCKED doesn't quarantine agent.
13. **NO POSTMORTEM TEMPLATE** — no Postmortem model, no incident timeline, no RCA field, no action-items tracking.
14. **NO INCIDENT DECLARATION** — no "declare incident" button, no severity assignment, no war-room coordination.
15. **NO STATUS PAGE** — no external-facing status.nexus.os page for stakeholders.
16. **NO METRIC TIME-SERIES** — overview-tab 24h timeline is seededRandom. /api/rate-limit/status does live aggregation (N+1). No pre-aggregated snapshots.
17. **NO CHAT MESSAGE PERSISTENCE** — chatMessages in Zustand only (no DB). Conversation context lost on page refresh. (Per DATA-1 GAP 6.)
18. **NO CONSTITUTION AUDIT TRAIL** — /api/settings PUT mutates SystemConfig (including OPENROUTER_API_KEY, governor_thresholds) with no audit row. (Per DATA-1 GAP 7.)
19. **7 OF 12 KEYBOARD SHORTCUTS DON'T WORK** — ⌘B, ⌘D, ⌘N, R, S, /, P declared in help but not wired. (Per UX-1.)
20. **NO DATA SOURCE BADGES IN UI** — operator can't tell real from mock. Overview tab presents identically to real tabs. (Per UX-1.)
21. **CIRCUIT BREAKER NOT THREAD-SAFE** — AdaptiveCircuitBreaker has no Lock. Concurrent record_failure() could double-trip.
22. **MINJA DETECTOR UNWIRED** — 285 lines of sophisticated poisoning detection, never called from any write path. OWASP-ASI-02 compliance rule references it but context.poison_check_passed is never set.
23. **AGENTCYCLERUNNER CANARY POINTS TO WRONG PORT** — run_canary() hits localhost:8000/health but 01_PROJECT_STATE.md says governance API is on 7352. Canary will always fail.
24. **BRIDGE SERVER DEV MODE SKIPS AUTHZ** — `governor=None` default → _authorize() returns without checking. Production deployment must explicitly pass a governor.
25. **CVAVerifier IS A STUB** — verify_alignment() returns (True, "OK") for all actions. Comment says "Production: query agent_registry.traits" — never implemented.
26. **AGENT CARD HARDCODED** — BridgeServer.get_agent_card() returns hardcoded capabilities ["code_generation", "governance_audit", "swarm_orchestration"] instead of querying Vault/Governor. Defined TWICE (lines 282 + 293) — dead code. (Per ARCH-1.)
27. **TRACE_ID NOT PROPAGATED** — TraceContext exists but no /api/* route generates or propagates trace_id. No parent/child span tracking. No distributed tracing.
28. **NO LOG AGGREGATION** — Python stdout, Next.js stdout, mini-services stdout — all separate. No shared log surface. No ELK, no Loki, no Datadog.
29. **NO METRICS ENDPOINT** — no /metrics (Prometheus exposition), no /statsd, no OpenTelemetry metrics exporter.
30. **NO SYNTHETIC MONITORING** — no external probe hitting the dashboard from outside. No "canary user" running scripted journeys.
31. **NO HEALTH PROBE FOR PYTHON BACKEND** — Diagnostics panel checks 4 TS endpoints but NOT bridge:7352/health, NOT swarm-ws:3003, NOT Ollama:11434, NOT TWAVE:7353.
32. **NO GRACEFUL SHUTDOWN** — Worker.stop() sets _running=False and sends final heartbeat. Foreman.stop_monitoring() joins thread with 5s timeout. But BridgeServer has no shutdown handler. DatabaseManager connections are per-thread (threading.local) — no explicit close on shutdown.
33. **NO BACKUP/RESTORE** — agent_cycle.py git_backup() does `git add -A` + `git commit --allow-empty` — but no DB backup, no vault export, no config export. Recovery from data loss is "restore from git" which doesn't include SQLite file (it's gitignored).
34. **NO LOAD TESTING** — no locust, no k6, no artillery script. StressLab tests ZAI SDK responses, not system throughput.
35. **NO CHAOS ENGINEERING** — no chaos monkey, no failure injection, no game-day procedure.

H. RECOMMENDED RELIABILITY IMPROVEMENTS
=========================================

PRIORITIZED (P0 = blocks production, P1 = major risk, P2 = improvement):

**P0-1: Real Alerting Pipeline**
- Add an `alerts` table (id, severity, source, message, payload JSON, status [active/acknowledged/resolved], trace_id, created_at, acknowledged_at, acknowledged_by, resolved_at).
- Emit alerts from: governor.check_access() DENY, compliance.evaluate() BLOCKED, trust_engine_v2 CDR escalation to CASCADE/COLLAPSE, TokenGuard hard-stop (95%+), AdaptiveCircuitBreaker state transitions, Foreman worker unhealthy.
- New /api/alerts GET (with filter by status/severity/source) + POST (acknowledge/resolve).
- Replace notification-center.tsx hardcoded simulatedNotifications with /api/alerts polling.
- Add Slack webhook + email notification channels (configurable in SystemConfig).

**P0-2: Real System Logs**
- Replace system-logs.tsx 20 hardcoded templates with a real /api/logs endpoint.
- Backend: add a LogShipper that captures Python logging output (via custom logging.Handler) + Next.js console output + mini-services stdout, writes to a `system_logs` table (id, timestamp, level, source, message, trace_id, payload JSON).
- /api/logs GET with filter by level/source/since/until, pagination, full-text search.
- System-logs.tsx polls /api/logs every 2s for new entries (since last timestamp).
- Add log retention policy (default 30 days, configurable).

**P0-3: Wire Python Backend Health into Diagnostics**
- Diagnostics panel should check 7 endpoints, not 4: add bridge:7352/health, swarm-ws:3003 socket.io handshake, Ollama:11434/api/tags, TWAVE:7353/health.
- Add Python backend process check (is uvicorn running on 7352?).
- Add SQLite file size + WAL checkpoint status.
- Add Prisma migration version check.

**P0-4: Fix AgentCycleRunner Canary Port**
- run_canary() should hit localhost:7352/health (per 01_PROJECT_STATE.md), not localhost:8000/health.
- Set enable_canary=True default in production config.
- Wire AgentCycleRunner as a scheduled daemon (systemd timer or cron entry), not a CLI tool.

**P0-5: Real WebSocket Events (Not Fabricated)**
- mini-services/swarm-ws/index.ts should subscribe to real Python backend events via Redis pub/sub or direct HTTP polling of /api/swarm, not generate fake events.
- Add 5 new Python endpoints that emit real events: /api/events/workers, /api/events/tasks, /api/events/metrics, /api/events/activity, /api/events/alerts (all Server-Sent Events or WebSocket).
- mini-services/swarm-ws proxies these to dashboard clients.

**P1-1: SLO + Error Budget Framework**
- Add Prisma model ServiceLevelObjective (id, name, target_availability Decimal, target_latency_p95_ms Int, error_budget_30d Int, created_at, updated_at).
- Add ErrorBudgetSnapshot (id, slo_id FK, period_start, period_end, total_requests, error_requests, budget_remaining, burn_rate, recorded_at).
- New /api/slos GET returns SLOs + current error budget status.
- Add burn-rate alert: if burn_rate > 2x for 1h → page; if burn_rate > 1x for 24h → warn.
- UI: new "SLOs" sub-tab in tokens-tab or new dedicated tab showing SLO status, error budget burn-down chart, and "stop deploying" indicator.

**P1-2: Incident Response Workflow**
- Add Prisma model Incident (id, title, severity [SEV1/SEV2/SEV3/SEV4], status [detected/investigating/mitigating/resolved/postmortem], detected_at, resolved_at, lead_operator, summary, root_cause, timeline JSON, action_items JSON).
- New /api/incidents GET/POST/PUT.
- Add "Declare Incident" button in header (next to notifications) — opens dialog with severity selector + title + initial summary.
- Add incident timeline auto-population: when an incident is active, every alert + every governor DENY + every compliance BLOCKED gets appended to the incident timeline.
- Add postmortem template: when incident moves to "postmortem" status, generate a markdown template with sections (Summary, Timeline, Root Cause, Contributing Factors, Action Items, Lessons Learned).
- Add /api/incidents/:id/postmortem GET/PUT for editing postmortem.

**P1-3: Runbook Library**
- Add /docs/runbooks/ directory with markdown files for top 10 incident types:
  1. runbook-worker-unresponsive.md (steps: check Foreman heartbeat, check .heartbeats/*.json, check worker process, restart worker, escalate)
  2. runbook-vault-chain-broken.md (steps: identify broken entry, quarantine agent, audit recent writes, restore from backup)
  3. runbook-trust-collapsed.md (steps: identify agent + lane, review CDR trajectory, reset_agent() via API, restrict to read-only, monitor recovery)
  4. runbook-token-budget-exhausted.md (steps: identify consumer, refill budget via /api/tokens reset, investigate burn rate, apply cost optimizer)
  5. runbook-rate-limit-429-storm.md (steps: identify provider, rotate API key via api-key-manager, switch model via GMR, throttle upstream)
  6. runbook-compliance-violation.md (steps: identify rule, identify agent, quarantine agent, audit recent actions, file postmortem)
  7. runbook-circuit-breaker-open.md (steps: identify model, check failover log, wait for HALF_OPEN, verify recovery, manual reset if needed)
  8. runbook-poisoning-detected.md (steps: identify agent + content, validate MinjaDetector finding, quarantine agent, audit contradictory writes, restore correct memory)
  9. runbook-bridge-unreachable.md (steps: check uvicorn process, check port 7352, check Caddy proxy, restart bridge, verify HMAC auth)
  10. runbook-cdr-cascade.md (steps: identify agent, pull from rotation, reset trust, investigate regression events, monitor convergence)
- Add /api/runbooks GET (list) + GET /api/runbooks/:slug (content).
- UI: new "Runbooks" tab or command-palette command "open runbook X" — opens runbook in a dialog with quick actions.

**P1-4: Automated Remediation Hooks**
- Foreman: when worker marked unhealthy, auto-spawn replacement (subject to max_workers limit) + write GovernorDecision action="auto_remediate" reason="worker unhealthy".
- GMR: when AdaptiveCircuitBreaker OPEN, auto-deactivate model in /api/models (ModelEntry.isActive=false) + write ActivityFeed entry.
- TrustEngineV2: when CDR COLLAPSE, auto-update Agent.trustScore to 0 + auto-restrict agent (add to "restricted" set in SystemConfig).
- Compliance: when BLOCKED, auto-quarantine agent (Agent.status="error") + write GovernorDecision action="auto_quarantine".
- TokenGuard: when 95% hard-stop, auto-trigger fallback model via trigger_fallback() + write ActivityFeed entry.
- All automated remediations should be CONFIGURABLE (SystemConfig "auto_remediation_enabled": true/false per category) and REVERSIBLE (operator can undo via /api/swarm update_trust or /api/models toggle).

**P1-5: Postmortem Template + Incident Review Process**
- Add Postmortem Prisma model (id, incident_id FK, summary, timeline_markdown, root_cause, contributing_factors JSON, action_items JSON [each: description, owner, due_date, status], lessons_learned, created_at, completed_at).
- /api/incidents/:id/postmortem GET/PUT.
- UI: postmortem editor with markdown preview, action-items checklist (assignee + due date + status), timeline editor.
- Add 30-day postmortem review reminder (cron checks for postmortems with action_items due soon).

**P1-6: Metric Time-Series + /metrics Endpoint**
- Add Prisma model MetricSnapshot (id, metric_name, labels JSON, value Float, recorded_at). Index on (metric_name, recorded_at).
- Pre-aggregate key metrics every 1min via cron: request_count, error_count, p50_latency, p95_latency, p99_latency, active_workers, budget_remaining, trust_avg, cdr_collapsed_count, circuit_open_count, compliance_blocked_count.
- Add /metrics endpoint in Prometheus exposition format (text/plain) for external scraping.
- Add /api/metrics/:name GET for time-series queries (returns array of {timestamp, value} for charting).
- UI: replace overview-tab seededRandom timeline with real /api/metrics/system_health calls.

**P2-1: Consolidate Circuit Breakers**
- Delete inline CircuitBreaker in gmr/rotator.py.
- Wire AdaptiveCircuitBreaker (with thread-safe Lock added) into rotator.execute_with_fallback().
- Add ModelProfile.record_failure() and reset_failure_count() methods (currently __getattr__ returns None — silent no-op).
- Add circuit_breaker_state field to ModelEntry Prisma model.
- Expose in /api/models GET response.
- GMR-tab: add "Circuit Breaker Status" panel showing per-model state.

**P2-2: Wire MinjaDetector into Write Paths**
- Call validate_write() in: /api/vault POST (any write action), /api/swarm update_trust (writing trust entry to vault), BridgeServer._exec_vault_write (when implemented).
- Persist MinjaDetector _project_indexes to disk (or to a prisma table) so they survive process restart.
- Add /api/vault/poisoning-check POST endpoint for on-demand validation.
- Vault-tab: add "Poisoning Detection" panel showing recent validates + blocks.

**P2-3: Real Trace ID Propagation**
- /api/* routes should generate trace_id via trace_context.generate_trace_id() (or accept X-Nexus-Trace-ID header) at request entry.
- Propagate trace_id to all DB writes (add trace_id column to GovernorDecision, VaultEntry, TokenUsageLog, TestRun, RateLimitLog, AgentCycleResult).
- System-logs panel should display trace_id column.
- Add /api/traces/:trace_id GET endpoint that returns all events with that trace_id (cross-table query).
- UI: click any log entry / decision / vault entry to see its full trace timeline.

**P2-4: Status Page**
- Add /status public route (no auth) showing: overall system status (operational/degraded/maintenance), 8 pillar health badges, recent incidents (last 30d), upcoming maintenance windows.
- Add MaintenanceWindow Prisma model (id, title, scheduled_start, scheduled_end, impact, status).
- /api/status public GET.

**P2-5: Synthetic Monitoring**
- Add a /api/canary/run POST endpoint that runs a scripted journey: spawn test worker → submit test task → verify vault write → terminate worker → return pass/fail + latency.
- Schedule via cron every 5min.
- Alert on canary failure.

**P2-6: Backup + Restore**
- Add /api/backup POST endpoint that exports: SQLite DB file (gzipped), vault JSON, SystemConfig JSON, all GovernorDecisions CSV. Returns download URL.
- Add /api/restore POST endpoint that accepts backup file + restores (with confirmation dialog).
- Schedule automatic daily backup via cron.
- Store backups in a versioned directory (backup/YYYY-MM-DD/).

**P2-7: Chat Message Persistence**
- Add ChatMessage Prisma model (per DATA-1 GAP 6).
- /api/chat POST writes user message + assistant response to ChatMessage.
- /api/chat/sessions GET + /api/chat/sessions/:id GET.
- AI assistant loads prior conversation on page refresh.

**P2-8: Constitution Audit Trail**
- Add ConstitutionAudit Prisma model (per DATA-1 GAP 7).
- /api/settings PUT writes ConstitutionAudit row alongside SystemConfig upsert.
- /api/settings/audit GET returns audit history.
- Settings page shows audit trail per key.

**P2-9: Consolidate Trust Systems**
- Pick TrustEngineV2 (logistic + decay + CDR) as canonical.
- /api/trust-engine should call Python trust_engine_v2 via bridge (when bridge is wired).
- Deprecate the local heuristic in route.ts.
- Deprecate trust_scoring.py (or document it as the hot-path in-process variant).

**P2-10: Load Testing + Chaos Engineering**
- Add scripts/loadtest.ts (k6 script) that simulates 100 concurrent operators hitting /api/system, /api/governor, /api/vault for 10min.
- Add scripts/chaos.ts that randomly: kills a worker process, fills token budget to 95%, opens a circuit breaker, triggers a CDR escalation — to test automated remediation.
- Schedule weekly chaos exercise (game day).

Stage Summary:
- Monitoring architecture is BIFURCATED: Python canonical subsystems (TokenGuard, TrustEngineV2, Foreman, AdaptiveCircuitBreaker, MinjaDetector) are well-designed but UNWIRED to dashboard. Dashboard has its own (simpler, often fake) implementations. 35 specific reliability gaps identified.
- Observability stack is FRAGMENTED: TraceContext exists but unused, Python logging is extensive but invisible to dashboard, system-logs panel is 100% fabricated, no metrics endpoint, no log aggregation, no SLO tracking. Squeez log compression system is referenced but MISSING from extracted source.
- Incident response workflow is EFFECTIVELY ABSENT: no alerting pipeline, no paging, no runbooks, no postmortem template, no incident declaration. Operator must visually scan 9 tabs (3 of which are 100% fake) to detect incidents. Zero automated remediation.
- Governor + compliance enforcement is CANONICAL-BUT-UNWIRED: NexusGovernor.check_access() implements the right pipeline (budget → KAIJU → CVA → compliance) but kaiju_auth.py and proof_chain.py are MISSING from extracted source — would ImportError on instantiation. Dashboard doesn't call governor at all. Thresholds stored but never enforced. HARDWALL mechanism exists in trust_engine_v2 but update_trust() is never called by any dashboard flow.
- Circuit breaker design is DUPLICATED AND DEAD: AdaptiveCircuitBreaker (3-state, exp backoff) is the best design but is dead code. Inline CircuitBreaker in rotator.py is also dead (record_failure never called). Client CircuitBreaker in sdk.py is the only one actually used. None wired to /api/models.
- Vault integrity + poisoning detection: 5-track schema exists in Python (UPSERT semantics) and Prisma (APPEND semantics) — different data models. Neither implements hash chain. /api/vault verify_chain is structural-only. UI chain hashes are fake. MinjaDetector v2 (285 lines, sophisticated) is unwired. Decay worker is MISSING.
- 15 strengths to preserve (TrustEngine design, CDR state machine, AdaptiveCircuitBreaker design, compliance framework coverage, MinjaDetector, Foreman heartbeat, TokenGuard atomic reserve, hard-fail encryption, JSON-RPC error envelope, DAG cycle detection, file-driven tasks, zero-context-loss handoff, TraceContext, AgentCycleRunner canary, VAP audit signature).
- 35 weaknesses to fix — top 5 P0: real alerting, real system logs, Python backend health in diagnostics, fix canary port, real WebSocket events.
- 25 prioritized recommendations (5 P0, 6 P1, 10 P2) covering alerting pipeline, SLO/error budget, incident response workflow, runbook library, automated remediation, postmortem template, metric time-series, circuit breaker consolidation, MinjaDetector wiring, trace ID propagation, status page, synthetic monitoring, backup/restore, chat persistence, constitution audit, trust consolidation, load testing, chaos engineering.

RECOMMENDED NEXT ACTIONS (priority order):
1. P0-1: Add alerts table + /api/alerts + replace notification-center simulatedNotifications with real polling. Wire Python logger warnings to /api/alerts via custom logging.Handler.
2. P0-2: Add system_logs table + /api/logs + replace system-logs.tsx hardcoded templates with real log ingestion (LogShipper captures Python + TS + mini-services stdout).
3. P0-3: Expand diagnostics-panel from 4 to 7 endpoint checks (add bridge:7352/health, swarm-ws:3003, Ollama:11434/api/tags, TWAVE:7353/health).
4. P0-4: Fix agent_cycle.py run_canary() port from 8000 to 7352; set enable_canary=True default in production.
5. P0-5: Replace mini-services/swarm-ws/index.ts fabricated events with real Python backend event subscription (Redis pub/sub or HTTP polling).
6. P1-1: Add ServiceLevelObjective + ErrorBudgetSnapshot Prisma models; add /api/slos + /metrics (Prometheus) endpoints; add SLO status UI.
7. P1-2: Add Incident + Postmortem Prisma models; add /api/incidents + /api/incidents/:id/postmortem; add "Declare Incident" button + postmortem editor UI.
8. P1-3: Create /docs/runbooks/ with 10 markdown runbooks; add /api/runbooks + command-palette integration.
9. P1-4: Wire automated remediation hooks (Foreman auto-spawn, GMR auto-deactivate, TrustEngine auto-quarantine, Compliance auto-quarantine, TokenGuard auto-fallback) — all configurable + reversible.
10. P1-5: Add postmortem template + 30-day action-items review cron.
11. P1-6: Add MetricSnapshot Prisma model + 1min pre-aggregation cron + /api/metrics/:name time-series endpoint + Prometheus /metrics exposition; replace overview-tab seededRandom timeline with real data.
12. P2-1: Delete inline CircuitBreaker in rotator.py; wire AdaptiveCircuitBreaker (with thread-safe Lock) into execute_with_fallback(); add circuit_breaker_state field to ModelEntry.
13. P2-2: Wire MinjaDetector.validate_write() into /api/vault POST, /api/swarm update_trust, BridgeServer._exec_vault_write; persist TF-IDF indexes; add /api/vault/poisoning-check endpoint.
14. P2-3: Generate/propagate trace_id in all /api/* routes; add trace_id column to GovernorDecision/VaultEntry/TokenUsageLog/TestRun/RateLimitLog; add /api/traces/:trace_id endpoint.
15. P2-4: Add public /status page + MaintenanceWindow model.
16. P2-5: Add /api/canary/run synthetic monitoring endpoint; schedule every 5min via cron; alert on failure.
17. P2-6: Add /api/backup + /api/restore endpoints; schedule daily backup via cron.
18. P2-7: Add ChatMessage persistence (closes DATA-1 GAP 6).
19. P2-8: Add ConstitutionAudit (closes DATA-1 GAP 7).
20. P2-9: Consolidate 3 trust systems to TrustEngineV2 as canonical; wire /api/trust-engine to call Python via bridge.
21. P2-10: Add k6 load test + chaos engineering script; schedule weekly game day.
