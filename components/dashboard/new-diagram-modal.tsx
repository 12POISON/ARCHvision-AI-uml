"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Plus, Sparkles, Trash2, Wand2 } from "lucide-react";
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
import type { Architecture, ArchitectureNodeKind, ArchitectureRelationshipType, UMLModel } from "@/types/diagram";
import { storage } from "@/lib/data/storage";
import { toast } from "@/components/ui/toast";
import { extractModelFromText } from "@/lib/ai/mock-engine";
import { describeModel } from "@/lib/ai/describe";
import { modelToMermaid } from "@/lib/mermaid/parser";
import { architectureToMermaid } from "@/lib/architecture/serialization";
import { createEmptyArchitecture } from "@/lib/architecture/model";
import { validateArchitecture } from "@/lib/architecture/validate";
import { KIND_LABELS } from "@/lib/architecture/editing";
import { RELATION_SPECS_EXTENDED, RELATION_TYPE_ORDER } from "@/lib/editor/relations";
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

interface ManualNode {
  name: string;
  kind: ArchitectureNodeKind;
}

interface ManualRelationship {
  source: string;
  target: string;
  type: ArchitectureRelationshipType;
  label: string;
}

const MANUAL_KINDS: Array<{ value: ArchitectureNodeKind; label: string }> = [
  "class",
  "interface",
  "abstract",
  "entity",
  "table",
  "controller",
  "service",
  "repository",
  "database",
  "api",
  "actor",
  "event",
].map((kind) => ({ value: kind as ArchitectureNodeKind, label: KIND_LABELS[kind as ArchitectureNodeKind] }));

const RELATION_TYPE_OPTIONS = RELATION_TYPE_ORDER.map((type) => ({
  value: type,
  label: RELATION_SPECS_EXTENDED[type].label,
}));

