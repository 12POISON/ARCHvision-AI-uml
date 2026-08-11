import { cn } from "@/lib/utils";

interface SpinnerProps {
  className?: string;
  label?: string;
}

function Spinner({ className, label = "Loading" }: SpinnerProps): React.ReactElement {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12" role="status" aria-label={label}>
      <div
        className={cn(
          "h-8 w-8 animate-spin rounded-full border-[3px] border-slate-200 border-t-primary",
          className
        )}
      />
      <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
    </div>
  );
}

export { Spinner };