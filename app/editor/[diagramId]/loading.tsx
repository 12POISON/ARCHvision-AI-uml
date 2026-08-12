import { Skeleton } from "@/components/ui/skeleton";

export default function EditorLoading(): React.ReactElement {
  return (
    <main className="flex h-screen flex-col overflow-hidden bg-white">
      <div className="flex h-16 items-center justify-between border-b border-line px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-xl" />
          <Skeleton className="h-5 w-40" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="hidden h-9 w-24 rounded-btn2 sm:block" />
          <Skeleton className="h-9 w-28 rounded-btn2" />
          <Skeleton className="h-9 w-9 rounded-full" />
        </div>
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col gap-4 bg-surface/40 p-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-32 rounded-card" />
            ))}
          </div>
          <Skeleton className="h-48 rounded-card" />
        </div>
      </div>
    </main>
  );
}
