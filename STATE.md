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

## STATUS: READY FOR LONG RUN

All milestones (A–E) complete. App compiles, lints clean, dev server healthy on
:3000. Agent Browser self-verify PASSED (all 4 pages render, handoff create
flow end-to-end, MCP health degrades to STUB with sample payload, filters work,
mobile responsive, sticky footer).

## Git backup (anti-wipe)

- **Remote:** `specimba/NEXUS_OpsBoard_multi-lane_A2A_ACP_mirror` (branch `main`)
- **Token:** stored in `~/.git-credentials` (mode 600, never tracked).
- **Identity:** `Canberk 'specimba' Karaerkek <32012089+specimba@users.noreply.github.com>`
- **Signing:** GPG ed25519 key `8D8015A4E4C4AF93` (no passphrase, headless-safe);
  uploaded to GitHub; `commit.gpgsign=true` → commits show **Verified**.
- **Backup script:** `bash scripts/git-backup.sh [msg]` (commits + pulls + pushes).
- **Docs:** `docs/GIT_BACKUP.md` (setup, recovery, gitignore policy).
- Runtime/binary/secret files gitignored (`.env`, `db/*.db`, `data/handoffs.json`,
  `.zscripts/dev.pid`). Fresh clones start from sample seed.

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
