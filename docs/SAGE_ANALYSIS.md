# NEXUS SAGE — Analysis & Integration Plan

> Grounded analysis of the NEXUS SAGE project, retrieved from Google Drive via
> Browserless on 2026-07-12. Source files in `sage/reference/`.
> This is an **analysis**, not an integration — the staged plan at the end is a
> proposal awaiting operator confirmation before any code is written.

## 1. What SAGE actually is

NEXUS SAGE is a **Custom GPT** configured on **GPT-5.6 Thinking** that acts as
the **chief reasoning, architecture-audit, and governance-preparation lane** for
the NEXUS mesh. The name is a backronym: **S**ynthesis, **A**udit,
**G**overnance, **E**vidence.

It is *not* a standalone app. It runs inside ChatGPT as a Custom GPT and reaches
back into the NEXUS backend through a **governed REST facade** called the
**SAGE Action Gateway** — an OpenAPI 3.1 spec hosted over an ngrok tunnel that
proxies a subset of the Grok MCP Bridge v2 tools.

### Authoritative identity (from `01_instructions_v2.md`)

> You are NEXUS SAGE, the chief reasoning, architecture-audit, and
> governance-preparation lane for NEXUS.
>
> The user is the CEO/operator and final authority.
> HERMES is the principal orchestrator.
> ARCHIVIST owns durable evidence and lineage.
> Codex and other assigned coding lanes perform repository implementation.

## 2. The SAGE governance stack (lane contracts)

SAGE defines **8 lanes** with explicit role contracts (`02_nexus_sage_v1.txt` §6).
These are governance roles, not executor lanes:

| Lane | Role | Authority |
|------|------|-----------|
| **HERMES** | Principal orchestrator: mission decomposition, lane assignment, locks/leases, receipts, retries, execution-authorization routing, closure coordination | Sole authority for task lifecycle (claim/complete/fail) |
| **ARCHIVIST** | Evidence retention, provenance, claim-to-source linkage, decision records, durable system memory | Owns the evidence store |
| **Grok** | Fast public-source discovery, rapid bounded browser probing, exploratory adversarial research | Advisory until verified |
| **Zo** | Long-context review, parallel verification, judge / best-of-N comparison, contradiction discovery | Judge-only / read-only unless explicit execution authority |
| **DeepSeek** | Structured technical reasoning, algorithms, state machines, protocol/implementation critique | Reasoning lane |
| **ChatGPT / NEXUS SAGE** | Synthesis, architecture audit, evidence analysis, plan preparation, cross-lane adjudication, governance design | This lane = SAGE itself |
| **Codex** | Scoped repository implementation, tests, diffs, worktree-contained execution | One writer per worktree |
| **Antigravity** | Governed coding or review per workspace rules | No new governance lane per conversation |

## 3. SAGE's action surface (the permission model)

The Action Gateway OpenAPI spec (`05_actions_openapi.yaml`) exposes **17
operations** — a strict subset of the Grok MCP Bridge v2's 22 tools. The
excluded tools are the **HERMES-only lifecycle operations**: `task_claim`,
`task_complete`, `task_fail`. SAGE cannot claim, complete, or fail coordination
tasks — it can only *propose* them via `task_add` and hand off to HERMES.

This maps cleanly to a three-tier action doctrine (`01_instructions_v2.md`):

| Tier | Tools | SAGE may call? |
|------|-------|----------------|
| **0 — reasoning** | (no tools) | Yes — default |
| **1 — observation** (read-only) | `ping`, `echo`, `registry_debug`, `coordination_status`, `task_list`, `agent_list_topics`, `agent_retrieve_messages`, `session_status`, `comparison_get`, `comparison_export`, `http_diagnostic` (dry_run), `simulate_probe` (labeled) | Yes |
| **2 — auditable writes** | `task_add`, `agent_publish_message`, `session_heartbeat`, `evidence_capture`, `audit_log`, `query_log`, `comparison_add` | Yes — with payload summary before + receipt after |
| **3 — HERMES lifecycle** | `task_claim`, `task_complete`, `task_fail` | **No** — prepare a HERMES handoff instead |

### `http_diagnostic` hardening (matches our Ops Board)

SAGE's instruction matches our `docs/MCP_CONTRACT.md` denylist exactly:

