"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  AlignCenter,
  AlignHorizontalDistributeCenter,
  AlignLeft,
  AlignRight,
  AlignVerticalDistributeCenter,
  AlignEndHorizontal,
  AlignEndVertical,
  AlignStartVertical,
  ArrowLeft,
  ChevronDown,
  Clipboard,
  Code2,
  Copy,
  Download,
  FileCode2,
  FileText,
  FileUp,
  History,
  LayoutGrid,
  Maximize,
  MessageSquare,
  Minus,
  Plus,
  Printer,
  Redo2,
  RotateCcw,
  ScanSearch,
  Scissors,
  Share2,
  ShieldCheck,
  Sparkles,
  Trash2,
  Undo2,
  Wand2,
  ZoomIn,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DiagramType, ViewMode } from "@/types/diagram";
import type { DiagramEngine } from "@/hooks/useDiagram";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown";
import { useEditorUI } from "@/hooks/useDiagram";

interface ToolbarProps {
  diagramName: string;
  diagramType: DiagramType;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  validationScore: number | null;
  isValid: boolean;
  onExport: (format: string) => void;
  codePanelOpen: boolean;
  onToggleCodePanel: () => void;
  engine: DiagramEngine;
  commentCount: number;
}

const ALIGN_ITEMS: Array<{ axis: "left" | "center" | "right" | "top" | "middle" | "bottom"; label: string; icon: React.ReactNode }> = [
  { axis: "left", label: "Align left", icon: <AlignLeft className="h-3.5 w-3.5" /> },
  { axis: "center", label: "Align center (h)", icon: <AlignCenter className="h-3.5 w-3.5" /> },
  { axis: "right", label: "Align right", icon: <AlignRight className="h-3.5 w-3.5" /> },
  { axis: "top", label: "Align top", icon: <AlignStartVertical className="h-3.5 w-3.5" /> },
  { axis: "middle", label: "Align middle (v)", icon: <AlignEndVertical className="h-3.5 w-3.5" /> },
  { axis: "bottom", label: "Align bottom", icon: <AlignEndHorizontal className="h-3.5 w-3.5" /> },
];

const dispatch = (name: string, detail?: Record<string, unknown>): void => {
  window.dispatchEvent(new CustomEvent(name, { detail }));
};

