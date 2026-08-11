import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { Navbar } from "@/components/layout/navbar";
import { CommandPalette } from "@/components/layout/command-palette";
import { Dashboard } from "@/components/dashboard/dashboard-view";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your projects, diagrams and workspace activity.",
};

export default async function DashboardPage(): Promise<React.ReactElement> {
  const session = await auth();
  const userName = session?.user?.name ?? "Explorer";

  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <CommandPalette />
      <Dashboard userName={userName} />
    </main>
  );
}