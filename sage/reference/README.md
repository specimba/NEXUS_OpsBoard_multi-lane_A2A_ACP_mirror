# NEXUS SAGE — reference materials (backed up from Google Drive)

These files are the **NEXUS SAGE** project: a Custom GPT (running on GPT-5.6
Thinking) that acts as the chief reasoning, architecture-audit, and
governance-preparation lane for NEXUS. They were retrieved from the private
Google Drive folder `NEXUS SAGE` using Browserless (cloud headless Chrome) and
committed here for version-controlled backup.

> **Source:** `https://drive.google.com/drive/folders/1VDkwR4r9r6iBJJPFceqvAC4eQnyuu0wM`
> **Retrieved:** 2026-07-12 via Browserless `/content` + `/function` + `/download`.
> **Analysis:** see `../docs/SAGE_ANALYSIS.md`.

## Files

| File | Type | What it is |
|------|------|------------|
| `01_instructions_v2.md` | text/markdown | **SAGE v2 operating instructions** — identity, core doctrine, knowledge hierarchy, action tiers, mission workflow (GROUND→MODEL→AUDIT→DESIGN→VERIFY→HANDOFF), truth labels, browser/CDP rules, repo rules. The canonical SAGE doctrine. |
| `02_nexus_sage_v1.txt` | text | **Full GPT Builder transcript + operating instructions (v1)** — the complete Custom GPT configuration including name, description, model (GPT-5.6 Thinking), capabilities, conversation starters, knowledge-file list (AGENTS/SKILLS/SOUL/LANES/ONBOARDING/CONTRIBUTING/README/NEXUS_MANIFEST/GROUNDING/01_PROJECT_STATE/CLAUDE/knowledge.md), and the v1 operating instructions (sections 1–14). |
| `03_fable5systemprompt.txt` | text | **Claude Fable 5 system prompt (reference)** — transcribed reference of Anthropic's Claude Fable 5 chat-interface system prompt. Used as cross-model reference only; SAGE does not adopt Claude-specific behavior. |
| `04_sonnet5systemprompt.txt` | text | **Claude Sonnet 5 system prompt (reference)** — transcribed reference of Claude Sonnet 5's system prompt. Same cross-model-reference role. |
| `05_actions_openapi.yaml` | application/yaml | **SAGE Action Gateway OpenAPI 3.1 spec** — the REST facade the Custom GPT calls. 17 operations mapping to Tier 1 + Tier 2 of the NEXUS MCP bridge (no task_claim/complete/fail — HERMES-only). Server: ngrok tunnel to the MCP bridge. |
| `06_privacy_policy.md` | text/markdown | **Action Gateway privacy notice** — data processed, purpose, retention, sharing, security, user control. |

## Relationship to this repo (`nexus-a2a-control-plane`)

SAGE and this Ops Board are **two views of the same backend**:

- Both target the **Grok MCP Bridge v2** (port 7354) with the same 22 tools.
- SAGE is the **governance/reasoning view** (runs in ChatGPT/GPT-5.6, calls the
  bridge via the Action Gateway REST facade over ngrok).
- This Ops Board is the **operator mirror view** (runs in this Next.js sandbox,
  polls the bridge directly via `/api/mcp/*`).
- SAGE's lane doctrine (HERMES, ARCHIVIST, Grok, Zo, DeepSeek, ChatGPT/SAGE,
  Codex, Antigravity) is a **governance superset** of this repo's executor lanes
  (qwen_webdev, mimo_claw, gemini, minimax, mistral_code, intern_gpu,
  meta_muse, apodex, glm52). The two registries overlap on Grok/Zo/DeepSeek/ChatGPT.

See `../docs/SAGE_ANALYSIS.md` for the full integration analysis and the staged
plan to reconcile the two registries and bridge the Action Gateway into the Ops
Board.
