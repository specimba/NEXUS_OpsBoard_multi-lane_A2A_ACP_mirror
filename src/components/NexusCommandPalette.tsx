"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  ClipboardList,
  Wrench,
  Network,
  ArrowLeftRight,
  Globe,
  Download,
  Terminal,
} from "lucide-react";

// NXM-038 REV 2 Step 6 — command palette adapted from nexusDASHv1 donor.
// Stripped: zustand store, theme toggle, 13-tab nav (donor had 13 tabs; we have 6).
// Routed over our 6 pages via next/navigation router.

interface CmdItem {
  id: string;
  label: string;
  icon: React.ElementType;
  shortcut?: string;
  action: () => void;
  group: "navigation" | "actions";
}

export function NexusCommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  // Ctrl+K / Cmd+K to toggle
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const nav = (href: string) => {
    router.push(href);
    setOpen(false);
  };

  const items: CmdItem[] = [
    { id: "ops", label: "Ops Board", icon: LayoutDashboard, shortcut: "1", action: () => nav("/"), group: "navigation" },
    { id: "board", label: "Mission Board", icon: ClipboardList, shortcut: "2", action: () => nav("/board"), group: "navigation" },
    { id: "mcp", label: "MCP Control Panel", icon: Wrench, shortcut: "3", action: () => nav("/mcp"), group: "navigation" },
    { id: "lanes", label: "Lane Doctrine", icon: Network, shortcut: "4", action: () => nav("/lanes"), group: "navigation" },
    { id: "handoffs", label: "Handoff Bus", icon: ArrowLeftRight, shortcut: "5", action: () => nav("/handoffs"), group: "navigation" },
    { id: "browserless", label: "Browserless", icon: Globe, shortcut: "6", action: () => nav("/browserless"), group: "navigation" },
    { id: "export", label: "Export Dashboard Data (CSV/JSON)", icon: Download, action: () => { window.print(); setOpen(false); }, group: "actions" },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="overflow-hidden p-0 shadow-lg max-w-xl">
        <Command className="rounded-lg">
          <CommandInput placeholder="Type a command or search…" />
          <CommandList className="max-h-[300px]">
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Navigation">
              {items.filter((i) => i.group === "navigation").map((item) => {
                const Icon = item.icon;
                return (
                  <CommandItem
                    key={item.id}
                    value={item.label}
                    onSelect={item.action}
                  >
                    <Icon className="mr-2 h-4 w-4 text-muted-foreground" aria-hidden />
                    <span className="flex-1 text-sm">{item.label}</span>
                    {item.shortcut && (
                      <kbd className="mono rounded bg-white/5 px-1.5 py-0.5 text-[9px] text-muted-foreground">
                        {item.shortcut}
                      </kbd>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Actions">
              {items.filter((i) => i.group === "actions").map((item) => {
                const Icon = item.icon;
                return (
                  <CommandItem
                    key={item.id}
                    value={item.label}
                    onSelect={item.action}
                  >
                    <Icon className="mr-2 h-4 w-4 text-muted-foreground" aria-hidden />
                    <span className="flex-1 text-sm">{item.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
