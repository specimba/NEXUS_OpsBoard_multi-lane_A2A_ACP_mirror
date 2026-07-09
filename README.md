# NEXUS A2A Control Plane

A long-lived ops mirror for the NEXUS multi-lane Agent-to-Agent (A2A) mesh and the
Grok MCP Bridge v2. This is the **operator mirror**, not the browser driver.

> **CDP :9224 is live truth. This app is the operator mirror.**
> Run `keep_visible_daemon` on the Windows host.

## What this is

- **Ops board** — lane cards (status + doctrine), handoff bus, ledger tail.
- **MCP control panel** — 22-tool inventory, health badge (UP/DOWN/STUB), queue snapshot.
- **Handoffs** — create + list handoff cards between lanes, file-backed store.
- **Resume OS** — `STATE.md` + `docs/RESUME.md` so a new GLM-5.2 session continues cleanly.

## Reality of the NEXUS stack

| Port | Component | Role |
|------|-----------|------|
| 9224 | Chrome CDP | Multi-lane browser truth (Grok, ChatGPT, Gemini, Qwen, DeepSeek, Zo, MiMo Claw, …) |
| 7354 | Grok MCP Bridge v2 | SSE connector tools for Grok/GPT custom connectors |
| 7352 | Brain API | Not MCP |
| 7355 | ModelRelay fallback | Internal |
| file | `NEXUScontinuity_runs.jsonl` | Continuity ledger |

### Hardening facts (the UI never contradicts these)

- `http_diagnostic` is **public HTTPS GET/HEAD only**; private IPs blocked; no cookies/auth headers.
- **No delete / shell / local-FS tools** on the Grok bridge.
- Runtime may fall back to `scratch/browser_ai_mcp_runtime`.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · shadcn/ui.
Dark ops aesthetic; dense but readable.

## Develop

```bash
bun run dev      # http://localhost:3000  (dev log -> dev.log)
bun run lint     # eslint
```

> **Sandbox note:** the app runs on port 3000. Preview it via the Preview Panel —
> do not navigate to `localhost:3000` directly.

## Environment

See [`.env.example`](./.env.example). In-sandbox, all values are optional and
sample data is used. Point `NEXUS_LEDGER_PATH` at the real ledger on the Windows
host to mirror live continuity runs.

## Layout

```
src/
  app/
    page.tsx              # ops board (home)
    mcp/page.tsx          # MCP tools + health
    lanes/page.tsx        # lane doctrine grid
    handoffs/page.tsx     # handoff bus + create form
    api/
      health/route.ts
      ledger/route.ts
      lanes/route.ts
      handoffs/route.ts
      mcp/health/route.ts # tries 7354/health; degrades to STUB
      mcp/tools/route.ts
      mcp/queue/route.ts
  components/
    LaneCard.tsx  HandoffCard.tsx  LedgerTail.tsx
    McpToolTable.tsx  McpHealthBadge.tsx
    KeepVisibleBanner.tsx  QwenWebDevNote.tsx  OpsShell.tsx
  lib/
    types.ts  registry.ts  mcpTools.ts  paths.ts  ledger.ts  handoffBus.ts
data/
  sample_ledger.jsonl  sample_handoffs.json  sample_mcp_health.json
docs/
  MCP_CONTRACT.md  LANE_DOCTRINE.md  RESUME.md
STATE.md  README.md
```

## Resume protocol

If a session fails mid-milestone, open `STATE.md`, find the last completed
milestone, and continue from there with:

> Continue Milestone X from STATE.md, GLM-5.2 only.

No model switch. No "try flash instead". See [docs/RESUME.md](./docs/RESUME.md).
