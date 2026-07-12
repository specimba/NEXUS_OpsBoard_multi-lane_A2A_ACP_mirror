// NEXUS Browserless adapter — cloud headless browser client.
//
// Wraps the Browserless shared-fleet REST API (production-sfo.browserless.io).
// This is the missing cloud-browser layer that complements (does NOT replace)
// the local CDP :9224 live truth. Used for read-only probing of JS-rendered
// or authenticated pages that page_reader cannot pierce.
//
// SSRF posture — matches SAGE's http_diagnostic doctrine + our MCP_CONTRACT.md:
//   - target URL must be public HTTP(S); private IPs / localhost blocked
//   - no cookies / no auth headers forwarded to the target
//   - token stays server-side (env), never sent to the client
//
// Token: BROWSERLESS_TOKEN in .env.local (gitignored). Region default SFO.

export const BROWSERLESS_TOKEN = process.env.BROWSERLESS_TOKEN ?? "";
export const BROWSERLESS_REGION =
  process.env.BROWSERLESS_REGION ?? "production-sfo";
export const BROWSERLESS_BASE = `https://${BROWSERLESS_REGION}.browserless.io`;

/** Is the adapter configured (token present)? */
export function browserlessConfigured(): boolean {
  return BROWSERLESS_TOKEN.length > 0;
}

/** Private-IP / non-public target guard. Throws on policy violation. */
function assertPublicTarget(url: string): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`invalid url: ${url}`);
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`blocked: non-http(s) protocol (${parsed.protocol})`);
  }
  const host = parsed.hostname.toLowerCase();
  // Block localhost / loopback / link-local / metadata endpoints
  const blocked = [
    "localhost",
    "127.0.0.1",
    "0.0.0.0",
    "::1",
    "169.254.169.254", // cloud metadata
    "metadata.google.internal",
  ];
  if (blocked.includes(host)) {
    throw new Error(`blocked: private/loopback host (${host})`);
  }
  // Block RFC1918 / private ranges by first octet
  const m = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (m) {
    const [a] = m.slice(1).map(Number);
    if (a === 10 || a === 172 || a === 192 || a === 127 || a === 0) {
      throw new Error(`blocked: private IP range (${host})`);
    }
  }
}

export interface BrowserlessContentResult {
  url: string;
  html: string;
  bytes: number;
  fetchedAt: string;
  region: string;
}

/**
 * Fetch fully-rendered HTML (JS executed) for a public URL via /content.
 * @param url public http(s) URL
 */
export async function fetchContent(
  url: string,
): Promise<BrowserlessContentResult> {
  assertPublicTarget(url);
  if (!browserlessConfigured()) {
    throw new Error("BROWSERLESS_TOKEN not configured (set in .env.local)");
  }

  const endpoint = `${BROWSERLESS_BASE}/content?token=${BROWSERLESS_TOKEN}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      signal: controller.signal,
      cache: "no-store",
      body: JSON.stringify({ url }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(
        `browserless /content HTTP ${res.status}: ${body.slice(0, 200)}`,
      );
    }
    const html = await res.text();
    return {
      url,
      html,
      bytes: html.length,
      fetchedAt: new Date().toISOString(),
      region: BROWSERLESS_REGION,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export interface BrowserlessScreenshotResult {
  url: string;
  contentType: string;
  bytes: number;
  fetchedAt: string;
  region: string;
}

/**
 * Capture a screenshot (PNG) of a public URL via /screenshot.
 * Returns the raw image bytes.
 */
export async function fetchScreenshot(
  url: string,
): Promise<BrowserlessScreenshotResult> {
  assertPublicTarget(url);
  if (!browserlessConfigured()) {
    throw new Error("BROWSERLESS_TOKEN not configured (set in .env.local)");
  }

  const endpoint = `${BROWSERLESS_BASE}/screenshot?token=${BROWSERLESS_TOKEN}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      signal: controller.signal,
      cache: "no-store",
      body: JSON.stringify({ url, options: { type: "png", fullPage: true } }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(
        `browserless /screenshot HTTP ${res.status}: ${body.slice(0, 200)}`,
      );
    }
    const buf = Buffer.from(await res.arrayBuffer());
    const contentType = res.headers.get("content-type") ?? "image/png";
    return {
      url,
      contentType,
      bytes: buf.length,
      fetchedAt: new Date().toISOString(),
      region: BROWSERLESS_REGION,
    };
  } finally {
    clearTimeout(timeout);
  }
}

/** Fetch the rendered text content (HTML stripped to text) via /scrape. */
export async function fetchScrape(
  url: string,
  elements: string[] = ["body"],
): Promise<{
  url: string;
  data: unknown;
  fetchedAt: string;
  region: string;
}> {
  assertPublicTarget(url);
  if (!browserlessConfigured()) {
    throw new Error("BROWSERLESS_TOKEN not configured (set in .env.local)");
  }

  const endpoint = `${BROWSERLESS_BASE}/scrape?token=${BROWSERLESS_TOKEN}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      signal: controller.signal,
      cache: "no-store",
      body: JSON.stringify({ url, elements }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(
        `browserless /scrape HTTP ${res.status}: ${body.slice(0, 200)}`,
      );
    }
    const data = await res.json();
    return {
      url,
      data,
      fetchedAt: new Date().toISOString(),
      region: BROWSERLESS_REGION,
    };
  } finally {
    clearTimeout(timeout);
  }
}
