# RESUME — for the next GLM-5.2 session

> If you are a new GLM-5.2 session continuing this project, read this file and
> `STATE.md` **first**, then continue from the last completed milestone.
> Do **not** restate the original prompt. Do **not** switch models.

## Who you are

- **Model:** GLM-5.2 (locked — no flash fallback, no provider switch).
- **Host:** Z.ai sandbox, Next.js 16 on port 3000.
- **Project:** `nexus-a2a-control-plane` — operator mirror of the NEXUS A2A mesh.

## Where the project lives

```
/home/z/my-project/
  STATE.md              ← read this first (milestone progress)
  README.md             ← project overview
  worklog.md            ← per-task step log
  docs/
    MCP_CONTRACT.md     ← 22-tool table + denylist
    LANE_DOCTRINE.md    ← lane success signals + wait policies
    RESUME.md           ← this file
  src/
    lib/types.ts registry.ts mcpTools.ts paths.ts ledger.ts handoffBus.ts
    app/page.tsx  mcp/page.tsx  lanes/page.tsx  handoffs/page.tsx
    app/api/{health,ledger,lanes,handoffs,mcp/*}/route.ts
    components/{OpsNav,LaneCard,HandoffCard,LedgerTail,McpToolTable,
                McpHealthBadge,KeepVisibleBanner,QwenWebDevNote}.tsx
    hooks/use-nexus.ts
  data/{sample_ledger.jsonl, sample_handoffs.json, sample_mcp_health.json}
```

## How to resume

1. `cat STATE.md` — find the last `✅ DONE` milestone.
2. `bun run lint` — confirm the tree is clean.
3. `tail -20 /home/z/my-project/dev.log` — confirm the dev server is healthy.
4. Continue the next milestone. Small file batches. Re-read `STATE.md` after each batch.

## Retry protocol (high-usage / failures)

1. On any failure: **wait**, then issue:
   > Continue Milestone X from STATE.md, GLM-5.2 only.
2. **Small file batches** — never one mega paste.
3. After each batch, **re-read `STATE.md`**.
4. **No model switch.** No "try flash instead".

## What is done (as of last session)

- **A — Scaffold** ✅ — lib foundation, README, STATE, .env.example.
- **B — Domain + APIs** ✅ — types, samples, all 7 API routes.
- **C — UI boards** ✅ — dark ops shell, home/MCP/lanes/handoffs pages, components.
- **D — Docs** ✅ — MCP_CONTRACT, LANE_DOCTRINE, RESUME.
- **E — Stretch** — file-backed `data/handoffs.json` ✅, filter UI ✅, SSE note pending.

## What remains / next steps

- **SSE note page** (Milestone E stretch) — document the `7354/sse` stream.
- **Wire real ledger** — set `NEXUS_LEDGER_PATH` to the Windows host path:
  `C:\Users\speci.000\Downloads\NEXUSlogs\NEXUScontinuity_runs.jsonl`.
- **Wire live MCP queue** — replace the v0 mock at `/api/mcp/queue` with a real
  `coordination_status` call when the bridge is live.
- **Agent Browser self-verify** — the main orchestrator must verify every page
  renders + the handoff create flow works before declaring done.

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

## Hardening facts (never contradict in code/UI)

- `http_diagnostic` is public HTTPS GET/HEAD only; private IPs blocked; no cookies/auth headers.
- No delete / shell / local-FS tools on the Grok bridge.
- CDP `:9224` is live truth; this app is the operator mirror, not the driver.
