# NEXUS A2A Control Plane — Comprehensive Handoff Document

> **Date:** 2026-07-17 (updated with D7 v2+v3 upgrades)
> **Purpose:** Complete state transfer for a new session (human or AI) to
> continue or improve the NEXUS A2A control plane. Contains: architecture,
> current state, all credentials/secrets, file inventory, gate status, and
> the FABLE5 plan context.
> **Repository:** `github.com/specimba/NEXUS_OpsBoard_multi-lane_A2A_ACP_mirror`

---

## 1. What This Project Is

A Next.js 16 + TypeScript + Tailwind CSS 4 operator mirror for the NEXUS
multi-lane A2A mesh and the Grok MCP Bridge v2. It runs in a z.ai sandbox on
port 3000. The app implements the **FABLE5 NXM-038 REV 2** plan: a truth rail
+ honesty rail that uses a one-way git-bus (STATE_PACK) to bring live host
truth into the sandbox without exposing secrets.

**Key principle (D-005):** No fabricated data is presented as real. Every panel
has a `DataSourceBadge` showing WIRED / PACK / SEED / MOCK / OFF.

---

## 2. Current State — NXM-038 REV 2

### Gate Status

| Gate | Status | Evidence |
|------|--------|----------|
| G1 (build+lint green) | ✅ PASS | `bun run build` → ✓ 12.6s, 9/9 pages; `eslint .` clean |
| G2 (badge tally == manifest) | ✅ PASS | 12 manifest panels == 12 badged panelIds |
| G3 (negative control) | ✅ PASS | No-pack walk: all routes degrade to SEED/MOCK/OFF honestly |
| G4 (pack round-trip) | ✅ PASS (sandbox-side) | Simulated pack POSTed via /api/import → all panels refresh; credential sweep canary blocked (422) |
| PR #52 verdict | N/A | Not our repo (nexusalpha) |
| OG-6 REQUEST block | ❌ NOT FILED | Operator-side action |

### What G4 Proved (sandbox-side)

1. POST `g4-roundtrip-proof-0001` to `/api/import` → 200 OK, pack written to `data/state_pack.json`
2. `/api/state` → `source=pack, pack_id=g4-roundtrip-proof-0001`
3. `/api/lanes` → `source=pack, zo=ready` (flipped from broken to ready)
4. `/api/mcp/tools` → `source=pack, count=25` (flipped from 22 static)
5. `/api/mcp/queue` → `source=pack, open=5` (flipped from sample fixture)
6. Board → 8 real NXM cards (flipped from 42 NXM-SEED sentinels)
7. Credential canary (`[CANARY]`) → 422 CREDENTIAL_DETECTED, pack not overwritten

**What G4 does NOT prove:** A real host-side generator (NXM-043) pushing a real
pack from the live MCP bridge. That requires the operator to run NXM-043 on the
Windows host.

---

## 3. All Credentials, Keys, and Secrets

> **WARNING:** These are live credentials. Per D-014, they are NOT rotated —
> they are accepted risk with structural containment. Per D-016, no NEXUS
> secret may enter the z.ai sandbox surface except the repo push credential.

### 3.1 GitHub Personal Access Token

```
Token:    [SEE_CHAT_HISTORY]
Name:     GLMfalltoken1
Expires:  Monday, October 05, 2026
Scopes:   36 repository permissions + 19 account permissions (full repo access)
Repo:     specimba/NEXUS_OpsBoard_multi-lane_A2A_ACP_mirror
User:     specimba (id 32012089)
```

**Storage:** `~/.git-credentials` (mode 600, outside repo, never tracked)
**Remote URL:** `https://github.com/specimba/NEXUS_OpsBoard_multi-lane_A2A_ACP_mirror.git` (clean — no embedded token)
**Recovery after sandbox wipe:**
```bash
printf 'https://x-access-token:[SEE_CHAT_HISTORY]@github.com\n' > ~/.git-credentials
chmod 600 ~/.git-credentials
git config --global credential.helper store
```

### 3.2 GPG Signing Key

