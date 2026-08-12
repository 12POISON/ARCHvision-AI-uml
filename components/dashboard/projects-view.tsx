"use client";

import * as React from "react";
import { FolderPlus } from "lucide-react";
import { ProjectCard, NewProjectCard, type LiteDiagram, type ProjectWithDiagrams } from "@/components/dashboard/project-card";
import { NewProjectModal } from "@/components/dashboard/new-project-modal";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { useWorkspaceStore } from "@/lib/data/workspace-store";

export function ProjectsView(): React.ReactElement {
  const { projects, diagrams, loaded, reload, deleteProject } = useWorkspaceStore();
  const [modalOpen, setModalOpen] = React.useState(false);

  React.useEffect(() => {
    void reload();
  }, [reload]);

  const withDiagrams: ProjectWithDiagrams[] = React.useMemo(
    () =>
      projects.map((project) => ({
        ...project,
        diagrams: diagrams
          .filter((d) => d.projectId === project.id)
          .map((d): LiteDiagram => ({ id: d.id, name: d.name, type: d.type, updatedAt: d.updatedAt })),
      })),
    [projects, diagrams]
  );

  const handleDelete = async (id: string): Promise<void> => {
    const project = projects.find((p) => p.id === id);
    if (!project) return;
    if (!window.confirm(`Delete "${project.name}" and all of its diagrams? This can't be undone.`)) return;
    try {
      await deleteProject(id);
      toast("success", `Project "${project.name}" deleted`);
    } catch (err) {
      toast("error", err instanceof Error ? `Couldn't delete project: ${err.message}` : "Couldn't delete project");
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-28 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Workspace</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">Projects</h1>
          <p className="mt-2 text-sm text-muted">
            {loaded
              ? `${projects.length} ${projects.length === 1 ? "project" : "projects"} in your workspace`
              : "Loading workspace…"}
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)} disabled={!loaded}>
          <FolderPlus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      {!loaded ? (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-56 animate-pulse rounded-card bg-slate-100" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <h2 className="text-lg font-extrabold tracking-tight text-foreground">No projects yet</h2>
          <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted">
            Create your first project to start turning visions into diagrams.
          </p>
          <div className="mt-6">
            <Button onClick={() => setModalOpen(true)}>
              <FolderPlus className="h-4 w-4" />
              Create your first project
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {withDiagrams.map((project) => (
            <ProjectCard key={project.id} project={project} onDeleted={(id) => void handleDelete(id)} />
          ))}
          <NewProjectCard onClick={() => setModalOpen(true)} />
        </div>
      )}

      <NewProjectModal open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
}
