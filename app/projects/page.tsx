import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FolderKanban, FolderPlus, Workflow } from "lucide-react";
import { auth } from "@/lib/auth";
import { repository } from "@/lib/data/repository";
import { Navbar } from "@/components/layout/navbar";
import { CommandPalette } from "@/components/layout/command-palette";

export const metadata: Metadata = {
  title: "Projects",
  description: "All your architecture projects in one place.",
};

export default async function ProjectsPage(): Promise<React.ReactElement> {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const projects = await repository.listProjects();

  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <CommandPalette />
      <div className="mx-auto max-w-7xl px-4 pb-24 pt-28 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Workspace</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">Projects</h1>
            <p className="mt-2 text-sm text-muted">
              {projects.length} {projects.length === 1 ? "project" : "projects"} in your workspace
            </p>
          </div>
          <Link
            href="/dashboard?new=1"
            className="btn btn-primary inline-flex h-10 items-center gap-2 px-4 text-sm"
          >
            <FolderPlus className="h-4 w-4" />
            New Project
          </Link>
        </div>

        {projects.length === 0 ? (
          <div className="mt-10 rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <FolderKanban className="h-6 w-6" />
            </span>
            <h2 className="mt-4 text-lg font-extrabold tracking-tight text-foreground">No projects yet</h2>
            <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted">
              Create your first project to start turning visions into diagrams.
            </p>
            <div className="mt-6">
              <Link
                href="/dashboard?new=1"
                className="btn btn-primary inline-flex h-10 items-center gap-2 px-4 text-sm"
              >
                <FolderPlus className="h-4 w-4" />
                Create your first project
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/dashboard?projectId=${project.id}`}
                className="group flex flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md focus-visible:outline-2 focus-visible:outline-primary"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 text-primary transition-transform duration-300 group-hover:scale-110">
                  <FolderKanban className="h-5 w-5" strokeWidth={2} />
                </span>
                <h3 className="mt-4 text-lg font-extrabold tracking-tight text-foreground">{project.name}</h3>
                <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted">
                  {project.description ?? "No description yet — this project is ready for its first diagram."}
                </p>
                <div className="mt-auto flex items-center justify-between pt-5">
                  <span className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                    <Workflow className="h-3.5 w-3.5" />
                    {project.diagramCount} {project.diagramCount === 1 ? "diagram" : "diagrams"}
                  </span>
                  <span className="text-sm font-semibold text-primary transition-colors group-hover:text-primary-deep">
                    Open →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
