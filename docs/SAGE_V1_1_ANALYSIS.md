# NEXUS SAGE v1.1 — Hardening Pack Analysis

> Analysis of the new SAGE v1.1 files retrieved from Google Drive on 2026-07-12.
> Source files in `sage/reference/v1_1/`. This is a **delta analysis** against the
> v1 work already in `sage/reference/` + the gateway I built in
> `mini-services/sage-gateway/`.

## What's new (12 files, retrieved 2026-07-12)

| File | Lines | Role |
|------|-------|------|
| `nexus_sage_v1_1_openapi.yaml` | 557 | **v1.1 hardened OpenAPI 3.1 spec** — contracted surface |
| `NEXUS_SAGE_LOCAL_DEV_AUDIT_2026-07-12.md` | 909 | **The audit** — 5 P0 findings driving v1.1 |
| `sage_gateway_security.py` | 114 | Reference security middleware (ASGI, Python) |
| `sage_idempotency.py` | 230 | Reference 3-state idempotency store (SQLite) |
| `test_sage_gateway_contract.py` | 124 | Contract tests — idempotency + jobs + schema |
| `redact_nexus_sage_logs.py` | 73 | Log redaction tool (for the credential exposure P0) |
| `REST_Facade_Walkthrough.md` | 76 | v1 walkthrough |
| `REST_Facade_Walkthrough_v2_ULTRA.md` | 76 | v2 ULTRA walkthrough |
| `NEXUS_SAGEv2.txt` | 5555 | v2 GPT-builder transcript (expanded surface) |
| `SOL_Ultimate_Master_Integration_Plan_v1.md` | 208 | Master integration plan v1 |
| `SOL_Ultimate_Master_Integration_Plan_v2.md` | 235 | Master integration plan v2 |
| `SOL_Advisory_Execution_Task_Tracker.md` | 37 | Execution task tracker |

## The 5 P0 findings (from the audit)

The audit (`NEXUS_SAGE_LOCAL_DEV_AUDIT_2026-07-12.md`) reviewed 12,664 lines of
logs and found:

1. **Credential exposure** — the SAGE Bearer token appears in plaintext in logs
   + is written to a plaintext file. **Must rotate before re-exposing the tunnel.**
   The included `rotate_nexus_sage_secret.ps1` generates a 32-byte token.
2. **HTTP 421 on the bridge** — `https://sharply-unethical-various.ngrok-free.dev/sse`
   returns 421. This is **deployment step 1** in your deployment order. Historical
   smoke-test success does not establish current availability. Free ngrok hostnames
   are unsuitable as production identity.
3. **Cached duplicates invalidated the strongest tests** — the "14/14" v2 test
   result counted `duplicate` idempotency receipts as successes for swarm dispatch
   + program execution. Does not prove the code path executes. The contract test
   pack enforces: fresh → `reserved`, replay → `duplicate`, changed payload → `409`.
4. **`/v1/program` is unsafe** — arbitrary server-side Python execution. Must be
   removed from production. Replaced in v1.1 by the durable `/v1/jobs` workflow API.
5. **v2 endpoints overstate their implementation** — swarm dispatch is a generic
   queue task, provider status reports no real quotas, trust returns a scalar,
   grounding is truncated/hard-coded, memory + model-health routes 500.

## v1.1 vs v1 — what changed in the spec

The v1.1 spec is a **hardened contraction** of v1. My gateway
(`mini-services/sage-gateway/index.ts`) implements the v1 surface; v1.1
restructures it.

### Removed from v1.1 (my v1 gateway has these — they must go)

