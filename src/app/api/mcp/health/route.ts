import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import { ENV, SAMPLE_MCP_HEALTH_PATH } from "@/lib/paths";
import type { McpHealth } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 10;

// GET /api/mcp/health — probe the Grok MCP Bridge v2 /health endpoint.
// Degrades gracefully: if the bridge is unreachable (sandbox), returns STUB
// with the bundled sample payload so the dashboard still renders.
//
// SSRF note (for DeepSeek review): the target URL is fixed by env
// (NEXUS_MCP_HEALTH_URL), never by request input. Default is the local
// bridge on 127.0.0.1:7354. No user-controlled redirect following.
export async function GET() {
  const checked_at = new Date().toISOString();
  const url = ENV.mcpHealthUrl;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      // Do not follow redirects — the bridge is a fixed local endpoint.
      redirect: "error",
      cache: "no-store",
      headers: { accept: "application/json" },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json(
        await downStub(url, checked_at, `HTTP ${res.status}`),
      );
    }

    let payload: Record<string, unknown> | undefined;
    try {
      payload = (await res.json()) as Record<string, unknown>;
    } catch {
      payload = undefined;
    }

    const health: McpHealth = {
      status: "UP",
      url,
      checked_at,
      payload,
      // FABLE5 fix: the live bridge emits registry_security.registry_schema_hash,
      // NOT payload.registry_hash. Read both for backwards compat.
      registry_hash:
        (payload?.registry_security as Record<string, unknown> | undefined)
          ?.registry_schema_hash as string | undefined ??
        (payload && typeof payload.registry_hash === "string"
          ? (payload.registry_hash as string)
          : undefined),
    };
    return NextResponse.json(health);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(await downStub(url, checked_at, message));
  }
}

// Build a STUB response that includes the sample payload so the UI can still
// render realistic tool/queue data while the bridge is offline.
async function downStub(
  url: string,
  checked_at: string,
  error: string,
): Promise<{ status: "STUB"; url: string; checked_at: string; error: string; payload?: Record<string, unknown>; registry_hash?: string; sample: boolean }> {
  let sample: Record<string, unknown> | undefined;
  let registry_hash: string | undefined;
  try {
    const raw = await fs.readFile(SAMPLE_MCP_HEALTH_PATH, "utf-8");
    sample = JSON.parse(raw) as Record<string, unknown>;
    if (sample && typeof sample.registry_hash === "string") {
      registry_hash = sample.registry_hash;
    }
  } catch {
    sample = undefined;
  }

  return {
    status: "STUB",
    url,
    checked_at,
    error,
    payload: sample,
    registry_hash,
    sample: true,
  };
}
