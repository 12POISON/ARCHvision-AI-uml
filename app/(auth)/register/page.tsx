import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Logo } from "@/components/layout/navbar";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = {
  title: "Create account",
};

export default async function RegisterPage(): Promise<React.ReactElement> {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white px-4">
      <div className="orb orb-2 right-[-5%] top-[-5%] h-[360px] w-[360px]" />
      <div className="relative w-full max-w-md">
        <div className="card-elevated p-8 shadow-panel-float">
          <div className="mb-8 flex justify-center">
            <Logo />
          </div>
          <AuthForm
            mode="register"
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