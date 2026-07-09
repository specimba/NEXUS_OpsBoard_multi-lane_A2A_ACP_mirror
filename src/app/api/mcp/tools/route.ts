import { NextResponse } from "next/server";
import { MCP_TOOLS, MCP_DENYLIST, toolCountsByGroup, MCP_TOOL_COUNT } from "@/lib/mcpTools";

export const dynamic = "force-dynamic";

// GET /api/mcp/tools — static tool inventory (always available, even in STUB).
export async function GET() {
  return NextResponse.json({
    count: MCP_TOOL_COUNT,
    groups: toolCountsByGroup(),
    tools: MCP_TOOLS,
    denylist: MCP_DENYLIST,
    server_time: new Date().toISOString(),
  });
}
