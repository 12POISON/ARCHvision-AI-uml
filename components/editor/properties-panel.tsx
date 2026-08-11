"use client";

import * as React from "react";
import { Trash2, Plus } from "lucide-react";
import type { ArchitectureRelationshipType, ArchitectureNodeKind, Visibility } from "@/types/diagram";
import { RELATION_SPECS, VALID_MULTIPLICITIES } from "@/types/diagram";
import {
  defaultAttribute,
  defaultMethod,
  KIND_LABELS,
  methodParametersToString,
  parseMethodParameters,
  VISIBILITY_OPTIONS,
  type NodeEditPatch,
  type RelationshipEditPatch,
} from "@/lib/architecture/editing";
import { cn } from "@/lib/utils";
import type { DiagramEngine } from "@/hooks/useDiagram";

interface PropertiesPanelProps {
  engine: DiagramEngine;
}

const NODE_KIND_OPTIONS: Array<{ value: ArchitectureNodeKind; label: string }> = [
  "class",
  "abstract",
  "interface",
  "entity",
  "controller",
  "service",
  "repository",
  "component",
  "actor",
  "database",
  "api",
  "event",
].map((kind) => ({ value: kind as ArchitectureNodeKind, label: KIND_LABELS[kind as ArchitectureNodeKind] }));

const RELATION_TYPE_OPTIONS = (
  ["association", "dependency", "inheritance", "aggregation", "composition", "implementation"] as const
).map((type) => ({ value: type, label: RELATION_SPECS[type].label }));

function Select({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  ariaLabel: string;
}): React.ReactElement {
  return (
    <select
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-8 w-full rounded-lg border border-line bg-white px-2 text-[12px] font-medium text-foreground outline-none transition-colors focus:border-primary/60"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel: string;
}): React.ReactElement {
  return (
    <input
      aria-label={ariaLabel}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="h-8 w-full rounded-lg border border-line bg-white px-2 text-[12px] font-medium text-foreground outline-none transition-colors focus:border-primary/60"
    />
  );
}

function SectionLabel({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <p className="mt-4 mb-1.5 text-[10.5px] font-bold uppercase tracking-widest text-muted-foreground">{children}</p>
  );
}

