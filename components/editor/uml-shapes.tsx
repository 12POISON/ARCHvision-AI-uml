"use client";

import * as React from "react";
import { Position, type NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import type { UMLFlowNode } from "@/lib/mermaid/transformer";
import type { ArchitectureNodeKind } from "@/types/diagram";
import { SideHandles } from "@/components/editor/uml-node";
import UMLClassNode from "@/components/editor/uml-node";

/**
 * Creately-style UML shape renderers.
 * Each node is a fixed-size SVG + label; selection shows the #0052CC ring.
 */

const BORDER = "#C1C7D0";
const TEXT = "#172B4D";
const MUTED = "#5E6C84";

function Frame({
  children,
  selected,
  className,
  label,
  stereo,
  mutedStyle,
}: {
  children: React.ReactNode;
  selected: boolean;
  className?: string;
  label?: string;
  stereo?: string | null;
  mutedStyle?: boolean;
}): React.ReactElement {
  return (
    <div
      className={cn("uml-node group relative", className)}
      aria-label={`${label ?? "shape"}${stereo ? ` (${stereo})` : ""}`}
    >
      <div
        className={cn(
          "transition-all duration-150",
          selected ? "ring-2 ring-[#0052CC]/25" : ""
        )}
      >
        {children}
      </div>
      {label ? (
        <p
          className={cn(
            "mt-1 truncate text-center text-[11.5px] font-semibold",
            mutedStyle ? "text-[#5E6C84]" : "text-[#172B4D]"
          )}
        >
          {label}
        </p>
      ) : null}
      {stereo ? (
        <p className="truncate text-center text-[9.5px] font-semibold uppercase tracking-widest text-[#5E6C84]">
          «{stereo}»
        </p>
      ) : null}
      <SideHandles side={Position.Left} />
      <SideHandles side={Position.Right} />
      <SideHandles side={Position.Top} />
      <SideHandles side={Position.Bottom} />
    </div>
  );
}

function EllipseShape({ data, selected }: { data: UMLFlowNode["data"]; selected: boolean }): React.ReactElement {
  return (
    <Frame selected={selected} stereo={data.stereotype} className="w-[180px]">
      <div
        className={cn(
          "flex h-[64px] w-[180px] items-center justify-center rounded-full border bg-white",
          selected ? "border-[#0052CC]" : "border-[#C1C7D0]"
        )}
        style={{ borderWidth: 1.5 }}
      >
        <span className="px-4 text-center text-[12.5px] font-semibold text-[#172B4D]">{data.label}</span>
      </div>
    </Frame>
  );
}

function NoteShape({ data, selected }: { data: UMLFlowNode["data"]; selected: boolean }): React.ReactElement {
  return (
    <Frame selected={selected} label={data.label} className="w-[168px]">
      <div className="relative h-[100px] w-[168px]">
        <div
          className={cn(
            "h-[100px] w-[168px] rounded-sm border border-amber-400/70 bg-[#FFFDF5] px-3 py-2 text-[11.5px] text-[#8A5A00] shadow-sm",
            selected ? "border-[#0052CC]" : ""
          )}
        >
          <span className="line-clamp-4 leading-snug">{data.label}</span>
        </div>
        <div
          className="absolute -right-px -top-px h-0 w-0 border-l-[22px] border-t-[22px] border-l-transparent border-t-amber-300/80"
          style={{ clipPath: "polygon(100% 0, 100% 100%, 0 0)" }}
        />
      </div>
    </Frame>
  );
}

function ConstraintShape({ data, selected }: { data: UMLFlowNode["data"]; selected: boolean }): React.ReactElement {
  return (
    <Frame selected={selected} className="w-[200px]">
      <div
        className={cn(
          "flex h-[52px] w-[200px] items-center justify-center rounded-lg border bg-white font-mono text-[11.5px] text-[#172B4D]",
          selected ? "border-[#0052CC]" : "border-[#C1C7D0]"
        )}
      >
        <span className="px-2 text-center">{"{"} {data.label} {"}"}</span>
      </div>
    </Frame>
  );
}

function LifelineShape({ data, selected }: { data: UMLFlowNode["data"]; selected: boolean }): React.ReactElement {
  return (
    <Frame selected={selected} className="w-[140px]">
      <div className="relative w-[140px]" style={{ height: 210 }}>
        <div
          className={cn(
            "mx-auto flex h-[26px] w-[140px] items-center justify-center border bg-white text-[11.5px] font-bold text-[#172B4D]",
            selected ? "border-[#0052CC]" : "border-[#C1C7D0]"
          )}
        >
          {data.label}
        </div>
        <div className="absolute left-1/2 top-[26px] bottom-0 w-px -translate-x-1/2 border-l border-dashed border-[#94A3B8]" />
      </div>
    </Frame>
  );
}

function CircleShape({ data, selected, filled, ring }: { data: UMLFlowNode["data"]; selected: boolean; filled?: boolean; ring?: boolean }): React.ReactElement {
  return (
    <Frame selected={selected} className="w-[64px]" stereo={data.stereotype}>
      <div className="flex h-[64px] w-[64px] items-center justify-center">
        {ring ? (
          <div
            className={cn(
              "flex h-[34px] w-[34px] items-center justify-center rounded-full border-2",
              selected ? "border-[#0052CC]" : "border-[#172B4D]"
            )}
          >
            <div className="h-[18px] w-[18px] rounded-full bg-[#172B4D]" />
          </div>
        ) : (
          <div
            className={cn(
              "h-[26px] w-[26px] rounded-full",
              filled ? "bg-[#172B4D]" : "",
              selected && !filled ? "border-[#0052CC]" : ""
            )}
          />
        )}
      </div>
    </Frame>
  );
}

function DecisionShape({ data, selected, muted }: { data: UMLFlowNode["data"]; selected: boolean; muted?: boolean }): React.ReactElement {
  const color = muted ? MUTED : TEXT;
  return (
    <Frame selected={selected} className="w-[120px]">
      <div className="flex h-[72px] w-[120px] items-center justify-center">
        <svg width="120" height="72" viewBox="0 0 120 72" aria-hidden>
          <polygon
            points="60,4 116,36 60,68 4,36"
            fill="#FFFFFF"
            stroke={selected ? "#0052CC" : color}
            strokeWidth={selected ? 2 : 1.2}
          />
        </svg>
        <span className="absolute max-w-[76px] truncate text-center text-[11.5px] font-semibold text-[#172B4D]">
          {data.label}
        </span>
      </div>
    </Frame>
  );
}

function ActivityShape({ data, selected, rounded }: { data: UMLFlowNode["data"]; selected: boolean; rounded?: boolean }): React.ReactElement {
  return (
    <Frame selected={selected} className="w-[168px]">
      <div
        className={cn(
          "flex h-[48px] w-[168px] items-center justify-center border bg-white px-3 text-[12px] font-semibold text-[#172B4D]",
          selected ? "border-[#0052CC]" : "border-[#C1C7D0]",
          rounded ? "rounded-[10px]" : "rounded-sm"
        )}
      >
        <span className="truncate">{data.label}</span>
      </div>
    </Frame>
  );
}

function ForkShape({ data, selected }: { data: UMLFlowNode["data"]; selected: boolean }): React.ReactElement {
  return (
    <Frame selected={selected} label={data.label} className="w-[150px]">
      <div
        className={cn(
          "h-[10px] w-[150px] rounded-[2px]",
          selected ? "bg-[#0052CC]" : "bg-[#5E6C84]"
        )}
      />
    </Frame>
  );
}

function SwimlaneShape({ data, selected }: { data: UMLFlowNode["data"]; selected: boolean }): React.ReactElement {
  return (
    <Frame selected={selected} className="w-[140px]">
      <div className="w-[140px]" style={{ height: 190 }}>
        <div
          className={cn(
            "flex h-[26px] w-[140px] items-center justify-center border-b bg-[#F8F9FA] text-[11.5px] font-bold text-[#172B4D]",
            selected ? "border-[#0052CC]" : "border-[#C1C7D0]"
          )}
        >
          {data.label}
        </div>
        <div className={cn("h-full w-[140px] border-x border-b bg-white", selected ? "border-[#0052CC]" : "border-[#C1C7D0]")} />
      </div>
    </Frame>
  );
}

function ComponentShape({ data, selected }: { data: UMLFlowNode["data"]; selected: boolean }): React.ReactElement {
  return (
    <Frame selected={selected} className="w-[148px]">
      <div className="relative h-[84px] w-[148px]">
        <div
          className={cn(
            "absolute left-[10px] top-1/2 h-[68px] w-[132px] -translate-y-1/2 rounded-sm border bg-white",
            selected ? "border-[#0052CC]" : "border-[#172B4D]"
          )}
        />
        <div
          className={cn(
            "absolute left-0 top-1/2 flex -translate-y-1/2 flex-col gap-[5px]",
            "border bg-white",
            selected ? "border-[#0052CC]" : "border-[#172B4D]"
          )}
        >
          <span className="h-[6px] w-[9px]" />
          <span className="h-[6px] w-[9px]" />
          <span className="h-[6px] w-[9px]" />
        </div>
        <span className="absolute left-[26px] top-1/2 max-w-[100px] -translate-y-1/2 truncate text-[11.5px] font-semibold text-[#172B4D]">
          {data.label}
        </span>
      </div>
    </Frame>
  );
}

function NodeCubeShape({ data, selected }: { data: UMLFlowNode["data"]; selected: boolean }): React.ReactElement {
  const stroke = selected ? "#0052CC" : "#172B4D";
  return (
    <Frame selected={selected} className="w-[132px]">
      <div className="flex h-[96px] w-[132px] items-center justify-center">
        <svg width="108" height="84" viewBox="0 0 108 84" aria-hidden>
          <path d="M 24 16 L 54 4 L 88 16 L 54 30 Z" fill="#FFFFFF" stroke={stroke} strokeWidth="1.2" />
          <path d="M 24 16 L 24 56 L 54 68 L 54 30 Z" fill="#F8F9FA" stroke={stroke} strokeWidth="1.2" />
          <path d="M 54 30 L 88 16 L 88 56 L 54 68 Z" fill="#F1F3F4" stroke={stroke} strokeWidth="1.2" />
          <text x="54" y="46" textAnchor="middle" fontSize="11" fontFamily="Inter, sans-serif" fontWeight="600" fill="#172B4D">
            {data.label.length > 12 ? `${data.label.slice(0, 11)}…` : data.label}
          </text>
        </svg>
      </div>
    </Frame>
  );
}

function ArtifactShape({ data, selected }: { data: UMLFlowNode["data"]; selected: boolean }): React.ReactElement {
  const stroke = selected ? "#0052CC" : "#172B4D";
  return (
    <Frame selected={selected} className="w-[132px]">
      <div className="flex h-[80px] w-[132px] items-center justify-center">
        <svg width="116" height="72" viewBox="0 0 116 72" aria-hidden>
          <path d="M 14 10 h 58 l 22 22 v 28 a 2 2 0 0 1 -2 2 h -78 a 2 2 0 0 1 -2 -2 v -48 a 2 2 0 0 1 2 -2 z" fill="#FFFFFF" stroke={stroke} strokeWidth="1.2" />
          <path d="M 72 10 v 22 h 22" fill="none" stroke={stroke} strokeWidth="1.2" />
          <line x1="20" y1="30" x2="96" y2="30" stroke="#94A3B8" strokeWidth="1" />
          <line x1="20" y1="38" x2="96" y2="38" stroke="#94A3B8" strokeWidth="1" />
          <line x1="20" y1="46" x2="76" y2="46" stroke="#94A3B8" strokeWidth="1" />
        </svg>
        <span className="absolute mt-[56px] max-w-[110px] truncate text-[10.5px] font-semibold text-[#172B4D]">{data.label}</span>
      </div>
    </Frame>
  );
}

function PortShape({ data, selected }: { data: UMLFlowNode["data"]; selected: boolean }): React.ReactElement {
  return (
    <Frame selected={selected} label={data.label} className="w-[48px]">
      <div
        className={cn(
          "mx-auto h-[26px] w-[26px] border-2 bg-white",
          selected ? "border-[#0052CC]" : "border-[#0052CC]"
        )}
      />
    </Frame>
  );
}

function DoubleRectShape({ data, selected }: { data: UMLFlowNode["data"]; selected: boolean }): React.ReactElement {
  return (
    <Frame selected={selected} className="w-[150px]">
      <div className="relative h-[52px] w-[150px]">
        <div className={cn("absolute inset-0 border bg-white", selected ? "border-[#0052CC]" : "border-[#172B4D]")} />
        <div className={cn("absolute inset-[3px] border", selected ? "border-[#0052CC]" : "border-[#172B4D]")} />
        <span className="absolute inset-0 flex items-center justify-center text-[12px] font-semibold text-[#172B4D]">
          {data.label}
        </span>
      </div>
    </Frame>
  );
}

function DiamondShape({ data, selected, muted }: { data: UMLFlowNode["data"]; selected: boolean; muted?: boolean }): React.ReactElement {
  const color = muted ? MUTED : TEXT;
  return (
    <Frame selected={selected} className="w-[110px]">
      <div className="flex h-[60px] w-[110px] items-center justify-center">
        <svg width="110" height="60" viewBox="0 0 110 60" aria-hidden>
          <polygon
            points="55,2 108,30 55,58 2,30"
            fill="#FFFFFF"
            stroke={selected ? "#0052CC" : color}
            strokeWidth={selected ? 2 : 1.2}
          />
        </svg>
        <span className="absolute max-w-[70px] truncate text-center text-[11px] font-semibold text-[#172B4D]">
          {data.label}
        </span>
      </div>
    </Frame>
  );
}

function ParallelogramShape({ data, selected }: { data: UMLFlowNode["data"]; selected: boolean }): React.ReactElement {
  return (
    <Frame selected={selected} className="w-[150px]">
      <div className="flex h-[48px] w-[150px] items-center justify-center">
        <svg width="150" height="48" viewBox="0 0 150 48" aria-hidden>
          <polygon
            points="18,6 144,6 132,42 6,42"
            fill="#FFFFFF"
            stroke={selected ? "#0052CC" : BORDER}
            strokeWidth={selected ? 2 : 1.2}
          />
        </svg>
        <span className="absolute max-w-[104px] truncate text-center text-[12px] font-semibold text-[#172B4D]">
          {data.label}
        </span>
      </div>
    </Frame>
  );
}

function DocumentShape({ data, selected }: { data: UMLFlowNode["data"]; selected: boolean }): React.ReactElement {
  const stroke = selected ? "#0052CC" : "#172B4D";
  return (
    <Frame selected={selected} className="w-[120px]">
      <div className="flex h-[86px] w-[120px] items-center justify-center">
        <svg width="104" height="76" viewBox="0 0 104 76" aria-hidden>
          <path d="M 12 10 h 56 l 24 24 v 30 a 2 2 0 0 1 -2 2 h -78 a 2 2 0 0 1 -2 -2 v -52 a 2 2 0 0 1 2 -2 z" fill="#FFFFFF" stroke={stroke} strokeWidth="1.2" />
          <path d="M 68 10 v 24 h 24" fill="none" stroke={stroke} strokeWidth="1.2" />
          <line x1="18" y1="30" x2="86" y2="30" stroke="#C1C7D0" strokeWidth="1" />
          <line x1="18" y1="38" x2="86" y2="38" stroke="#C1C7D0" strokeWidth="1" />
          <line x1="18" y1="46" x2="70" y2="46" stroke="#C1C7D0" strokeWidth="1" />
        </svg>
        <span className="absolute mt-[62px] max-w-[100px] truncate text-[10.5px] font-semibold text-[#172B4D]">{data.label}</span>
      </div>
    </Frame>
  );
}

function CloudShape({ data, selected }: { data: UMLFlowNode["data"]; selected: boolean }): React.ReactElement {
  return (
    <Frame selected={selected} className="w-[152px]">
      <div className="flex h-[84px] w-[152px] items-center justify-center">
        <svg width="140" height="76" viewBox="0 0 140 76" aria-hidden>
          <path
            d="M 26 64 a 13 13 0 0 1 -2 -25.8 a 15.5 15.5 0 0 1 29.3 -4.3 a 10.6 10.6 0 0 1 2.3 26.1 z"
            fill="#EFF6FF"
            stroke={selected ? "#0052CC" : "#0052CC"}
            strokeWidth="1.2"
          />
          <text x="40" y="46" textAnchor="middle" fontSize="11" fontFamily="Inter, sans-serif" fontWeight="600" fill="#1D4ED8">
            {data.label.length > 9 ? `${data.label.slice(0, 8)}…` : data.label}
          </text>
        </svg>
      </div>
    </Frame>
  );
}

function ArrowAnnotation({ data, selected, dashed, label }: { data: UMLFlowNode["data"]; selected: boolean; dashed?: boolean; label?: string }): React.ReactElement {
  const stroke = selected ? "#0052CC" : "#172B4D";
  return (
    <Frame selected={selected} className="w-[176px]">
      <div className="flex h-[52px] w-[176px] flex-col items-center justify-center gap-1">
        <svg width="150" height="22" viewBox="0 0 150 22" aria-hidden>
          <line x1="2" y1="11" x2="130" y2="11" stroke={stroke} strokeWidth="1.4" strokeDasharray={dashed ? "5 3" : undefined} />
          <polygon points="130,11 118,5.5 118,16.5" fill={stroke} />
        </svg>
        <span className="max-w-[170px] truncate font-mono text-[10.5px] text-[#5E6C84]">{label ?? data.label}</span>
      </div>
    </Frame>
  );
}

function ActivationShape({ data, selected }: { data: UMLFlowNode["data"]; selected: boolean }): React.ReactElement {
  return (
    <Frame selected={selected} label={data.label} className="w-[40px]">
      <div className="relative mx-auto h-[140px] w-[40px]">
        <div className={cn("absolute left-1/2 top-0 h-full w-[7px] -translate-x-1/2 rounded-sm", selected ? "bg-[#0052CC]/80" : "bg-[#0052CC]/70")} />
        <div className="absolute left-0 top-[6px] h-px w-[40px] border-t border-dashed border-[#94A3B8]" />
        <div className="absolute bottom-[6px] left-0 h-px w-[40px] border-t border-dashed border-[#94A3B8]" />
      </div>
    </Frame>
  );
}

function FragmentShape({ data, selected }: { data: UMLFlowNode["data"]; selected: boolean }): React.ReactElement {
  return (
    <Frame selected={selected} className="w-[190px]">
      <div className="relative h-[120px] w-[190px]">
        <div
          className={cn(
            "absolute inset-0 border-2 border-dashed",
            selected ? "border-[#0052CC]" : "border-[#172B4D]"
          )}
        />
        <div
          className={cn(
            "absolute left-0 top-0 flex h-[22px] w-[46px] items-center justify-center border-r border-b text-[11px] font-bold text-white",
            selected ? "bg-[#0052CC]" : "bg-[#172B4D]"
          )}
        >
          {data.label || "alt"}
        </div>
        <div className="absolute left-0 top-[52px] h-px w-full border-t border-dashed border-[#172B4D]" />
        <div className="absolute left-0 top-[86px] h-px w-full border-t border-dashed border-[#172B4D]" />
      </div>
    </Frame>
  );
}

function DestroyShape({ selected }: { data: UMLFlowNode["data"]; selected: boolean }): React.ReactElement {
  const stroke = selected ? "#0052CC" : "#172B4D";
  return (
    <Frame selected={selected} className="w-[80px]">
      <div className="flex h-[80px] w-[80px] items-center justify-center">
        <svg width="46" height="46" viewBox="0 0 46 46" aria-hidden>
          <g stroke={stroke} strokeWidth="2.6" strokeLinecap="round">
            <line x1="10" y1="10" x2="36" y2="36" />
            <line x1="36" y1="10" x2="10" y2="36" />
          </g>
        </svg>
      </div>
    </Frame>
  );
}

const SHAPE_COMPONENTS: Partial<Record<ArchitectureNodeKind, (props: { data: UMLFlowNode["data"]; selected: boolean }) => React.ReactElement>> = {
  usecase: EllipseShape,
  note: NoteShape,
  constraint: ConstraintShape,
  lifeline: LifelineShape,
  start: (p) => <CircleShape {...p} filled />,
  end: (p) => <CircleShape {...p} ring />,
  initial: (p) => <CircleShape {...p} filled />,
  final: (p) => <CircleShape {...p} ring />,
  decision: (p) => <DecisionShape {...p} />,
  activity: (p) => <ActivityShape {...p} rounded />,
  fork: ForkShape,
  swimlane: SwimlaneShape,
  component: ComponentShape,
  node: NodeCubeShape,
  artifact: ArtifactShape,
  port: PortShape,
  "weak-entity": DoubleRectShape,
  attribute: (p) => <EllipseShape {...p} />,
  "derived-attribute": (p) => (
    <Frame selected={p.selected} className="w-[180px]">
      <div className="relative h-[64px] w-[180px]">
        <div
          className={cn(
            "absolute inset-0 rounded-full border-2 border-dashed bg-white",
            p.selected ? "border-[#0052CC]" : "border-[#C1C7D0]"
          )}
        />
        <span className="absolute inset-0 flex items-center justify-center text-[12.5px] font-semibold text-[#172B4D]">
          {p.data.label}
        </span>
      </div>
    </Frame>
  ),
  relationship: (p) => <DiamondShape {...p} muted />,
  "weak-relationship": (p) => (
    <Frame selected={p.selected} className="w-[110px]">
      <div className="relative h-[60px] w-[110px]">
        <div
          className={cn(
            "absolute inset-0 border-2",
            p.selected ? "border-[#0052CC]" : "border-[#5E6C84]",
            "skew-x-0"
          )}
          style={{ clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }}
        />
        <div
          className={cn(
            "absolute inset-[5px] border-2",
            p.selected ? "border-[#0052CC]" : "border-[#5E6C84]",
            "skew-x-0"
          )}
          style={{ clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }}
        />
        <span className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold text-[#172B4D]">
          {p.data.label}
        </span>
      </div>
    </Frame>
  ),
  cloud: CloudShape,
  parallelogram: ParallelogramShape,
  document: DocumentShape,
  circle: (p) => (
    <Frame selected={p.selected} className="w-[96px]">
      <div className="flex h-[96px] w-[96px] items-center justify-center">
        <div className={cn("flex h-[84px] w-[84px] items-center justify-center rounded-full border bg-white", p.selected ? "border-[#0052CC]" : "border-[#C1C7D0]")}>
          <span className="max-w-[64px] truncate text-center text-[11.5px] font-semibold text-[#172B4D]">{p.data.label}</span>
        </div>
      </div>
    </Frame>
  ),
  diamond: (p) => <DiamondShape {...p} />,
  rect: (p) => <ActivityShape {...p} />,
  "rounded-rect": (p) => <ActivityShape {...p} rounded />,
  activation: ActivationShape,
  fragment: FragmentShape,
  destroy: DestroyShape,
  message: (p) => <ArrowAnnotation {...p} />,
  "return-message": (p) => <ArrowAnnotation {...p} dashed />,
  "self-message": (p) => (
    <Frame selected={p.selected} className="w-[176px]">
      <div className="flex h-[52px] w-[176px] items-center justify-center">
        <svg width="110" height="40" viewBox="0 0 110 40" aria-hidden>
          <g fill="none" stroke={p.selected ? "#0052CC" : "#172B4D"} strokeWidth="1.4">
            <path d="M 70 8 h 34 v 16" />
            <polygon points="70 8 76 4 76 12" fill={p.selected ? "#0052CC" : "#172B4D"} stroke="none" />
          </g>
          <line x1="56" y1="24" x2="24" y2="24" stroke="#172B4D" strokeWidth="1" strokeDasharray="3 2" />
        </svg>
        <span className="absolute mt-[38px] max-w-[160px] truncate font-mono text-[10.5px] text-[#5E6C84]">{p.data.label}</span>
      </div>
    </Frame>
  ),
  transition: (p) => <ArrowAnnotation {...p} label={p.data.label} />,
};

export function UMLShapeNode(props: NodeProps<UMLFlowNode>): React.ReactElement {
  const { data } = props;
  const renderer = SHAPE_COMPONENTS[data.kind];
  if (renderer) return renderer({ data, selected: props.selected ?? false });
  // Class-like nodes (class/abstract/interface/enum/entity/…/actor/database
  // handled by dedicated node types) fall back to the classic compartment node.
  return <UMLClassNode {...props} />;
}

export default React.memo(UMLShapeNode);
