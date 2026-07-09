// NEXUS handoff bus — in-memory + file-backed store for HandoffCard.
// Milestone E promotes this to file-backed persistence under data/handoffs.json.
// For now we seed from the sample file and keep an in-process cache that
// survives across hot reloads via a global singleton.

import { promises as fs } from "node:fs";
import { HANDOFF_STORE_PATH, SAMPLE_HANDOFFS_PATH } from "./paths";
import type { HandoffCard, HandoffStatus, LaneId } from "./types";

type GlobalHandoffs = {
  handoffs: HandoffCard[];
  loaded: boolean;
  dirty: boolean;
};

const g = globalThis as unknown as { __nexusHandoffs?: GlobalHandoffs };

function store(): GlobalHandoffs {
  if (!g.__nexusHandoffs) {
    g.__nexusHandoffs = { handoffs: [], loaded: false, dirty: false };
  }
  return g.__nexusHandoffs;
}

async function loadIfEmpty(): Promise<void> {
  const s = store();
  if (s.loaded) return;
  s.loaded = true;

  // Prefer the file-backed store if it exists (Milestone E), else sample seed.
  const candidates = [HANDOFF_STORE_PATH, SAMPLE_HANDOFFS_PATH];
  for (const p of candidates) {
    try {
      const raw = await fs.readFile(p, "utf-8");
      const parsed = JSON.parse(raw) as HandoffCard[];
      if (Array.isArray(parsed)) {
        s.handoffs = parsed;
        return;
      }
    } catch {
      // Try next candidate.
    }
  }
  s.handoffs = [];
}

/** Return all handoffs, newest first. */
export async function listHandoffs(): Promise<HandoffCard[]> {
  await loadIfEmpty();
  return [...store().handoffs].sort((a, b) =>
    b.created_at.localeCompare(a.created_at),
  );
}

/** Return the N most recent handoffs. */
export async function recentHandoffs(limit = 5): Promise<HandoffCard[]> {
  const all = await listHandoffs();
  return all.slice(0, limit);
}

/** Create a new handoff card. */
export async function addHandoff(input: {
  from: LaneId;
  to: LaneId;
  token: string;
  summary: string;
  artifacts?: string[];
  status?: HandoffStatus;
  mcp_evidence_ref?: string;
  budget?: string;
}): Promise<HandoffCard> {
  await loadIfEmpty();
  const s = store();
  const card: HandoffCard = {
    id: `hof_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    from: input.from,
    to: input.to,
    token: input.token,
    summary: input.summary,
    artifacts: input.artifacts ?? [],
    status: input.status ?? "open",
    created_at: new Date().toISOString(),
    mcp_evidence_ref: input.mcp_evidence_ref,
    budget: input.budget,
  };
  s.handoffs.push(card);
  s.dirty = true;
  await persist();
  return card;
}

/** Update a handoff's status by id. */
export async function setHandoffStatus(
  id: string,
  status: HandoffStatus,
): Promise<HandoffCard | null> {
  await loadIfEmpty();
  const s = store();
  const card = s.handoffs.find((h) => h.id === id);
  if (!card) return null;
  card.status = status;
  s.dirty = true;
  await persist();
  return card;
}

/** Persist the in-memory store to data/handoffs.json (Milestone E). */
async function persist(): Promise<void> {
  const s = store();
  if (!s.dirty) return;
  try {
    await fs.writeFile(
      HANDOFF_STORE_PATH,
      JSON.stringify(s.handoffs, null, 2),
      "utf-8",
    );
    s.dirty = false;
  } catch {
    // Non-fatal: in-memory store still serves reads.
  }
}