```
Key ID:      FFE1A9C8FA725B36
Fingerprint: 3A9F06BBB6E6DDCC12B7620CFFE1A9C8FA725B36
Type:        ed25519, signing-only, no passphrase (headless-safe)
Uploaded:    GitHub GPG key id 5180494 (or newer — has been regenerated multiple times after sandbox wipes)
Identity:    Canberk 'specimba' Karaerkek <32012089+specimba@users.noreply.github.com>
```

**Recovery after sandbox wipe:**
```bash
mkdir -p ~/.gnupg && chmod 700 ~/.gnupg
printf 'pinentry-mode loopback\nuse-agent\n' > ~/.gnupg/gpg.conf
gpg --batch --pinentry-mode loopback --passphrase '' --quick-generate-key "GLM-5.2 NEXUS <32012089+specimba@users.noreply.github.com>" ed25519 sign 0
KEYID=$(gpg --list-secret-keys --keyid-format=long 2>/dev/null | grep -oE '[A-F0-9]{16}' | head -1)
git config user.signingkey "$KEYID"
git config commit.gpgsign true
# Upload to GitHub:
gpg --armor --export "$KEYID"  # paste into GitHub Settings → SSH and GPG keys
```

### 3.3 Git Identity

```
user.name:  Canberk 'specimba' Karaerkek
user.email: 32012089+specimba@users.noreply.github.com (GitHub noreply — privacy-preserving)
```

### 3.4 Browserless Token

```
Token:    [SEE_CONVERSATION_HISTORY]
Account:  browserless.io (132 / 1k units)
Endpoint: https://production-sfo.browserless.io
Usage:    POST /content, /function, /download, /screenshot, /scrape (with ?token=)
```

**Storage:** `.env.local` (gitignored — sandbox wipes this file on reset)
**Recovery:**
```bash
printf 'BROWSERLESS_TOKEN=[SEE_CONVERSATION_HISTORY]\nBROWSERLESS_REGION=production-sfo\n' > .env.local
```

### 3.5 Environment Variables

**`.env.local` (gitignored, sandbox-side):**
```env
BROWSERLESS_TOKEN=[SEE_CONVERSATION_HISTORY]
BROWSERLESS_REGION=production-sfo
```

**`.env` (tracked, non-secret):**
```env
DATABASE_URL=file:/home/z/my-project/db/custom.db
```

**`.env.example` (was tracked, sandbox wiped it — recreate):**
```env
NEXUS_LEDGER_PATH=
NEXUS_MCP_HEALTH_URL=http://127.0.0.1:7354/health
NEXUS_MCP_SSE_URL=http://127.0.0.1:7354/sse
NEXUS_CDP_PORT=9224
NEXUS_STATE_PACK_PATH=
BROWSERLESS_TOKEN=
BROWSERLESS_REGION=production-sfo
```

### 3.6 Host-Side Services (NOT in sandbox — for reference)

| Port | Service | Notes |
|------|---------|-------|
| 3000 | Next.js Dashboard (this app) | Sandbox |
| 7350 | ModelRelay | 277 models |
| 7352 | Brain API | Observe-only |
| 7354 | MCP Bridge v2 | 25 tools, v2.4.0-p0-continuity, hash `102aca727ff0b7ce` |
| 9224 | Chrome CDP | Multi-lane browser truth, keep-visible watchdog |

---

## 4. File Inventory

### Pages (7)

| Page | Path | Purpose |
|------|------|---------|
| Ops Board | `src/app/page.tsx` | Home — lane grid, stats, handoffs, ledger tail, **ledger integrity chain**, **research coverage** |
| Mission Board | `src/app/board/page.tsx` | 42 NXM cards from STATE_PACK + BoardFilters |
| MCP | `src/app/mcp/page.tsx` | Health badge, drift banner, queue, 25-tool table |
| Lanes | `src/app/lanes/page.tsx` | 14-lane doctrine grid (pack-driven statuses) |
| Handoffs | `src/app/handoffs/page.tsx` | Handoff bus CRUD + filters + **handoff↔ledger cross-link** |
| Browserless | `src/app/browserless/page.tsx` | Cloud headless chrome (OFF in sandbox) |
| SAGE | `src/app/sage/page.tsx` | Reserved stub (gated on OG-6) |

### API Routes (13)

