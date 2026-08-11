import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva("btn", {
  variants: {
    variant: {
      primary: "btn-primary",
      ghost: "btn-ghost",
      outline: "btn-outline",
      accent: "btn-accent",
      danger: "btn-danger",
      subtle: "bg-slate-100 text-foreground hover:bg-slate-200",
    },
    size: {
      default: "h-10 px-4 text-sm",
      sm: "h-8 px-3 text-[13px] rounded-btn2",
      lg: "h-12 px-6 text-[15px]",
      icon: "h-9 w-9 rounded-btn2",
      "icon-sm": "h-7 w-7 rounded-btn2",
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "default",
  },
});

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        />
      ) : null}
      {children}
    </button>
  )
);
Button.displayName = "Button";

export { Button, buttonVariants };