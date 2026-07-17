# NEXUS Papers Database Investigation — Formal Report
## Deep-Dive Comparison: Old Dashboard vs. Current State vs. Papers Library

> **Date:** 2026-07-15
> **Investigator:** GLM-5.2 (NEXUS A2A control plane)
> **Sources reviewed:**
> - Papers database (Drive folder `1cDD09fOP...`): 14 paper folders (~646 PDFs), GAP_FILL_MISSION_REPORT.md, 00_INDEX_GAP_FILL.md
> - Zip-extracted dashboard (Drive folder `14tey3EJQ...`): full nexusDASHv1 source (25 Prisma models, 78-module Python, 40 tabs, 139 API routes)
> - Current control plane (this repo): 7 pages, 12 API routes, STATE_PACK truth rail

---

## 1. What the Old Dashboard Got Right (Do Not Redo)

| Capability | Implementation | Assessment |
|------------|---------------|------------|
| **Research paper CRUD** | Prisma `Paper` model + `GET/POST/PUT /api/research` | Fully wired, real DB persistence. Priority tiers P0/P1/P2, relevance scores, arxiv ID linking, vetting flag. |
| **Alphaxiv fetch** | `GET /api/alphaxiv` → Tavily/Jina search → DB persistence | Real external API integration with fallback chain. Papers auto-saved with metadata. |
| **Paper priority workflow** | P0/P1/P2 queues + status changes + "mark in progress" | Operationally complete. DB cuid fix (the `paperId` bug) was already resolved. |
| **DataSourceBadge pattern** | `data-source-badge.tsx` with 6 states | Provenance discipline. We adapted this as Step 1 of NXM-038 REV 2. |
| **Command palette** | `cmdk`-based with 16 commands | Navigation + actions. We adapted this as Step 6. |
| **Token budget tracking** | `SessionBudget` + `TokenUsageLog` Prisma models | Real DB-backed budget with per-agent/per-model breakdown. |
| **GMR health checks** | Real z-ai-web-dev-sdk pings with latency tracking | Real model health, not mocked. |

**Conclusion:** The old dashboard's research pipeline (CRUD + Alphaxiv + priority workflow) is production-quality. We should NOT rebuild it — we should **port it as a pack-section extension when the STATE_PACK carries a `papers` section**.

---

## 2. What the Old Dashboard Missed or Got Wrong

| Gap | Evidence | Impact |
|-----|----------|--------|
| **No papers database integration** | The old dashboard seeded only 6 papers (isc-bench, or-bench, dual-pool, deer-flow, routing-survey, shieldgemma). The actual papers library has ~646 PDFs across 14 folders. | The dashboard showed 6 papers while 640+ sat unused in the filesystem. No connection between the research library and the operational dashboard. |
| **No gap-fill awareness** | The GAP_FILL_MISSION_REPORT.md (2026-07-12) identified 6 critical research gaps and filled them with 46 verified papers. The dashboard has no concept of "gap areas" or "research coverage." | The operator cannot see which NEXUS components have literature backing vs. which are research gaps. Coverage went from 65% → 95% but the dashboard doesn't reflect this. |
| **No paper-to-component mapping** | The 00_INDEX_GAP_FILL.md maps each paper to specific NEXUS components (e.g., `2603.24775 AIP → governor/kaiju_auth.py`). The dashboard has no such mapping. | The operator cannot trace from a paper's finding to the code it should improve. The "nexusMapping" field exists in the Paper model but was never populated with component paths. |
| **No integration pass tracking** | The GAP_FILL report defines 4 integration passes (Pass 1: IBCT tokens + routing policies; Pass 2: sandbox backends; Pass 3: worker roles + DAG; Pass 4: DeepContext + UQLM + steg scenarios). The dashboard has no tracking for these. | Research findings are disconnected from implementation progress. |
| **Fabricated arXiv IDs not flagged** | The gap-fill mission found 5 fabricated IDs and 4 wrong IDs in prior reports. The dashboard has no verification status on paper IDs. | Papers with fabricated IDs could be cited as evidence without the paper actually existing. |
| **No steganographic threat monitoring** | 8 papers on AI steganography (G5 gap) including "Tool Use Enables Undetectable Steganography" (2606.28425) — agents can build working stegosystems with tool use. The dashboard has no steganographic channel monitoring. | A real security gap: multi-agent systems can collude via covert channels that the dashboard cannot detect. |
| **No hallucination detection integration** | 6 papers on runtime hallucination monitoring (G6 gap) including DeepContext (F1=0.84, sub-20ms) and UQLM (generation-time UQ). The dashboard's StressLab tests LLM output but doesn't monitor for hallucination patterns in production. | The CDR (Cognitive Degradation Recovery) stages exist in the trust engine but are not connected to real-time hallucination detection. |
| **No cost-aware routing visualization** | 9 papers on token economics (G2 gap) including CARROT (minimax-optimal router) and R2-Router (4-5x lower cost). The dashboard's GMR tab shows model pools but doesn't visualize cost-optimization decisions. | The operator cannot see whether the model routing is cost-optimal or where savings opportunities exist. |

