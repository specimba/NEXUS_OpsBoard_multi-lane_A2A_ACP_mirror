"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Globe,
  Loader2,
  ShieldCheck,
  ShieldAlert,
  ExternalLink,
  Copy,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ContentResult {
  ok: boolean;
  url: string;
  bytes: number;
  fetchedAt: string;
  region: string;
  html: string;
  error?: string;
  configured?: boolean;
}

export default function BrowserlessPage() {
  const [url, setUrl] = useState("https://example.com");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ContentResult | null>(null);

  async function fetchIt(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) {
      toast.error("URL is required");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/browserless/content", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const json = (await res.json()) as ContentResult;
      if (!res.ok) {
        throw new Error(json.error ?? `HTTP ${res.status}`);
      }
      setResult(json);
      toast.success(`Fetched ${(json.bytes / 1024).toFixed(1)} KB`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "fetch failed";
      toast.error(message);
      setResult({ ok: false, url, bytes: 0, fetchedAt: "", region: "", html: "", error: message });
    } finally {
      setLoading(false);
    }
  }

  async function copyHtml() {
    if (!result?.html) return;
    try {
      await navigator.clipboard.writeText(result.html);
      toast.success("HTML copied to clipboard");
    } catch {
      toast.error("copy failed");
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="mono flex items-center gap-2 text-lg font-bold tracking-wide text-foreground sm:text-xl">
          <Globe className="h-5 w-5 text-cyan-300" aria-hidden />
          Browserless
        </h1>
        <p className="mono text-[11px] uppercase tracking-wider text-muted-foreground">
          cloud headless chrome · complements CDP :9224 · read-only probing
        </p>
      </div>

      {/* doctrine banner */}
      <div className="nexus-panel rounded-lg border-cyan-500/20 bg-cyan-500/[0.04] p-3">
        <div className="flex items-start gap-2 text-xs">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" aria-hidden />
          <div className="space-y-1 text-muted-foreground">
            <p>
              <span className="mono font-semibold uppercase tracking-wider text-cyan-300">
                SSRF posture
              </span>{" "}
              — public HTTP(S) only. Private IPs, localhost, loopback, and cloud
              metadata endpoints are blocked server-side. No cookies or auth
              headers are forwarded to the target. Token stays in{" "}
              <code className="mono text-cyan-200">.env.local</code> (never
              client-exposed, never tracked).
            </p>
            <p className="text-muted-foreground/60">
              Matches SAGE <code className="mono">http_diagnostic</code> doctrine
              + NEXUS <code className="mono">docs/MCP_CONTRACT.md</code>{" "}
              denylist. Does not drive CDP :9224.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={fetchIt} className="nexus-panel space-y-3 rounded-lg p-4">
        <div className="space-y-1">
          <Label className="mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Public URL to render
          </Label>
          <div className="flex gap-2">
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="mono text-xs"
              placeholder="https://example.com"
              spellCheck={false}
              autoComplete="off"
            />
            <Button
              type="submit"
              disabled={loading}
              className="bg-cyan-600 hover:bg-cyan-500"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Globe className="h-4 w-4" aria-hidden />
              )}
              Fetch
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            "https://example.com",
            "https://news.ycombinator.com",
            "https://docs.browserless.io/overview/intro",
          ].map((sample) => (
            <button
              key={sample}
              type="button"
              onClick={() => setUrl(sample)}
              className="mono rounded bg-white/5 px-2 py-0.5 text-[10px] text-muted-foreground hover:text-foreground"
            >
              {sample.replace(/^https?:\/\//, "")}
            </button>
          ))}
        </div>
      </form>

      {result && (
        <div className="space-y-2">
          {result.ok ? (
            <div className="nexus-panel rounded-lg overflow-hidden">
              <header className="flex flex-wrap items-center gap-3 border-b border-white/5 px-4 py-2.5">
                <span className="mono inline-flex items-center gap-1 text-xs font-semibold text-emerald-300">
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                  OK
                </span>
                <a
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mono inline-flex items-center gap-1 truncate text-xs text-cyan-300 hover:text-cyan-200"
                >
                  {result.url}
                  <ExternalLink className="h-3 w-3 shrink-0" aria-hidden />
                </a>
                <span className="mono text-[10px] text-muted-foreground">
                  {(result.bytes / 1024).toFixed(1)} KB · {result.region}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="ml-auto h-7"
                  onClick={copyHtml}
                >
                  <Copy className="h-3 w-3" aria-hidden />
                  Copy HTML
                </Button>
              </header>
              <pre className="nexus-scroll max-h-[32rem] overflow-auto p-3 mono text-[10px] leading-relaxed text-foreground/70">
                {result.html.slice(0, 50000)}
                {result.html.length > 50000 && (
                  <span className="text-muted-foreground/50">
                    {"\n\n… truncated ({result.html.length - 50000} more bytes) …"}
                  </span>
                )}
              </pre>
            </div>
          ) : (
            <div
              className={cn(
                "nexus-panel rounded-lg border-rose-500/30 bg-rose-500/[0.05] p-4",
              )}
            >
              <div className="flex items-start gap-2 text-xs">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" aria-hidden />
                <div className="space-y-1">
                  <p className="mono font-semibold uppercase tracking-wider text-rose-300">
                    Fetch failed
                  </p>
                  <p className="mono text-rose-200/80">{result.error}</p>
                  <p className="mono text-[10px] text-muted-foreground/60">
                    {result.url}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
