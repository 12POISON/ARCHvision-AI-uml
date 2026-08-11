import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface GlassPanelProps {
  className?: string;
  children?: React.ReactNode;
  id?: string;
  elevated?: boolean;
  animate?: boolean;
  hoverable?: boolean;
  delay?: number;
  style?: React.CSSProperties;
}

const GlassPanel = React.forwardRef<HTMLDivElement, GlassPanelProps>(
  ({ className, elevated = false, animate = true, hoverable = false, delay = 0, ...props }, ref) => {
    const classes = cn(
      "glass rounded-card border border-line",
      elevated ? "shadow-panel-float" : "shadow-card",
      hoverable && "transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover cursor-pointer",
      className
    );
    if (!animate) {
      return <div ref={ref} className={classes} {...props} />;
    }
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 14, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1], delay }}
        className={classes}
        {...props}
      />
    );
  }
);
GlassPanel.displayName = "GlassPanel";

export { GlassPanel };