"use client";

import * as React from "react";
import {
  Box,
  Cpu,
  Database,
  FileCode2,
  FolderGit2,
  LayoutTemplate,
  PersonStanding,
  Save,
  Settings2,
  Star,
  X,
} from "lucide-react";
import { PALETTE_KINDS } from "@/lib/architecture/editing";
import type { ArchitectureNodeKind } from "@/types/diagram";
import { TEMPLATES, TEMPLATE_CATEGORIES, type EditorTemplate } from "@/lib/architecture/templates";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/toast";

const KIND_ICON: Record<ArchitectureNodeKind, React.ReactElement> = {
  class: <Box className="h-3.5 w-3.5" />,
  interface: <FileCode2 className="h-3.5 w-3.5" />,
  actor: <PersonStanding className="h-3.5 w-3.5" />,
  database: <Database className="h-3.5 w-3.5" />,
  controller: <Cpu className="h-3.5 w-3.5" />,
  service: <Settings2 className="h-3.5 w-3.5" />,
  repository: <FolderGit2 className="h-3.5 w-3.5" />,
  abstract: <Box className="h-3.5 w-3.5" />,
  enum: <Box className="h-3.5 w-3.5" />,
  entity: <Box className="h-3.5 w-3.5" />,
  table: <Database className="h-3.5 w-3.5" />,
  component: <Box className="h-3.5 w-3.5" />,
  package: <FolderGit2 className="h-3.5 w-3.5" />,
  boundary: <Box className="h-3.5 w-3.5" />,
  external: <Box className="h-3.5 w-3.5" />,
  api: <Box className="h-3.5 w-3.5" />,
  event: <Box className="h-3.5 w-3.5" />,
  state: <Box className="h-3.5 w-3.5" />,
};

const CATEGORY_LABEL: Record<EditorTemplate["category"], string> = {
  diagram: "Diagrams",
  uml: "UML",
  flow: "Flows",
  planning: "Planning",
};

const MY_TEMPLATES_KEY = "archvision:my-templates";

interface MyTemplate {
  id: string;
  name: string;
  code: string;
}

function loadMyTemplates(): MyTemplate[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(MY_TEMPLATES_KEY) ?? "[]") as MyTemplate[];
  } catch {
    return [];
  }
}

export function PaletteSidebar({
  open,
  onClose,
  onApplyTemplate,
  onSaveTemplate,
  mermaidCode,
}: {
  open: boolean;
  onClose: () => void;
  onApplyTemplate: (code: string, name: string) => void;
  onSaveTemplate: (code: string) => void;
  mermaidCode: string;
}): React.ReactElement | null {
  const [tab, setTab] = React.useState<"shapes" | "templates" | "mine">("shapes");
  const [category, setCategory] = React.useState<EditorTemplate["category"]>("diagram");
  const [myTemplates, setMyTemplates] = React.useState<MyTemplate[]>([]);

  React.useEffect(() => {
    if (tab === "mine") setMyTemplates(loadMyTemplates());
  }, [tab]);

  if (!open) return null;

  const templates = TEMPLATES.filter((t) => t.category === category);

  return (
    <aside
      role="complementary"
      aria-label="Palette"
      className="absolute left-3 top-3 z-30 flex w-[200px] flex-col rounded-2xl border border-line bg-white/95 p-3 shadow-panel-float backdrop-blur"
    >
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Palette</p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close palette"
          className="rounded-md p-0.5 text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mb-3 flex rounded-pill border border-line bg-surface p-0.5">
        {(
          [
            ["shapes", "Shapes"],
            ["templates", "Templates"],
            ["mine", "Mine"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              "flex-1 rounded-pill px-2 py-1 text-[10.5px] font-semibold transition-colors",
              tab === key ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "shapes" ? (
        <>
          <p className="mb-3 text-[10.5px] leading-relaxed text-slate-400">
            Drag a shape onto the canvas to add it.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {PALETTE_KINDS.map(({ kind, label }) => (
              <button
                key={kind}
                type="button"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("application/archvision-node", JSON.stringify({ kind }));
                  e.dataTransfer.effectAllowed = "move";
                }}
                className="flex flex-col items-center gap-1 rounded-xl border border-line bg-white px-1 py-2 text-center transition-all hover:border-primary/40 hover:bg-primary/5 hover:shadow-sm active:cursor-grabbing"
                title={`Add ${label} — drag onto canvas`}
              >
                <span className="text-primary/80">{KIND_ICON[kind]}</span>
                <span className="text-[10.5px] font-semibold text-foreground">{label}</span>
              </button>
            ))}
          </div>
          <p className="mt-3 border-t border-line pt-2 text-[10px] leading-relaxed text-slate-400">
            Drag between node handles to create relationships. Select a shape or line to edit it.
          </p>
        </>
      ) : null}

      {tab === "templates" ? (
        <>
          <div className="mb-2 flex flex-wrap gap-1">
            {TEMPLATE_CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={cn(
                  "rounded-pill px-2 py-0.5 text-[10px] font-semibold transition-colors",
                  category === c ? "bg-primary text-white" : "bg-surface text-muted-foreground hover:text-foreground"
                )}
              >
                {CATEGORY_LABEL[c]}
              </button>
            ))}
          </div>
          <ul className="max-h-[50vh] space-y-2 overflow-auto pr-0.5">
            {templates.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => {
                    onApplyTemplate(t.build(), t.name);
                    toast("success", `Template “${t.name}” applied`);
                  }}
                  className="w-full rounded-xl border border-line bg-white p-2.5 text-left transition-all hover:border-primary/40 hover:bg-primary/5 hover:shadow-sm"
                >
                  <span className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-[12px] text-primary">
                      {t.icon}
                    </span>
                    <span className="text-[12px] font-bold text-foreground">{t.name}</span>
                  </span>
                  <span className="mt-1 block text-[10.5px] leading-snug text-muted-foreground">{t.description}</span>
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => {
              onSaveTemplate(mermaidCode);
              toast("success", "Current diagram saved as a template");
            }}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-line py-2 text-[11px] font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
          >
            <Save className="h-3.5 w-3.5" />
            Save current as template
          </button>
        </>
      ) : null}

      {tab === "mine" ? (
        <>
          <p className="mb-2 text-[10.5px] text-slate-400">Templates you saved.</p>
          {myTemplates.length === 0 ? (
            <div className="flex flex-col items-center gap-1 py-6 text-center">
              <Star className="h-6 w-6 text-slate-300" />
              <p className="text-[11px] text-muted-foreground">No saved templates yet.</p>
              <p className="max-w-[150px] text-[10px] text-slate-400">
                Use “Save current as template” to keep one.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {myTemplates.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onApplyTemplate(t.code, t.name);
                      toast("success", `Template “${t.name}” applied`);
                    }}
                    className="flex w-full items-center gap-2 rounded-xl border border-line bg-white p-2.5 text-left transition-all hover:border-primary/40 hover:bg-primary/5"
                  >
                    <LayoutTemplate className="h-3.5 w-3.5 shrink-0 text-primary" />
                    <span className="truncate text-[12px] font-bold text-foreground">{t.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : null}
    </aside>
  );
}