> Never call http_diagnostic on localhost, private networks, metadata services,
> credential-bearing URLs, or non-public targets. Prefer `mode=dry_run`; use
> live public diagnostics only when the user explicitly requests them.

## 4. SAGE's mission workflow

```
GROUND → MODEL → AUDIT → DESIGN → VERIFY → HANDOFF
```

- **GROUND** — read knowledge files, establish canonical state, mark stale/contradictory/inferred material.
- **MODEL** — define objective, current state, constraints, affected systems, authority owner, lane owner, dependencies, risks, evidence requirements, success/stop conditions.
- **AUDIT** — check architectural drift, privilege expansion, identity ambiguity, fallback ambiguity, worktree collision, browser/CDP drift, duplicate tabs, uncoordinated writes, secret exposure, private egress, schema drift, missing rollback/tests, unverifiable completion.
- **DESIGN** — smallest safe plan: lane owner, inputs, allowed/forbidden actions, approval gate, commands, evidence, verification, rollback, retry policy, closure criteria.
- **VERIFY** — separate code-written from code-tested, tests-suggested from tests-run, local-success from production-readiness.
- **HANDOFF** — structured block:

```
## HANDOFF — <LANE>
Mission:
Inputs:
Allowed actions:
Forbidden actions:
Expected evidence:
Stop conditions:
Return format:
```

### Truth labels (governance vocabulary)

SAGE uses a **controlled vocabulary** for claim status — never `DONE`/`PASS`/
`READY`/`CLOSED` without evidence:

`VERIFIED` · `PROVISIONAL` · `INFERRED` · `STALE` · `BLOCKED` · `NOT TESTED` · `CONTRADICTED`

## 5. How SAGE relates to this Ops Board

**They are two views of the same backend.** Both target the Grok MCP Bridge v2
on port 7354 with the same 22-tool inventory.

| Aspect | NEXUS Ops Board (this repo) | NEXUS SAGE (Custom GPT) |
|--------|----------------------------|--------------------------|
| Runtime | Next.js 16 sandbox (GLM-5.2) | ChatGPT Custom GPT (GPT-5.6 Thinking) |
| Bridge access | Direct `/api/mcp/*` polling | REST facade (Action Gateway) over ngrok |
| Role | Operator mirror — observability | Governance — reasoning, audit, plan prep |
| Lane model | 14 **executor** lanes (qwen, mimo, gemini, minimax, mistral, intern_gpu, meta_muse, apodex, glm52, + grok/deepseek/zo/chatgpt/qwen_deep) | 8 **governance** lanes (hermes, archivist, sage, + grok/zo/deepseek/chatgpt/codex/antigravity) |
| Handoff model | `HandoffCard` (from/to/token/summary/status) | Structured `## HANDOFF — <LANE>` block with allowed/forbidden actions |
| Truth labels | `ready/partial/broken/unknown/preview_mode` (lane status) | `VERIFIED/PROVISIONAL/INFERRED/STALE/BLOCKED/NOT TESTED/CONTRADICTED` (claim status) |

**Overlap:** Grok, Zo, DeepSeek, ChatGPT appear in both registries.
**Complement:** SAGE adds HERMES + ARCHIVIST (governance) + Codex + Antigravity
(coding). The Ops Board adds the executor lanes SAGE doesn't model
(qwen_webdev, mimo_claw, gemini, minimax, mistral_code, intern_gpu, meta_muse,
apodex, glm52).

The two are **designed to compose**: SAGE reasons + prepares handoffs; the Ops
Board renders the live state SAGE reasons over and the handoffs SAGE emits.

## 6. The reference files (Fable 5 / Sonnet 5 system prompts)

`03_fable5systemprompt.txt` and `04_sonnet5systemprompt.txt` are **transcribed
reference copies** of Anthropic's Claude Fable 5 and Claude Sonnet 5 chat-system
prompts. They are **not** SAGE's own logic. SAGE's instructions explicitly
scoped them as cross-model reference only:

> CLAUDE.md: model-independent reference only; do not adopt Claude-specific
> behavior automatically.

Their value to NEXUS is **adversarial understanding**: knowing how a competing
frontier model is instructed lets SAGE's governance decisions account for
cross-lane behavioral drift (e.g., when Zo or ChatGPT lanes drift toward
Claude-style behaviors).

