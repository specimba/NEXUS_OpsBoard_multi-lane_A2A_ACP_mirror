"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { PackStatusChip } from "@/components/PackStatusChip";
import {
  LayoutDashboard,
  Wrench,
  Network,
  ArrowLeftRight,
  Globe,
  ClipboardList,
  Sparkles,
  Activity,
} from "lucide-react";

const LINKS = [
  { href: "/", label: "Ops Board", icon: LayoutDashboard },
  { href: "/board", label: "Mission Board", icon: ClipboardList },
  { href: "/mcp", label: "MCP", icon: Wrench },
  { href: "/lanes", label: "Lanes", icon: Network },
  { href: "/handoffs", label: "Handoffs", icon: ArrowLeftRight },
  { href: "/browserless", label: "Browserless", icon: Globe },
  { href: "/sage", label: "SAGE", icon: Sparkles },
] as const;

export function OpsNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 nexus-panel border-b">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-3 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 pr-3"
          aria-label="NEXUS home"
        >
          <span className="relative flex h-6 w-6 items-center justify-center">
            <span className="absolute inset-0 rounded-md bg-cyan-500/20" />
            <Activity className="h-4 w-4 text-cyan-300" aria-hidden />
          </span>
          <span className="mono text-sm font-bold tracking-widest text-foreground">
            NEXUS
          </span>
          <span className="mono hidden text-[10px] uppercase tracking-[0.2em] text-cyan-300/70 sm:inline">
            a2a·control·plane
          </span>
        </Link>

        <nav
          className="ml-2 flex items-center gap-1 overflow-x-auto nexus-scroll"
          aria-label="Primary"
        >
          {LINKS.map((l) => {
            const active =
              l.href === "/"
                ? pathname === "/"
                : pathname.startsWith(l.href);
            const Icon = l.icon;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                  active
                    ? "bg-cyan-500/15 text-cyan-200 ring-1 ring-cyan-500/30"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden />
                <span className="mono uppercase tracking-wider">{l.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto hidden items-center gap-2 sm:flex">
          <PackStatusChip />
          <span className="mono text-[10px] uppercase tracking-widest text-muted-foreground">
            CDP :9224 · live truth
          </span>
          <span
            className="h-2 w-2 rounded-full bg-emerald-400 nexus-pulse"
            aria-hidden
          />
        </div>
      </div>
    </header>
  );
}
