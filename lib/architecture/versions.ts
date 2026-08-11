import type { Architecture } from "@/types/diagram";
import { generateId } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Version history — immutable snapshots of the canonical model with   */
/* computed change summaries. Restore = swap the snapshot back.        */
/* ------------------------------------------------------------------ */

export interface DiagramVersion {
  version: number;
  label: string;
  mermaidCode: string;
  summary: string;
  changes: string[];
  createdAt: string;
}

export interface VersionDiff {
  addedNodes: string[];
  removedNodes: string[];
  addedRelations: string[];
  removedRelations: string[];
}

export function diffArchitectures(before: Architecture, after: Architecture): VersionDiff {
  const beforeNodes = new Set(before.nodes.map((n) => n.name));
  const afterNodes = new Set(after.nodes.map((n) => n.name));
  const beforeRels = new Set(
    before.relationships.map((r) => `${r.type}:${r.source}->${r.target}`)
  );
  const afterRels = new Set(after.relationships.map((r) => `${r.type}:${r.source}->${r.target}`));

  return {
    addedNodes: Array.from(afterNodes).filter((n) => !beforeNodes.has(n)),
    removedNodes: Array.from(beforeNodes).filter((n) => !afterNodes.has(n)),
    addedRelations: Array.from(afterRels).filter((r) => !beforeRels.has(r)),
    removedRelations: Array.from(beforeRels).filter((r) => !afterRels.has(r)),
  };
}

export function describeDiff(diff: VersionDiff): string[] {
  const lines: string[] = [];
  for (const node of diff.addedNodes) lines.push(`Added node ${node}`);
  for (const node of diff.removedNodes) lines.push(`Removed node ${node}`);
  for (const rel of diff.addedRelations) lines.push(`Added relationship ${rel}`);
  for (const rel of diff.removedRelations) lines.push(`Removed relationship ${rel}`);
  if (lines.length === 0) lines.push("No structural changes");
  return lines;
}

export function createVersion(
  previous: DiagramVersion | null,
  mermaidCode: string,
  before: Architecture | null,
  after: Architecture,
  label?: string
): DiagramVersion {
  const changes = before ? describeDiff(diffArchitectures(before, after)) : ["Initial snapshot"];
  return {
    version: (previous?.version ?? 0) + 1,
    label: label ?? `Version ${(previous?.version ?? 0) + 1}`,
    mermaidCode,
    summary: changes.length === 1 ? changes[0] : changes.slice(0, 3).join("; "),
    changes,
    createdAt: new Date().toISOString(),
  };
}

export function newVersionId(): string {
  return generateId("ver");
}
