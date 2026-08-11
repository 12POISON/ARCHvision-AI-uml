"use client";

import * as React from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import type { UMLFlowNode } from "@/lib/mermaid/transformer";
import type { ArchitectureNodeKind } from "@/types/diagram";

const VISIBILITY_ICON: Record<string, string> = {
  public: "+",
  private: "-",
  protected: "#",
};

/** One handle pair (source + target) per side — draw.io-style 4-way wiring. */
function SideHandles({ side }: { side: Position }): React.ReactElement {
  const base =
    side === Position.Top || side === Position.Bottom
      ? "!left-1/2 !-translate-x-1/2"
      : "!top-1/2 !-translate-y-1/2";
  return (
    <div className="group">
      <Handle
        id={`${side.toLowerCase()}-source`}
        type="source"
        position={side}
        className={cn(
          "!h-2 !w-2 !rounded-full !border !border-slate-400 !bg-white opacity-0 transition-opacity group-hover:!opacity-100",
          base
        )}
      />
      <Handle
        id={`${side.toLowerCase()}-target`}
        type="target"
        position={side}
        className={cn(
          "!h-2 !w-2 !rounded-full !border !border-slate-400 !bg-white opacity-0 transition-opacity group-hover:!opacity-100",
          base
        )}
      />
    </div>
  );
}

const KIND_STYLE: Record<ArchitectureNodeKind, { header: string; dot: string } | undefined> = {
  class: undefined,
  abstract: undefined,
  interface: { header: "border-primary/25 bg-primary/5", dot: "bg-primary/70" },
  enum: { header: "border-sky-300 bg-sky-50", dot: "bg-sky-400" },
  entity: { header: "border-emerald-200 bg-emerald-50", dot: "bg-emerald-500" },
  table: { header: "border-emerald-200 bg-emerald-50", dot: "bg-emerald-500" },
  controller: { header: "border-blue-200 bg-blue-50", dot: "bg-blue-500" },
  service: { header: "border-amber-200 bg-amber-50", dot: "bg-amber-500" },
  repository: { header: "border-purple-200 bg-purple-50", dot: "bg-purple-500" },
  component: { header: "border-teal-200 bg-teal-50", dot: "bg-teal-500" },
  package: { header: "border-slate-200 bg-slate-50", dot: "bg-slate-400" },
  actor: { header: "border-sky-200 bg-sky-50", dot: "bg-sky-500" },
  database: { header: "border-slate-200 bg-slate-100", dot: "bg-slate-500" },
  boundary: { header: "border-orange-200 bg-orange-50", dot: "bg-orange-500" },
  external: { header: "border-rose-200 bg-rose-50", dot: "bg-rose-500" },
  api: { header: "border-indigo-200 bg-indigo-50", dot: "bg-indigo-500" },
  event: { header: "border-pink-200 bg-pink-50", dot: "bg-pink-500" },
  state: { header: "border-cyan-200 bg-cyan-50", dot: "bg-cyan-500" },
};

function UMLClassNode({ data, selected }: NodeProps<UMLFlowNode>): React.ReactElement {
  const { label, stereotype, isAbstract, isInterface, kind, attributes, methods, viewMode } = data;
  const isExecutive = viewMode === "EXECUTIVE";
  const style = KIND_STYLE[kind];
  const italic = isAbstract || isInterface;

  return (
    <div
      className={cn(
        "uml-node group w-[232px] overflow-hidden rounded-2xl border bg-white shadow-card transition-all duration-300",
        selected ? "border-blue-500 ring-2 ring-blue-500/20" : isInterface ? "border-primary/40" : isAbstract ? "border-accent/60" : "border-line",
        isExecutive && "w-[280px]"
      )}
      aria-label={`${kind} ${label}`}
    >
      <div
        className={cn(
          "flex items-center gap-2 border-b px-4 py-2.5",
          style?.header ?? (isInterface ? "border-primary/25 bg-primary/5" : isAbstract ? "border-accent/30 bg-accent-soft/60" : "border-line bg-surface")
        )}
      >
        <span className={cn("h-2 w-2 shrink-0 rounded-full", style?.dot ?? (isInterface ? "bg-primary/70" : isAbstract ? "bg-accent" : "bg-slate-300"))} />
        <div className="min-w-0 flex-1 text-center">
          {stereotype ? (
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{stereotype}</p>
          ) : null}
          <p
            className={cn(
              "truncate font-bold tracking-tight text-foreground",
              isExecutive ? "text-base" : "text-[13.5px]",
              italic && "italic"
            )}
          >
            {label}
          </p>
        </div>
      </div>

      {attributes.length > 0 ? (
        <div className="border-b border-line px-4 py-1.5">
          {attributes.map((attribute) => (
            <p key={attribute.name} className="truncate font-mono text-[11.5px] leading-[21px] text-slate-700">
              <span
                className={cn(
                  "mr-1 font-semibold",
                  attribute.visibility === "private"
                    ? "text-error/70"
                    : attribute.visibility === "protected"
                      ? "text-amber-500"
                      : "text-emerald-500"
                )}
              >
                {VISIBILITY_ICON[attribute.visibility] ?? "+"}
              </span>
              {attribute.name}
              {attribute.type && attribute.type !== "unknown" ? <span className="text-slate-400">: {attribute.type}</span> : null}
              {attribute.isStatic ? <span className="text-slate-400">$</span> : null}
            </p>
          ))}
        </div>
      ) : null}

      {methods.length > 0 ? (
        <div className={cn("px-4 py-1.5", attributes.length === 0 && "border-t border-line")}>
          {methods.map((method) => {
            const params = method.parameters.map((p) => `${p.name}${p.type ? `: ${p.type}` : ""}`).join(", ");
            return (
              <p key={method.name} className="truncate font-mono text-[11.5px] leading-[21px] text-slate-700">
                <span className="mr-1 font-semibold text-primary/70">{VISIBILITY_ICON[method.visibility] ?? "+"}</span>
                {method.name}({params})
                <span className="text-slate-400">: {method.returnType}</span>
              </p>
            );
          })}
        </div>
      ) : null}

      <SideHandles side={Position.Left} />
      <SideHandles side={Position.Right} />
      <SideHandles side={Position.Top} />
      <SideHandles side={Position.Bottom} />
    </div>
  );
}