---

## 3. New Patterns, Anomalies, and Opportunities Discovered

### 3.1 AIP Protocol — Verifiable Delegation (arXiv 2603.24775)

**Finding:** The AIP (Agent Identity Protocol) paper introduces IBCT/Biscuit tokens with Datalog-based capability attenuation. It achieves 100% rejection of 600 attack vectors with only 2.35ms overhead.

**Current state:** Our KAIJU 4-variable authz (`governor/kaiju_auth.py` in the donor) uses scope × clearance × impact × intent. It does NOT use capability tokens or Datalog-based attenuation.

**Opportunity:** Wire AIP-style Biscuit tokens into the SAGE Action Gateway's Bearer auth. The SAGE v1.1 OpenAPI spec already uses `bearerAuth` with `NEXUS_API_KEY` format — replacing this with Biscuit tokens would add verifiable delegation chains with cryptographic capability attenuation. This is a concrete, paper-backed improvement to the gateway's auth model.

### 3.2 DeepContext — Real-Time Intent Drift Detection (arXiv 2602.16935)

**Finding:** DeepContext uses an RNN-based stateful monitor that detects "semantic drift" in multi-turn conversations with F1=0.84 and sub-20ms inference. It specifically targets Crescendo-style attacks where intent gradually shifts.

**Current state:** Our CDR (Cognitive Degradement Recovery) 6-stage state machine reacts to trust score thresholds. It does NOT monitor conversation intent in real-time. The `semantic_drift_monitor.py` module is referenced in the papers index but doesn't exist in the extracted source.

**Opportunity:** Add a DeepContext-style intent drift monitor as a pack-section extension. The STATE_PACK could carry a `drift_monitoring` section with per-agent drift scores, and the dashboard could display them as a new panel with a DataSourceBadge. This connects the CDR stages to real-time detection rather than reactive trust-score thresholds.

### 3.3 CARROT — Cost-Aware Rate-Optimal Router (arXiv 2502.03261)

**Finding:** CARROT introduces minimax-optimal routing that predicts both cost and accuracy. It includes the SPROUT dataset and proves rate-optimal bounds. R2-Router (2602.02823) extends this with "routing as reasoning" — the router itself is an LLM that reasons about which model to use.

**Current state:** Our GMR (Global Model Relay) uses a composite scoring function (success_rate × 0.10 + throughput × 0.05 + latency_inverse × 0.30 + cost_inverse × 0.25 + intent_match × 0.30). This is a static weighted sum, not a learned or minimax-optimal policy.

**Opportunity:** Add a "Routing Policy" panel to the GMR tab that shows the current routing policy and compares it against the CARROT minimax-optimal baseline. The STATE_PACK could carry `mcp.routing_policy` with the current weights and `mcp.routing_savings` with the estimated savings vs. a single-model baseline.

