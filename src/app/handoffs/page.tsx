"use client";

import { useState } from "react";
import { useNexusFetch } from "@/hooks/use-nexus";
import { HandoffCard } from "@/components/HandoffCard";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { LANES } from "@/lib/registry";
import type { HandoffCard as HandoffCardType, HandoffStatus, LaneId } from "@/lib/types";
import { toast } from "sonner";
import { ArrowLeftRight, Plus, Loader2, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface HandoffsResponse {
  count: number;
  handoffs: HandoffCardType[];
}

const STATUS_OPTIONS: { value: HandoffStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "accepted", label: "Accepted" },
  { value: "blocked", label: "Blocked" },
  { value: "done", label: "Done" },
];

const STATUS_FILTERS = [
  { id: "all", label: "All" },
  { id: "open", label: "Open" },
  { id: "accepted", label: "Accepted" },
  { id: "blocked", label: "Blocked" },
  { id: "done", label: "Done" },
] as const;

function genToken() {
  return `nx_${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export default function HandoffsPage() {
  const handoffs = useNexusFetch<HandoffsResponse>("/api/handoffs", 6000);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [laneFilter, setLaneFilter] = useState<string>("all");

  // form state
  const [from, setFrom] = useState<LaneId>("grok");
  const [to, setTo] = useState<LaneId>("qwen_webdev");
  const [token, setToken] = useState(genToken());
  const [summary, setSummary] = useState("");
  const [artifacts, setArtifacts] = useState("");
  const [status, setStatus] = useState<HandoffStatus>("open");
  const [evidence, setEvidence] = useState("");
  const [budget, setBudget] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const all = handoffs.data?.handoffs ?? [];
  const filtered = all.filter((h) => {
    if (statusFilter !== "all" && h.status !== statusFilter) return false;
    if (laneFilter !== "all" && h.from !== laneFilter && h.to !== laneFilter)
      return false;
    return true;
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!summary.trim()) {
      toast.error("Summary is required");
      return;
    }
    if (from === to) {
      toast.error("From and To must differ");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/handoffs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          from,
          to,
          token: token.trim(),
          summary: summary.trim(),
          artifacts: artifacts
            .split(/\n|,/)
            .map((s) => s.trim())
            .filter(Boolean),
          status,
          mcp_evidence_ref: evidence.trim() || undefined,
          budget: budget.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }
      toast.success("Handoff card created");
      setSummary("");
      setArtifacts("");
      setEvidence("");
      setBudget("");
      setToken(genToken());
      handoffs.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "create failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="mono flex items-center gap-2 text-lg font-bold tracking-wide text-foreground sm:text-xl">
            <ArrowLeftRight className="h-5 w-5 text-cyan-300" aria-hidden />
            Handoff Bus
            <DataSourceBadge source="wired" panelId="handoffs-bus-list" />
          </h1>
          <p className="mono text-[11px] uppercase tracking-wider text-muted-foreground">
            create + track tokens between lanes · file-backed
          </p>
        </div>
        <div className="mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {all.length} total · {filtered.length} shown
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[22rem_1fr]">
        {/* Create form */}
        <form
          onSubmit={submit}
          className="nexus-panel space-y-3 rounded-lg p-4 self-start xl:sticky xl:top-16"
        >
          <h2 className="mono flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-foreground">
            <Plus className="h-3.5 w-3.5 text-cyan-300" aria-hidden />
            New Handoff
          </h2>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="mono text-[10px] uppercase tracking-wider text-muted-foreground">
                From
              </Label>
              <Select value={from} onValueChange={(v) => setFrom(v as LaneId)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANES.map((l) => (
                    <SelectItem key={l.id} value={l.id} className="text-xs">
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="mono text-[10px] uppercase tracking-wider text-muted-foreground">
                To
              </Label>
              <Select value={to} onValueChange={(v) => setTo(v as LaneId)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANES.map((l) => (
                    <SelectItem key={l.id} value={l.id} className="text-xs">
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Token
            </Label>
            <div className="flex gap-2">
              <Input
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="mono h-9 text-xs"
                placeholder="nx_TK##"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 shrink-0"
                onClick={() => setToken(genToken())}
              >
                Gen
              </Button>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Summary *
            </Label>
            <Textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={3}
              className="text-xs"
              placeholder="What is being handed off…"
            />
          </div>

          <div className="space-y-1">
            <Label className="mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Artifacts (comma/newline separated)
            </Label>
            <Textarea
              value={artifacts}
              onChange={(e) => setArtifacts(e.target.value)}
              rows={2}
              className="mono text-xs"
              placeholder="docs/MCP_CONTRACT.md, drive://pkg.zip"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Status
              </Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as HandoffStatus)}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value} className="text-xs">
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Budget
              </Label>
              <Input
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="mono h-9 text-xs"
                placeholder="1 cycle"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="mono text-[10px] uppercase tracking-wider text-muted-foreground">
              MCP evidence ref
            </Label>
            <Input
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              className="mono h-9 text-xs"
              placeholder="ev_####"
            />
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="w-full bg-cyan-600 hover:bg-cyan-500"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Plus className="h-4 w-4" aria-hidden />
            )}
            Create Handoff
          </Button>
        </form>

        {/* List */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
            <span className="mono text-[10px] uppercase tracking-wider text-muted-foreground">
              status:
            </span>
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setStatusFilter(f.id)}
                className={cn(
                  "mono rounded-md px-2 py-0.5 text-[10px] uppercase tracking-wider transition-colors",
                  statusFilter === f.id
                    ? "bg-cyan-500/15 text-cyan-200 ring-1 ring-cyan-500/30"
                    : "bg-white/5 text-muted-foreground hover:text-foreground",
                )}
              >
                {f.label}
              </button>
            ))}
            <span className="mono ml-2 text-[10px] uppercase tracking-wider text-muted-foreground">
              lane:
            </span>
            <Select value={laneFilter} onValueChange={setLaneFilter}>
              <SelectTrigger className="h-7 w-36 text-[11px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">
                  All lanes
                </SelectItem>
                {LANES.map((l) => (
                  <SelectItem key={l.id} value={l.id} className="text-xs">
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="max-h-[calc(100vh-16rem)] space-y-3 overflow-y-auto nexus-scroll pr-1">
            {handoffs.loading && !handoffs.data ? (
              <div className="nexus-panel rounded-lg p-6 text-center text-xs text-muted-foreground">
                loading handoffs…
              </div>
            ) : filtered.length > 0 ? (
              filtered.map((h) => <HandoffCard key={h.id} handoff={h} />)
            ) : (
              <div className="nexus-panel rounded-lg p-6 text-center text-xs text-muted-foreground">
                no handoffs match the filter
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
