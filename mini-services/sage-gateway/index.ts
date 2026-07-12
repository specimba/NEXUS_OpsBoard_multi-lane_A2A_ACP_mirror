/**
 * NEXUS SAGE Action Gateway — governed REST facade over the Grok MCP Bridge v2.
 *
 * Implements the OpenAPI 3.1 spec at sage/reference/05_actions_openapi.yaml:
 *   - 17 operations under /v1/... (HERMES-only task_claim/complete/fail excluded)
 *   - Bearer auth (NEXUS_API_KEY env)
 *   - Idempotency-Key header → receipt generation + cached replay within TTL
 *   - /privacy route serving the Action Gateway privacy notice
 *
 * Deployment (production): runs on the Windows host next to the MCP bridge
 * (port 7354), exposed publicly via ngrok. Locally: port 3001, proxies to
 * SAGE_MCP_BRIDGE_URL (default http://127.0.0.1:7354). When the bridge is
 * unreachable the gateway degrades gracefully — returns a STUB receipt so
 * /v1/health is testable outside ChatGPT (deployment step 6).
 *
 * Port: 3001 (fixed, per mini-service rules — never env-driven).
 */

import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

const PORT = 3001;
const NEXUS_API_KEY = process.env.NEXUS_API_KEY ?? "";
const MCP_BRIDGE_URL =
  process.env.SAGE_MCP_BRIDGE_URL ?? "http://127.0.0.1:7354";
const IDEMPOTENCY_TTL_MS = 10 * 60 * 1000; // 10 minutes

// ---- Receipt envelope ----
interface Receipt {
  receipt_id: string;
  idempotency_key: string | null;
  ts: string;
  ok: boolean;
  operation: string;
  source: "bridge" | "stub";
  data: unknown;
  error?: string;
}

function newReceiptId(): string {
  return `rcp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// ---- Idempotency cache (in-process, TTL-bounded) ----
const idempotencyCache = new Map<string, { receipt: Receipt; expires: number }>();

function getIdempotent(key: string): Receipt | null {
  const entry = idempotencyCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    idempotencyCache.delete(key);
    return null;
  }
  return entry.receipt;
}

function storeIdempotent(key: string, receipt: Receipt): void {
  idempotencyCache.set(key, { receipt, expires: Date.now() + IDEMPOTENCY_TTL_MS });
}

// ---- Bridge proxy (graceful degradation) ----
async function callBridge(
  tool: string,
  args: Record<string, unknown>,
): Promise<{ data: unknown; source: "bridge" | "stub"; error?: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    // The MCP bridge exposes tools via a JSON-RPC-like POST at /tools/:name
    const res = await fetch(`${MCP_BRIDGE_URL}/tools/${tool}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      signal: controller.signal,
      cache: "no-store",
      body: JSON.stringify(args),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return {
        data: undefined,
        source: "stub",
        error: `bridge HTTP ${res.status}: ${body.slice(0, 200)}`,
      };
    }
    const data = await res.json().catch(() => ({}));
    return { data, source: "bridge" };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: undefined, source: "stub", error: message };
  } finally {
    clearTimeout(timeout);
  }
}

// ---- HTTP helpers ----
function readBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve) => {
    let raw = "";
    req.on("data", (c) => {
      raw += c;
      if (raw.length > 1_000_000) {
        raw = "";
        req.destroy();
      }
    });
    req.on("end", () => {
      if (!raw.trim()) return resolve({});
      try {
        resolve(JSON.parse(raw) as Record<string, unknown>);
      } catch {
        resolve({ _parseError: "invalid JSON body" });
      }
    });
    req.on("error", () => resolve({}));
  });
}

function send(res: ServerResponse, status: number, body: unknown): void {
  const json = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json",
    "content-length": Buffer.byteLength(json),
    "cache-control": "no-store",
  });
  res.end(json);
}

// ---- Auth ----
function checkAuth(req: IncomingMessage): boolean {
  if (!NEXUS_API_KEY) return true; // unconfigured = open (dev only)
  const auth = req.headers.authorization ?? "";
  if (auth.startsWith("Bearer ")) {
    return auth.slice(7).trim() === NEXUS_API_KEY;
  }
  return false;
}

