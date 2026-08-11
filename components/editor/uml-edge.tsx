"use client";

import * as React from "react";
import { BaseEdge, getBezierPath, type EdgeProps } from "@xyflow/react";
import type { UMLFlowEdge } from "@/lib/mermaid/transformer";
import { orthogonalPath, pathMidpoint, type Point, type Side } from "@/lib/editor/orthogonal";

interface EdgeData {
  relationType: string;
  fromMultiplicity?: string | null;
  toMultiplicity?: string | null;
  orthogonal?: boolean;
  waypoints?: Point[];
}

function markerFor(type: string): { markerEnd: string; strokeDasharray?: string; stroke?: string } {
  switch (type) {
    case "inheritance":
      return { markerEnd: "url(#arrow-triangle)", stroke: "#1D4ED8" };
    case "implementation":
      return { markerEnd: "url(#arrow-triangle)", strokeDasharray: "5 5", stroke: "#1D4ED8" };
    case "composition":
      return { markerEnd: "url(#diamond-filled)" };
    case "aggregation":
      return { markerEnd: "url(#diamond-empty)" };
    case "dependency":
      return { markerEnd: "url(#arrow-open)", strokeDasharray: "5 5" };
    case "association":
    default:
      return { markerEnd: "url(#arrow-open)" };
  }
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
  const style = markerFor(edgeData.relationType);
  const labelText = typeof label === "string" ? label : null;
  const labelWidth = labelText ? labelText.length * 7 + 12 : 0;

  let path: string;
  let mid: Point;
  const source = { x: sourceX, y: sourceY };
  const target = { x: targetX, y: targetY };
  if (edgeData.orthogonal) {
    const pts: Point[] = [source];
    if (edgeData.waypoints && edgeData.waypoints.length > 0) {
      pts.push(...edgeData.waypoints);
    }
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
  } else {
    [path] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });
    mid = { x: (sourceX + targetX) / 2, y: (sourceY + targetY) / 2 };
  }

  return (
    <>
      <defs>
        <marker id="arrow-open" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 1 L 9 5 L 0 9" fill="none" stroke="#94A3B8" strokeWidth="1.4" strokeLinecap="round" />
        </marker>
        <marker id="arrow-triangle" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#1D4ED8" />
        </marker>
        <marker id="diamond-filled" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="8" markerHeight="8" orient="auto">
          <path d="M 5 0 L 10 5 L 5 10 L 0 5 z" fill="#64748B" />
        </marker>
        <marker id="diamond-empty" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="8" markerHeight="8" orient="auto">
          <path d="M 5 0 L 10 5 L 5 10 L 0 5 z" fill="#fff" stroke="#64748B" strokeWidth="1.2" />
        </marker>
      </defs>
      <BaseEdge
        id={id}
        path={path}
        style={{
          stroke: selected ? "#2563EB" : style.stroke ?? "#94A3B8",
          strokeWidth: selected ? 2.4 : 1.5,
          strokeDasharray: style.strokeDasharray,
        }}
        markerEnd={style.markerEnd}
      />
      {selected ? (
        <path d={path} fill="none" stroke="#2563EB" strokeWidth={7.5} strokeOpacity={0.18} strokeLinecap="round" pointerEvents="none" />
      ) : null}
      {labelText ? (
        <foreignObject
          width={labelWidth}
          height={22}
          x={0}
          y={0}
          className="pointer-events-none"
          style={{ transform: `translate(${mid.x - labelWidth / 2}px, ${mid.y - 11}px)` }}
        >
          <span className="rounded-full border border-line bg-white px-2 py-0.5 font-mono text-[10.5px] text-slate-600 shadow-sm">
            {labelText}
          </span>
        </foreignObject>
      ) : null}
      {edgeData.fromMultiplicity ? (
        <foreignObject
          width={34}
          height={16}
          className="pointer-events-none"
          style={{ transform: `translate(${sourceX - 40}px, ${sourceY - 8}px)` }}
        >
          <span className="font-mono text-[10px] text-slate-400">{edgeData.fromMultiplicity}</span>
        </foreignObject>
      ) : null}
      {edgeData.toMultiplicity ? (
        <foreignObject
          width={34}
          height={16}
          className="pointer-events-none"
          style={{ transform: `translate(${targetX + 8}px, ${targetY - 8}px)` }}
        >
          <span className="font-mono text-[10px] text-slate-400">{edgeData.toMultiplicity}</span>
        </foreignObject>
      ) : null}
    </>
  );
}

export default React.memo(UMLRelationshipEdge);