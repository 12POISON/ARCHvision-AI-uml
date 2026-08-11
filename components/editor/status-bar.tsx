"use client";

import * as React from "react";
import { useReactFlow } from "@xyflow/react";
import { CheckCircle2, Loader2, Minus, Maximize, Plus } from "lucide-react";
import type { DiagramEngine } from "@/hooks/useDiagram";
import type { UMLFlowEdge, UMLFlowNode } from "@/lib/mermaid/transformer";
import { useCommentsStore } from "@/lib/editor/comments";

interface StatusBarProps {
  engine: DiagramEngine;
  nodeCount: number;
  edgeCount: number;
}

export function StatusBar({ engine, nodeCount, edgeCount }: StatusBarProps): React.ReactElement {
  const { zoomIn, zoomOut, fitView, getZoom } = useReactFlow<UMLFlowNode, UMLFlowEdge>();
  const [zoom, setZoom] = React.useState(1);
  const commentCount = useCommentsStore((s) => s.comments[engine.diagramId]?.length ?? 0);

  React.useEffect(() => {
    const update = (): void => setZoom(getZoom());
    update();
    const timer = window.setInterval(update, 200);
    return () => window.clearInterval(timer);
  }, [getZoom]);

  return (
    <div className="pointer-events-auto absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 rounded-pill border border-line bg-white/95 px-2.5 py-1.5 shadow-panel-float backdrop-blur">
      <button
        type="button"
        onClick={() => void zoomOut()}
        className="rounded-full p-1 text-slate-500 transition-colors hover:bg-surface hover:text-foreground"
        aria-label="Zoom out"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => void fitView({ padding: 0.2, duration: 400 })}
        className="rounded-full p-1 text-slate-500 transition-colors hover:bg-surface hover:text-foreground"
        aria-label="Fit view"
      >
        <Maximize className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => void zoomIn()}
        className="rounded-full p-1 text-slate-500 transition-colors hover:bg-surface hover:text-foreground"
        aria-label="Zoom in"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
      <span className="mx-1 w-11 text-center font-mono text-[11px] font-semibold text-slate-600">
        {Math.round(zoom * 100)}%
      </span>
      <span className="h-4 w-px bg-line" />
      <span className="px-1 font-mono text-[11px] text-slate-400">
        {nodeCount} n · {edgeCount} e
      </span>
      {commentCount > 0 ? (
        <span className="rounded-pill bg-primary/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-primary">
          {commentCount} comments
        </span>
      ) : null}
      <span className="h-4 w-px bg-line" />
      {engine.isSaving ? (
        <span className="flex items-center gap-1 px-1 text-[11px] font-semibold text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin text-primary" />
          saving…
        </span>
      ) : engine.lastSaved ? (
        <span className="flex items-center gap-1 px-1 text-[11px] font-semibold text-emerald-600">
          <CheckCircle2 className="h-3 w-3" />
          saved {engine.lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      ) : null}
    </div>
  );
}
