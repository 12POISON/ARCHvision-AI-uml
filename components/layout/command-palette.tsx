"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Boxes,
  Code2,
  FileText,
  LayoutGrid,
  Plus,
  ScanSearch,
  Search,
  ShieldCheck,
  Sparkles,
  Wand2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Command {
  id: string;
  label: string;
  hint: string;
  icon: React.ReactNode;
  keywords: string;
  run: () => void;
  category: string;
}

export function CommandPalette(): React.ReactElement {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const router = useRouter();

  React.useEffect(() => {
    const handler = (): void => {
      setOpen(true);
      setQuery("");
    };
    window.addEventListener("archvision:command", handler);
    return () => window.removeEventListener("archvision:command", handler);
  }, []);

  const commands: Command[] = React.useMemo(() => {
    const editor = typeof window !== "undefined" ? window.location.pathname.startsWith("/editor") : false;
    const list: Command[] = [
      {
        id: "new-diagram",
        label: "Create new diagram",
        hint: "Open the scope wizard",
        icon: <Plus className="h-4 w-4" />,
        keywords: "new create diagram wizard ai generate",
        category: "Create",
        run: () => {
          window.dispatchEvent(new CustomEvent("archvision:new-diagram"));
        },
      },
      {
        id: "dashboard",
        label: "Go to dashboard",
        hint: "Projects & diagrams",
        icon: <LayoutGrid className="h-4 w-4" />,
        keywords: "dashboard projects home",
        category: "Navigate",
        run: () => router.push("/dashboard"),
      },
      ...(editor
        ? [
            {
              id: "toggle-code",
              label: "Toggle code panel",
              hint: "Open Monaco editor",
              icon: <Code2 className="h-4 w-4" />,
              keywords: "code panel monaco editor toggle",
              category: "Editor",
              run: () => window.dispatchEvent(new CustomEvent("archvision:toggle-code")),
            },
            {
              id: "ai-sidebar",
              label: "Open AI assistant",
              hint: "Chat with your diagram",
              icon: <Sparkles className="h-4 w-4" />,
              keywords: "ai assistant chat sidebar",
              category: "Editor",
              run: () => window.dispatchEvent(new CustomEvent("archvision:ai-sidebar")),
            },
            {
              id: "validate",
              label: "Run UML validation",
              hint: "Checklist & score",
              icon: <ShieldCheck className="h-4 w-4" />,
              keywords: "validate check score rules",
              category: "Editor",
              run: () => window.dispatchEvent(new CustomEvent("archvision:validate")),
            },
            {
              id: "analyze",
              label: "Architecture analysis",
              hint: "Critic & metrics",
              icon: <ScanSearch className="h-4 w-4" />,
              keywords: "analyze critic metrics coupling",
              category: "Editor",
              run: () => window.dispatchEvent(new CustomEvent("archvision:analyze")),
            },
            {
              id: "docs",
              label: "Generate design docs",
              hint: "Markdown documentation",
              icon: <FileText className="h-4 w-4" />,
              keywords: "docs documentation explain markdown readme",
              category: "Editor",
              run: () => window.dispatchEvent(new CustomEvent("archvision:docs")),
            },
            {
              id: "codegen",
              label: "Generate source code",
              hint: "TS / Java / Python / C#",
              icon: <Wand2 className="h-4 w-4" />,
              keywords: "code generate source typescript java python csharp",
              category: "Editor",
              run: () => window.dispatchEvent(new CustomEvent("archvision:codegen")),
            },
            {
              id: "export",
              label: "Export diagram",
              hint: "SVG / PNG / PDF / JSON",
              icon: <Boxes className="h-4 w-4" />,
              keywords: "export download svg png pdf json plantuml",
              category: "Editor",
              run: () => window.dispatchEvent(new CustomEvent("archvision:export")),
            },
          ]
        : []),
    ];
    return list;
  }, [router]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => c.label.toLowerCase().includes(q) || c.keywords.includes(q));
  }, [query, commands]);

  React.useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  React.useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, [open]);

  const run = (command: Command): void => {
    setOpen(false);
    command.run();
  };

  const onKeyDown = (event: React.KeyboardEvent): void => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter" && filtered[activeIndex]) {
      event.preventDefault();
      run(filtered[activeIndex]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/25 pt-[16vh] backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="w-full max-w-xl overflow-hidden rounded-3xl border border-line bg-white shadow-panel-float"
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
          >
            <div className="flex items-center gap-3 border-b border-line px-5 py-4">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Type a command or search…"
                className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                aria-label="Search commands"
              />
              <kbd className="rounded-md border border-line bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                ESC
              </kbd>
            </div>
            <div className="max-h-[46vh] overflow-y-auto p-2">
              {filtered.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No commands match <span className="font-semibold text-foreground">“{query}”</span>
                </p>
              ) : (
                <div className="space-y-0.5">
                  {filtered.map((command, index) => (
                    <button
                      key={command.id}
                      type="button"
                      onClick={() => run(command)}
                      onMouseEnter={() => setActiveIndex(index)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors duration-150",
                        index === activeIndex ? "bg-slate-100" : "hover:bg-slate-50"
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                          index === activeIndex ? "bg-primary text-white" : "bg-slate-100 text-slate-500"
                        )}
                      >
                        {command.icon}
                      </span>
                      <span className="flex-1">
                        <span className="block font-medium text-foreground">{command.label}</span>
                        <span className="block text-xs text-muted-foreground">{command.hint}</span>
                      </span>
                      <ArrowRight
                        className={cn(
                          "h-4 w-4 transition-opacity duration-150",
                          index === activeIndex ? "opacity-100 text-primary" : "opacity-0"
                        )}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}