## 7. Staged integration plan (proposal — not yet implemented)

The integration has three clean layers, each independently valuable. **No code
is written until the operator confirms which layer to start.**

### Layer 1 — Browserless adapter (tactical, immediate)

**Why first:** Browserless is what made reading SAGE possible. It belongs in
the Ops Board as a first-class adapter — it's the missing cloud-browser layer
that complements (does not replace) the local CDP :9224 truth.

- New `src/lib/browserless.ts` — client wrapping `/content`, `/scrape`,
  `/screenshot`, `/function`, `/download`, `/smart-scrape`. Token from
  `.env.local` (`BROWSERLESS_TOKEN`, already stored, gitignored).
- New API routes `/api/browserless/{content,screenshot,scrape}` — SSRF-hardened
  (the SAGE `http_diagnostic` rule applies: public HTTPS only, no private IPs,
  no auth headers). Reuses the same denylist posture as `/api/mcp/health`.
- UI: a `browserless` card on the Ops Board + a `/browserless` page with a
  "fetch URL" tool (renders any JS-heavy/authenticated page).
- **Does NOT touch CDP :9224** — Browserless is a separate cloud fleet, used
  for read-only probing per SAGE's browser/CDP rules.

### Layer 2 — SAGE governance lanes (strategic)

**Why second:** Reconciles the two registries so the Ops Board renders the full
governance stack SAGE reasons over.

- Add SAGE's missing lanes to `src/lib/registry.ts`: `hermes`, `archivist`,
  `sage`, `codex`, `antigravity` — flagged as **governance** lanes (vs the
  existing **executor** lanes). New `LaneKind` type: `"governance" | "executor"`.
- Add SAGE's **truth labels** as a `ClaimStatus` type; render on `HandoffCard`
  alongside the existing executor status.
- Add SAGE's **action tiers** to the MCP tool table (`McpToolInfo.tier`:
  `0 | 1 | 2 | 3`); mark Tier 3 (HERMES-only) tools as restricted in the UI.
- Update `docs/LANE_DOCTRINE.md` with the reconciled lane contracts.

### Layer 3 — Action Gateway bridge (the real SAGE integration)

**Why last:** This is where SAGE's verdicts actually flow into the Ops Board.

- Host the SAGE Action Gateway spec (`sage/reference/05_actions_openapi.yaml`)
  as a documented contract; build the bridge routes under `/api/gateway/*` that
  proxy to the MCP bridge (reusing our existing `/api/mcp/*` logic).
- Render SAGE's emitted handoffs on the Ops Board: SAGE publishes to A2A topic
  `nexus.a2a.handoff` via `agent_publish_message`; our handoff bus already
  consumes that conceptually — wire it for real.
- Render SAGE's **mission workflow state** (GROUND→…→HANDOFF) as a progress
  strip on handoff cards that carry a SAGE verdict.
- Optional: a `/sage` page showing SAGE's recent verdicts, evidence captures,
  and HERMES-handoff queue (the Tier 3 operations SAGE cannot perform itself).

### What I will NOT do without confirmation

- Will not modify the existing lane registry until you confirm the governance/executor split.
- Will not expose the Action Gateway publicly until SSRF/auth review (SAGE's
  privacy policy + DeepSeek's prior SSRF review both apply).
- Will not drive CDP :9224 from Browserless — they stay separate per SAGE's
  browser/CDP rules.

## 8. Reference file map

| File | Lines | Role |
|------|-------|------|
| `sage/reference/01_instructions_v2.md` | 197 | Canonical SAGE v2 doctrine |
| `sage/reference/02_nexus_sage_v1.txt` | 7555 | Full GPT Builder transcript + v1 instructions |
| `sage/reference/03_fable5systemprompt.txt` | 1584 | Claude Fable 5 system prompt (reference) |
| `sage/reference/04_sonnet5systemprompt.txt` | 222 | Claude Sonnet 5 system prompt (reference) |
| `sage/reference/05_actions_openapi.yaml` | 557 | Action Gateway OpenAPI 3.1 spec (17 ops) |
| `sage/reference/06_privacy_policy.md` | 37 | Action Gateway privacy notice |