function UMLActorNode({ data, selected }: NodeProps<UMLFlowNode>): React.ReactElement {
  const { label } = data;
  return (
    <div
      className={cn(
        "uml-node group w-[132px] rounded-2xl border bg-white p-3 text-center shadow-card transition-all duration-300",
        selected ? "border-blue-500 ring-2 ring-blue-500/20" : "border-line"
      )}
      aria-label={`Actor ${label}`}
    >
      <svg viewBox="0 0 40 40" className="mx-auto h-10 w-10" aria-hidden>
        <circle cx="20" cy="10" r="6" fill="none" stroke="#334155" strokeWidth="2" />
        <path d="M 6 34 C 6 26 12 22 20 22 C 28 22 34 26 34 34" fill="none" stroke="#334155" strokeWidth="2" strokeLinecap="round" />
        <path d="M 20 22 L 20 30" stroke="#334155" strokeWidth="2" />
        <path d="M 20 26 L 10 30" stroke="#334155" strokeWidth="2" strokeLinecap="round" />
        <path d="M 20 26 L 30 30" stroke="#334155" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <p className="mt-1.5 truncate text-[11.5px] font-bold text-foreground">{label}</p>
      <p className="text-[9.5px] font-semibold uppercase tracking-widest text-slate-400">«actor»</p>
      <SideHandles side={Position.Left} />
      <SideHandles side={Position.Right} />
      <SideHandles side={Position.Top} />
      <SideHandles side={Position.Bottom} />
    </div>
  );
}

function UMLDatabaseNode({ data, selected }: NodeProps<UMLFlowNode>): React.ReactElement {
  const { label } = data;
  return (
    <div
      className={cn(
        "uml-node group w-[152px] rounded-xl border border-line bg-white px-4 pb-3 pt-1 shadow-card transition-all duration-300",
        selected ? "border-blue-500 ring-2 ring-blue-500/20" : "border-line"
      )}
      aria-label={`Database ${label}`}
    >
      <div className="relative">
        <div className="h-3 rounded-t-[50%] border border-b-0 border-slate-300 bg-slate-100" />
        <div className="border-x border-slate-300 bg-white" style={{ height: 40 }} />
        <div className="h-3 rounded-b-[50%] border border-t-0 border-slate-300 bg-white" />
        <div className="absolute inset-x-0 top-0 flex h-12 items-center justify-center">
          <p className="truncate px-1 text-[11.5px] font-bold text-foreground">{label}</p>
        </div>
      </div>
      <p className="mt-1 text-center text-[9.5px] font-semibold uppercase tracking-widest text-slate-400">«database»</p>
      <SideHandles side={Position.Left} />
      <SideHandles side={Position.Right} />
      <SideHandles side={Position.Top} />
      <SideHandles side={Position.Bottom} />
    </div>
  );
}

export default React.memo(UMLClassNode);
export const UMLActorNodeComponent = React.memo(UMLActorNode);
export const UMLDatabaseNodeComponent = React.memo(UMLDatabaseNode);