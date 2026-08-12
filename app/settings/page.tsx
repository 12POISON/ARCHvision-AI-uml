import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Mail, ShieldCheck, TriangleAlert, User } from "lucide-react";
import { auth } from "@/lib/auth";
import { Navbar } from "@/components/layout/navbar";
import { CommandPalette } from "@/components/layout/command-palette";
import { SignOutButton } from "@/components/settings/sign-out-button";
import { DeleteAccountButton } from "@/components/settings/danger-zone";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Settings",
  description: "Account settings for ArchVision AI.",
};

export default async function SettingsPage(): Promise<React.ReactElement> {
  const session = await auth();
  const user = session?.user;

  return (
    <main className="min-h-screen bg-white">
      <Navbar user={user} />
      <CommandPalette />
      <div className="mx-auto max-w-7xl px-4 pb-24 pt-28 sm:px-6 lg:px-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>

        <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-foreground">Settings</h1>
        <p className="mt-2 text-sm text-muted">Manage your account and workspace preferences.</p>

        <div className="mt-10 grid max-w-3xl gap-6">
          <section className="card-elevated p-6">
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <User className="h-6 w-6" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-lg font-extrabold tracking-tight text-foreground">
                  {user?.name ?? "Explorer"}
                </p>
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" /> {user?.email ?? "—"}
                </p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Badge variant="outline">Demo account</Badge>
              <Badge variant="outline">Local workspace</Badge>
              <Badge variant="outline">
                <ShieldCheck className="h-3 w-3" /> Session stored as JWT
              </Badge>
            </div>
          </section>

          <section className="card-elevated p-6">
            <h2 className="text-base font-bold text-foreground">Access</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              This instance runs with demo access and an offline AI extraction engine. Configure OAuth provider
              keys in <code className="text-primary">.env</code> to enable GitHub / Google sign-in.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <SignOutButton />
            </div>
          </section>

          <section className="rounded-xl border border-error/20 bg-red-50/40 p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-error/10 text-error">
                <TriangleAlert className="h-5 w-5" />
              </span>
              <h2 className="text-base font-bold text-foreground">Danger Zone</h2>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Permanently remove your account and all associated diagrams. This action cannot be undone.
            </p>
            <div className="mt-5">
              <DeleteAccountButton />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}