// ---- Route table ----
// Each route: { method, path, operation, tool?, buildArgs? }
// tool=null means handle inline (health/echo/privacy); otherwise proxy to bridge.
type Route = {
  method: "GET" | "POST";
  path: string;
  operation: string;
  tool?: string;
};

const ROUTES: Route[] = [
  { method: "GET", path: "/v1/health", operation: "ping", tool: "ping" },
  { method: "POST", path: "/v1/echo", operation: "echo" },
  { method: "GET", path: "/v1/registry", operation: "registry_debug", tool: "registry_debug" },
  { method: "GET", path: "/v1/coordination/status", operation: "coordination_status", tool: "coordination_status" },
  { method: "GET", path: "/v1/tasks", operation: "task_list", tool: "task_list" },
  { method: "POST", path: "/v1/tasks", operation: "task_add", tool: "task_add" },
  { method: "GET", path: "/v1/a2a/topics", operation: "agent_list_topics", tool: "agent_list_topics" },
  { method: "GET", path: "/v1/a2a/messages", operation: "agent_retrieve_messages", tool: "agent_retrieve_messages" },
  { method: "POST", path: "/v1/a2a/messages", operation: "agent_publish_message", tool: "agent_publish_message" },
  { method: "GET", path: "/v1/sessions/status", operation: "session_status", tool: "session_status" },
  { method: "POST", path: "/v1/sessions/heartbeat", operation: "session_heartbeat", tool: "session_heartbeat" },
  { method: "POST", path: "/v1/evidence", operation: "evidence_capture", tool: "evidence_capture" },
  { method: "POST", path: "/v1/audit", operation: "audit_log", tool: "audit_log" },
  { method: "POST", path: "/v1/http-diagnostic", operation: "http_diagnostic", tool: "http_diagnostic" },
  { method: "POST", path: "/v1/query-log", operation: "query_log", tool: "query_log" },
  { method: "GET", path: "/v1/comparison", operation: "comparison_get", tool: "comparison_get" },
  { method: "POST", path: "/v1/comparison", operation: "comparison_add", tool: "comparison_add" },
  { method: "GET", path: "/v1/comparison/export", operation: "comparison_export", tool: "comparison_export" },
  { method: "POST", path: "/v1/probes/simulate", operation: "simulate_probe", tool: "simulate_probe" },
];

// ---- Privacy policy (served at /privacy, deployment step 5) ----
const PRIVACY_MD = `# NEXUS SAGE Action Gateway Privacy Notice

Last updated: 2026-07-12

## Scope

This notice covers the private NEXUS SAGE Action Gateway used by a Custom GPT to access NEXUS coordination, audit, evidence, diagnostic, session, and A2A services.

## Data processed

When an action is invoked, the gateway may receive only the fields required for that operation, such as task identifiers, topic names, bounded messages, audit payloads, evidence text, URLs for public diagnostics, session identifiers, and action metadata.

Do not submit passwords, API keys, private keys, authentication cookies, payment information, medical data, or other unnecessary sensitive information.

## Purpose

Data is processed solely to execute the requested NEXUS action, return its result, maintain operational evidence, and protect the system through auditing, rate limits, schema validation, and abuse detection.

## Retention

Operational receipts, audit records, task state, and evidence records may be retained according to the NEXUS governance and ARCHIVIST retention policy. Diagnostic request bodies should be minimized and bounded.

## Sharing and sale

The gateway does not sell personal data. Data is not shared with advertisers. Service providers used to host or tunnel the gateway may process network and operational metadata under their own terms.

## Security

The gateway uses HTTPS, authentication, bounded payloads, input validation, rate limiting, allowlists, and least-privilege operation exposure. No internet-facing system is risk-free.

## User control

The operator may request inspection or deletion of non-canonical records where deletion does not conflict with required security, audit, or governance retention.

## Contact

Publish a real operator-controlled contact address here before sharing the GPT beyond private use.
`;

