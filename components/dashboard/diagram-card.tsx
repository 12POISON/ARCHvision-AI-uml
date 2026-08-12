"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { MermaidRenderer } from "@/components/editor/mermaid-renderer";
import { formatRelativeTime } from "@/lib/utils";
import { DIAGRAM_TYPES } from "@/types/diagram";
import type { Diagram } from "@/types/diagram";

export function DiagramCard({
  diagram,
  index,
}: {
  diagram: Diagram;
  index: number;
}): React.ReactElement {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: [0.4, 0, 0.2, 1] }}
    >
      <Link
        href={`/editor/${diagram.id}`}
        className="group flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-primary"
      >
        <div className="relative h-32 shrink-0 overflow-hidden border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white">
          <div className="absolute inset-0 scale-[1.6] origin-top-left opacity-60 transition-transform duration-300 group-hover:opacity-90">
            <MermaidRenderer code={diagram.mermaidCode} fit={false} />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
        </div>
        <div className="flex flex-1 flex-col p-4">
          <div className="flex items-start justify-between gap-2">
            <span className="min-w-0 truncate text-sm font-bold text-foreground">{diagram.name}</span>
            <Badge variant="soft-blue" className="shrink-0">
              {DIAGRAM_TYPES.find((t) => t.value === diagram.type)?.label ?? diagram.type}
            </Badge>
          </div>
          <p className="mt-auto pt-3 text-[11px] text-muted-foreground">
            Updated {formatRelativeTime(diagram.updatedAt)}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}
