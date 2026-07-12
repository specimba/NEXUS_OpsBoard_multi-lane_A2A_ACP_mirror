# NEXUS SAGE Local Development Cycle Audit
## End-to-end investigation and v1.1 remediation plan

**Date:** 2026-07-12  
**Scope:** Full review of `NEXUSdesktopCOMMANDERmcptoolsGLM52logs-02.txt` and `NEXUSantiGRAVnexlog-13(1).txt`, plus comparison against the NEXUS SAGE v1 artifacts and the currently reachable GPT-audit-tools bridge.

---

## Executive assessment

The NEXUS SAGE project has a sound architectural intent: SAGE is separated from HERMES lifecycle authority; the Custom GPT uses a bounded OpenAPI surface; read-only observation, coordination proposals, and evidence capture are separated into lanes; and the local bridge supplies live state rather than allowing the GPT to invent execution.

The implementation, however, is not ready to be treated as a verified production baseline.

The two reviewed logs contain **12,664 lines** in total. They show meaningful progress, but also reveal five high-severity issues:

1. **The Bearer credential is compromised.** A long-lived SAGE key appears repeatedly in both logs and is written to a plaintext local file. It must be rotated before the tunnel or REST façade is exposed again.
2. **The current bridge is unavailable.** A live probe on 2026-07-12 returns HTTP 421 from the ngrok SSE endpoint. Historical smoke-test success does not establish current availability.
3. **The advertised 14/14 v2 test result is not trustworthy.** The two highest-risk write tests—swarm dispatch and program execution—returned cached `duplicate` receipts rather than performing fresh work. A later independent run reported genuine failures in model health, memory access, and program execution.
4. **`/v1/program` is an unsafe and conceptually incorrect abstraction.** It exposes arbitrary server-side Python execution and should not be conflated with OpenAI Programmatic Tool Calling, which executes constrained JavaScript in an isolated hosted runtime and can call only explicitly allowed tools.
5. **Several v2 endpoints overstate what they implement.** Swarm dispatch creates a generic queue task rather than a confirmed Foreman/TeamCoordinator swarm; provider status does not report real provider quotas or health; trust returns a scalar rather than the proposed multidimensional trust model; grounding is truncated and hard-coded; memory and model-health routes fail.

The recommended direction is therefore:

- stabilize and harden a **v1.1 production surface**;
- remove arbitrary code execution and simulated probes from production;
- rotate and scope credentials;
- make idempotency atomic and payload-aware;
- introduce a durable HERMES-owned job state machine;
- convert v2 capabilities into capability-advertised adapters that remain disabled until their contracts pass fresh tests;
- separate Custom GPT Actions, NEXUS local orchestration, and OpenAI Responses API multi-agent/programmatic features into distinct execution planes.

---

# 1. Evidence and review method

## 1.1 Materials read

The review covered both supplied logs from beginning to end, not only their first or last sections:

- `NEXUSdesktopCOMMANDERmcptoolsGLM52logs-02.txt`
  - 8,044 lines
  - 353,377 bytes
- `NEXUSantiGRAVnexlog-13(1).txt`
  - 4,620 lines
  - 263,052 bytes

The analysis also compared their claims with the previously generated NEXUS SAGE v1 OpenAPI schema, instructions, lane contracts, builder configuration, deployment checklist, and current MCP reachability.

## 1.2 Truth labels used

- **VERIFIED:** directly supported by code, test output, runtime response, or an exact file.
- **PROVISIONAL:** plausible and partly implemented, but missing independent verification.
- **CONTRADICTED:** a later or stronger observation conflicts with the claim.
- **BLOCKED:** cannot currently proceed because a required dependency is unavailable.
- **NOT TESTED:** described or configured but not actually exercised.
- **INFERRED:** engineering conclusion derived from evidence, clearly distinguished from direct observation.

---

# 2. Current local development workflow

The logs reveal this effective workflow:

1. A model agent reads prior NEXUS SAGE plans and local records.
2. The agent edits the existing monolithic MCP server, primarily:
   - `tools/browser_ai_mcp/grok_mcp_server_v2.py`
3. The same process serves:
   - MCP SSE
   - the Custom GPT REST façade
   - queue and evidence helpers
   - SAGE authentication
   - idempotency
   - experimental v2 routes
