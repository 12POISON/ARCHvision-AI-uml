"use client";

import * as React from "react";
import {
  BaseEdge,
  getBezierPath,
  getStraightPath,
  type EdgeProps,
} from "@xyflow/react";
import type { UMLFlowEdge } from "@/lib/mermaid/transformer";
import { orthogonalPath, pathMidpoint, type Point, type Side } from "@/lib/editor/orthogonal";
import { cn } from "@/lib/utils";

interface EdgeData {
  relationType: string;
  fromMultiplicity?: string | null;
  toMultiplicity?: string | null;
  orthogonal?: boolean;
  waypoints?: Point[];
  sourceRole?: string | null;
  targetRole?: string | null;
  color?: string;
  width?: number;
  dash?: string;
  routing?: "orthogonal" | "straight" | "curved";
  onUpdateLabel?: (label: string | null) => void;
}

const DEFAULT_COLOR = "#5E6C84";

function markerFor(type: string): { markerEnd?: string; markerStart?: string; strokeDasharray?: string; stroke?: string } {
  switch (type) {
    case "inheritance":
      return { markerEnd: "url(#triangle-hollow)", stroke: "#172B4D" };
    case "implementation":
      return { markerEnd: "url(#triangle-hollow)", strokeDasharray: "5 4", stroke: "#172B4D" };
    case "composition":
      return { markerStart: "url(#diamond-filled)" };
    case "aggregation":
      return { markerStart: "url(#diamond-hollow)" };
    case "dependency":
    case "include":
    case "extend":
    case "reference":
    case "return":
      return { markerEnd: "url(#arrow-open)", strokeDasharray: "5 4" };
    case "async":
      return { markerEnd: "url(#arrow-stick)" };
    case "association":
    case "call":
    case "flow":
    case "message":
    case "transition":
    default:
      return { markerEnd: "url(#arrow-open)" };
  }
}

function EditableLabel({
  value,
  editing,
  onStart,
  onCommit,
  onCancel,
  className,
}: {
  value: string;
  editing: boolean;
  onStart: () => void;
  onCommit: (next: string) => void;
  onCancel: () => void;
  className?: string;
}): React.ReactElement {
  if (!editing) {
    return (
      <span
        className={cn("cursor-text", className)}
        onDoubleClick={(e) => {
          e.stopPropagation();
          onStart();
        }}
      >
        {value}
      </span>
    );
  }
  return (
    <input
      autoFocus
      defaultValue={value}
      onKeyDown={(e) => {
        if (e.key === "Enter") onCommit((e.target as HTMLInputElement).value.trim());
        if (e.key === "Escape") onCancel();
      }}
      onBlur={(e) => {
        const next = e.target.value.trim();
        if (next && next !== value) onCommit(next);
        else onCancel();
      }}
      onClick={(e) => e.stopPropagation()}
      className="w-[120px] rounded border border-[#0052CC] bg-white px-1.5 py-0.5 text-center font-mono text-[11px] outline-none"
      aria-label="Edit edge label"
    />
  );
}