function NodeEditor({ engine }: { engine: DiagramEngine }): React.ReactElement | null {
  const node = engine.architecture.nodes.find((n) => n.id === engine.selectedNodeId);
  if (!node) return null;

  const patch = (p: NodeEditPatch): void => {
    engine.updateNode(node.id, p);
  };

  const setAttributes = (attributes: typeof node.attributes): void => patch({ attributes: attributes.map((a) => ({ ...a })) });
  const setMethods = (methods: typeof node.methods): void => patch({ methods: methods.map((m) => ({ ...m })) });

  return (
    <div className="p-4">
      <div className="flex items-center justify-between">
        <p className="text-[12px] font-bold text-foreground">Node properties</p>
        <button
          type="button"
          onClick={() => engine.removeNode(node.id)}
          className="flex items-center gap-1 rounded-lg border border-error/20 bg-error/5 px-2 py-1 text-[11px] font-semibold text-error transition-colors hover:bg-error/10"
        >
          <Trash2 className="h-3 w-3" /> Delete
        </button>
      </div>

      <SectionLabel>Identity</SectionLabel>
      <div className="space-y-2">
        <TextInput
          ariaLabel="Node name"
          value={node.name}
          onChange={(v) => patch({ name: v.trim() ? v : node.name })}
          placeholder="Name"
        />
        <Select
          ariaLabel="Node kind"
          value={node.kind}
          onChange={(v) => patch({ kind: v as ArchitectureNodeKind })}
          options={NODE_KIND_OPTIONS}
        />
      </div>

      <div className="mt-2 flex gap-2">
        <label className={cn("flex items-center gap-1.5 text-[11.5px] font-medium text-foreground", node.isInterface && "text-sky-600")}>
          <input
            type="checkbox"
            checked={node.isInterface}
            onChange={(e) => patch({ isInterface: e.target.checked })}
            className="h-3.5 w-3.5 accent-primary"
          />
          Interface
        </label>
        <label className={cn("flex items-center gap-1.5 text-[11.5px] font-medium text-foreground", node.isAbstract && "text-amber-600")}>
          <input
            type="checkbox"
            checked={node.isAbstract}
            onChange={(e) => patch({ isAbstract: e.target.checked })}
            className="h-3.5 w-3.5 accent-primary"
          />
          Abstract
        </label>
      </div>

      <div className="flex items-center justify-between">
        <SectionLabel>Attributes</SectionLabel>
        <button
          type="button"
          onClick={() => setAttributes([...node.attributes, defaultAttribute(`field${node.attributes.length + 1}`)])}
          className="mb-1.5 flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold text-primary hover:bg-primary/5"
        >
          <Plus className="h-3 w-3" /> Add
        </button>
      </div>
      <div className="space-y-1.5">
        {node.attributes.map((attr, index) => (
          <div key={`${attr.name}-${index}`} className="flex items-center gap-1.5">
            <Select
              ariaLabel={`Attribute ${attr.name} visibility`}
              value={attr.visibility}
              onChange={(v) => {
                const next = [...node.attributes];
                next[index] = { ...next[index], visibility: v as Visibility };
                setAttributes(next);
              }}
              options={VISIBILITY_OPTIONS.map((o) => ({ value: o.value, label: o.symbol }))}
            />
            <TextInput
              ariaLabel={`Attribute ${index + 1} name`}
              value={attr.name}
              onChange={(v) => {
                const next = [...node.attributes];
                next[index] = { ...next[index], name: v.trim() ? v : next[index].name };
                setAttributes(next);
              }}
            />
            <TextInput
              ariaLabel={`Attribute ${index + 1} type`}
              value={attr.type}
              onChange={(v) => {
                const next = [...node.attributes];
                next[index] = { ...next[index], type: v.trim() ? v : "string" };
                setAttributes(next);
              }}
            />
            <button
              type="button"
              aria-label={`Remove attribute ${attr.name}`}
              onClick={() => setAttributes(node.attributes.filter((_, i) => i !== index))}
              className="rounded-md p-1 text-slate-400 transition-colors hover:bg-error/10 hover:text-error"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}
        {node.attributes.length === 0 ? (
          <p className="text-[11px] text-slate-400">No attributes</p>
        ) : null}
      </div>

      <div className="flex items-center justify-between">
        <SectionLabel>Methods</SectionLabel>
        <button
          type="button"
          onClick={() => setMethods([...node.methods, defaultMethod(`method${node.methods.length + 1}`)])}
          className="mb-1.5 flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold text-primary hover:bg-primary/5"
        >
          <Plus className="h-3 w-3" /> Add
        </button>
      </div>
      <div className="space-y-1.5">
        {node.methods.map((method, index) => (
          <div key={`${method.name}-${index}`} className="space-y-1.5 rounded-lg border border-line p-1.5">
            <div className="flex items-center gap-1.5">
              <Select
                ariaLabel={`Method ${method.name} visibility`}
                value={method.visibility}
                onChange={(v) => {
                  const next = [...node.methods];
                  next[index] = { ...next[index], visibility: v as Visibility };
                  setMethods(next);
                }}
                options={VISIBILITY_OPTIONS.map((o) => ({ value: o.value, label: o.symbol }))}
              />
              <TextInput
                ariaLabel={`Method ${index + 1} name`}
                value={method.name}
                onChange={(v) => {
                  const next = [...node.methods];
                  next[index] = { ...next[index], name: v.trim() ? v : next[index].name };
                  setMethods(next);
                }}
              />
              <button
                type="button"
                aria-label={`Remove method ${method.name}`}
                onClick={() => setMethods(node.methods.filter((_, i) => i !== index))}
                className="rounded-md p-1 text-slate-400 transition-colors hover:bg-error/10 hover:text-error"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
            <div className="flex gap-1.5">
              <TextInput
                ariaLabel={`Method ${method.name} parameters`}
                value={methodParametersToString(method.parameters)}
                onChange={(v) => {
                  const next = [...node.methods];
                  next[index] = { ...next[index], parameters: parseMethodParameters(v) };
                  setMethods(next);
                }}
                placeholder="arg: string, id: number"
              />
              <TextInput
                ariaLabel={`Method ${method.name} return type`}
                value={method.returnType}
                onChange={(v) => {
                  const next = [...node.methods];
                  next[index] = { ...next[index], returnType: v.trim() ? v : "void" };
                  setMethods(next);
                }}
                placeholder="void"
              />
            </div>
          </div>
        ))}
        {node.methods.length === 0 ? (
          <p className="text-[11px] text-slate-400">No methods</p>
        ) : null}
      </div>
    </div>
  );
}

function EdgeEditor({ engine }: { engine: DiagramEngine }): React.ReactElement | null {
  const edge = engine.architecture.relationships.find((r) => r.id === engine.selectedEdgeId);
  if (!edge) return null;

  const patch = (p: RelationshipEditPatch): void => {
    engine.updateRelationship(edge.id, p);
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between">
        <p className="text-[12px] font-bold text-foreground">Relationship properties</p>
        <button
          type="button"
          onClick={() => engine.removeRelationship(edge.id)}
          className="flex items-center gap-1 rounded-lg border border-error/20 bg-error/5 px-2 py-1 text-[11px] font-semibold text-error transition-colors hover:bg-error/10"
        >
          <Trash2 className="h-3 w-3" /> Delete
        </button>
      </div>

      <p className="mt-2 truncate rounded-lg bg-surface px-2 py-1.5 font-mono text-[11px] text-muted-foreground">
        {edge.source} <span className="text-slate-400">→</span> {edge.target}
      </p>

      <SectionLabel>Type</SectionLabel>
      <Select
        ariaLabel="Relationship type"
        value={edge.type}
        onChange={(v) => patch({ type: v as ArchitectureRelationshipType })}
        options={RELATION_TYPE_OPTIONS}
      />

      <SectionLabel>Label</SectionLabel>
      <TextInput
        ariaLabel="Relationship label"
        value={edge.label ?? ""}
        onChange={(v) => patch({ label: v.trim() ? v : null })}
        placeholder="e.g. owns, depends, has"
      />

      <SectionLabel>Multiplicities</SectionLabel>
      <div className="flex gap-2">
        <div className="flex-1">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Source</p>
          <Select
            ariaLabel="Source multiplicity"
            value={edge.sourceMultiplicity}
            onChange={(v) => patch({ sourceMultiplicity: v })}
            options={Array.from(VALID_MULTIPLICITIES).map((m) => ({ value: m, label: m }))}
          />
        </div>
        <div className="flex-1">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Target</p>
          <Select
            ariaLabel="Target multiplicity"
            value={edge.targetMultiplicity}
            onChange={(v) => patch({ targetMultiplicity: v })}
            options={Array.from(VALID_MULTIPLICITIES).map((m) => ({ value: m, label: m }))}
          />
        </div>
      </div>

      <p className="mt-3 border-t border-line pt-2 text-[11px] leading-relaxed text-slate-400">
        Saved as Mermaid: {edge.source} {edge.sourceMultiplicity !== "1" ? `"${edge.sourceMultiplicity}" ` : ""}
        {RELATION_SPECS[edge.type as keyof typeof RELATION_SPECS]?.mermaid ?? "-->"}
        {edge.targetMultiplicity !== "1" ? ` "${edge.targetMultiplicity}"` : ""}
        {edge.label ? ` : ${edge.label}` : ""}
      </p>
    </div>
  );
}

export function PropertiesPanel({ engine }: PropertiesPanelProps): React.ReactElement | null {
  const hasSelection = engine.selectedNodeId !== null || engine.selectedEdgeId !== null;
  if (!hasSelection) return null;
  return (
    <aside
      role="complementary"
      aria-label="Properties panel"
      className="absolute bottom-0 right-0 top-0 z-30 flex w-[320px] flex-col overflow-y-auto border-l border-line bg-white/95 shadow-panel-float backdrop-blur"
    >
      {engine.selectedNodeId !== null ? <NodeEditor engine={engine} /> : null}
      {engine.selectedEdgeId !== null ? <EdgeEditor engine={engine} /> : null}
    </aside>
  );
}