4. A public ngrok tunnel exposes the local service.
5. OpenAPI schemas and Custom GPT Instructions are copied into the GPT Builder.
6. Smoke tests are run against local or tunneled endpoints.
7. Walkthrough documents then summarize completion.

This cycle is fast and productive, but it currently lacks strict boundaries between:

- design claims and implemented behavior;
- cached idempotent replay and fresh execution;
- development-only routes and production routes;
- Custom GPT Action behavior and OpenAI Responses API features;
- SAGE proposals and HERMES execution;
- local code edits and repository-grade commit/test evidence.

---

# 3. State of the existing NEXUS SAGE system

| Area | Current assessment | Evidence interpretation |
|---|---|---|
| SAGE role and authority split | **VERIFIED design** | SAGE is intentionally separated from HERMES claim/complete/fail authority. |
| v1 REST façade | **PROVISIONAL** | Logs show routes and historical smoke tests, but current live bridge is unavailable. |
| Bearer authentication | **COMPROMISED** | The active-form credential appears repeatedly in development logs and plaintext storage. |
| Idempotency | **PARTIAL / UNSAFE** | Replay exists, but it is key-only, not operation/principal/payload aware, and is not atomically reserved. |
| A2A/task/evidence routes | **PROVISIONAL** | Implemented historically; current tunnel is blocked. |
| v2 25-operation schema | **DRAFT** | Parses, but response contracts and implementations diverge. |
| Swarm dispatch | **MISLABELED** | Creates a queue task; no evidence of a live Foreman/team execution path. |
| Program execution | **UNSAFE / BLOCK** | Arbitrary Python endpoint, failed in an independent run, and conceptually conflated with OpenAI hosted programmatic calls. |
| Grounding endpoint | **PARTIAL** | Hard-coded files, silent truncation, in-process cache, no hashes or canonical metadata. |
| Memory endpoint | **FAILED** | Calls an unavailable `read_channel` method in the independent run. |
| Model health | **FAILED** | Uses undefined `OLLAMA_PORT` in the independent run. |
| Trust endpoint | **OVERCLAIMED** | Returns a scalar pool score, not the proposed 11-element trust breakdown. |
| Provider status | **OVERCLAIMED** | Returns coordination/registry summaries, not real provider quota and cooldown data. |
| Current MCP/tunnel | **BLOCKED** | Live MCP ping returns HTTP 421 from the ngrok SSE URL. |

---

# 4. Critical findings

## 4.1 P0 — Credential exposure

The logs contain repeated full values matching the SAGE token format, and the Antigravity cycle writes the key to a plaintext file. The server code also logs the newly generated secret.

This creates several problems:

- anyone with log access can authenticate;
- archived copies preserve the credential indefinitely;
- the GPT Builder may continue using the compromised value after local rotation;
- the ngrok endpoint makes exploitation remotely reachable while the tunnel is active;
- the credential has no visible scope, expiry, or per-client identity.

### Required action

1. Stop the public tunnel.
2. Rotate the key.
3. update the GPT Builder secret;
4. restart the gateway;
5. test that the old token returns `401`;
6. redact copies of logs before wider sharing;
7. preserve original logs only in a restricted forensic archive.

The included `rotate_nexus_sage_secret.ps1` generates a 32-byte random token, restricts its ACL, and avoids printing it unless an explicit clipboard option is used.

---

## 4.2 P0 — Historical success conflicts with current availability

The Antigravity walkthrough reports passing public health and privacy checks. The current MCP probe returns:

```text
HTTP 421
https://sharply-unethical-various.ngrok-free.dev/sse
```

Therefore:

- historical availability was real only for that test interval;
- the current public endpoint is **BLOCKED**;
- the Custom GPT Action must not be deployed against this unstable hostname until health is restored;
- a rotating free ngrok hostname is unsuitable as the long-lived production identity of NEXUS SAGE.

### Recommendation

Use a stable domain such as:

```text
https://actions.<your-controlled-domain>
```

Put a reverse proxy in front of the local service and expose only the REST paths needed by SAGE. Keep MCP SSE private or separately authenticated.

---

## 4.3 P0 — Cached duplicates invalidated the strongest tests

The final “14/14” result counted `duplicate` receipts for swarm dispatch and program execution as successful tests.

That only proves:

- the same idempotency key existed;
- a prior receipt could be replayed.

It does **not** prove:

- the current code path executes;
- the payload matches the earlier request;
- the sandbox works;
- the swarm has real workers;
- the route remains compatible with the current schema.

A later independent run then found:

- model-health 500;
- memory 500;
- program status `failed`;
- trust 404 for a dummy agent.

### Required test correction

Every mutating test must use:

- a fresh database or isolated namespace;
- a unique idempotency key;
- an assertion that the first request is not `duplicate`;
- a second identical request that must be `duplicate`;
- a third request with the same key but changed payload that must return `409 IDEMPOTENCY_CONFLICT`.

The provided test pack enforces this pattern.

---

## 4.4 P0 — Remove `/v1/program` from production

The implementation accepts arbitrary Python, writes it to a host temporary file, and asks a sandbox backend to run `python3 <host-temp-path>`.

Risks include:

- remote-code-execution exposure;
- accidental host execution if a userspace backend is selected;
- host/container path mismatch;
- temporary-file leakage on exceptions;
- blocking execution inside an async request;
- raw stderr disclosure;
- no signed allowlist of programs;
- no durable job or approval state;
- confusing `accepted` with completed execution.

More importantly, it is architecturally unrelated to OpenAI Programmatic Tool Calling. That feature uses constrained hosted JavaScript in an isolated runtime and calls only allowed tools. It is designed primarily for read-heavy composition and aggregation; approval-sensitive writes should remain direct tool calls.

### Replacement

Replace arbitrary code with an allowlisted durable workflow API:

```json
{
  "workflow_type": "grounding_audit",
  "parameters": {
    "files": ["01_PROJECT_STATE.md", "GROUNDING.md"]
  },
  "lane": "SAGE-C1",
  "idempotency_key": "..."
}
```

SAGE submits the job. HERMES claims it with a lease. A specific worker executes an allowlisted implementation. SAGE polls or reads the resulting receipt in a later interaction.

---

# 5. Security and correctness gaps

## 5.1 Authentication

### Existing weaknesses

- secret auto-generation is logged;
- plaintext key file;
- ordinary string comparison;
- one global bearer token;
- no rotation metadata;
- no scopes;
- no expiry;
- no key ID in receipts.

### v1.1 design

At minimum:

- load the key from an environment variable or restricted file;
- fail closed if absent;
- use `secrets.compare_digest`;
- calculate a non-secret key fingerprint for audit records;
- never log the token;
- use separate keys for development and production.

Later:

```json
{
  "sage-primary": {
    "hash": "<sha256>",
    "scopes": ["observe", "coordinate", "evidence"],
    "expires_at": "..."
  }
}
```

OAuth is not necessary while the GPT is private and has a single operator. It becomes appropriate when multiple human users need distinct identities.

---

## 5.2 Request-size enforcement

The current code checks only `Content-Length`.

This can be bypassed or mismeasured when:

- transfer encoding is chunked;
- the header is absent;
- a proxy changes transport behavior;
- declared and actual size differ.

Use an ASGI receive-wrapper that counts actual bytes and stops at a hard maximum. Apply a lower internal payload budget than the platform maximum to preserve response framing headroom.

---

## 5.3 Rate limiting

The current per-IP in-memory `defaultdict(list)` is acceptable only as a development convenience.

Problems:

- no synchronization;
- no multiprocess consistency;
- proxy/ngrok source attribution may be misleading;
- list cleanup is inefficient;
- key cardinality can grow;
- a restart resets all limits.

For a single local process, use a lock-protected token bucket keyed by authenticated key ID and operation. For multiple workers, move rate-limit state to Redis or SQLite.

---

## 5.4 Idempotency

The current table keys only on `idempotency_key`, and `INSERT OR REPLACE` can overwrite prior truth.

A correct idempotency identity is:

```text
principal + operation + idempotency_key
```

and it must store:

```text
request_hash
state: in_progress | completed | failed
response
HTTP status
created_at
expires_at
```

Required behavior:

| Situation | Result |
|---|---|
| unseen key | atomically reserve |
| same key and same payload, completed | replay as duplicate |
| same key and same payload, in progress | return 409/202 in-progress |
| same key and changed payload | return 409 conflict |
| expired key | allow new reservation according to policy |

The provided `sage_idempotency.py` implements this using `BEGIN IMMEDIATE`, WAL mode, a payload hash, and explicit state transitions.

---

## 5.5 Error contracts

