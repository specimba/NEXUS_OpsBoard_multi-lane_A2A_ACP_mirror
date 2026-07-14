# NEXUS STATE — continuity ledger for GLM-5.2 sessions

> Single source of truth for milestone progress. A new GLM-5.2 session MUST read
> this file first and continue from the last `DONE` milestone. No model switch.

## Identity

- **Runtime:** GLM-5.2 on Z.ai sandbox (Next.js 16, port 3000).
- **App:** `nexus-a2a-control-plane` — operator mirror of the NEXUS A2A mesh.
- **Rule:** Retries only. Model lock. Small file batches. Re-read STATE.md after each batch.

## Milestones

### A — Scaffold — ✅ DONE

- Next.js App Router + TS + Tailwind already initialized (dev server on :3000).
- `README.md`, `.env.example` created.
- Domain foundation in `src/lib/`:
  - `types.ts` — LaneId, LaneStatus, HandoffCard, LedgerRow, McpToolInfo, McpHealth, McpQueueSnapshot.
  - `registry.ts` — 14 lanes with success signals + wait policies + accent colors.
  - `mcpTools.ts` — all 22 Grok MCP tools + denylist (no shell/cookies/private IP).
  - `paths.ts` — env resolution (NEXUS_LEDGER_PATH injectable, sample fallback).
  - `ledger.ts` — JSONL tail reader + summarizer.
  - `handoffBus.ts` — in-memory + file-backed handoff store.

### B — Domain + APIs — ✅ DONE

- `data/sample_ledger.jsonl` (24 rows), `data/sample_handoffs.json` (6 cards), `data/sample_mcp_health.json`.
- API routes: `health`, `ledger` (?limit), `lanes`, `handoffs` (GET+POST, validated), `mcp/health` (fetch 7354 → STUB fallback w/ sample payload), `mcp/tools` (22 + denylist), `mcp/queue` (mock snapshot).

### C — UI boards — ✅ DONE

- `layout.tsx` dark ops shell + sticky footer + nav (forced dark theme, nexus-bg grid).
- Components: OpsNav, LaneCard, HandoffCard, LedgerTail, McpToolTable, McpHealthBadge, KeepVisibleBanner, QwenWebDevNote.
- Pages: home ops board, `/mcp`, `/lanes`, `/handoffs` (wired to APIs, polling).
- `useNexusFetch` polling hook; sonner toasts for handoff create. Lint clean.

### D — MCP contract docs — ✅ DONE

- `docs/MCP_CONTRACT.md` — full 22-tool table + denylist + SSRF checklist.
- `docs/LANE_DOCTRINE.md` — 14 lanes with success signals + wait policies.
- `docs/RESUME.md` — next-session resume protocol.
- STATE.md -> "READY FOR LONG RUN".

### E — Stretch — ✅ DONE

- [x] File-backed `data/handoffs.json` store (handoffBus.ts persists on every add).
- [x] Filter UI on handoffs (status + lane filters).
- [x] SSE note section on MCP page (documents 7354/sse stream + wiring path).

## STATUS: NXM-038 REV 2 IN PROGRESS (Steps 1-6 DONE, Step 7 pending)

FABLE5 plan (NXM-038 REV 2) execution — the truth rail + honesty rail.
Grounded in `upload/NEXUSgeneralFABLE5advisorylogs-06.txt` (lines 1870-1970).

### NXM-038 REV 2 Steps

- **Step 1 — Badge substrate** ✅ DONE (commit 7821f8d)
  DataSourceBadge (WIRED|PACK|SEED|MOCK|OFF) + panelId + WIRED_VS_MOCKED.json manifest.
  All 5 pages retrofitted. G2 gate: 10 badged == 10 manifest.

- **Step 2 — Pack seam** ✅ DONE (commit 2ea7a22)
  statePack.ts (zod v4 schema, mtime-cached loader, staleness, credential sweep).
  data/test_pack.example.json (sentinel: 42 NXM-SEED cards, 25 tools, zo broken).
  POST/GET /api/import (1.5MB cap, sweep→422, zod validate).
  GET /api/state (pack reader).

