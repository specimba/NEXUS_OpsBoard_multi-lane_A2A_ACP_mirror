# Git Backup & Version Control

The NEXUS A2A Control Plane is backed up to a GitHub repo to survive sandbox
wipes. This documents the setup, the backup workflow, and commit signing.

## Remote

- **Repo:** `specimba/NEXUS_OpsBoard_multi-lane_A2A_ACP_mirror`
- **Branch:** `main`
- **URL:** `https://github.com/specimba/NEXUS_OpsBoard_multi-lane_A2A_ACP_mirror`

## Authentication

- Git credential helper: `store` (writes to `~/.git-credentials`, mode `0600`).
- The **token is never stored inside the repo** or in any tracked file.
- The remote URL is clean (no embedded token):
  `https://github.com/specimba/...git`
- A fresh sandbox session must re-add the credential before pushing:
  ```bash
  printf 'https://x-access-token:<TOKEN>@github.com\n' > ~/.git-credentials
  chmod 600 ~/.git-credentials
  git config --global credential.helper store
  ```

## Commit identity

- `user.name`: `Canberk 'specimba' Karaerkek`
- `user.email`: `32012089+specimba@users.noreply.github.com` (GitHub noreply,
  privacy-preserving, links commits to the `specimba` account)

## Commit signing (GPG)

All commits are GPG-signed and show as **Verified** on GitHub.

- Key type: `ed25519`, signing-only, no passphrase, no expiry (headless-safe).
- Key ID: `8D8015A4E4C4AF93`
- Fingerprint: `C9F613A0F088BE4E5CD8FDD48D8015A4E4C4AF93`
- Uploaded to GitHub as GPG key id `5177423`.
- `~/.gnupg/gpg.conf` sets `pinentry-mode loopback` so signing works headless.

Git config:
```
user.signingkey = 8D8015A4E4C4AF93
commit.gpgsign  = true
gpg.program      = /usr/bin/gpg
```

> The private key lives only in `~/.gnupg` on this sandbox. If the sandbox is
> wiped, a new key must be generated and re-uploaded — but the **commit
> history survives on GitHub**, which is the point of the backup.

## What is NOT committed (gitignored)

Runtime/binary/secret files stay local — fresh clones start clean:

| Path | Reason |
|------|--------|
| `.env`, `.env.local` | environment / secrets |
| `db/*.db`, `db/*.db-journal` | SQLite binary |
| `.zscripts/dev.pid` | runtime pid |
| `data/handoffs.json` | runtime-mutated state (seed is `data/sample_handoffs.json`) |
| `node_modules/`, `.next/`, `*.log` | build artifacts / logs |

## Ongoing backup workflow

Use the backup script after each milestone or significant change:

```bash
bash scripts/git-backup.sh                    # auto message
bash scripts/git-backup.sh "feat: add SSE page"  # custom message
```

The script is idempotent: it commits only if the tree is dirty, pulls remote
changes (merge, non-destructive), then pushes.

## Recovering after a sandbox wipe

1. Clone the repo: `git clone https://github.com/specimba/NEXUS_OpsBoard_multi-lane_A2A_ACP_mirror.git`
2. `bun install`
3. Re-create `.env.local` from `.env.example` (set `NEXUS_LEDGER_PATH` etc.).
4. Re-add git credentials (see Authentication above) if you need to push.
5. `bun run dev` — the app runs from the committed source + sample data.

The continuity ledger (`STATE.md`, `worklog.md`, `docs/RESUME.md`) is committed,
so a new GLM-5.2 session can resume exactly where the last one left off.
