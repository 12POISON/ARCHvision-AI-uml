"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Sparkles, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { DIAGRAM_TYPES } from "@/types/diagram";
import { storage } from "@/lib/data/storage";
import { extractModelFromText } from "@/lib/ai/mock-engine";
import { modelToMermaid } from "@/lib/mermaid/parser";
import { useWorkspaceStore } from "@/lib/data/workspace-store";

type QuickType = "CLASS" | "SEQUENCE" | "ER";

interface NewDiagramModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: string | null;
}

interface ScopeEntity {
  name: string;
  included: boolean;
}

export function NewDiagramModal({ open, onOpenChange, projectId }: NewDiagramModalProps): React.ReactElement {
  const router = useRouter();
  const projects = useWorkspaceStore((s) => s.projects);
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [selectedProject, setSelectedProject] = React.useState("");
  const [type, setType] = React.useState<QuickType>("CLASS");
  const [extracting, setExtracting] = React.useState(false);
  const [preview, setPreview] = React.useState<ScopeEntity[] | null>(null);
  const [mermaidPreview, setMermaidPreview] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setSelectedProject(projectId ?? projects[0]?.id ?? "");
      setName("");
      setDescription("");
      setPreview(null);
      setMermaidPreview(null);
      setType("CLASS");
    }
  }, [open, projectId, projects]);

  const runExtraction = async (): Promise<void> => {
    if (!description.trim()) return;
    setExtracting(true);
    setMermaidPreview(null);
    await new Promise((resolve) => setTimeout(resolve, 450));
    const model = extractModelFromText(description);
    setPreview(model.classes.map((cls) => ({ name: cls.name, included: true })));
    setMermaidPreview(modelToMermaid(model));
    setExtracting(false);
  };

  const includedCount = preview?.filter((p) => p.included).length ?? 0;

  const createDiagram = async (): Promise<void> => {
    const targetProject = selectedProject || projects[0]?.id;
    if (!targetProject) return;
    const finalName =
      name.trim() ||
      (preview ? "Diagram from description" : type === "CLASS" ? "Class Diagram" : type === "SEQUENCE" ? "Sequence Diagram" : "ER Diagram");
    const diagram = await storage.createDiagram({ name: finalName, type, description }, targetProject, mermaidPreview ?? undefined);
    router.push(`/editor/${diagram.id}`);
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-2xl">
        <ModalHeader>
          <ModalTitle>Create a diagram</ModalTitle>
          <ModalDescription>
            Describe the system in plain language — we extract the model, you confirm the scope.
          </ModalDescription>
        </ModalHeader>

        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="nd-name">Name</Label>
              <Input id="nd-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Authentication domain" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nd-project">Project</Label>
              <select
                id="nd-project"
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="input-base cursor-pointer appearance-none disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Project"
                disabled={projects.length === 0}
              >
                {projects.length === 0 ? (
                  <option value="">No projects yet</option>
                ) : (
                  projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))
                )}
              </select>
              {projects.length === 0 ? (
                <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">
                  No projects yet.{" "}
                  <button
                    type="button"
                    onClick={() => {
                      onOpenChange(false);
                      window.dispatchEvent(new CustomEvent("archvision:new-project"));
                    }}
                    className="font-semibold text-primary hover:underline"
                  >
                    Create one first
                  </button>
                </p>
              ) : null}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="nd-desc">System description</Label>
            <Textarea
              id="nd-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                "e.g. \"An e-commerce system with User, Order and Payment entities. A user has many orders and one cart. Orders are processed by the PaymentService which uses the PaymentGateway.\""
              }
              rows={4}
            />
          </div>

          {preview && preview.length > 0 ? (
            <div className="rounded-2xl border border-amber-200/70 bg-accent-soft/60 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="flex items-center gap-2 text-[13px] font-bold text-[#92400E]">
                  <Sparkles className="h-3.5 w-3.5" />
                  Extracted scope — {includedCount} {includedCount === 1 ? "entity" : "entities"}
                </p>
                <button
                  type="button"
                  onClick={() => setPreview(null)}
                  className="text-[12px] font-semibold text-amber-700 transition-colors hover:text-amber-900"
                >
                  Reset
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {preview.map((entity) => (
                  <button
                    key={entity.name}
                    type="button"
                    onClick={() =>
                      setPreview((prev) =>
                        (prev ?? []).map((p) => (p.name === entity.name ? { ...p, included: !p.included } : p))
                      )
                    }
                    className={cn(
                      "flex items-center gap-1.5 rounded-pill border px-3 py-1.5 text-[12.5px] font-semibold transition-all duration-200",
                      entity.included
                        ? "border-amber-300 bg-white text-[#92400E] shadow-sm"
                        : "border-amber-200 bg-transparent text-amber-700/40 line-through"
                    )}
                    aria-pressed={entity.included}
                  >
                    <span
                      className={cn(
                        "flex h-4 w-4 items-center justify-center rounded-full border transition-colors duration-200",
                        entity.included ? "border-amber-400 bg-amber-400 text-white" : "border-amber-300 bg-white"
                      )}
                    >
                      {entity.included ? <Check className="h-2.5 w-2.5" /> : null}
                    </span>
                    {entity.name}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            {DIAGRAM_TYPES.filter((t) => ["CLASS", "SEQUENCE", "ER"].includes(t.value)).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setType(option.value as QuickType)}
                className={cn(
                  "rounded-pill border px-4 py-1.5 text-[12.5px] font-semibold transition-all duration-200",
                  type === option.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-line text-muted hover:border-slate-300 hover:text-foreground"
                )}
                aria-pressed={type === option.value}
              >
                {option.label}
              </button>
            ))}
            <Badge variant="outline" className="ml-auto">
              auto-detect from text
            </Badge>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <Button variant="outline" onClick={() => void runExtraction()} loading={extracting} className="flex-1">
              {extracting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Extract scope
            </Button>
            <Button onClick={createDiagram} disabled={!description.trim() && preview === null} className="flex-1">
              <Wand2 className="h-4 w-4" />
              Generate diagram
            </Button>
          </div>

          <p className="text-center text-[11px] text-muted-foreground">
            With a provider key, extraction runs on GPT-4o / Claude · offline mode uses ArchVision&apos;s local
            extraction engine
          </p>
        </div>
      </ModalContent>
    </Modal>
  );
}