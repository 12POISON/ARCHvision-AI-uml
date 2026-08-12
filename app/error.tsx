"use client";

import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }): React.ReactElement {
  useEffect(() => {
    // Full error goes to the console/log pipeline only — never to the rendered UI.
    console.error("[app] Unhandled error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-6 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-error">
        <TriangleAlert className="h-7 w-7" />
      </span>
      <h2 className="text-xl font-extrabold tracking-tight text-foreground">Something went wrong</h2>
      <p className="max-w-md text-sm leading-relaxed text-muted">
        An unexpected error occurred. Your changes are saved automatically as you work, so you can
        try again without losing your workspace.
      </p>
      {error.digest ? (
        <p className="max-w-md text-xs text-muted-foreground">
          Support reference: <span className="font-mono">{error.digest}</span>
        </p>
      ) : null}
      <button
        type="button"
        onClick={reset}
        className="rounded-btn2 bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-btn-primary transition-all duration-300 hover:-translate-y-0.5 hover:shadow-btn-primary-hover"
      >
        Try again
      </button>
    </div>
  );
}