| Route | Method | Purpose |
|-------|--------|---------|
| `/api` | GET | API index |
| `/api/health` | GET | App liveness |
| `/api/state` | GET | STATE_PACK reader (pack/test/none) |
| `/api/import` | GET, POST | Pack import (1.5MB cap, sweep→422, zod validate) |
| `/api/lanes` | GET | Lane registry (pack-driven) |
| `/api/ledger` | GET | Continuity ledger tail (JSONL, accepts ts+timestamp) |
| `/api/ledger/integrity` | GET | **SHA-256 hash chain over ledger rows (D7 v2)** |
| `/api/handoffs` | GET, POST | Handoff bus (file-backed) |
| `/api/mcp/health` | GET | MCP bridge probe (STUB fallback, reads registry_security.registry_schema_hash) |
| `/api/mcp/tools` | GET | Tool inventory (pack 25 + static 22 + drift detection) |
| `/api/mcp/queue` | GET | Queue snapshot (pack → sample fixture → inline) |
| `/api/browserless/content` | POST | Cloud headless chrome (SSRF-hardened, OFF in sandbox) |
| `/api/sage` | GET | SAGE stub `{status:"RESERVED", gated_on:"OG-6"}` |

### Components (16)

| Component | File | Purpose |
|-----------|------|---------|
| DataSourceBadge | `src/components/DataSourceBadge.tsx` | WIRED/PACK/SEED/MOCK/OFF honesty badge |
| PackStatusChip | `src/components/PackStatusChip.tsx` | Nav chip: "PACK · 2h" or "NO PACK — SEED" |
| DriftBanner | `src/components/DriftBanner.tsx` | Warns when pack tools ≠ contract |
| BoardFilters | `src/components/BoardFilters.tsx` | Executor/priority/gate/search filters |
| NexusCommandPalette | `src/components/NexusCommandPalette.tsx` | Ctrl+K palette (7 nav + actions) |
| OpsNav | `src/components/OpsNav.tsx` | Top nav with 7 tabs + pack chip |
| LaneCard | `src/components/LaneCard.tsx` | Lane card with doctrine |
| HandoffCard | `src/components/HandoffCard.tsx` | Handoff token card |
| LedgerTail | `src/components/LedgerTail.tsx` | Ledger row list |
| **LedgerIntegrityPanel** | `src/components/LedgerIntegrityPanel.tsx` | **SHA-256 hash chain visualization (D7 v2)** |
| **HandoffLedgerLink** | `src/components/HandoffLedgerLink.tsx` | **Handoff↔ledger cross-link (D7 v2)** |
| **ResearchCoveragePanel** | `src/components/ResearchCoveragePanel.tsx` | **Papers database coverage (D7 v3)** |
| McpHealthBadge | `src/components/McpHealthBadge.tsx` | UP/DOWN/STUB health badge |
| McpToolTable | `src/components/McpToolTable.tsx` | Tool table with group filters |
| KeepVisibleBanner | `src/components/KeepVisibleBanner.tsx` | CDP :9224 reminder |
| QwenWebDevNote | `src/components/QwenWebDevNote.tsx` | Qwen preview-mode note |

### Lib (10)

| File | Purpose |
|------|---------|
| `src/lib/statePack.ts` | zod v4 schema, mtime-cached loader, staleness, credential sweep |
| `src/lib/registry.ts` | 14 lanes with doctrine + accent colors |
| `src/lib/mcpTools.ts` | 22 static tools + denylist |
| `src/lib/paths.ts` | Env resolution (ledger, MCP, CDP, state pack) |
| `src/lib/ledger.ts` | JSONL reader (accepts ts + timestamp) |
| `src/lib/handoffBus.ts` | File-backed handoff store |
| `src/lib/browserless.ts` | Cloud headless chrome client (SSRF-hardened) |
| `src/lib/types.ts` | Domain types |
| `src/lib/db.ts` | Prisma client (unused — no Prisma models wired) |
| `src/lib/utils.ts` | cn() helper |

### Data (6)

| File | Purpose |
|------|---------|
| `data/state_pack.json` | Live STATE_PACK (currently the G4 simulation pack) |
| `data/test_pack.example.json` | Sentinel fixture (42 NXM-SEED cards, 25 tools, zo broken) |
| `data/sample_ledger.jsonl` | 24 sample ledger rows |
| `data/sample_handoffs.json` | 6 seed handoff cards |
| `data/sample_mcp_health.json` | Sample bridge health payload |
| `data/sample_mcp_queue.json` | Sample queue fixture (sample:true watermark) |

