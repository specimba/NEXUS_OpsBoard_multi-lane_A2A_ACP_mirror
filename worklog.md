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
