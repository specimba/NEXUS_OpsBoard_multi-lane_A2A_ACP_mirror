# Lane Doctrine

> Encoded in `src/lib/registry.ts`. The dashboard at `/lanes` renders this.
> Each lane has a **success signal** and a **wait policy** — operators must
> respect these or stall the mesh.

## Doctrine table

| Lane | Role | Success signal | Wait policy |
|------|------|----------------|-------------|
| grok | MCP + synth + Drive work folder coordinator | MCP tools respond; synth artifacts land in Drive work folder | Coordinator — orchestrates others, does not block on chat essays |
| glm52 | This sandbox — NEXUS control-plane runtime | App compiles, boards render, STATE.md advances per milestone | Retries only. Model lock. No model switch / no flash fallback. |
| qwen_webdev | Frontend preview/code/deploy lane | **Preview / Code / Deploy DOM appears** (NOT a chat essay) | **No chat-essay wait** — success = preview DOM, stop waiting for prose |
| qwen_deep | Deep reasoning lane | Structured reasoning output committed | Standard queue wait |
| deepseek | Fast code / review lane | Assistant markdown grows with concrete code/review deltas | Fast code/review — short wait, expect deltas |
| mimo_claw | Red-team / adversarial gate | Daily 4h red-team VERDICT issued | Paranoid gate — do not pass lanes until verdict clears |
| zo | Ubuntu host + NEXUS agents | Resume summary produced after every pause | Resume summary required after pause — **NOT hide-stress** |
| gemini | Canvas + Drive storage bridge | Drive package published / Canvas artifact shared | Storage bridge — async, poll for package |
| chatgpt | Multi-lane browser truth (CDP :9224) | Browser lane responsive under CDP | Standard queue wait |
| minimax | general / coder / verifier team cycles | Team cycle completes with verifier sign-off | Team cycles — rotate general/coder/verifier |
| mistral_code | GitHub + Drive implementation coder | PR opened + Drive artifact committed | Implementation — wait for PR |
| intern_gpu | Shanghai A800 notebook GPU jobs | GPU job completes on A800 notebook | GPU jobs — long wait, poll status |
| meta_muse | Fast HTML examples / tricky collab | HTML example rendered + shared | Tricky collab — short iterative cycles |
| apodex | Auxiliary lane (reserved) | TBD — reserved lane | Unknown — not yet integrated |

## Critical doctrine notes

### Qwen WebDev — success = Preview, not chat
Do **not** wait for a chat essay from `qwen_webdev`. The success signal is the
**Preview / Code / Deploy DOM** appearing. Waiting for prose stalls the mesh.
The dashboard marks this lane `preview_mode` with a dedicated helper note.

### MiMo Claw — paranoid 4h red-team gate
`mimo_claw` runs a **daily 4h red-team cycle** and issues a VERDICT. Lanes must
not pass the gate until the verdict clears. A `blocked` probe status means the
gate is pending.

### Zo — resume summary, not hide-stress
After any pause, `zo` must produce a **resume summary**. This is explicitly
**not** hide-stress behavior — the lane is expected to surface state, not
conceal it.

### GLM-5.2 — model lock
This sandbox runs GLM-5.2 only. On failure: wait, then *"Continue Milestone X
from STATE.md, GLM-5.2 only."* No model switch. No "try flash instead".

## Status values

| Status | Meaning |
|--------|---------|
| `ready` | Lane operational, accepting work. |
| `partial` | Lane up but degraded (slow / queued / constrained). |
| `preview_mode` | Qwen-specific: success measured by preview DOM, not prose. |
| `broken` | Lane not responding; do not route work here. |
| `unknown` | Lane reserved / not yet integrated (e.g. apodex). |

## Hermes constraint

Only **one supervisor** at a time. Enforce `VISIBLE_LANES=1` and run
`keep_visible_daemon` on the Windows host. The control plane is the operator
mirror — it does not itself assume supervisory authority over the mesh.