| v1 route | Why removed |
|----------|-------------|
| `/v1/echo` | Connectivity toy; not in v1.1 |
| `/v1/http-diagnostic` | Raw diagnostics excluded from production surface |
| `/v1/query-log` | Excluded |
| `/v1/probes/simulate` | Simulations excluded (P0 #4 rationale) |
| `/v1/program` | **Arbitrary code execution — P0 #4, hard removal** |

### Added in v1.1 (my v1 gateway lacks these)

| v1.1 route | Purpose |
|------------|---------|
| `/v1/capabilities` | Read enabled/disabled capability flags |
| `/v1/grounding/manifest` | List canonical grounding files |
| `/v1/grounding/files/{name}` | Read a specific grounding file |
| `/v1/jobs` (POST) | Submit a durable allowlisted workflow job |
| `/v1/jobs/{job_id}` (GET) | Poll job status |
| `/v1/jobs/{job_id}/cancel` (POST) | Cancel a job |

### Renamed operationIds (v1 → v1.1)

v1: `ping, echo, registry_debug, coordination_status, task_list, task_add, ...`
v1.1: `nexusHealth, nexusCapabilities, nexusRegistry, nexusCoordinationStatus,
nexusListTasks, nexusProposeTask, ...` — all prefixed `nexus*`, no `echo`.

## What this means for my gateway (`mini-services/sage-gateway/`)

My v1 gateway is **not v1.1-compliant**. Honest gap list:

| v1.1 requirement | My v1 gateway | Action needed |
|------------------|---------------|----------------|
| 3-state idempotency (`reserved`→`in_progress`→`duplicate`) + 409 on changed payload | 2-state cache (returns same receipt on replay, no payload check, no 409) | **Rewrite** — port `sage_idempotency.py` logic |
| `secrets.compare_digest` for token check | `===` string compare | **Fix** — use `crypto.timingSafeEqual` |
| Fail-closed if `NEXUS_API_KEY` absent | Open if unset (dev mode) | **Fix** — fail closed in prod |
| Key fingerprint (sha256[:12]) in receipts | Not included | **Add** `key_id` field |
| `max_body_bytes` enforcement (90KB, counted not header-trusted) | 1MB hard limit via body read | **Tighten** to 90KB |
| No `/v1/program` | Not present (I never built it) | ✅ already compliant |
| No `/v1/probes/simulate`, `/v1/http-diagnostic`, `/v1/query-log`, `/v1/echo` | **Present** (I built them from v1 spec) | **Remove** for v1.1 |
| `/v1/capabilities`, `/v1/grounding/*`, `/v1/jobs/*` | Not present | **Add** |
| 409 + 422 responses on mutating routes | Only 200/401/404/502 | **Add** 409/422 |
| `x-openai-isConsequential: true` on all POST (except heartbeat) | Not set | **Add** |
| Durable `JobStore` (SQLite, claim/lease/complete) | None | **Add** — port `sage_jobs` pattern |

## The reference Python implementations

The hardening pack includes Python reference code. These are **design references**,
not drop-in replacements for my Bun gateway — but they define the contract precisely:

- `sage_gateway_security.py` — `SecuritySettings.from_environment()` (fail-closed,
  32-byte min key), `extract_bearer_token`, `authenticate` (uses
  `secrets.compare_digest`), `BodySizeLimitMiddleware` (counts actual ASGI bytes).
- `sage_idempotency.py` — `IdempotencyStore` over SQLite; `reserve()` returns
  `reserved` / `in_progress` / `duplicate` / `conflict` states.
- `test_sage_gateway_contract.py` — the contract: fresh→reserved, replay→duplicate,
  changed-payload→conflict, jobs claim/lease/complete, `arbitrary_python` rejected,
  schema has no `/v1/program` or `/v1/probes/simulate`, mutating routes advertise
  409/422.
- `redact_nexus_sage_logs.py` — redacts the compromised token from log files.

## Deployment-order status (your 14-step checklist)

| # | Step | Status |
|---|------|--------|
| 1 | Restore MCP SSE endpoint (HTTP 421) | **BLOCKED** — Windows host :7354, my sandbox can't reach it. Audit confirms 421. |
| 2 | Add `/v1/...` REST facade | **v1 done** (my gateway); **v1.1 not done** — see gap list above |
| 3 | Bearer authentication | **v1 done** (basic); **v1.1 needs** `compare_digest` + fail-closed + key_id |
| 4 | Idempotency + receipts | **v1 done** (2-state); **v1.1 needs** 3-state + 409 + payload-aware |
| 5 | `/privacy` route | ✅ done |
| 6 | Test `/v1/health` outside ChatGPT | ✅ done (local curl passes) |
| 7–12 | GPT builder config (OpenAPI paste, API Key→Bearer, Instructions, Knowledge, capabilities, sharing) | **Operator side** — ChatGPT UI |
| 13 | 10 smoke tests | **v1.1 contract tests exist** (`test_sage_gateway_contract.py`); need to port + run against my gateway |
| 14 | Create SAGE v1 | **Operator side** — after gates pass |

## New GitHub repo: `specimba/NEXUS_SAGE`

Checked via API: exists, created 2026-07-12, **empty** (default `.gitignore`/
`LICENSE`/`README.md` only, size 0). It's a placeholder for a dedicated SAGE repo.
No code pushed yet. Decision pending: should the SAGE gateway + hardening pack
live there (separate from this Ops Board repo), or stay in `mini-services/sage-gateway/`
here? The audit's separation-of-planes guidance suggests **separate repo** is correct.

## Recommended next actions (calm, ordered)

1. **Rotate the compromised SAGE credential** (P0 #1) — your side, using the
   included `rotate_nexus_sage_secret.ps1`. Do not re-expose the tunnel until done.
2. **Fix the HTTP 421** (P0 #2, deployment step 1) — your side, Windows host.
3. **Upgrade my gateway to v1.1** — port the 3-state idempotency, remove the
   4 excluded routes, add `/v1/capabilities` + `/v1/grounding/*` + `/v1/jobs/*`,
   use `timingSafeEqual`, fail-closed auth, 90KB body limit, 409/422 responses.
   This is the real build work.
4. **Port the contract tests** to run against the Bun gateway.
5. **Decide on the `specimba/NEXUS_SAGE` repo** — should I push the v1.1 gateway
   + hardening pack there as the dedicated SAGE home?

I am **not** doing #3 until you confirm you want the upgrade in-place versus
waiting for the dedicated repo decision. No more building ahead of confirmation.
