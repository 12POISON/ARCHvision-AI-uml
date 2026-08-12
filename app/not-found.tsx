import Link from "next/link";
import { Boxes, Compass } from "lucide-react";

export default function NotFound(): React.ReactElement {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-deep text-white shadow-btn-primary">
        <Boxes className="h-8 w-8" />
      </span>
      <p className="mt-8 text-[11px] font-bold uppercase tracking-[0.2em] text-primary">404 · Page not found</p>
      <h1 className="mt-3 max-w-md text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
        This page drifted off the diagram
      </h1>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
        The link may be outdated, or the address was mistyped. Your diagrams are safe — head back to
        the workspace and keep going.
      </p>
      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
        <Link
          href="/dashboard"
          className="inline-flex h-10 items-center gap-2 rounded-btn2 bg-primary px-5 text-sm font-bold text-white shadow-btn-primary transition-all duration-300 hover:-translate-y-0.5 hover:shadow-btn-primary-hover"
        >
          <Compass className="h-4 w-4" />
          Go to dashboard
        </Link>
        <Link
          href="/"
          className="inline-flex h-10 items-center rounded-btn2 border border-line bg-white px-5 text-sm font-semibold text-foreground transition-colors hover:border-slate-300"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
