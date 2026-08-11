import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { repository } from "@/lib/data/repository";
import { Navbar } from "@/components/layout/navbar";
import { CommandPalette } from "@/components/layout/command-palette";
import { DashboardView } from "@/components/dashboard/dashboard-view";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your projects, diagrams and workspace activity.",
};

export const dynamic = "force-dynamic";

export default async function DashboardPage(): Promise<React.ReactElement> {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  let projects: Awaited<ReturnType<typeof repository.listProjects>> = [];
  let diagrams: Awaited<ReturnType<typeof repository.listDiagrams>> = [];
  try {
    [projects, diagrams] = await Promise.all([
      repository.listProjects(),
      repository.listDiagrams("project_demo_auth"),
    ]);
  } catch {
    // Workspace data service unavailable — render empty states instead of crashing.
  }

  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <CommandPalette />
      <DashboardView user={session.user} projects={projects} diagrams={diagrams} />
    </main>
  );
}
