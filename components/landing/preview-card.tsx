"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Code2, Database, Network, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { DEFAULT_CLASS_MERMAID, DEFAULT_ER_MERMAID, DEFAULT_SEQUENCE_MERMAID } from "@/types/diagram";
import { MermaidRenderer } from "@/components/editor/mermaid-renderer";
import { Badge } from "@/components/ui/badge";

const TABS = [
  { id: "class", label: "Class", icon: Network, code: DEFAULT_CLASS_MERMAID },
  { id: "sequence", label: "Sequence", icon: Zap, code: DEFAULT_SEQUENCE_MERMAID },
  { id: "er", label: "Entity · ER", icon: Database, code: DEFAULT_ER_MERMAID },
] as const;

export function PreviewCard(): React.ReactElement {
  const [active, setActive] = React.useState<(typeof TABS)[number]["id"]>("class");
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const activeTab = TABS.find((t) => t.id === active) ?? TABS[0];

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      className="card-elevated overflow-hidden shadow-card-hover"
    >
      <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
        <div className="flex items-center gap-4">
          <div className="flex gap-1.5" aria-hidden="true">
            <span className="h-3 w-3 rounded-full bg-[#FF5F57]" />
            <span className="h-3 w-3 rounded-full bg-[#FEBC2E]" />
            <span className="h-3 w-3 rounded-full bg-[#28C840]" />
          </div>
          <span className="text-[13px] font-semibold text-slate-500">archvision.ai/editor/auth-service</span>
        </div>
        <Badge variant="success" className="gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-ring" />
          Live preview
        </Badge>
      </div>

      <div className="flex items-center justify-between border-b border-line bg-surface/50 px-5 py-2.5">
        <div className="flex items-center gap-1 rounded-btn2 bg-white p-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActive(tab.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12.5px] font-semibold transition-all duration-300",
                active === tab.id ? "bg-primary text-white shadow-btn-primary" : "text-slate-500 hover:text-foreground"
              )}
              aria-pressed={active === tab.id}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
        <span className="hidden items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground sm:flex">
          <Code2 className="h-3.5 w-3.5 text-primary" />
          Two-way Mermaid sync
        </span>
      </div>

      <div className="relative h-[420px] overflow-hidden bg-[radial-gradient(circle_at_1px_1px,transparent_15%,rgba(15,23,42,0.10)_20%)]  bg-[size:24px_24px]">
        {mounted ? (
          <MermaidRenderer key={active} code={activeTab.code} className="p-6" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Rendering…</div>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent" />
      </div>

      <div className="flex items-center justify-between px-5 py-4">
        <p className="text-[13px] text-muted-foreground">
          <span className="font-semibold text-foreground">{activeTab.label} diagram</span> generated from a
          single-sentence description
        </p>
        <p className="flex items-center gap-1 text-[12px] font-semibold text-emerald-600">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Score 94 / 100
        </p>
      </div>
    </motion.div>
  );
}