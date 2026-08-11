import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>): React.ReactElement {
  return (
    <div
      className={cn("animate-pulse rounded-xl bg-slate-100", className)}
      aria-hidden="true"
      {...props}
    />
  );
}

export { Skeleton };