// ---- Request handler ----
async function handle(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
  const path = url.pathname;
  const method = (req.method ?? "GET").toUpperCase() as "GET" | "POST";

  // CORS + preflight (ChatGPT custom connectors preflight)
  res.setHeader("access-control-allow-origin", "*");
  res.setHeader("access-control-allow-methods", "GET,POST,OPTIONS");
  res.setHeader("access-control-allow-headers", "authorization,content-type,idempotency-key");
  if (method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  // /privacy — public, no auth (step 5)
  if (path === "/privacy" && method === "GET") {
    res.writeHead(200, { "content-type": "text/markdown; charset=utf-8" });
    return res.end(PRIVACY_MD);
  }

  // /openapi.json — serve the spec (helps ChatGPT connector import)
  if (path === "/openapi.json" && method === "GET") {
    return send(res, 200, { note: "see sage/reference/05_actions_openapi.yaml", server: MCP_BRIDGE_URL });
  }

  // /v1/* routes require auth
  if (path.startsWith("/v1/")) {
    if (!checkAuth(req)) {
      return send(res, 401, {
        error: "unauthorized",
        hint: NEXUS_API_KEY ? "Bearer token required (NEXUS_API_KEY)." : "NEXUS_API_KEY not set on gateway — configure before production.",
      });
    }

    const route = ROUTES.find((r) => r.path === path && r.method === method);
    if (!route) {
      return send(res, 404, { error: "not found", path, method });
    }

    // idempotency
    const idemKey = (req.headers["idempotency-key"] as string | undefined)?.trim() || null;
    if (idemKey) {
      const cached = getIdempotent(idemKey);
      if (cached) return send(res, 200, cached);
    }

    const body = method === "POST" ? await readBody(req) : {};
    const query: Record<string, string> = {};
    url.searchParams.forEach((v, k) => { query[k] = v; });

    // /v1/echo is inline (bounded connectivity test, no bridge call)
    if (route.operation === "echo") {
      const message = typeof body.message === "string" ? body.message.slice(0, 2000) : "";
      const receipt: Receipt = {
        receipt_id: newReceiptId(),
        idempotency_key: idemKey,
        ts: new Date().toISOString(),
        ok: true,
        operation: "echo",
        source: "bridge",
        data: { message, echoed: true },
      };
      if (idemKey) storeIdempotent(idemKey, receipt);
      return send(res, 200, receipt);
    }

    // all other /v1 routes proxy to the bridge
    const args = { ...query, ...body };
    const result = await callBridge(route.tool ?? route.operation, args);

    const receipt: Receipt = {
      receipt_id: newReceiptId(),
      idempotency_key: idemKey,
      ts: new Date().toISOString(),
      ok: !result.error,
      operation: route.operation,
      source: result.source,
      data: result.data ?? {
        note: "bridge unreachable — STUB response",
        operation: route.operation,
        args,
      },
      error: result.error,
    };
    if (idemKey) storeIdempotent(idemKey, receipt);
    return send(res, 200, receipt);
  }

  // root
  if (path === "/" || path === "") {
    return send(res, 200, {
      service: "nexus-sage-action-gateway",
      version: "1.0.0",
      port: PORT,
      bridge_url: MCP_BRIDGE_URL,
      auth_configured: Boolean(NEXUS_API_KEY),
      routes: ROUTES.length,
      endpoints: ["/v1/health", "/v1/echo", "/v1/registry", "/privacy", "/openapi.json"],
    });
  }

  return send(res, 404, { error: "not found", path });
}

// ---- Start ----
const server = createServer((req, res) => {
  handle(req, res).catch((err) => {
    const message = err instanceof Error ? err.message : String(err);
    send(res, 500, { error: "internal", message });
  });
});

server.listen(PORT, () => {
  console.log(`[sage-gateway] listening on :${PORT}`);
  console.log(`[sage-gateway] bridge: ${MCP_BRIDGE_URL}`);
  console.log(`[sage-gateway] auth: ${NEXUS_API_KEY ? "configured (NEXUS_API_KEY)" : "OPEN (dev — set NEXUS_API_KEY before production)"}`);
  console.log(`[sage-gateway] routes: ${ROUTES.length} /v1/* operations + /privacy + /openapi.json`);
});
