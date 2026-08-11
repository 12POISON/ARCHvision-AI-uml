"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, FilePlus2, FolderKanban, RefreshCw, Workflow } from "lucide-react";
import { StatsBar } from "@/components/dashboard/stats-bar";
import { NewDiagramModal } from "@/components/dashboard/new-diagram-modal";
import { NewProjectModal } from "@/components/dashboard/new-project-modal";
import { NewProjectCard } from "@/components/dashboard/project-card";
import { DiagramCard } from "@/components/dashboard/diagram-card";
import { Button } from "@/components/ui/button";
import type { Diagram, Project } from "@/types/diagram";

interface DashboardViewProps {
  user: { name?: string | null };
  projects: Project[];
  diagrams: Diagram[];
}

export function DashboardView({ user, projects, diagrams }: DashboardViewProps): React.ReactElement {
  const [modalOpen, setModalOpen] = React.useState(false);
  const [projectModalOpen, setProjectModalOpen] = React.useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  React.useEffect(() => {
    if (searchParams.get("new") === "1") {
      setModalOpen(true);
      const url = new URL(window.location.href);
      url.searchParams.delete("new");
      window.history.replaceState(null, "", url.toString());
    }
  }, [searchParams]);

  React.useEffect(() => {
    const handler = (): void => setModalOpen(true);
    window.addEventListener("archvision:new-diagram", handler);
    const projectHandler = (): void => setProjectModalOpen(true);
    window.addEventListener("archvision:new-project", projectHandler);
    return () => {
      window.removeEventListener("archvision:new-diagram", handler);
      window.removeEventListener("archvision:new-project", projectHandler);
    };
  }, []);

  React.useEffect(() => {
    const projectId = searchParams.get("projectId");
    if (!projectId) return;
    const el = document.querySelector(`[data-project-id="${projectId}"]`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-primary/40");
      setTimeout(() => el.classList.remove("ring-2", "ring-primary/40"), 1600);
    }
    const url = new URL(window.location.href);
    url.searchParams.delete("projectId");
    window.history.replaceState(null, "", url.toString());
  }, [searchParams]);

  const recentDiagrams = [...diagrams]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 4);

  const totalDiagrams = diagrams.length;
  const totalClasses = diagrams.length * 4;
  const userName = user?.name?.split(" ")[0] ?? "Explorer";

  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-28 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"
      >
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Workspace</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Welcome back, {userName}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {projects.length} {projects.length === 1 ? "project" : "projects"} · {totalDiagrams}{" "}
            {totalDiagrams === 1 ? "diagram" : "diagrams"} in your workspace
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button variant="outline" onClick={() => router.refresh()} aria-label="Refresh workspace">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={() => setModalOpen(true)}>
            <FilePlus2 className="h-4 w-4" />
            New diagram
          </Button>
        </div>
      </motion.div>

      <div className="mb-12">
        <StatsBar diagrams={totalDiagrams} projects={projects.length} classes={totalClasses} methods={8} />
      </div>

      <div className="mb-4 grid gap-5 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-primary"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 text-primary transition-transform duration-300 group-hover:scale-110">
            <FilePlus2 className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-bold text-foreground">New Diagram</span>
            <span className="block text-[13px] text-muted-foreground">Paste a vision, AI does the rest</span>
          </span>
          <ArrowRight className="ml-auto h-4 w-4 text-slate-300 transition-all duration-300 group-hover:translate-x-1 group-hover:text-primary" />
        </button>
        <button
          type="button"
          onClick={() => router.push("/projects")}
          className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-primary"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 text-primary transition-transform duration-300 group-hover:scale-110">
            <FolderKanban className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-bold text-foreground">Browse Projects</span>
            <span className="block text-[13px] text-muted-foreground">Jump across all your projects</span>
          </span>
          <ArrowRight className="ml-auto h-4 w-4 text-slate-300 transition-all duration-300 group-hover:translate-x-1 group-hover:text-primary" />
        </button>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-extrabold tracking-tight text-foreground">Recent diagrams</h2>
        <p className="text-[13px] text-muted-foreground">{recentDiagrams.length} shown</p>
      </div>

      {recentDiagrams.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <h3 className="text-lg font-extrabold tracking-tight text-foreground">No diagrams yet. Create your first.</h3>
          <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted">
            Paste a vision in plain language and the AI engine turns it into architecture.
          </p>
          <div className="mt-6">
            <Button onClick={() => setModalOpen(true)}>
              <FilePlus2 className="h-4 w-4" />
              Create your first diagram
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {recentDiagrams.map((diagram, index) => (
            <DiagramCard key={diagram.id} diagram={diagram} index={index} />
          ))}
        </div>
      )}

      <div className="mb-6 mt-12 flex items-center justify-between">
        <h2 className="text-lg font-extrabold tracking-tight text-foreground">Projects</h2>
        <Link href="/projects" className="inline-flex items-center gap-1 text-sm font-semibold text-primary transition-colors hover:text-primary-deep">
          View all <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <h3 className="text-lg font-extrabold tracking-tight text-foreground">No projects yet. Create your first.</h3>
          <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted">
            Projects group your diagrams into one workspace.
          </p>
          <div className="mt-6">
            <Button onClick={() => setProjectModalOpen(true)}>
              <FilePlus2 className="h-4 w-4" />
              Create your first project
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.slice(0, 3).map((project) => (
            <Link
              key={project.id}
              data-project-id={project.id}
              href={`/dashboard?projectId=${project.id}`}
              className="group flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-primary"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 text-primary transition-transform duration-300 group-hover:scale-110">
                <FolderKanban className="h-5 w-5" />
              </span>
              <h3 className="mt-3 truncate text-base font-extrabold tracking-tight text-foreground">{project.name}</h3>
              <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-muted">
                {project.description ?? "No description yet — this project is ready for its first diagram."}
              </p>
              <div className="mt-auto flex items-center justify-between pt-4">
                <span className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                  <Workflow className="h-3.5 w-3.5" />
                  {project.diagramCount} {project.diagramCount === 1 ? "diagram" : "diagrams"}
                </span>
                <span className="text-[13px] font-semibold text-primary transition-colors group-hover:text-primary-deep">
                  Open →
                </span>
              </div>
            </Link>
          ))}
          <NewProjectCard onClick={() => setProjectModalOpen(true)} />
        </div>
      )}

      <NewDiagramModal open={modalOpen} onOpenChange={setModalOpen} projects={projects} />
      <NewProjectModal open={projectModalOpen} onOpenChange={setProjectModalOpen} />
    </div>
  );
}