export function UMLRelationshipEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  label,
  selected,
}: EdgeProps<UMLFlowEdge>): React.ReactElement {
  const edgeData = (data ?? {}) as unknown as EdgeData;
  const [editing, setEditing] = React.useState(false);
  const base = markerFor(edgeData.relationType);
  const labelText = typeof label === "string" ? label : null;

  const color = edgeData.color ?? base.stroke ?? DEFAULT_COLOR;
  const width = edgeData.width ?? (selected ? 2.4 : 1.6);
  const dash = edgeData.dash ?? base.strokeDasharray;

  const labelWidth = labelText ? Math.max(40, labelText.length * 7 + 12) : 0;

  let path: string;
  let mid: Point;
  const source = { x: sourceX, y: sourceY };
  const target = { x: targetX, y: targetY };

  const routing = edgeData.routing ?? (edgeData.orthogonal ? "orthogonal" : "curved");

  if (routing === "straight") {
    [path] = getStraightPath({ sourceX, sourceY, targetX, targetY });
    mid = { x: (sourceX + targetX) / 2, y: (sourceY + targetY) / 2 };
  } else if (routing === "curved") {
    [path] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });
    mid = { x: (sourceX + targetX) / 2, y: (sourceY + targetY) / 2 };
  } else {
    const pts: Point[] = [source];
    if (edgeData.waypoints && edgeData.waypoints.length > 0) pts.push(...edgeData.waypoints);
    pts.push(target);
    const sides = [sourcePosition, targetPosition] as Side[];
    if (edgeData.waypoints && edgeData.waypoints.length > 0) {
      let d = `M ${pts[0].x} ${pts[0].y}`;
      for (const p of pts.slice(1)) d += ` L ${p.x} ${p.y}`;
      path = d;
    } else {
      path = orthogonalPath(source, target, sides[0], sides[1]);
    }
    mid = pathMidpoint(pts);
  }

  const commitLabel = (next: string | null): void => {
    setEditing(false);
    if (edgeData.onUpdateLabel) edgeData.onUpdateLabel(next);
  };

  return (
    <>
      <defs>
        <marker id="arrow-open" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 1.2 L 8.5 5 L 0 8.8" fill="none" stroke="#5E6C84" strokeWidth="1.5" strokeLinecap="round" />
        </marker>
        <marker id="arrow-stick" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M 8.5 0 L 8.5 10" stroke="#5E6C84" strokeWidth="1.8" strokeLinecap="round" />
        </marker>
        <marker id="triangle-hollow" viewBox="0 0 12 12" refX="11" refY="6" markerWidth="10" markerHeight="10" orient="auto">
          <path d="M 1.5 1 L 10 6 L 1.5 11 L 1.5 1 Z" fill="#FFFFFF" stroke="#172B4D" strokeWidth="1.3" strokeLinejoin="round" />
        </marker>
        <marker id="diamond-filled" viewBox="0 0 10 10" refX="4" refY="5" markerWidth="9" markerHeight="9" orient="auto-start-reverse">
          <path d="M 5 0.8 L 9.5 5 L 5 9.2 L 0.5 5 Z" fill="#172B4D" />
        </marker>
        <marker id="diamond-hollow" viewBox="0 0 10 10" refX="4" refY="5" markerWidth="9" markerHeight="9" orient="auto-start-reverse">
          <path d="M 5 0.8 L 9.5 5 L 5 9.2 L 0.5 5 Z" fill="#FFFFFF" stroke="#172B4D" strokeWidth="1.2" />
        </marker>
      </defs>
      <BaseEdge
        id={id}
        path={path}
        style={{
          stroke: selected ? "#0052CC" : color,
          strokeWidth: width,
          strokeDasharray: dash,
          strokeLinecap: "round",
        }}
        markerStart={base.markerStart}
        markerEnd={base.markerEnd}
      />
      {selected ? (
        <path d={path} fill="none" stroke="#0052CC" strokeWidth={7.5} strokeOpacity={0.15} strokeLinecap="round" pointerEvents="none" />
      ) : null}

      {labelText !== null ? (
        <foreignObject
          width={labelWidth + 24}
          height={26}
          x={0}
          y={0}
          style={{ transform: `translate(${mid.x - (labelWidth + 24) / 2}px, ${mid.y - 13}px)`, pointerEvents: "auto" }}
          className="flex items-center justify-center"
        >
          <EditableLabel
            value={labelText}
            editing={editing}
            onStart={() => setEditing(true)}
            onCommit={(next) => commitLabel(next)}
            onCancel={() => setEditing(false)}
            className="rounded-full border border-[#E5E7EB] bg-white px-2 py-0.5 font-mono text-[10.5px] text-gray-600 shadow-sm"
          />
        </foreignObject>
      ) : null}

      {edgeData.sourceRole ? (
        <foreignObject width={90} height={16} className="pointer-events-none" style={{ transform: `translate(${sourceX - 90}px, ${sourceY - 22}px)` }}>
          <span className="text-[10px] italic text-gray-400">{edgeData.sourceRole}</span>
        </foreignObject>
      ) : null}
      {edgeData.targetRole ? (
        <foreignObject width={90} height={16} className="pointer-events-none" style={{ transform: `translate(${targetX + 4}px, ${targetY - 22}px)` }}>
          <span className="text-[10px] italic text-gray-400">{edgeData.targetRole}</span>
        </foreignObject>
      ) : null}
      {edgeData.fromMultiplicity ? (
        <foreignObject width={34} height={16} className="pointer-events-none" style={{ transform: `translate(${sourceX - 42}px, ${sourceY + 4}px)` }}>
          <span className="font-mono text-[10px] text-gray-400">{edgeData.fromMultiplicity}</span>
        </foreignObject>
      ) : null}
      {edgeData.toMultiplicity ? (
        <foreignObject width={34} height={16} className="pointer-events-none" style={{ transform: `translate(${targetX + 8}px, ${targetY + 4}px)` }}>
          <span className="font-mono text-[10px] text-gray-400">{edgeData.toMultiplicity}</span>
        </foreignObject>
      ) : null}
    </>
  );
}

export default React.memo(UMLRelationshipEdge);