The OpenAPI schemas describe only `200` responses. Production routes need common error envelopes for:

- `400` invalid request;
- `401` missing or invalid authentication;
- `403` scope denied;
- `404` unknown resource;
- `409` idempotency or state conflict;
- `413` payload too large;
- `422` schema validation;
- `429` rate limit;
- `500` internal failure;
- `503` dependency unavailable.

Never return raw exception strings. Give clients:

```json
{
  "ok": false,
  "request_id": "...",
  "error": {
    "code": "DEPENDENCY_UNAVAILABLE",
    "message": "The model-health adapter is unavailable.",
    "retryable": true
  }
}
```

Log the internal exception separately with redaction.

---

# 6. Architecture conflicts between the two agent cycles

## 6.1 “S2 complete” versus independent failures

The Antigravity cycle promotes v2 to completed after adjusting the test harness and counting expected 404s and cached duplicates as passes.

The GLM cycle later runs a more independent check and finds actual 500s and failed execution.

**Resolution:** the stronger status is:

```text
SAGE v2: PROVISIONAL and CONTRADICTED
```

Do not mark S2 closed until fresh, isolated, contract-level tests pass.

---

## 6.2 Custom GPT Actions versus OpenAI Responses API features

The logs blend three separate planes:

### Plane A — Custom GPT

- configured in GPT Builder;
- invokes OpenAPI Actions;
- request/response interaction;
- platform confirmation for consequential operations.

### Plane B — NEXUS local orchestration

- HERMES;
- queue;
- leases;
- Foreman/team coordination;
- local agents;
- evidence and trust.

### Plane C — OpenAI Responses API

- GPT-5.6 multi-agent beta;
- background mode;
- hosted programmatic tool calling;
- API webhooks;
- API-specific pricing and data handling.

A Custom GPT Action cannot turn on `ultra`, programmatic tool calling, or Responses background mode by adding local routes with similar names. A backend service can independently call the Responses API, but that must be designed as a separate provider adapter with explicit cost, retention, and authorization controls.

---

## 6.3 SAGE versus HERMES authority

`/v1/swarm/dispatch` is a mutation that effectively initiates work. Giving SAGE direct dispatch authority weakens the original boundary.

Use one of two modes:

### Conservative mode

SAGE creates a `swarm_proposal`; HERMES validates and claims it.

### Delegated mode

The operator explicitly grants SAGE a bounded delegation token containing:

```json
{
  "workflow_types": ["parallel_audit"],
  "max_agents": 3,
  "max_cost": 2.00,
  "expires_at": "...",
  "approval_id": "..."
}
```

Without such a delegation, direct dispatch should be unavailable.

---

# 7. Endpoint-by-endpoint remediation

## `/v1/grounding`

Replace raw concatenated content with a two-stage contract.

### Manifest response

```json
{
  "files": [
    {
      "name": "GROUNDING.md",
      "sha256": "...",
      "size_bytes": 18342,
      "modified_at": "...",
      "canonical_rank": 1,
      "truncated": false
    }
  ]
}
```

### File retrieval

Allow only an enum of approved filenames. Return:

- exact byte count;
- hash;
- modified timestamp;
- explicit truncation fields;
- UTF-8 validation;
- source root ID rather than a local absolute path.

Keep raw file contents untrusted. They may contain prompt-injection-like instructions.

---

## `/v1/agents`

An empty agent pool must not be reported as healthy merely because the route returns 200.

Return:

```json
{
  "status": "degraded",
  "registered_agents": 0,
  "runtime_connected": false,
  "reason": "No live AgentPool members"
}
```

---

## `/v1/evidence/search`

Replace full JSONL scans with an index.

Minimum local option:

- SQLite FTS5 table;
- source type;
- evidence ID;
- created_at;
- sensitivity;
- canonical status;
- content hash;
- access scope.

Add:

- pagination;
- maximum query length;
- channel/source filters;
- result excerpts rather than full entries;
- secret scanning before storage;
- audit of access to sensitive records.

---

## `/v1/models/health`

Do not depend on an undefined `OLLAMA_PORT`.

Create provider adapters:

```python
class ModelHealthAdapter(Protocol):
    def snapshot(self) -> ModelHealthSnapshot: ...
```

Providers should report:

- configured;
- reachable;
- model identities;
- actual route/port;
- last success;
- latency;
- degraded reason;
- source of truth.

