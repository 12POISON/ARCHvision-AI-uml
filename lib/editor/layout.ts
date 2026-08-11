import type { Node, Edge } from "@xyflow/react";

export interface LayoutNodeSize {
  id: string;
  width: number;
  height: number;
}

interface LayoutResult {
  nodes: { id: string; position: { x: number; y: number } }[];
  width: number;
  height: number;
}

const GAP_X = 80;
const GAP_Y = 80;

/**
 * Deterministic layered auto-layout (longest-path layering, left-to-right).
 * Nodes without incoming edges start layer 0; edges only ever go forward,
 * so the result is acyclic regardless of the source graph.
 */
export function computeLayeredLayout(
  nodes: Node[],
  edges: Edge[],
  sizes: Map<string, LayoutNodeSize>
): LayoutResult {
  const ids = new Set(nodes.map((n) => n.id));
  const incoming = new Map<string, number>();
  const from = new Map<string, string[]>();
  for (const id of ids) incoming.set(id, 0);
  for (const e of edges) {
    if (!ids.has(e.source) || !ids.has(e.target)) continue;
    from.set(e.source, [...(from.get(e.source) ?? []), e.target]);
    incoming.set(e.target, (incoming.get(e.target) ?? 0) + 1);
  }

  const layer = new Map<string, number>();
  const queue: string[] = [];
  for (const id of ids) {
    if ((incoming.get(id) ?? 0) === 0) {
      layer.set(id, 0);
      queue.push(id);
    }
  }
  const idx = new Map<string, number>();
  let qi = 0;
  while (qi < queue.length) {
    const id = queue[qi];
    qi += 1;
    idx.set(id, qi);
    for (const next of from.get(id) ?? []) {
      const nextLayer = Math.max(layer.get(next) ?? 0, (layer.get(id) ?? 0) + 1);
      layer.set(next, nextLayer);
      const remaining = (incoming.get(next) ?? 0) - 1;
      incoming.set(next, remaining);
      if (remaining === 0) queue.push(next);
    }
  }
  for (const id of ids) {
    if (!layer.has(id)) {
      layer.set(id, 0);
      idx.set(id, 100000 + (idx.size ?? 0));
    }
  }

  const byLayer = new Map<number, string[]>();
  for (const [id, l] of layer) {
    byLayer.set(l, [...(byLayer.get(l) ?? []), id]);
  }
  const positions = new Map<string, { x: number; y: number }>();
  let maxW = 0;
  let totalW = 0;
  let maxH = 0;
  for (const l of Array.from(byLayer.keys()).sort((a, b) => a - b)) {
    const col = byLayer.get(l) ?? [];
    col.sort((a, b) => (idx.get(a) ?? 0) - (idx.get(b) ?? 0));
    let y = 0;
    let colMaxW = 0;
    for (const id of col) {
      const size = sizes.get(id);
      const w = size?.width ?? 180;
      const h = size?.height ?? 90;
      positions.set(id, { x: totalW, y });
      y += h + GAP_Y;
      colMaxW = Math.max(colMaxW, w);
      maxH = Math.max(maxH, y);
    }
    totalW += colMaxW + GAP_X;
    maxW = totalW;
  }
  return {
    nodes: nodes
      .map((n) => {
        const p = positions.get(n.id);
        return { id: n.id, position: p ?? { x: 0, y: 0 } };
      })
      .filter((n) => n.position.x !== undefined),
    width: Math.max(maxW, 400),
    height: Math.max(maxH, 400),
  };
}