export function NewDiagramModal({ open, onOpenChange, projectId }: NewDiagramModalProps): React.ReactElement {
  const router = useRouter();
  const projects = useWorkspaceStore((s) => s.projects);
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [selectedProject, setSelectedProject] = React.useState("");
  const [type, setType] = React.useState<QuickType>("CLASS");
  const [tab, setTab] = React.useState<"description" | "manual">("description");
  const [extracting, setExtracting] = React.useState(false);
  const [describing, setDescribing] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [preview, setPreview] = React.useState<ScopeEntity[] | null>(null);
  const [extractedModel, setExtractedModel] = React.useState<UMLModel | null>(null);
  const [mermaidPreview, setMermaidPreview] = React.useState<string | null>(null);
  const [manualNodes, setManualNodes] = React.useState<ManualNode[]>([]);
  const [manualRelationships, setManualRelationships] = React.useState<ManualRelationship[]>([]);

  React.useEffect(() => {
    if (open) {
      setSelectedProject(projectId ?? projects[0]?.id ?? "");
      setName("");
      setDescription("");
      setPreview(null);
      setExtractedModel(null);
      setMermaidPreview(null);
      setType("CLASS");
      setTab("description");
      setManualNodes([{ name: "Entity", kind: "class" }]);
      setManualRelationships([]);
    }
  }, [open, projectId, projects]);

  const runExtraction = async (): Promise<void> => {
    if (!description.trim()) return;
    setExtracting(true);
    setMermaidPreview(null);
    await new Promise((resolve) => setTimeout(resolve, 450));
    const model = extractModelFromText(description);
    setExtractedModel(model);
    setPreview(model.classes.map((cls) => ({ name: cls.name, included: true })));
    setMermaidPreview(modelToMermaid(model));
    setExtracting(false);
  };

  const runDescription = async (): Promise<void> => {
    if (!extractedModel) return;
    setDescribing(true);
    try {
      const result = await describeModel(extractedModel);
      setDescription(result.text);
    } catch {
      setDescription(
        `${extractedModel.classes.length} classes, ${extractedModel.links.length} relationships extracted from the description.`
      );
    } finally {
      setDescribing(false);
    }
  };

  const includedCount = preview?.filter((p) => p.included).length ?? 0;

  const manualArchitecture: Architecture = React.useMemo(() => {
    const arch = createEmptyArchitecture("CLASS", name.trim() || "Untitled");
    for (const node of manualNodes) {
      const cleanName = node.name.trim() || `Node${arch.nodes.length + 1}`;
      if (!arch.nodes.some((n) => n.name === cleanName)) {
        arch.nodes.push({
          id: cleanName,
          name: cleanName,
          kind: node.kind,
          stereotype: null,
          parentId: null,
          attributes: [],
          methods: [],
          isAbstract: false,
          isInterface: node.kind === "interface",
          notes: [],
        });
      }
    }
    for (const rel of manualRelationships) {
      if (rel.source && rel.target && rel.source !== rel.target) {
        arch.relationships.push({
          id: `manual-rel-${arch.relationships.length}`,
          source: rel.source,
          target: rel.target,
          type: rel.type,
          label: rel.label.trim() || null,
          sourceMultiplicity: "1",
          targetMultiplicity: "1",
          direction: "forward",
          action: null,
          foreignKeyColumn: null,
        });
      }
    }
    return arch;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manualNodes, manualRelationships, name]);

  const manualValidation = React.useMemo(() => validateArchitecture(manualArchitecture), [manualArchitecture]);

  const createDiagram = async (): Promise<void> => {
    const targetProject = selectedProject || projects[0]?.id;
    if (!targetProject) return;
    setCreating(true);
    try {
      let finalMermaid: string | undefined = mermaidPreview ?? undefined;
      if (tab === "manual" && manualArchitecture.nodes.length > 0) {
        finalMermaid = architectureToMermaid(manualArchitecture);
      }
      const finalName =
        name.trim() ||
        (preview
          ? "Diagram from description"
          : tab === "manual"
            ? "Class Diagram"
            : type === "CLASS"
              ? "Class Diagram"
              : type === "SEQUENCE"
                ? "Sequence Diagram"
                : "ER Diagram");
      const diagram = await storage.createDiagram(
        { name: finalName, type: tab === "manual" ? "CLASS" : type, description },
        targetProject,
        finalMermaid
      );
      router.push(`/editor/${diagram.id}`);
      onOpenChange(false);
    } catch (err) {
      console.error("Create diagram failed", err);
      toast("error", err instanceof Error ? `Couldn't create diagram: ${err.message}` : "Couldn't create diagram");
    } finally {
      setCreating(false);
    }
  };

  const canCreate =
    tab === "manual"
      ? manualArchitecture.nodes.length > 0
      : Boolean(description.trim() || preview !== null);

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-2xl">
        <ModalHeader>
          <ModalTitle>Create a diagram</ModalTitle>
          <ModalDescription>
            Describe the system in plain language, or build the model manually — we validate it either way.
          </ModalDescription>
        </ModalHeader>

        <div className="mb-4 flex items-center gap-1 rounded-pill border border-line bg-surface p-1">
          {(
            [
              { id: "description", label: "AI description" },
              { id: "manual", label: "Manual info" },
            ] as const
          ).map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setTab(option.id)}
              className={cn(
                "flex-1 rounded-pill px-3 py-1.5 text-[12.5px] font-semibold transition-colors",
                tab === option.id ? "bg-white text-foreground shadow-sm" : "text-muted hover:text-foreground"
              )}
              aria-pressed={tab === option.id}
            >
              {option.label}
            </button>
          ))}
        </div>

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

          {tab === "description" ? (
            <>
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
                <div className="rounded-2xl border border-accent-200/70 bg-accent-soft/60 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="flex items-center gap-2 text-[13px] font-bold text-teal-900">
                      <Sparkles className="h-3.5 w-3.5" />
                      Extracted scope — {includedCount} {includedCount === 1 ? "entity" : "entities"}
                    </p>
                    <button
                      type="button"
                      onClick={() => setPreview(null)}
                      className="text-[12px] font-semibold text-teal-700 transition-colors hover:text-teal-900"
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
                            ? "border-accent-300 bg-white text-teal-900 shadow-sm"
                            : "border-accent-200 bg-transparent text-teal-700/40 line-through"
                        )}
                        aria-pressed={entity.included}
                      >
                        <span
                          className={cn(
                            "flex h-4 w-4 items-center justify-center rounded-full border transition-colors duration-200",
                            entity.included ? "border-accent bg-accent text-teal-950" : "border-accent-300 bg-white"
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
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[12.5px] font-bold text-foreground">Nodes</p>
                <button
                  type="button"
                  onClick={() => setManualNodes((prev) => [...prev, { name: `Node${prev.length + 1}`, kind: "class" }])}
                  className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold text-primary hover:bg-primary/5"
                >
                  <Plus className="h-3 w-3" /> Add node
                </button>
              </div>
              <div className="space-y-2">
                {manualNodes.map((node, index) => (
                  <div key={index} className="flex items-center gap-1.5">
                    <Input
                      aria-label={`Node ${index + 1} name`}
                      value={node.name}
                      onChange={(e) =>
                        setManualNodes((prev) => prev.map((n, i) => (i === index ? { ...n, name: e.target.value } : n)))
                      }
                      className="h-8 flex-1"
                      placeholder="Name"
                    />
                    <select
                      aria-label={`Node ${index + 1} kind`}
                      value={node.kind}
                      onChange={(e) =>
                        setManualNodes((prev) =>
                          prev.map((n, i) => (i === index ? { ...n, kind: e.target.value as ArchitectureNodeKind } : n))
                        )
                      }
                      className="h-8 w-36 rounded-lg border border-line bg-white px-2 text-[12px] font-medium text-foreground outline-none transition-colors focus:border-primary/60"
                    >
                      {MANUAL_KINDS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      aria-label={`Remove node ${node.name}`}
                      onClick={() => {
                        setManualNodes((prev) => prev.filter((_, i) => i !== index));
                        setManualRelationships((rels) => rels.filter((r) => r.source !== node.name && r.target !== node.name));
                      }}
                      className="rounded-md p-1 text-slate-400 transition-colors hover:bg-error/10 hover:text-error"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <p className="text-[12.5px] font-bold text-foreground">Relationships</p>
                <button
                  type="button"
                  onClick={() =>
                    setManualRelationships((prev) => [
                      ...prev,
                      { source: manualNodes[0]?.name ?? "", target: manualNodes[1]?.name ?? manualNodes[0]?.name ?? "", type: "association", label: "" },
                    ])
                  }
                  className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold text-primary hover:bg-primary/5"
                >
                  <Plus className="h-3 w-3" /> Add relationship
                </button>
              </div>
              <div className="space-y-2">
                {manualRelationships.map((rel, index) => (
                  <div key={index} className="flex items-center gap-1.5">
                    <select
                      aria-label={`Relationship ${index + 1} source`}
                      value={rel.source}
                      onChange={(e) =>
                        setManualRelationships((prev) => prev.map((r, i) => (i === index ? { ...r, source: e.target.value } : r)))
                      }
                      className="h-8 w-32 rounded-lg border border-line bg-white px-2 text-[12px] font-medium text-foreground outline-none transition-colors focus:border-primary/60"
                    >
                      {manualNodes.map((node) => (
                        <option key={node.name} value={node.name}>
                          {node.name}
                        </option>
                      ))}
                    </select>
                    <select
                      aria-label={`Relationship ${index + 1} type`}
                      value={rel.type}
                      onChange={(e) =>
                        setManualRelationships((prev) =>
                          prev.map((r, i) => (i === index ? { ...r, type: e.target.value as ArchitectureRelationshipType } : r))
                        )
                      }
                      className="h-8 w-32 rounded-lg border border-line bg-white px-2 text-[12px] font-medium text-foreground outline-none transition-colors focus:border-primary/60"
                    >
                      {RELATION_TYPE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <select
                      aria-label={`Relationship ${index + 1} target`}
                      value={rel.target}
                      onChange={(e) =>
                        setManualRelationships((prev) => prev.map((r, i) => (i === index ? { ...r, target: e.target.value } : r)))
                      }
                      className="h-8 w-32 rounded-lg border border-line bg-white px-2 text-[12px] font-medium text-foreground outline-none transition-colors focus:border-primary/60"
                    >
                      {manualNodes.map((node) => (
                        <option key={node.name} value={node.name}>
                          {node.name}
                        </option>
                      ))}
                    </select>
                    <Input
                      aria-label={`Relationship ${index + 1} label`}
                      value={rel.label}
                      onChange={(e) =>
                        setManualRelationships((prev) => prev.map((r, i) => (i === index ? { ...r, label: e.target.value } : r)))
                      }
                      className="h-8 flex-1"
                      placeholder="label"
                    />
                    <button
                      type="button"
                      aria-label={`Remove relationship ${index + 1}`}
                      onClick={() => setManualRelationships((prev) => prev.filter((_, i) => i !== index))}
                      className="rounded-md p-1 text-slate-400 transition-colors hover:bg-error/10 hover:text-error"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                {manualRelationships.length === 0 ? (
                  <p className="text-[11px] text-slate-400">No relationships yet</p>
                ) : null}
              </div>

              <div className="rounded-2xl border border-line bg-surface/60 p-4">
                <div className="flex items-center gap-2">
                  <Badge variant={manualValidation.score >= 70 ? "success" : manualValidation.score >= 40 ? "warning" : "error"}>
                    Score: {manualValidation.score}/100
                  </Badge>
                  <p className="text-[11.5px] text-muted-foreground">
                    {manualArchitecture.nodes.length} nodes · {manualArchitecture.relationships.length} relationships
                  </p>
                </div>
                {manualValidation.issues.length > 0 ? (
                  <ul className="mt-2 space-y-1">
                    {manualValidation.issues.slice(0, 4).map((issue, index) => (
                      <li key={index} className="text-[11.5px] text-muted-foreground">
                        {issue.severity === "critical" ? "🔴" : issue.severity === "warning" ? "🟠" : "🔵"} {issue.message}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-[11.5px] font-medium text-emerald-700">No validation issues — the model is consistent.</p>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {tab === "description" ? (
              <>
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
              </>
            ) : (
              <Badge variant="outline">Class diagram (manual)</Badge>
            )}
            <Badge variant="outline" className="ml-auto">
              {tab === "manual" ? "validated live" : "auto-detect from text"}
            </Badge>
          </div>

          <div className="flex items-center gap-3 pt-1">
            {tab === "description" ? (
              <>
                <Button variant="outline" onClick={() => void runExtraction()} loading={extracting} className="flex-1">
                  {extracting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Extract scope
                </Button>
                <Button
                  variant="outline"
                  onClick={() => void runDescription()}
                  loading={describing}
                  disabled={!extractedModel}
                  className="flex-1"
                >
                  {describing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  AI description
                </Button>
              </>
            ) : null}
            <Button onClick={() => void createDiagram()} disabled={!canCreate || creating} className="flex-1">
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
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