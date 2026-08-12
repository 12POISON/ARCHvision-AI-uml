import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Navbar } from "@/components/layout/navbar";
import { CommandPalette } from "@/components/layout/command-palette";
import { DashboardView } from "@/components/dashboard/dashboard-view";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your projects, diagrams and workspace activity.",
};

export default async function DashboardPage(): Promise<React.ReactElement> {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  // Workspace reads happen client-side through the same `storage` facade
  // used for writes (lib/data/workspace-store.ts) — one data source, with
  // the facade's DB health check, timeout and offline fallback.
  return (
    <main className="min-h-screen bg-white">
      <Navbar user={session.user} />
      <CommandPalette />
      <DashboardView user={session.user} />
    </main>
  );
}
