import { NextResponse } from "next/server";
import { fetchContent, browserlessConfigured } from "@/lib/browserless";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// POST /api/browserless/content  { url: string }
// Returns rendered HTML for a public URL via the Browserless cloud fleet.
// SSRF-hardened: private IPs / localhost / non-http(s) blocked in lib/browserless.ts.
export async function POST(request: Request) {
  if (!browserlessConfigured()) {
    return NextResponse.json(
      {
        error:
          "BROWSERLESS_TOKEN not configured. Set it in .env.local (gitignored).",
        configured: false,
      },
      { status: 503 },
    );
  }

  let body: { url?: string };
  try {
    body = (await request.json()) as { url?: string };
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const url = body.url?.trim();
  if (!url) {
    return NextResponse.json({ error: "`url` is required" }, { status: 400 });
  }

  try {
    const result = await fetchContent(url);
    return NextResponse.json({
      ok: true,
      url: result.url,
      bytes: result.bytes,
      fetchedAt: result.fetchedAt,
      region: result.region,
      html: result.html,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message.startsWith("blocked:") ? 400 : 502;
    return NextResponse.json({ error: message, url }, { status });
  }
}
