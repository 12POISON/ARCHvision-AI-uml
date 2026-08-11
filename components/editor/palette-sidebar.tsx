"use client";

import * as React from "react";
import {
  Box,
  Database,
  FileCode2,
  FolderGit2,
  PersonStanding,
  Settings2,
  Cpu,
  X,
} from "lucide-react";
import { PALETTE_KINDS } from "@/lib/architecture/editing";
import type { ArchitectureNodeKind } from "@/types/diagram";

const KIND_ICON: Record<ArchitectureNodeKind, React.ReactElement> = {
  class: <Box className="h-3.5 w-3.5" />,
  interface: <FileCode2 className="h-3.5 w-3.5" />,
  actor: <PersonStanding className="h-3.5 w-3.5" />,
  database: <Database className="h-3.5 w-3.5" />,
  controller: <Cpu className="h-3.5 w-3.5" />,
  service: <Settings2 className="h-3.5 w-3.5" />,
  repository: <FolderGit2 className="h-3.5 w-3.5" />,
  abstract: <Box className="h-3.5 w-3.5" />,
  enum: <Box className="h-3.5 w-3.5" />,
  entity: <Box className="h-3.5 w-3.5" />,
  table: <Database className="h-3.5 w-3.5" />,
  component: <Box className="h-3.5 w-3.5" />,
  package: <FolderGit2 className="h-3.5 w-3.5" />,
  boundary: <Box className="h-3.5 w-3.5" />,
  external: <Box className="h-3.5 w-3.5" />,
  api: <Box className="h-3.5 w-3.5" />,
  event: <Box className="h-3.5 w-3.5" />,
  state: <Box className="h-3.5 w-3.5" />,
};

export function PaletteSidebar({ open, onClose }: { open: boolean; onClose: () => void }): React.ReactElement | null {
  if (!open) return null;
  return (
    <aside
      role="complementary"
      aria-label="UML shape palette"
      className="absolute left-3 top-3 z-30 flex w-[168px] flex-col rounded-2xl border border-line bg-white/95 p-3 shadow-panel-float backdrop-blur"
    >
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Shapes</p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close palette"
          className="rounded-md p-0.5 text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <p className="mb-3 text-[10.5px] leading-relaxed text-slate-400">Drag a shape onto the canvas to add it.</p>
      <div className="grid grid-cols-2 gap-2">
        {PALETTE_KINDS.map(({ kind, label }) => (
          <button
            key={kind}
            type="button"
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("application/archvision-node", JSON.stringify({ kind }));
              e.dataTransfer.effectAllowed = "move";
            }}
            className="flex flex-col items-center gap-1 rounded-xl border border-line bg-white px-1 py-2 text-center transition-all hover:border-primary/40 hover:bg-primary/5 hover:shadow-sm active:cursor-grabbing"
            title={`Add ${label} — drag onto canvas`}
          >
            <span className="text-primary/80">{KIND_ICON[kind]}</span>
            <span className="text-[10.5px] font-semibold text-foreground">{label}</span>
          </button>
        ))}
      </div>
      <p className="mt-3 border-t border-line pt-2 text-[10px] leading-relaxed text-slate-400">
        Drag between node handles to create relationships. Select a shape or line to edit it.
      </p>
    </aside>
  );
}