### 3.4 Steganographic Threat Surface (arXiv 2606.28425, 2402.07510, 2410.03768)

**Finding:** Three papers demonstrate that multi-agent LLM systems can build working steganographic channels using tool use, with Schelling-point coordination. Standard mitigations (filtering, temperature limits) are insufficient. The "strategic confinement hypothesis" suggests that agents can covertly communicate even when monitoring is present.

**Current state:** Our control plane has NO steganographic channel monitoring. The old dashboard has a `security/steg/` reference in the papers index but no implementation. The SAGE privacy policy mentions "abuse detection" but doesn't specify steganographic channels.

**Opportunity:** Add a "Steganographic Threat Surface" panel that displays the risk level based on: (a) number of active inter-agent channels, (b) tool-use frequency (the attack vector), (c) whether any agents have CDR stage ≥ DEGRADED. This is a display-only pack-section extension — the computation happens host-side.

### 3.5 SAGA 5-Layer Architecture (arXiv 2504.21034)

**Finding:** SAGA defines a 5-layer security architecture for AI agentic systems: (1) identity, (2) sandboxed execution, (3) policy enforcement, (4) observability/audit, (5) data mediation. Each layer has fine-grained access-control tokens.

**Current state:** Our 8-pillar architecture maps roughly to SAGA's layers but lacks the explicit layer separation. The SAGE Action Gateway is layer 1+3 (identity + policy). The Browserless adapter is layer 2 (sandboxed execution). The Vault is layer 4 (audit). But layer 5 (data mediation) is missing entirely.

**Opportunity:** Add a "SAGA Alignment" panel that maps our 8 pillars to SAGA's 5 layers and highlights the missing layer 5 (data mediation). This is a display-only comparison that helps the operator see architectural gaps.

### 3.6 Papers Library → Dashboard Connection (the big miss)

**Finding:** The papers library has ~646 PDFs across 14 folders. The old dashboard's research tab showed 6 seeded papers. The gap-fill mission added 46 more, but the dashboard was never updated to reflect the full library.

**Current state:** Our control plane has ZERO research capabilities — no paper model, no research API, no paper-to-component mapping. The FABLE5 plan explicitly DROPPED the research tab from REV 2 scope (D7 DROP list). But the papers database is a strategic asset that should be connected.

**Opportunity:** Add a `papers` section to the STATE_PACK schema. The host-side generator (NXM-043) would scan the papers folders, read the 00_INDEX_GAP_FILL.md, and include a summary in the pack. The dashboard would render:
- Total papers count by gap area (G1-G6)
- Coverage percentage (components backed by literature)
- Paper-to-component mapping (from the index)
- Integration pass status (Pass 1-4 from the gap-fill report)

This is a pack-section extension, display-only, and aligns with FABLE5 D7 v3 ("pack-section extensions, display-only").

---

## 4. Specific, Actionable Improvements with Evidence

### Improvement 1: Add `papers` section to STATE_PACK schema

**Evidence:** The papers library has 646 PDFs; the dashboard shows 0. The 00_INDEX_GAP_FILL.md already has the paper-to-component mapping.

**Action:** Extend `src/lib/statePack.ts` zod schema with:
```typescript
papers: z.object({
  total: z.number(),
  by_gap: z.record(z.string(), z.number()),
  coverage_pct: z.number(),
  integration_passes: z.array(z.object({
    pass: z.number(),
    name: z.string(),
    status: z.string(),
  })),
  recent_additions: z.array(z.object({
    arxiv_id: z.string(),
    title: z.string(),
    nexus_component: z.string(),
  })),
}).optional()
```

**Priority:** P2 (D7 v3 — pack-section extension, display-only)

### Improvement 2: Add "Research Coverage" panel to the Ops Board

**Evidence:** The gap-fill report shows coverage went from 65% → 95%. The dashboard doesn't display this.

