import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import { StatePack, sweepPack, invalidatePackCache, STATE_PACK_PATH } from "@/lib/statePack";

export const dynamic = "force-dynamic";
export const maxDuration = 10;

// GET /api/import — returns the import instructions (no auth in sandbox; host-mode adds shared-secret).
export async function GET() {
  return NextResponse.json({
    endpoint: "POST /api/import",
    method: "POST",
    content_type: "application/json",
    max_size_bytes: 1_572_864, // 1.5 MiB per FABLE5 D3 step 2
    sweep: "Tier A credential-prefix regexes (ghp_, github_pat_, sk-, hf_, fish_, ak_, Bearer, xox, AKIA, PEM, browserless customer-id). Fail-closed (422) on any hit.",
    schema: "STATE_PACK v1.0.0 — see src/lib/statePack.ts StatePack zod schema",
    note: "Per FABLE5 D5 RL-4: sweep gate fail-closed, no in-lane override. Per D-016: no NEXUS secret may enter the sandbox surface.",
  });
}

// POST /api/import — accepts a STATE_PACK JSON body, sweeps for credentials,
// validates against the zod schema, writes to data/state_pack.json.
// Per FABLE5 D3 step 2: 1.5 MB cap, sandbox-side credential-sweep → 422 on hit.
export async function POST(request: Request) {
  // Size cap (1.5 MiB)
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 1_572_864) {
    return NextResponse.json(
      { error: "PAYLOAD_TOO_LARGE", max_size: 1572864 },
      { status: 413 },
    );
  }

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  if (raw.length > 1_572_864) {
    return NextResponse.json(
      { error: "PAYLOAD_TOO_LARGE", max_size: 1572864 },
      { status: 413 },
    );
  }

  // Credential sweep (fail-closed)
  const sweep = sweepPack(raw);
  if (!sweep.clean) {
    return NextResponse.json(
      {
        error: "CREDENTIAL_DETECTED",
        message: "Pack rejected: credential-shaped string found. Per D-016/RL-4, no NEXUS secret may enter the sandbox.",
        hits: sweep.hits.map((h) => ({ label: h.label, sha8: h.sha8 })),
      },
      { status: 422 },
    );
  }

  // Parse JSON
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  // Validate against zod schema
  const result = StatePack.safeParse(parsed);
  if (!result.success) {
    return NextResponse.json(
      {
        error: "SCHEMA_INVALID",
        issues: result.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 422 },
    );
  }

  // Write to data/state_pack.json
  try {
    await fs.writeFile(STATE_PACK_PATH, JSON.stringify(result.data, null, 2), "utf-8");
    invalidatePackCache();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "WRITE_FAILED", message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    pack_id: result.data.pack_id,
    generated_at: result.data.generated_at,
    source: "pack",
    message: "STATE_PACK imported successfully. Cache invalidated. Panels will refresh on next poll.",
  });
}
