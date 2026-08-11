"use client";

import * as React from "react";
import { create } from "zustand";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastState {
  toasts: ToastItem[];
  push: (type: ToastType, message: string) => void;
  dismiss: (id: number) => void;
}

export const useToasts = create<ToastState>((set) => ({
  toasts: [],
  push: (type, message) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    set((s) => ({ toasts: [...s.toasts.slice(-3), { id, type, message }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 3500);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export function toast(type: ToastType, message: string): void {
  useToasts.getState().push(type, message);
}

const ICONS: Record<ToastType, React.ReactElement> = {
  success: <CheckCircle2 className="h-4 w-4 text-success" />,
  error: <XCircle className="h-4 w-4 text-error" />,
  info: <Info className="h-4 w-4 text-primary" />,
};

export function Toaster(): React.ReactElement {
  const toasts = useToasts((s) => s.toasts);
  const dismiss = useToasts((s) => s.dismiss);

  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-[60] w-full max-w-sm -translate-x-1/2 px-4" aria-live="polite">
      <AnimatePresence>
        {toasts.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className={cn(
              "pointer-events-auto mb-2 flex items-center gap-2.5 rounded-xl border border-line bg-white px-4 py-3 shadow-panel-float",
              item.type === "error" ? "border-red-200" : item.type === "success" ? "border-emerald-200" : "border-blue-200"
            )}
            role="status"
          >
            {ICONS[item.type]}
            <p className="min-w-0 flex-1 text-[13px] font-medium leading-snug text-foreground">{item.message}</p>
            <button
              type="button"
              onClick={() => dismiss(item.id)}
              aria-label="Dismiss notification"
              className="rounded-md p-0.5 text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}