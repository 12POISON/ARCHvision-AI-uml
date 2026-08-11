"use client";

import { useEffect } from "react";

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }): React.ReactElement {
  useEffect(() => {
    console.error("[app] Unhandled client error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-6 text-center">
      <h2 className="text-xl font-extrabold tracking-tight text-foreground">Something went wrong</h2>
      <p className="max-w-md text-sm text-muted">An unexpected error occurred. You can try again — your work is safe.</p>
      <p className="max-w-md text-xs text-red-500">{error.message}</p>
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