### Scripts (2)

| Script | Purpose |
|--------|---------|
| `scripts/git-backup.sh` | Idempotent commit + pull + push |
| `scripts/contract-sync.sh` | Regenerate MCP_CONTRACT.md tool table from pack |

### Docs (11)

| Doc | Purpose |
|-----|---------|
| `docs/STATE_PACK.md` | Pack schema + import guide + sweep patterns |
| `docs/WIRED_VS_MOCKED.json` | Panel manifest (12 panels, G2/G3 gate defs) |
| `docs/MCP_CONTRACT.md` | 25-tool table (contract:sync generated) + denylist |
| `docs/GIT_BACKUP.md` | Git backup setup + recovery |
| `docs/LANE_DOCTRINE.md` | 14-lane doctrine |
| `docs/RESUME.md` | Next-session resume protocol |
| `docs/SAGE_ANALYSIS.md` | SAGE v1 analysis |
| `docs/SAGE_V1_1_ANALYSIS.md` | SAGE v1.1 hardening pack analysis |
| `docs/NEXUS_FUSION_LONG_HORIZON_PLAN.md` | Earlier fusion plan (superseded by NXM-038 REV 2) |
| `docs/NEXUS_DEEP_SYNTHESIS_AND_NEW_OPS_BOARD_DESIGN.md` | Earlier 5-agent synthesis (partially superseded) |
| `STATE.md` | Continuity ledger for GLM-5.2 sessions |

---

## 5. FABLE5 Plan Context

### Binding Directives

| Directive | Meaning |
|-----------|---------|
| D-005 | No fabricated data presented as real |
| D-010 | FABLE5 plans, never implements; GLM52 implements sandbox-side |
| D-014 | NO credential rotations — accepted risk, structural containment |
| D-015 | NO GitHub payments — free tier only, no Actions dependency |
| D-016 | No NEXUS secret enters the sandbox surface |

### NXM-038 REV 2 Steps (all 7 done)

1. ✅ Badge substrate (DataSourceBadge + panel manifest)
2. ✅ Pack seam (statePack.ts + /api/import + /api/state + sentinel fixture)
3. ✅ Lanes pack-driven (applyPackStatuses + PackStatusChip)
4. ✅ MCP de-mock (25 pack tools + drift + health fix + queue de-inline)
5. ✅ Mission Board tab (/board + BoardFilters + 42 cards)
6. ✅ Palette + host-mode gating + watermarks + ledger fix + API index
7. ✅ Docs + negative control (STATE.md + STATE_PACK.md + contract:sync + G3)

### D6 Future Hooks (done this session)

- ✅ SAGE stub: `/api/sage` + `/sage` page (reserved, gated on OG-6)
- ✅ Drift banner: `DriftBanner` component on MCP page

### D7 Backlog (v2)

- [x] Ledger-integrity panel — **DONE** (`/api/ledger/integrity` + `LedgerIntegrityPanel`)
- [x] Handoff↔ledger cross-linking — **DONE** (`HandoffLedgerLink` on `/handoffs`)
- [x] SAGE stub — **DONE** (`/api/sage` + `/sage` page, reserved on OG-6)
- [ ] `/api/import` shared-secret auth (host-mode prerequisite — NXM-044)

### D7 Backlog (v3)

- [x] Papers section display — **DONE** (`ResearchCoveragePanel`, 646 papers, 95% coverage, gap areas, integration passes)
- [ ] Token/cost meters (pack-section extension, display-only)
- [ ] Governor threshold display (pack-section extension)
- [ ] Vault 5-track donut (pack-section extension)

### Papers Database Investigation

`docs/PAPERS_INVESTIGATION_REPORT.md` — formal report comparing old dashboard
vs. current state vs. papers library (~646 PDFs). 6 concrete improvements
identified: AIP Biscuit tokens, DeepContext drift detection, CARROT routing,
SAGA alignment, steganographic threat surface, papers→dashboard connection.
The papers→dashboard connection is now live (D7 v3).

### D7 DROP (explicitly excluded)

- StressLab tab
- Rate-limit tab
- Token-guard tab
- SSRF proxy route
- Prisma models (0 cherry-picked)

