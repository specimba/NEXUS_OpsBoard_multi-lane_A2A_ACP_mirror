import { NextResponse } from "next/server";
import { MCP_TOOLS, MCP_DENYLIST, toolCountsByGroup, MCP_TOOL_COUNT } from "@/lib/mcpTools";
import { loadPack } from "@/lib/statePack";
import type { McpToolInfo } from "@/lib/types";

export const dynamic = "force-dynamic";

// GET /api/mcp/tools — tool inventory.
// Per FABLE5 D3 step 4: prefers pack.mcp.tools (25 live) with static-22 fallback + visible drift note.
export async function GET() {
  const pack = await loadPack();
  const packMcp = pack.data?.mcp;

  if (packMcp?.tools && packMcp.tools.length > 0) {
    // Pack has live tool list — merge with static for descriptions
    const staticMap = new Map(MCP_TOOLS.map((t) => [t.name, t]));
    const merged: McpToolInfo[] = packMcp.tools.map((pt) => {
      const staticEntry = staticMap.get(pt.name);
      return {
        name: pt.name,
        group: (pt.group as McpToolInfo["group"]) ?? staticEntry?.group ?? "connectivity",
        description: staticEntry?.description ?? `(pack-only, no static description) live tool added in v2.4.0-p0-continuity`,
        risk: staticEntry?.risk ?? "low",
      };
    });

    // Drift detection
    const staticNames = new Set(MCP_TOOLS.map((t) => t.name));
    const packNames = new Set(packMcp.tools.map((t) => t.name));
    const added = [...packNames].filter((n) => !staticNames.has(n));
    const removed = [...staticNames].filter((n) => !packNames.has(n));

    return NextResponse.json({
      count: merged.length,
      source: "pack",
      pack_tool_count: packMcp.tool_count,
      static_tool_count: MCP_TOOL_COUNT,
      drift: {
        added: added, // e.g. continuity_append, continuity_tail, cdp_window_probe
        removed: removed,
        note: added.length > 0 || removed.length > 0
          ? `Drift detected: ${added.length} added, ${removed.length} removed vs static baseline`
          : "No drift — pack matches static baseline",
      },
      groups: merged.reduce((acc, t) => {
        acc[t.group] = (acc[t.group] ?? 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      tools: merged,
      denylist: MCP_DENYLIST,
      registry_schema_hash: packMcp.registry_schema_hash,
      server_time: new Date().toISOString(),
    });
  }

  // Fallback: static 22-tool inventory
  return NextResponse.json({
    count: MCP_TOOL_COUNT,
    source: "seed",
    groups: toolCountsByGroup(),
    tools: MCP_TOOLS,
    denylist: MCP_DENYLIST,
    drift: {
      added: [],
      removed: [],
      note: "No pack loaded — showing static 22-tool baseline. Live bridge has 25 tools (drift = continuity_append, continuity_tail, cdp_window_probe).",
    },
    server_time: new Date().toISOString(),
  });
}