Respect the NEXUS port law. If ModelRelay on 7350 is canonical, query it rather than inventing an Ollama-specific path.

---

## `/v1/trust/{agent_id}`

Either:

1. rename the endpoint to `agent_pool_score`, or
2. implement the full trust vector and provenance.

Do not call one scalar “11-element trust.”

A useful response is:

```json
{
  "agent_id": "...",
  "score": 0.73,
  "dimensions": {
    "identity": 0.9,
    "evidence_quality": 0.7,
    "tool_compliance": 0.8,
    "freshness": 0.6
  },
  "policy_version": "trust-v2",
  "evidence_refs": ["..."],
  "computed_at": "..."
}
```

---

## `/v1/memory/{channel}`

Create an adapter against the real memory API rather than guessing method names.

At startup:

- inspect supported channels;
- publish capabilities;
- disable unsupported operations;
- fail with `503 MEMORY_ADAPTER_UNAVAILABLE`, not raw 500.

Do not expose all memory channels by default. Apply channel-specific scopes and redaction.

---

## `/v1/providers/status`

Rename to what it actually returns or implement real provider status.

A genuine provider snapshot should include:

- provider ID;
- configured state;
- credential presence without revealing it;
- route/model;
- cooldown;
- quota snapshot where supported;
- last error class;
- last success;
- latency;
- source timestamp.

---

# 8. Workflow improvements

## 8.1 Introduce a release evidence gate

Every development cycle should produce:

```text
change request
→ implementation diff
→ schema diff
→ fresh isolated tests
→ security tests
→ live local test
→ public tunnel test
→ rollback test
→ evidence bundle
→ closure decision
```

A walkthrough is not a closure artifact unless it links to:

- commit;
- diff;
- exact test command;
- fresh test output;
- environment fingerprint;
- schema hash;
- secret-rotation state;
- active endpoint identity.

---

## 8.2 Separate production and development schemas

### Production

- no `simulate_probe`;
- no `echo`;
- no raw query logging;
- no arbitrary program execution;
- no HERMES lifecycle operations;
- only capabilities that pass contract tests.

### Development

- diagnostics;
- simulation;
- test fixtures;
- controlled fault injection;
- never connected to the production Custom GPT.

---

## 8.3 Add a capability endpoint

Instead of exposing broken routes and letting them fail:

```json
{
  "capabilities": {
    "memory_read": {
      "enabled": false,
      "reason": "Adapter contract mismatch"
    },
    "model_health": {
      "enabled": false,
      "reason": "ModelRelay adapter not configured"
    },
    "parallel_audit": {
      "enabled": true,
      "mode": "proposal_only"
    }
  }
}
```

The OpenAPI schema should include only stable operations. Experimental abilities can stay behind a separate developer schema or capability flag.

---

## 8.4 Durable HERMES jobs

Long work should not run inside the HTTP request.

Use:

```text
SAGE proposal
→ durable job row
→ HERMES claim with lease
→ executor heartbeat
→ result/evidence
→ HERMES closure
```

The included `sage_jobs.py` implements:

- allowlisted workflow types;
- queued/running/succeeded/failed/cancelled states;
- atomic claim;
- lease expiry;
- attempts;
- cancellation;
- result recording.

It intentionally contains no arbitrary-code workflow.

---

## 8.5 Tests must distinguish semantic outcomes

Do not treat “HTTP 200” as success.

Examples:

- agent list with zero agents = degraded;
- expected missing agent = correct 404 contract;
- program route returning `status=failed` = failed test;
- duplicate receipt on first request = test contamination;
- swarm task accepted = proposal accepted, not swarm completed;
- current tunnel health = separate from historical local health.

---

# 9. Recommended implementation sequence

## P0 — immediately

1. Stop ngrok/public exposure.
2. Rotate the leaked SAGE key.
3. update GPT Builder authentication.
4. remove secret logging.
5. invalidate the old token.
6. disable `/v1/program`.
7. mark v2 as PROVISIONAL.
8. restore MCP/REST health and resolve HTTP 421.
9. create a clean test database and rerun all writes with unique keys.

## P1 — before private v1.1 deployment

1. extract REST façade from `grok_mcp_server_v2.py`;
2. implement secure auth middleware;
3. implement byte-counting body limit;
4. replace idempotency store;
5. add common error responses;
6. add capability status;
7. implement durable HERMES jobs;
8. correct grounding manifest and file retrieval;
9. add schema-contract tests;
10. use a stable domain.