export function Toolbar({
  diagramName,
  diagramType,
  viewMode,
  onViewModeChange,
  validationScore,
  isValid,
  onExport,
  codePanelOpen,
  onToggleCodePanel,
  engine,
  commentCount,
}: ToolbarProps): React.ReactElement {
  const router = useRouter();
  const { setSidePanel, setAnalysisOpen, setCodeGenOpen, setDocsOpen, setVersionOpen, setShareOpen, setAiGenerateOpen, setImportOpen, setCheatSheetOpen } = useEditorUI();
  const [exportOpen, setExportOpen] = React.useState(false);
  const [fileOpen, setFileOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [viewOpen, setViewOpen] = React.useState(false);
  const [arrangeOpen, setArrangeOpen] = React.useState(false);

  React.useEffect(() => {
    const handler = (): void => setExportOpen(true);
    window.addEventListener("archvision:export-menu", handler);
    return () => window.removeEventListener("archvision:export-menu", handler);
  }, []);

  const exportFormats = [
    { id: "svg", label: "SVG (vector)", hint: "Best for embedding & editing" },
    { id: "png", label: "PNG (2x)", hint: "Crisp raster, any viewer" },
    { id: "pdf", label: "PDF report", hint: "Vector document" },
    { id: "plantuml", label: "PlantUML", hint: "Source code export" },
    { id: "mermaid", label: "Mermaid (.mmd)", hint: "Portable source" },
    { id: "json", label: "JSON model", hint: "Machine-readable AST" },
  ];

  const menuTrigger = (label: string, open: boolean): React.ReactNode => (
    <span className="flex items-center gap-1 px-2.5 py-1.5 text-[12px] font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-foreground rounded-btn2">
      {label}
      <ChevronDown className={cn("h-3 w-3 text-slate-400 transition-transform", open && "rotate-180")} />
    </span>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="glass flex items-center gap-2 border-b border-line px-4 py-2.5"
    >
      <button
        type="button"
        onClick={() => router.push("/dashboard")}
        className="flex h-8 w-8 items-center justify-center rounded-btn2 text-slate-500 transition-colors duration-200 hover:bg-slate-100 hover:text-foreground"
        aria-label="Back to dashboard"
      >
        <ArrowLeft className="h-4 w-4" />
      </button>

      <div className="flex min-w-0 items-center gap-2.5">
        <h1 className="truncate text-[14.5px] font-bold tracking-tight text-foreground">{diagramName}</h1>
        <Badge variant="soft-blue">{diagramType.toLowerCase()} diagram</Badge>
        {validationScore !== null ? (
          <Badge variant={isValid ? "success" : "warning"}>{validationScore}/100</Badge>
        ) : null}
      </div>

      <div className="mx-auto hidden items-center gap-0.5 lg:flex">
        <DropdownMenu open={fileOpen} onOpenChange={setFileOpen}>
          <DropdownMenuTrigger asChild>
            <button type="button" className="rounded-btn2 hover:bg-surface" aria-label="File menu">
              {menuTrigger("File", fileOpen)}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem onClick={() => router.push("/dashboard?new=1")}>
              <Plus className="h-3.5 w-3.5 text-slate-400" /> New diagram
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setImportOpen(true)}>
              <FileUp className="h-3.5 w-3.5 text-slate-400" /> Import…
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Export</DropdownMenuLabel>
            {exportFormats.map((format) => (
              <DropdownMenuItem key={format.id} onClick={() => onExport(format.id)}>
                <Download className="h-3.5 w-3.5 text-slate-400" />
                <span className="flex w-full items-center justify-between">
                  <span className="font-medium">{format.label}</span>
                  <span className="text-xs text-muted-foreground">{format.hint}</span>
                </span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setShareOpen(true)}>
              <Share2 className="h-3.5 w-3.5 text-slate-400" /> Share…
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.print()}>
              <Printer className="h-3.5 w-3.5 text-slate-400" /> Print
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu open={editOpen} onOpenChange={setEditOpen}>
          <DropdownMenuTrigger asChild>
            <button type="button" className="rounded-btn2 hover:bg-surface" aria-label="Edit menu">
              {menuTrigger("Edit", editOpen)}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
            <DropdownMenuItem disabled={!engine.canUndo} onClick={() => engine.undo()}>
              <Undo2 className="h-3.5 w-3.5 text-slate-400" /> Undo
              <span className="ml-auto text-[10px] text-muted-foreground">Ctrl Z</span>
            </DropdownMenuItem>
            <DropdownMenuItem disabled={!engine.canRedo} onClick={() => engine.redo()}>
              <Redo2 className="h-3.5 w-3.5 text-slate-400" /> Redo
              <span className="ml-auto text-[10px] text-muted-foreground">Ctrl Shift Z</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => dispatch("archvision:duplicate-selected")}>
              <Copy className="h-3.5 w-3.5 text-slate-400" /> Duplicate
              <span className="ml-auto text-[10px] text-muted-foreground">Ctrl D</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => dispatch("archvision:copy-selected")}>
              <Clipboard className="h-3.5 w-3.5 text-slate-400" /> Copy
              <span className="ml-auto text-[10px] text-muted-foreground">Ctrl C</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => dispatch("archvision:cut-selected")}>
              <Scissors className="h-3.5 w-3.5 text-slate-400" /> Cut
              <span className="ml-auto text-[10px] text-muted-foreground">Ctrl X</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => dispatch("archvision:paste")}>
              <Clipboard className="h-3.5 w-3.5 text-slate-400" /> Paste
              <span className="ml-auto text-[10px] text-muted-foreground">Ctrl V</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => dispatch("archvision:select-all")}>
              <Maximize className="h-3.5 w-3.5 text-slate-400" /> Select all
              <span className="ml-auto text-[10px] text-muted-foreground">Ctrl A</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => dispatch("archvision:delete-selected")}>
              <Trash2 className="h-3.5 w-3.5 text-slate-400" /> Delete
              <span className="ml-auto text-[10px] text-muted-foreground">Del</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu open={viewOpen} onOpenChange={setViewOpen}>
          <DropdownMenuTrigger asChild>
            <button type="button" className="rounded-btn2 hover:bg-surface" aria-label="View menu">
              {menuTrigger("View", viewOpen)}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
            <DropdownMenuItem onClick={() => dispatch("archvision:fit-view")}>
              <Maximize className="h-3.5 w-3.5 text-slate-400" /> Fit to screen
              <span className="ml-auto text-[10px] text-muted-foreground">Ctrl F</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => dispatch("archvision:zoom-in")}>
              <ZoomIn className="h-3.5 w-3.5 text-slate-400" /> Zoom in
              <span className="ml-auto text-[10px] text-muted-foreground">Ctrl +</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => dispatch("archvision:zoom-out")}>
              <Minus className="h-3.5 w-3.5 text-slate-400" /> Zoom out
              <span className="ml-auto text-[10px] text-muted-foreground">Ctrl -</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => dispatch("archvision:zoom-reset")}>
              <RotateCcw className="h-3.5 w-3.5 text-slate-400" /> Reset zoom
              <span className="ml-auto text-[10px] text-muted-foreground">Ctrl 0</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onToggleCodePanel}>
              <Code2 className="h-3.5 w-3.5 text-slate-400" /> Toggle code panel
              <span className="ml-auto text-[10px] text-muted-foreground">Ctrl E</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setCheatSheetOpen(true)}>
              <Sparkles className="h-3.5 w-3.5 text-slate-400" /> Shortcuts
              <span className="ml-auto text-[10px] text-muted-foreground">Ctrl ?</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu open={arrangeOpen} onOpenChange={setArrangeOpen}>
          <DropdownMenuTrigger asChild>
            <button type="button" className="rounded-btn2 hover:bg-surface" aria-label="Arrange menu">
              {menuTrigger("Arrange", arrangeOpen)}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Align</DropdownMenuLabel>
            {ALIGN_ITEMS.map((item) => (
              <DropdownMenuItem key={item.axis} onClick={() => dispatch("archvision:align", { axis: item.axis })}>
                {item.icon} {item.label}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Distribute</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => dispatch("archvision:distribute", { axis: "horizontal" })}>
              <AlignHorizontalDistributeCenter className="h-3.5 w-3.5 text-slate-400" /> Evenly (horizontal)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => dispatch("archvision:distribute", { axis: "vertical" })}>
              <AlignVerticalDistributeCenter className="h-3.5 w-3.5 text-slate-400" /> Evenly (vertical)
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => dispatch("archvision:auto-layout")}>
              <LayoutGrid className="h-3.5 w-3.5 text-slate-400" /> Auto layout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mx-auto hidden items-center gap-1.5 rounded-pill border border-line bg-white p-1 lg:flex">
        <span className="px-2 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">View</span>
        {(["EXECUTIVE", "ENGINEERING"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => onViewModeChange(mode)}
            className={cn(
              "rounded-pill px-3.5 py-1.5 text-[12px] font-semibold transition-all duration-300",
              viewMode === mode ? "bg-primary text-white shadow-btn-primary" : "text-slate-500 hover:text-foreground"
            )}
            aria-pressed={viewMode === mode}
          >
            {mode === "EXECUTIVE" ? "Executive" : "Engineering"}
          </button>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-1.5 lg:ml-0">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" onClick={() => engine.undo()} disabled={!engine.canUndo} aria-label="Undo">
              <Undo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Undo (Ctrl Z)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" onClick={() => engine.redo()} disabled={!engine.canRedo} aria-label="Redo">
              <Redo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Redo (Ctrl Shift Z)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" onClick={onToggleCodePanel} aria-label="Toggle code panel" className={cn(codePanelOpen && "border-primary/40 bg-primary/5 text-primary")}>
              <Code2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Toggle code panel</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" onClick={() => setSidePanel("validation")} aria-label="Open validation panel">
              <ShieldCheck className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>UML validation</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" onClick={() => setAnalysisOpen(true)} aria-label="Run architecture analysis">
              <ScanSearch className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Architecture analysis</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" onClick={() => setCodeGenOpen(true)} aria-label="Generate source code">
              <FileCode2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Generate code</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" onClick={() => setDocsOpen(true)} aria-label="Generate documentation">
              <FileText className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Design docs</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" onClick={() => setVersionOpen(true)} aria-label="Open version history">
              <History className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Version history</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" onClick={() => setShareOpen(true)} aria-label="Share diagram">
              <Share2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Share</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" onClick={() => useEditorUI.getState().setCommentsOpen(true)} aria-label="Open comments" className="relative">
              <MessageSquare className="h-4 w-4" />
              {commentCount > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-pill bg-primary px-1 text-[9.5px] font-bold text-white">
                  {commentCount}
                </span>
              ) : null}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Comments</TooltipContent>
        </Tooltip>

        <DropdownMenu open={exportOpen} onOpenChange={setExportOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-1.5">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel>Export diagram</DropdownMenuLabel>
            {exportFormats.map((format) => (
              <DropdownMenuItem key={format.id} onClick={() => onExport(format.id)}>
                <span className="flex w-full items-center justify-between">
                  <span className="font-medium">{format.label}</span>
                  <span className="text-xs text-muted-foreground">{format.hint}</span>
                </span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onExport("json")}>
              <span className="text-xs text-muted-foreground">Share as JSON link</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="outline" onClick={() => setAiGenerateOpen(true)} className="gap-1.5" aria-label="Generate diagram with AI">
          <Sparkles className="h-4 w-4" />
          <span className="hidden sm:inline">Generate</span>
        </Button>

        <Button onClick={() => setSidePanel("ai")} className="gap-1.5">
          <Wand2 className="h-4 w-4" />
          <Sparkles className="h-3 w-3 text-amber-300" />
          <span className="hidden sm:inline">AI Assistant</span>
        </Button>
      </div>
    </motion.div>
  );
}
