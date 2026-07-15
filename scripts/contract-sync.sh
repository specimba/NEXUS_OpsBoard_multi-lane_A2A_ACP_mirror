#!/usr/bin/env bash
# contract:sync — regenerates the MCP tool table from the STATE_PACK.
# Per FABLE5 D3 step 7: tool table regenerated from pack, never hand-authored.
set -euo pipefail
cd "$(dirname "$0")/.."

PACK=""
for f in data/state_pack.json data/test_pack.example.json; do
  if [ -f "$f" ]; then PACK="$f"; break; fi
done

if [ -z "$PACK" ]; then
  echo "[contract:sync] ERROR: no STATE_PACK found" >&2
  exit 1
fi

echo "[contract:sync] reading tools from $PACK"
python3 -c "
import json, sys
pack = json.load(open('$PACK'))
tools = pack.get('mcp', {}).get('tools', [])
if not tools:
    print('[contract:sync] WARNING: no tools in pack', file=sys.stderr)
    sys.exit(0)
print(f'[contract:sync] found {len(tools)} tools')
print()
print('| # | Tool | Group |')
print('|---|------|-------|')
for i, t in enumerate(tools, 1):
    name = t.get('name', '?')
    group = t.get('group', '?')
    print(f'| {i} | \`{name}\` | {group} |')
print()
h = pack.get('mcp', {}).get('registry_schema_hash', '?')
print(f'Registry schema hash: \`{h}\`')
print(f'Tool count: {len(tools)}')
print(f'Source: {pack.get(\"pack_id\", \"?\")} (generated {pack.get(\"generated_at\", \"?\")})')
"