- **Step 3 — Lanes pack-driven** ✅ DONE (commit 2ea7a22)
  /api/lanes merges pack.lanes over SEED baseline. PackStatusChip in nav.
  zo=broken when pack loaded. source: "pack"|"seed".

- **Step 4 — MCP de-mock** ✅ DONE (commit 2ea7a22)
  /api/mcp/tools: 25 pack-driven tools, drift detection (3 added: continuity_append,
  continuity_tail, cdp_window_probe). /api/mcp/health: reads
  registry_security.registry_schema_hash (FABLE5 wiring defect fixed).
  /api/mcp/queue: pack → sample fixture → inline mock (labeled).

- **Step 5 — Mission Board tab** ✅ DONE (commit 2ea7a22)
  /board page renders 42 NXM cards from pack.board.cards. Stat tiles, status icons,
  priority colors, PACK badge, import banner. Added to nav (6th tab).

- **Step 6 — Palette + fixes** ✅ DONE (commit 2ea7a22)
  NexusCommandPalette (Ctrl+K, 6 nav + 1 action, adapted from donor).
  Ledger reader accepts both 'timestamp' and 'ts' (FABLE5 wiring defect fixed).
  /api index replaces hello-world stub.

- **Step 7 — Docs + negative control** ⏳ IN PROGRESS
  [ ] STATE.md updated (this file)
  [ ] docs/STATE_PACK.md (pack schema + import instructions)
  [ ] docs/MCP_CONTRACT.md contract:sync note
  [ ] Negative control: full no-pack walk ⇒ zero unbadged MOCK/SEED
  [ ] G4 pack round-trip proof (operator pushes fresh pack → sandbox pulls → UI shows new pack_id)

### FABLE5 directives (binding)

- **D-005**: No fabricated data presented as real. Every panel has a DataSourceBadge.
- **D-010**: FABLE5 plans, never implements. GLM52 implements sandbox-side.
- **D-014**: NO credential rotations — accepted risk, structural containment.
- **D-015**: NO GitHub payments — free tier only, no Actions dependency.
- **D-016**: No NEXUS secret enters the sandbox surface (sweep gate fail-closed).

### What the user sees now (preview)

6 pages with honest badges + pack-driven data:
- `/` Ops Board — lane grid: SEED→PACK, stats: WIRED, handoffs: WIRED, ledger: WIRED
- `/board` Mission Board — 42 NXM cards from PACK (test sentinel), PACK badge
- `/mcp` MCP — health: WIRED, queue: PACK, tools: PACK (25, drift detected)
- `/lanes` Lanes — doctrine: SEED→PACK (zo=broken from pack)
- `/handoffs` Handoffs — bus: WIRED (file-backed store)
- `/browserless` Browserless — OFF (sandbox, token absent)

Nav shows PackStatusChip (TEST · just now) + Ctrl+K command palette.

### Git backup (anti-wipe)

- **Remote:** `specimba/NEXUS_OpsBoard_multi-lane_A2A_ACP_mirror` (branch `main`)
- **Identity:** `Canberk 'specimba' Karaerkek <32012089+specimba@users.noreply.github.com>`
- **Signing:** GPG ed25519 key `FFE1A9C8FA725B36` (regenerated after sandbox wipe;
  uploaded to GitHub; `commit.gpgsign=true` → commits show **Verified**).
- **Backup script:** `bash scripts/git-backup.sh [msg]` (commits + pulls + pushes).
- Runtime/binary/secret files gitignored. Fresh clones start from sample seed.

## Retry protocol

1. Fail -> wait -> "Continue Milestone X from STATE.md, GLM-5.2 only".
2. Small file batches; never one mega paste.
3. After each batch re-read STATE.md.
4. No model switch. No "try flash instead".

## Integration HANDOFF (when READY)

```
## HANDOFF
- Grok MCP: host app; wire real NEXUScontinuity_runs.jsonl; later add continuity_append tool
- Qwen-webdev: richer preview mirror of HandoffCard + dashboard skin
- Zo: Ubuntu job tail ledger -> agent_publish_message topic nexus.a2a.handoff
- Gemini: publish playbook to shared Google Drive (Grok work folder)
- DeepSeek: review API auth surface and SSRF on mcp/health proxy
- Hermes: only one supervisor; VISIBLE_LANES=1 + keep_visible_daemon
```
