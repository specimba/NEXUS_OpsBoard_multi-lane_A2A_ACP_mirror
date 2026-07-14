import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { OpsNav } from "@/components/OpsNav";
import { NexusCommandPalette } from "@/components/NexusCommandPalette";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NEXUS · A2A Control Plane",
  description:
    "Operator mirror for the NEXUS multi-lane A2A mesh and the Grok MCP Bridge v2. CDP :9224 is live truth.",
  keywords: [
    "NEXUS",
    "A2A",
    "MCP",
    "Grok",
    "control plane",
    "multi-lane",
    "operator mirror",
  ],
  authors: [{ name: "NEXUS / GLM-5.2" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased nexus-bg text-foreground min-h-screen flex flex-col`}
        suppressHydrationWarning
      >
        <OpsNav />
        <NexusCommandPalette />
        <main className="flex-1 mx-auto w-full max-w-7xl px-3 sm:px-6 py-5">
          {children}
        </main>
        <footer className="mt-auto nexus-panel border-t">
          <div className="mx-auto max-w-7xl px-3 sm:px-6 py-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
            <span className="mono uppercase tracking-widest text-cyan-300/80">
              NEXUS·A2A
            </span>
            <span className="mono">
              operator mirror — not the browser driver
            </span>
            <span className="mono hidden sm:inline">
              run <code className="text-cyan-300/80">keep_visible_daemon</code> on Windows host
            </span>
            <span className="mono ml-auto">
              GLM-5.2 · model lock · retries only
            </span>
          </div>
        </footer>
        <Toaster />
        <SonnerToaster theme="dark" position="bottom-right" />
      </body>
    </html>
  );
}
