import type { Node, Edge } from "@xyflow/react";

export type LayoutDirection = "LR" | "TB";

export interface LayoutNodeSize {
  id: string;
  width: number;
  height: number;
}

export interface LayoutResult {
  nodes: { id: string; position: { x: number; y: number } }[];
  width: number;
  height: number;
}

const GAP_X = 80;
const GAP_Y = 80;

function buildGraph(nodes: Node[], edges: Edge[]): {
  incoming: Map<string, Set<string>>;
  outgoing: Map<string, Set<string>>;
} {
  const ids = new Set(nodes.map((n) => n.id));
  const incoming = new Map<string, Set<string>>();
  const outgoing = new Map<string, Set<string>>();
  for (const id of ids) {
    incoming.set(id, new Set());
    outgoing.set(id, new Set());
  }
  for (const e of edges) {
    if (!ids.has(e.source) || !ids.has(e.target)) continue;
    outgoing.get(e.source)?.add(e.target);
    incoming.get(e.target)?.add(e.source);
  }
  return { incoming, outgoing };
}

/** Longest-path layering — always produces an acyclic ranking, even for cyclic graphs. */
function layerNodes(
  g: ReturnType<typeof buildGraph>,
  ids: string[]
): Map<string, number> {
  const layer = new Map<string, number>();
  const remaining = new Map<string, number>();
  for (const id of ids) remaining.set(id, g.incoming.get(id)?.size ?? 0);

  const queue: string[] = [];
  for (const id of ids) {
    if ((remaining.get(id) ?? 0) === 0) {
      layer.set(id, 0);
      queue.push(id);
    }
  }

  let qi = 0;
  while (true) {
    if (qi >= queue.length) {
      // No ready node: break cycles by seeding the next unlayered node.
      const next = ids.find((id) => !layer.has(id));
      if (!next) break;
      let seedLayer = 0;
      for (const pred of g.incoming.get(next) ?? []) {
        seedLayer = Math.max(seedLayer, (layer.get(pred) ?? 0) + 1);
      }
      layer.set(next, seedLayer);
      queue.push(next);
    }
    const id = queue[qi];
    qi += 1;
    for (const nxt of g.outgoing.get(id) ?? []) {
      layer.set(nxt, Math.max(layer.get(nxt) ?? 0, (layer.get(id) ?? 0) + 1));
      const rem = (remaining.get(nxt) ?? 0) - 1;
      remaining.set(nxt, rem);
      if (rem <= 0 && !queue.includes(nxt)) queue.push(nxt);
    }
  }
  return layer;
}

/**
 * Barycenter ordering: iterative sweeps sorting each layer by the average
 * position of neighbours in the adjacent layer (left→right then right→left)
 * to minimise edge crossings.
 */
function orderLayers(
  g: ReturnType<typeof buildGraph>,
  layer: Map<string, number>,
  ids: string[]
): Map<number, string[]> {
  const byLayer = new Map<number, string[]>();
  for (const id of ids) {
    const l = layer.get(id) ?? 0;
    byLayer.set(l, [...(byLayer.get(l) ?? []), id]);
  }
  const keys = [...byLayer.keys()].sort((a, b) => a - b);
  const order = new Map<number, string[]>();
  for (const k of keys) order.set(k, [...(byLayer.get(k) ?? [])]);

  const posOf = (layerId: number): Map<string, number> => {
    const m = new Map<string, number>();
    (order.get(layerId) ?? []).forEach((id, i) => m.set(id, i));
    return m;
  };

  const barySort = (layerId: number, neighbourPos: Map<string, number>): void => {
    const items = order.get(layerId) ?? [];
    const scored = items.map((id) => {
      const neighbours = [...(g.incoming.get(id) ?? []), ...(g.outgoing.get(id) ?? [])];
      const positions = neighbours
        .map((n) => neighbourPos.get(n))
        .filter((p): p is number => p !== undefined);
      const bary =
        positions.length > 0
          ? positions.reduce((a, b) => a + b, 0) / positions.length
          : -1;
      return { id, bary };
    });
    scored.sort(
      (a, b) =>
        (a.bary < 0 ? 1 : 0) - (b.bary < 0 ? 1 : 0) || a.bary - b.bary
    );
    order.set(
      layerId,
      scored.map((s) => s.id)
    );
  };

  for (let pass = 0; pass < 3; pass += 1) {
    for (let i = 1; i < keys.length; i += 1) barySort(keys[i], posOf(keys[i - 1]));
    for (let i = keys.length - 2; i >= 0; i -= 1) barySort(keys[i], posOf(keys[i + 1]));
  }
  return order;
}

