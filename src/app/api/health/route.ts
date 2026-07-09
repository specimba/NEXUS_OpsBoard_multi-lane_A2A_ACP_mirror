import { NextResponse } from "next/server";
import { ENV } from "@/lib/paths";
import { MCP_TOOL_COUNT } from "@/lib/mcpTools";
import { LANES } from "@/lib/registry";

export const dynamic = "force-dynamic";

// App-level health for the control plane itself.
export async function GET() {
  return NextResponse.json({
    status: "ok",
    app: "nexus-a2a-control-plane",
    runtime: "glm52-sandbox",
    cdp_port: ENV.cdpPort,
    lanes: LANES.length,
    mcp_tools: MCP_TOOL_COUNT,
    mcp_health_url: ENV.mcpHealthUrl,
    server_time: new Date().toISOString(),
  });
}
