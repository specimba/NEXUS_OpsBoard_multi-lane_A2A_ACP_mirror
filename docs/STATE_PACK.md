# STATE_PACK v1 — Schema + Import Guide

> NXM-038 REV 2 Step 7. The STATE_PACK is the one-way git-bus truth channel
> between the host (live NEXUS systems) and the sandbox (this control plane).

## What the STATE_PACK is

The host-side generator (NXM-043, not yet built) collects live state from:
- `NEXUScontinuity_runs.jsonl` (ledger tail, read-only)
- `GET http://127.0.0.1:7354/health` (MCP bridge)
- Master doc board parse (42 NXM cards)
- Ports doctor (3000, 7352, 7354, 9224)

It assembles a `STATE_PACK.json`, runs a redaction sweep (fail-closed on any
credential-shaped string), and commits it to this repo. The sandbox pulls and
every panel reads from `data/state_pack.json` via `/api/state`.

## Schema (zod v4, `src/lib/statePack.ts`)

```typescript
StatePack = {
  pack_id: string              // unique pack identifier
  generated_at: string         // ISO UTC timestamp
  ttl_hours: number            // staleness threshold (default 24)
  generator: string?           // generator name
  master_doc_sha: string?      // first 12 chars of master doc sha256
  sweep_proof: {               // redaction sweep result
    ran: boolean
    blocks: number?
    canary_blocked: boolean?
  }?
  pack_schema: string          // "1.0.0"

  // Sections (absent ⇒ UI renders labeled STUB)
  lanes: [{ id, status, evidence?, class?, checked_at? }]?
  mcp: {
    status, version, tool_count,
    registry_schema_hash,
    tools: [{ name, schema_hash?, group? }]?,
    queue: { open, claimed, completed, failed, items? }?
  }?
  ledger_tail: [{ ts?, timestamp?, kind?, lane?, status?, cycle?, ... }]?
  board: { cards: [{ id, title?, executor?, priority?, status?, gate?, rev? }]? }?
  ports_doctor: [{ port, service?, status?, note? }]?
  host_metrics?: unknown
  handoffs?: unknown
}
```

## Import methods

### T1 — Git-bus (primary, production)

1. Host generator (NXM-043) writes `data/state_pack.json` + commits + pushes
2. Sandbox: `git pull` (code + truth together)
3. Pack cache auto-invalidates on mtime change; panels refresh on next poll

### T2 — Structured upload (fallback)

```bash
curl -X POST http://localhost:3000/api/import \
  -H "Content-Type: application/json" \
  -d @state_pack.json
```

- Max size: 1.5 MiB (1,572,864 bytes)
- Credential sweep: 10 pattern classes (ghp_, github_pat_, sk-, hf_, fish_, ak_,
  Bearer, xox, AKIA, PEM, browserless customer-id). Any hit → 422 fail-closed.
- Zod schema validation: invalid → 422
- Success: writes `data/state_pack.json`, invalidates cache

### T3 — Trimmed chat-paste (emergency, ≤8 KB)

Paste the pack JSON into the conversation. Only for emergency updates when
git-bus and upload are both unavailable. Raw host-log uploads are FORBIDDEN
(D-016).

## Credential sweep

The sweep runs on the serialized pack bytes. It checks for:

| Pattern | Label |
|---------|-------|
| `ghp_[A-Za-z0-9]{20,}` | GitHub PAT (ghp_) |
| `github_pat_[A-Za-z0-9_]{20,}` | GitHub PAT (github_pat_) |
| `sk-[A-Za-z0-9]{20,}` | OpenAI-style key |
| `hf_[A-Za-z0-9]{20,}` | HuggingFace token |
| `fish_[A-Za-z0-9]{20,}` | Sakana key |
| `ak_[A-Za-z0-9]{20,}` | LongCat key |
| `Bearer\s+[A-Za-z0-9._-]{20,}` | Bearer token |
| `xox[bap]-[A-Za-z0-9-]{10,}` | Slack token |
| `AKIA[A-Z0-9]{12,}` | AWS key |
| `-----BEGIN [A-Z ]*PRIVATE KEY-----` | PEM private key |
| `customer-id[A-Za-z0-9_-]{10,}` | Browserless customer-id |

Any hit = exit 422, pack does not ship. Only a redacted hit report (class,
sha256[:8]) is returned. Per FABLE5 D5 RL-4: sweep gate fail-closed, no in-lane
override.

## Sentinel fixture

`data/test_pack.example.json` is a TEST FIXTURE (not live data). It contains:
- 42 NXM-SEED-* cards (watermarked)
- 25 MCP tools (the live bridge count)
- Lane `zo` status `broken` (the ngrok 421 defect)
- `registry_schema_hash: "102aca727ff0b7ce"`

It loads automatically when no real pack exists. The PackStatusChip shows
"TEST · just now" (blue) to distinguish it from a live pack ("PACK · 2h", cyan).

## FABLE5 directives (binding)

- **D-005**: No fabricated data presented as real — DataSourceBadge on every panel
- **D-014**: No credential rotations — accepted risk, structural containment
- **D-015**: No GitHub payments — free tier only, no Actions dependency
- **D-016**: No NEXUS secret enters the sandbox surface — sweep gate fail-closed