/**
 * Layered layout. For LR, layers are columns (x advances per layer, nodes
 * stack vertically). For TB, layers are rows (y advances per layer, nodes
 * stack horizontally).
 */
function computeLayout(
  nodes: Node[],
  edges: Edge[],
  sizes: Map<string, LayoutNodeSize>,
  vertical: boolean
): LayoutResult {
  const ids = nodes.map((n) => n.id);
  const g = buildGraph(nodes, edges);
  const layer = layerNodes(g, ids);
  const order = orderLayers(g, layer, ids);
  const keys = [...order.keys()].sort((a, b) => a - b);

  const positions = new Map<string, { x: number; y: number }>();
  let cursorCross = 0;
  let maxStack = 0;

  for (const layerId of keys) {
    const row = order.get(layerId) ?? [];
    let cursorStack = 0;
    for (const id of row) {
      const size = sizes.get(id);
      const w = size?.width ?? 180;
      const h = size?.height ?? 90;
      if (vertical) {
        positions.set(id, { x: cursorStack, y: cursorCross });
        cursorStack += w + GAP_X;
      } else {
        positions.set(id, { x: cursorCross, y: cursorStack });
        cursorStack += h + GAP_Y;
      }
    }
    const crossSize = vertical
      ? Math.max(...row.map((id) => sizes.get(id)?.height ?? 90))
      : Math.max(...row.map((id) => sizes.get(id)?.width ?? 180));
    cursorCross += crossSize + (vertical ? GAP_Y : GAP_X);
    maxStack = Math.max(maxStack, cursorStack - (vertical ? GAP_X : GAP_Y));
  }

  return {
    nodes: nodes
      .map((n) => {
        const p = positions.get(n.id);
        return { id: n.id, position: p ?? { x: 0, y: 0 } };
      })
      .filter((n) => n.position.x !== undefined),
    width: vertical ? maxStack : cursorCross - GAP_X,
    height: vertical ? cursorCross - GAP_Y : maxStack,
  };
}

/**
 * Deterministic layered auto-layout with barycenter crossing reduction.
 * Supports left-to-right (LR) and top-to-bottom (TB) directions.
 * Nodes without any edges are stacked beside the main graph, keeping the
 * main flow compact.
 */
export function computeLayeredLayout(
  nodes: Node[],
  edges: Edge[],
  sizes: Map<string, LayoutNodeSize>,
  direction: LayoutDirection = "LR"
): LayoutResult {
  const connected = nodes.filter((n) =>
    edges.some((e) => e.source === n.id || e.target === n.id)
  );
  const isolated = nodes.filter((n) => !connected.some((c) => c.id === n.id));

  const main = computeLayout(connected, edges, sizes, direction === "TB");

  if (isolated.length > 0) {
    let cursor = 0;
    let maxSide = 0;
    const horizontal = direction === "LR";
    for (const node of isolated) {
      const size = sizes.get(node.id);
      const w = size?.width ?? 180;
      const h = size?.height ?? 90;
      main.nodes.push({
        id: node.id,
        position: horizontal ? { x: main.width + 24, y: cursor } : { x: cursor, y: main.height + 24 },
      });
      cursor += (horizontal ? h : w) + 24;
      maxSide = Math.max(maxSide, horizontal ? w : h);
    }
    if (horizontal) {
      main.width += maxSide + 48;
      main.height = Math.max(main.height, cursor - 24);
    } else {
      main.height += maxSide + 48;
      main.width = Math.max(main.width, cursor - 24);
    }
  }

  return main;
}