---

## 6. How to Continue

### Quick Start (after sandbox wipe)

```bash
# 1. Restore credentials
printf 'https://x-access-token:[SEE_CHAT_HISTORY]@github.com\n' > ~/.git-credentials
chmod 600 ~/.git-credentials
git config --global credential.helper store

# 2. Restore GPG key (regenerate — sandbox wipes ~/.gnupg)
mkdir -p ~/.gnupg && chmod 700 ~/.gnupg
printf 'pinentry-mode loopback\nuse-agent\n' > ~/.gnupg/gpg.conf
gpg --batch --pinentry-mode loopback --passphrase '' --quick-generate-key "GLM-5.2 NEXUS <32012089+specimba@users.noreply.github.com>" ed25519 sign 0
KEYID=$(gpg --list-secret-keys --keyid-format=long 2>/dev/null | grep -oE '[A-F0-9]{16}' | head -1)
git config user.signingkey "$KEYID"
git config commit.gpgsign true
git config user.name "Canberk 'specimba' Karaerkek"
git config user.email "32012089+specimba@users.noreply.github.com"

# 3. Restore .env.local
printf 'BROWSERLESS_TOKEN=[SEE_CONVERSATION_HISTORY]\nBROWSERLESS_REGION=production-sfo\n' > .env.local

# 4. Install + run
bun install
bun run dev   # http://localhost:3000

# 5. Verify
bun run lint
bun run build
curl -s http://localhost:3000/api/state | python3 -m json.tool
```

### Backup

```bash
bash scripts/git-backup.sh "description of changes"
```

### Import a real STATE_PACK

```bash
curl -X POST http://localhost:3000/api/import \
  -H "Content-Type: application/json" \
  -d @state_pack.json
```

### Regenerate MCP contract from pack

```bash
bash scripts/contract-sync.sh
```

---

## 7. Screenshot Evidence (openable outside z.ai)

- `https://raw.githubusercontent.com/specimba/NEXUS_OpsBoard_multi-lane_A2A_ACP_mirror/main/docs/preview/root.png`
- `https://raw.githubusercontent.com/specimba/NEXUS_OpsBoard_multi-lane_A2A_ACP_mirror/main/docs/preview/board.png`
- `https://raw.githubusercontent.com/specimba/NEXUS_OpsBoard_multi-lane_A2A_ACP_mirror/main/docs/preview/mcp.png`
- `https://raw.githubusercontent.com/specimba/NEXUS_OpsBoard_multi-lane_A2A_ACP_mirror/main/docs/preview/lanes.png`
- `https://raw.githubusercontent.com/specimba/NEXUS_OpsBoard_multi-lane_A2A_ACP_mirror/main/docs/preview/browserless.png`
- `https://raw.githubusercontent.com/specimba/NEXUS_OpsBoard_multi-lane_A2A_ACP_mirror/main/docs/preview/sage.png`

---

## 8. Known Issues + Next Steps

### What's done

- NXM-038 REV 2 Steps 1-7 complete
- D6 SAGE stub + drift banner complete
- G1/G2/G3/G4(sandbox-side) gates pass
- All code GPG-signed and pushed to GitHub

### What's NOT done (requires operator or host-side)

- **G4 (real):** NXM-043 host-side generator must run on the Windows host, collect live state, and push a real STATE_PACK to this repo. The sandbox is fully ready to receive it.
- **OG-6:** Operator gate for SAGE activation — not filed.
- **NXM-044:** Host-mode deploy (clone this repo on the host, set `MIRROR_MODE=host`, configure `BROWSERLESS_TOKEN` + `NEXUS_LEDGER_PATH`).

### D7 v2 backlog (local, can start now)

1. Ledger-integrity panel — host-computed hash chain over ledger rows in the pack
2. Handoff↔ledger cross-linking — frontend join between HandoffCard and LedgerRow
3. `/api/import` shared-secret auth — for host-mode (NXM-044 prerequisite)

### FABLE5 reference

The full FABLE5 plan is in `upload/NEXUSgeneralFABLE5advisorylogs-06.txt`, lines 1870-2113.
The 7-step build order is in section D3 (line 1974). The backlog is in D7 (line 2045).