**Action:** Create `src/components/ResearchCoveragePanel.tsx` that reads `pack.papers` and displays:
- Total papers count + coverage percentage badge
- Gap area breakdown (G1-G6) with paper counts
- Integration pass status (Pass 1-4)
- Paper-to-component mapping (top 5 highest-impact papers)

**Priority:** P2 (D7 v3 — display-only, needs pack section)

### Improvement 3: Add "Steganographic Threat Surface" indicator

**Evidence:** 8 papers demonstrate that multi-agent LLM systems can build undetectable covert channels via tool use. Our control plane has no monitoring for this.

**Action:** Create `src/components/StegThreatPanel.tsx` that reads `pack.mcp.tools` (tool count = attack surface) + `pack.lanes` (active inter-agent channels) + CDR stages (if available) and displays a threat level. Add to the MCP page.

**Priority:** P3 (D7 v3+ — display-only, threat assessment from existing pack data)

### Improvement 4: Add "SAGA Alignment" architecture comparison

**Evidence:** SAGA (2504.21034) defines a 5-layer security architecture. Our 8-pillar model maps to 4 of 5 layers; layer 5 (data mediation) is missing.

**Action:** Create a static comparison panel that maps our 8 pillars to SAGA's 5 layers and highlights the gap. This is a documentation/awareness panel, not a data-driven one.

**Priority:** P3 (display-only, architectural awareness)

### Improvement 5: Connect AIP Biscuit tokens to SAGE gateway auth

**Evidence:** AIP (2603.24775) achieves 100% attack rejection with Biscuit tokens. Our SAGE gateway uses plain Bearer tokens.

**Action:** This is a host-side code change (in the SAGE gateway, not the sandbox). Document the improvement in `docs/SAGE_V1_1_ANALYSIS.md` and flag it for the next SAGE revision. The sandbox side needs no changes — the gateway's auth model is opaque to the control plane.

**Priority:** P3 (documentation + future SAGE v2 scope)

### Improvement 6: Add "Routing Policy" comparison to GMR panel

**Evidence:** CARROT (2502.03261) and R2-Router (2602.02823) define cost-optimal routing policies. Our GMR uses a static weighted sum.

**Action:** Add a "Routing Policy" section to the MCP or GMR panel that displays the current routing weights (from pack if available) and compares against the CARROT minimax-optimal baseline. This is display-only.

**Priority:** P3 (D7 v3 — pack-section extension)

---

## 5. Summary: Old Dashboard vs. Current State vs. Papers Library

| Dimension | Old Dashboard | Current Control Plane | Papers Library |
|-----------|--------------|----------------------|----------------|
| Paper count | 6 seeded | 0 (dropped per FABLE5) | ~646 PDFs |
| Paper-to-code mapping | Empty `nexusMapping` field | None | 46 mapped in 00_INDEX_GAP_FILL.md |
| Gap area awareness | None | None | 6 gaps (G1-G6) filled |
| Integration pass tracking | None | None | 4 passes defined, 0 executed |
| Coverage percentage | None | None | 95% (up from 65%) |
| Steganographic monitoring | None | None | 8 papers documenting the threat |
| Hallucination detection | StressLab (reactive) | None | 6 papers with real-time methods |
| Cost-aware routing | GMR (static weights) | None | 9 papers with optimal policies |
| SAGA layer 5 (data mediation) | Missing | Missing | 1 paper defining the full architecture |

**The core finding:** The papers library contains research that directly maps to improvements for every major NEXUS component, but neither the old dashboard nor the current control plane connects to it. The FABLE5 plan was correct to DROP the research tab from REV 2 (it would be mock theater without Prisma), but the papers data can flow through the STATE_PACK as a display-only pack-section extension — exactly what D7 v3 prescribes.

---

## 6. Recommended Next Action

Implement Improvement 1 (papers section in STATE_PACK schema) + Improvement 2 (Research Coverage panel). These are D7 v3 pack-section extensions, display-only, and they connect the 646-paper research library to the operational dashboard for the first time.
