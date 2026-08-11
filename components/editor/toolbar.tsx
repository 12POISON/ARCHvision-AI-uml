"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ChevronDown,
  Code2,
  Download,
  FileCode2,
  History,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Wand2,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DiagramType, ViewMode } from "@/types/diagram";
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
}

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
}: ToolbarProps): React.ReactElement {
  const router = useRouter();
  const { setSidePanel, setAnalysisOpen, setCodeGenOpen, setDocsOpen, setVersionOpen } = useEditorUI();
  const [exportOpen, setExportOpen] = React.useState(false);

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
            <Button variant="outline" size="icon" onClick={onToggleCodePanel} aria-label="Toggle code panel" className={cn(codePanelOpen && "border-primary/40 bg-primary/5 text-primary")}>
              <Code2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Toggle code panel</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSidePanel("validation")}
              aria-label="Open validation panel"
            >
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

        <Button onClick={() => setSidePanel("ai")} className="gap-1.5">
          <Wand2 className="h-4 w-4" />
          <Sparkles className="h-3 w-3 text-amber-300" />
          <span className="hidden sm:inline">AI Assistant</span>
        </Button>
      </div>
    </motion.div>
  );
}