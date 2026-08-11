import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Logo } from "@/components/layout/navbar";
import { AuthForm, type AuthMode } from "@/components/auth/auth-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to ArchVision AI to start generating UML diagrams.",
};

interface LoginPageProps {
  searchParams?: Record<string, string | string[] | undefined>;
}

export default async function LoginPage({ searchParams }: LoginPageProps): Promise<React.ReactElement> {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  const mode: AuthMode =
    Array.isArray(searchParams?.mode) ? (searchParams.mode[0] as AuthMode) : (searchParams?.mode as AuthMode) ?? "login";

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white px-4">
      <div className="orb orb-1 left-[15%] top-[-10%] h-[380px] w-[380px]" />
      <div className="orb orb-2 bottom-[-10%] right-[12%] h-[360px] w-[360px]" />

      <div className="relative w-full max-w-md">
        <div className="card-elevated p-8 shadow-panel-float">
          <div className="mb-8 flex justify-center">
            <Logo />
          </div>
          <AuthForm
            mode={mode}
            hasGithub={Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET)}
            hasGoogle={Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)}
          />
          <p className="mt-6 text-center text-xs text-muted-foreground">
            By continuing you agree to the <span className="font-medium text-slate-500">Terms</span> and{" "}
            <span className="font-medium text-slate-500">Privacy Policy</span>. No credit card required for demo access.
          </p>
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link href="/" className="font-medium text-primary transition-colors hover:text-primary-deep">
            ← Back to ArchVision AI
          </Link>
        </p>
      </div>
    </main>
  );
}