## P2 — capability restoration

1. real ModelRelay health adapter;
2. actual memory adapter;
3. indexed evidence search;
4. real multidimensional trust adapter;
5. provider health/quota adapters;
6. proposal-only parallel audit workflow;
7. optional Responses API provider plane with explicit budget and retention.

## P3 — maturity

1. per-key scopes and rotation;
2. structured OpenTelemetry traces;
3. Redis-backed rate limits for multiprocess deployments;
4. signed evidence bundles;
5. automated schema drift checks;
6. chaos/fault-injection tests;
7. reproducible deployment packaging;
8. formal security review.

---

# 10. Validation commands

## Local repository evidence

```powershell
git status --short
git diff -- tools/browser_ai_mcp/grok_mcp_server_v2.py
git diff -- tests
git log -1 --oneline
```

## Secret search without printing matches

```powershell
rg --count-matches "nxs_sage_[A-Za-z0-9_-]{32,}" `
  C:\Users\speci.000\Documents\NEXUS `
  C:\Users\speci.000\Downloads\NEXUSlogs `
  C:\Users\speci.000\Downloads\ARCHIVIST
```

## OpenAPI contract test

```powershell
python .\tools\sage_v1_1\test_sage_gateway_contract.py `
  .\tools\sage_v1_1\nexus_sage_v1_1_openapi.yaml
```

## Unit tests

```powershell
python -m unittest -v `
  tools.sage_v1_1.test_sage_gateway_contract
```

## Local health

```powershell
curl.exe -sS -D - http://127.0.0.1:7354/v1/health
```

## Public health

```powershell
curl.exe -sS -D - https://actions.example.com/v1/health
```

## Old-token rejection

```powershell
curl.exe -sS -D - `
  -H "Authorization: Bearer <OLD_TOKEN>" `
  https://actions.example.com/v1/health
```

Expected: `401`.

---

# 11. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Rotating the key breaks Builder Actions | Coordinate restart and Builder update in one maintenance window; verify old 401/new 200. |
| Removing `/program` reduces flexibility | Replace with allowlisted workflows and HERMES-owned executors. |
| REST extraction introduces regressions | Preserve route handlers behind an adapter and run contract tests before switching. |
| Stable public domain increases exposure | Restrict paths, authenticate, rate-limit, log safely, and consider IP allowlisting where practical. |
| Indexed evidence search increases stored metadata | Add sensitivity labels, scope checks, retention, and access audits. |
| Job queue adds complexity | Keep the state machine small and deterministic; avoid embedding worker logic in the API process. |
| Multi-agent work causes shared-state races | Use proposal/lease/claim contracts and avoid parallel writes to the same worktree or browser target. |
| OpenAI provider integration adds cost and data flow | Put it behind explicit provider policy, budget, and operator approval. |

---

# 12. Concrete closure checklist

- [ ] Public tunnel stopped.
- [ ] Compromised token rotated.
- [ ] Old token verified rejected.
- [ ] Logs redacted for normal sharing.
- [ ] Current 421 resolved.
- [ ] `/v1/program` removed from production.
- [ ] Production and development schemas separated.
- [ ] Atomic payload-aware idempotency installed.
- [ ] Durable HERMES job state machine installed.
- [ ] Common error envelopes and response codes added.
- [ ] Grounding manifest includes hash, size, mtime, and truncation state.
- [ ] Model, memory, trust, and provider routes disabled until adapters pass.
- [ ] All mutating tests use fresh keys and isolated state.
- [ ] First write is asserted non-duplicate.
- [ ] Same-key changed-payload returns 409.
- [ ] Current local and public health evidence recorded.
- [ ] Diff, tests, schema hash, and commit captured.
- [ ] NEXUS SAGE v1.1 remains private (`Only me`) until all gates pass.

---

# Final verdict

The local development cycles produced a valuable prototype and a strong governance concept, but they moved from implementation to “complete” too early. The next engineering milestone should not add more endpoints. It should make the existing production surface trustworthy.

The correct v1.1 objective is:

> **A small, stable, authenticated, payload-aware, evidence-producing SAGE gateway in which every advertised capability is real, every write is attributable and idempotent, and all actual execution remains under HERMES authority.**
