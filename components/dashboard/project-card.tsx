"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Boxes, Clock, GitBranch, Network, Plus, Trash2, Workflow } from "lucide-react";
import type { DiagramType, Project } from "@/types/diagram";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/utils";

export interface LiteDiagram {
  id: string;
  name: string;
  type: DiagramType;
  updatedAt: string;
}

export interface ProjectWithDiagrams extends Project {
  diagrams: LiteDiagram[];
}

interface ProjectCardProps {
  project: ProjectWithDiagrams;
  onDeleted: (id: string) => void;
}

export function ProjectCard({ project, onDeleted }: ProjectCardProps): React.ReactElement {
  const router = useRouter();
  const primaryDiagram = project.diagrams[0];

  const openFirstDiagram = (): void => {
    if (primaryDiagram) router.push(`/editor/${primaryDiagram.id}`);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="group relative"
    >
      <div
        role="button"
        tabIndex={0}
        onClick={openFirstDiagram}
        onKeyDown={(e) => {
          if (e.key === "Enter") openFirstDiagram();
        }}
        aria-label={`Open ${project.name}`}
        className="card-elevated flex h-full cursor-pointer flex-col p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover focus-visible:outline-2 focus-visible:outline-primary"
      >
        <div className="flex items-start justify-between">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 text-primary transition-transform duration-300 group-hover:scale-110">
            <Boxes className="h-5 w-5" strokeWidth={2} />
          </span>
          <div className="flex items-center gap-1.5">
            {project.lastSyncedAt ? (
              <Badge variant="success" className="gap-1.5 py-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-ring" />
                synced
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1.5 py-0.5">
                <Clock className="h-3 w-3" />
                {formatRelativeTime(project.updatedAt)}
              </Badge>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDeleted(project.id);
              }}
              className="rounded-lg p-1.5 text-slate-300 opacity-0 transition-all duration-200 hover:bg-red-50 hover:text-error group-hover:opacity-100"
              aria-label={`Delete project ${project.name}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <h3 className="mt-4 text-lg font-extrabold tracking-tight text-foreground">{project.name}</h3>
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted">
          {project.description ?? "No description yet — this project is ready for its first diagram."}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          {project.diagrams.slice(0, 2).map((diagram) => (
            <Badge key={diagram.id} variant="soft-blue" className="gap-1.5">
              <Network className="h-3 w-3" />
              {diagram.name}
            </Badge>
          ))}
          {project.diagrams.length > 2 ? <Badge variant="outline">+{project.diagrams.length - 2}</Badge> : null}
        </div>

        <div className="mt-auto flex items-center justify-between pt-5 text-[12px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <GitBranch className="h-3.5 w-3.5" />
            {project.githubRepo ?? "local"}
            {project.githubBranch ? <span className="text-slate-400">· {project.githubBranch}</span> : null}
          </span>
          <span className="flex items-center gap-1.5">
            <Workflow className="h-3.5 w-3.5" />
            {project.diagrams.length} {project.diagrams.length === 1 ? "diagram" : "diagrams"}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export function NewProjectCard({ onClick }: { onClick: () => void }): React.ReactElement {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1], delay: 0.15 }}
      className="group flex min-h-[220px] w-full flex-col items-center justify-center gap-3 rounded-card border-2 border-dashed border-slate-200 bg-transparent p-6 transition-colors duration-300 hover:border-primary/40 hover:bg-primary/[0.03] focus-visible:outline-2 focus-visible:outline-primary"
      aria-label="Create new diagram"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 transition-all duration-300 group-hover:bg-primary group-hover:text-white group-hover:shadow-btn-primary">
        <Plus className="h-6 w-6" />
      </span>
      <span className="text-sm font-semibold text-foreground">New diagram</span>
      <span className="text-[13px] text-muted-foreground">Paste a vision, AI does the rest</span>
    </motion.button>
  );
}