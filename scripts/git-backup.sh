#!/usr/bin/env bash
# NEXUS A2A Control Plane — git backup script
#
# Commits any uncommitted work and pushes to the GitHub backup remote.
# Safe to run repeatedly (no-op when the tree is clean).
#
# Usage:
#   bash scripts/git-backup.sh              # auto message
#   bash scripts/git-backup.sh "my message" # custom message
#
# Credentials: git reads ~/.git-credentials (credential.helper=store).
# The token is NEVER stored inside the repo or in tracked files.
#
# Security: runtime/binary/secret files are gitignored (.env, db/*.db,
# .zscripts/dev.pid, data/handoffs.json, .env.local) so they stay local.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# Ensure we are on main (the backup branch).
BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [ "$BRANCH" != "main" ]; then
  echo "[backup] not on main (on $BRANCH) — aborting" >&2
  exit 1
fi

# Stage everything respecting .gitignore.
git add -A

if git diff --cached --quiet; then
  echo "[backup] tree clean — nothing to commit"
else
  MSG="${1:-chore(nexus): periodic backup $(date -u +%Y-%m-%dT%H:%M:%SZ)}"
  git commit -m "$MSG" >/dev/null
  echo "[backup] committed: $MSG"
fi

# Pull any remote changes (merge) then push. Non-destructive.
git pull --no-rebase --no-edit origin main || {
  echo "[backup] pull failed — resolve conflicts then re-run" >&2
  exit 1
}
git push origin main
echo "[backup] pushed to origin/main -> $(git rev-parse --short origin/main)"
