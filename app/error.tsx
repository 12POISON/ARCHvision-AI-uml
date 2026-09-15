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
      <h2 className="text-xl font-extrabold tracking-tight text-foreground">The pencil slipped</h2>
      <p className="max-w-md text-sm leading-relaxed text-muted">
        Something broke on our side. Your work autosaves as you go, so you can pick up right
        where you left off.
      </p>
      {error.digest ? (
        <p className="max-w-md text-xs text-muted-foreground">
          Support reference: <span className="font-mono">{error.digest}</span>
        </p>
      ) : null}
      <button type="button" onClick={reset} className="uiverse-btn">
        <div className="uiverse-btn-inner">
          <span className="uiverse-btn-label">Try again</span>
        </div>
      </button>
    </div>
  );
}
