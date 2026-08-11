"use client";

import * as React from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  applyNodeChanges,
  applyEdgeChanges,
  type NodeChange,
  type EdgeChange,
  type Connection,
  type OnSelectionChangeParams,
  type XYPosition,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { RELATION_SPECS } from "@/types/diagram";
import type { DiagramEngine } from "@/hooks/useDiagram";
import type { UMLFlowEdge, UMLFlowNode } from "@/lib/mermaid/transformer";
import { computeLayeredLayout } from "@/lib/editor/layout";
import { EMPTY_COMMENTS, useCommentsStore } from "@/lib/editor/comments";
import { StatusBar } from "@/components/editor/status-bar";
import { toast } from "@/components/ui/toast";
import { BoxSelect, Clipboard, LayoutGrid, Maximize, MessageSquarePlus } from "lucide-react";

interface CanvasProps {
  diagramId: string;
  engine: DiagramEngine;
}

const NODE_TYPES = {
  uml: React.lazy(() => import("@/components/editor/uml-node")),
  "actor-node": React.lazy(() =>
    import("@/components/editor/uml-node").then((m) => ({ default: m.UMLActorNodeComponent }))
  ),
  "database-node": React.lazy(() =>
    import("@/components/editor/uml-node").then((m) => ({ default: m.UMLDatabaseNodeComponent }))
  ),
};

const EDGE_TYPES = {
  "uml-edge": React.lazy(() => import("@/components/editor/uml-edge")),
};

function positionKey(diagramId: string): string {
  return `archvision-positions-${diagramId}`;
}

function loadSavedPositions(diagramId: string): Record<string, { x: number; y: number }> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(positionKey(diagramId));
    return raw ? (JSON.parse(raw) as Record<string, { x: number; y: number }>) : {};
  } catch {
    return {};
  }
}

function savePositions(diagramId: string, positions: Record<string, { x: number; y: number }>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(positionKey(diagramId), JSON.stringify(positions));
  } catch {
    /* storage full or unavailable — positions are a convenience, not critical */
  }
}

function nodeSignature(nodes: UMLFlowNode[], edges: UMLFlowEdge[]): string {
  const nodePart = nodes.map((n) => `${n.id}:${n.type}`).join(",");
  const edgePart = edges.map((e) => `${e.id}:${e.source}:${e.target}`).join(",");
  return `${nodes.length}|${nodePart}|${edges.length}|${edgePart}`;
}

const RELATION_TYPE_ORDER = [
  "association",
  "dependency",
  "inheritance",
  "aggregation",
  "composition",
  "implementation",
] as const;
type UmlRelationType = (typeof RELATION_TYPE_ORDER)[number];

function ConnectionTypeDialog({
  open,
  sourceLabel,
  targetLabel,
  onCancel,
  onPick,
}: {
  open: boolean;
  sourceLabel: string | null;
  targetLabel: string | null;
  onCancel: () => void;
  onPick: (type: UmlRelationType) => void;
}): React.ReactElement | null {
  if (!open) return null;
  return (
    <div
      className="absolute inset-0 z-40 flex items-center justify-center bg-slate-900/25 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-label="Choose relationship type"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="w-[340px] rounded-2xl border border-line bg-white p-5 shadow-panel-float">
        <p className="text-[13px] font-bold text-foreground">New relationship</p>
        <p className="mt-1 truncate text-[12px] text-muted-foreground">
          {sourceLabel} <span className="mx-1 text-slate-400">→</span> {targetLabel}
        </p>
        <div className="mt-4 grid grid-cols-1 gap-2">
          {RELATION_TYPE_ORDER.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => onPick(type)}
              className="flex items-center gap-3 rounded-xl border border-line px-3 py-2 text-left text-[12.5px] font-semibold text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
            >
              <span className="w-10 shrink-0 font-mono text-[11px] text-primary">{RELATION_SPECS[type].mermaid}</span>
              {RELATION_SPECS[type].label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="mt-4 w-full rounded-xl border border-line py-2 text-[12.5px] font-semibold text-muted-foreground transition-colors hover:bg-surface"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

/* ---------------- clipboard & helpers ---------------- */

interface ClipNode {
  name: string;
  kind: UMLFlowNode["data"]["kind"];
  stereotype: string | null;
  isAbstract: boolean;
  isInterface: boolean;
  attributes: UMLFlowNode["data"]["attributes"];
  methods: UMLFlowNode["data"]["methods"];
  position: { x: number; y: number };
}

interface ClipEdge {
  source: string;
  target: string;
  type: string;
  label?: string | null;
}

let clipboard: { nodes: ClipNode[]; edges: ClipEdge[] } | null = null;

const NODE_WIDTH = 232;

function estimateNodeHeight(node: UMLFlowNode): number {
  if (node.measured?.height) return node.measured.height;
  return Math.max(72, 64 + (node.data.attributes.length + node.data.methods.length) * 21);
}

function nodeSize(node: UMLFlowNode): { w: number; h: number } {
  return { w: node.measured?.width ?? NODE_WIDTH, h: estimateNodeHeight(node) };
}

interface Guide {
  pos: number;
  from: number;
  to: number;
}

interface GuideState {
  v: Guide | null;
  h: Guide | null;
}

function CanvasInner({ diagramId, engine }: CanvasProps): React.ReactElement {
  const { fitView, screenToFlowPosition, zoomIn, zoomOut, setViewport, getViewport } = useReactFlow<UMLFlowNode, UMLFlowEdge>();
  const [flowNodes, setFlowNodes] = React.useState<UMLFlowNode[]>(engine.nodes);
  const [flowEdges, setFlowEdges] = React.useState<UMLFlowEdge[]>(engine.edges);
  const [pendingConnection, setPendingConnection] = React.useState<Connection | null>(null);
  const [guides, setGuides] = React.useState<GuideState>({ v: null, h: null });
  const [menu, setMenu] = React.useState<{ x: number; y: number; flow: XYPosition; target: "pane" } | null>(null);
  const savedRef = React.useRef(loadSavedPositions(diagramId));
  const flowNodesRef = React.useRef(flowNodes);
  flowNodesRef.current = flowNodes;
  const flowEdgesRef = React.useRef(flowEdges);
  flowEdgesRef.current = flowEdges;

  const comments = useCommentsStore((s) => s.comments[diagramId] ?? EMPTY_COMMENTS);
  const setCommentsOpen = useCommentsStore((s) => s.setOpen);
  const addComment = useCommentsStore((s) => s.addComment);
  const focusComment = useCommentsStore((s) => s.focusComment);

  const signature = nodeSignature(engine.nodes, engine.edges);

  React.useEffect(() => {
    const saved = savedRef.current;
    const positions = new Map(engine.nodes.map((n) => [n.id, saved[n.id] ?? n.position]));
    setFlowNodes(
      engine.nodes.map((n) => ({ ...n, position: positions.get(n.id) ?? n.position, style: { ...n.style } }))
    );
    setFlowEdges(
      engine.edges.map((e) => ({
        ...e,
        data: { ...(e.data as Record<string, unknown>), orthogonal: true },
      }))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      void fitView({ padding: 0.2, duration: 600 });
    }, 150);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const commitPositions = React.useCallback(
    (updater: (nodes: UMLFlowNode[]) => UMLFlowNode[]) => {
      setFlowNodes((nds) => {
        const next = updater(nds);
        const positions: Record<string, { x: number; y: number }> = { ...savedRef.current };
        for (const n of next) positions[n.id] = n.position;
        savedRef.current = positions;
        savePositions(diagramId, positions);
        return next;
      });
    },
    [diagramId]
  );

  const onNodesChange = React.useCallback(
    (changes: NodeChange<UMLFlowNode>[]) => {
      setFlowNodes((nds) => {
        const next = applyNodeChanges(changes, nds) as UMLFlowNode[];
        const positionChanges = changes.filter((c) => c.type === "position");
        if (positionChanges.length > 0) {
          const positions: Record<string, { x: number; y: number }> = { ...savedRef.current };
          for (const c of positionChanges) {
            if (c.type === "position" && c.position) positions[c.id] = c.position;
          }
          savedRef.current = positions;
          savePositions(diagramId, positions);
        }
        return next;
      });
    },
    [diagramId]
  );

  const onEdgesChange = React.useCallback((changes: EdgeChange<UMLFlowEdge>[]) => {
    setFlowEdges((eds) => applyEdgeChanges(changes, eds) as UMLFlowEdge[]);
  }, []);

  const onConnect = React.useCallback((connection: Connection) => {
    if (!connection.source || !connection.target || connection.source === connection.target) return;
    setPendingConnection(connection);
  }, []);

  const confirmConnection = React.useCallback(
    (type: UmlRelationType) => {
      const c = pendingConnection;
      setPendingConnection(null);
      if (!c?.source || !c?.target) return;
      engine.addRelationship(c.source, c.target, type);
    },
    [pendingConnection, engine]
  );

  const onNodesDelete = React.useCallback(
    (deleted: UMLFlowNode[]) => {
      for (const node of deleted) engine.removeNode(node.id);
    },
    [engine]
  );

  const onEdgesDelete = React.useCallback(
    (deleted: UMLFlowEdge[]) => {
      for (const edge of deleted) engine.removeRelationship(edge.id);
    },
    [engine]
  );

  const onSelectionChange = React.useCallback(
    ({ nodes: selectedNodes, edges: selectedEdges }: OnSelectionChangeParams) => {
      if (selectedEdges.length === 1 && selectedNodes.length === 0) {
        engine.setSelection(null, selectedEdges[0].id);
      } else if (selectedNodes.length === 1) {
        engine.setSelection(selectedNodes[0].id, null);
      } else {
        engine.setSelection(null, null);
      }
    },
    [engine]
  );

  /* ---------------- smart guides ---------------- */

  const onNodeDrag = React.useCallback(
    (_event: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent, node: UMLFlowNode) => {
      const dragged = node;
      const { w: dw, h: dh } = nodeSize(dragged);
      const x = dragged.position.x;
      const y = dragged.position.y;
      const cx = x + dw / 2;
      const cy = y + dh / 2;
      let snapX: number | null = null;
      let snapY: number | null = null;
      let vGuide: Guide | null = null;
      let hGuide: Guide | null = null;
      const THRESH = 8;

      for (const other of flowNodesRef.current) {
        if (other.id === dragged.id) continue;
        const { w: ow, h: oh } = nodeSize(other);
        const ox = other.position.x;
        const oy = other.position.y;
        const oCx = ox + ow / 2;
        const oCy = oy + oh / 2;

        const vCandidates: Array<[string, number, number]> = [
          ["left", ox, x],
          ["center", oCx, cx],
          ["right", ox + ow, x + dw],
        ];
        for (const [label, value, targetValue] of vCandidates) {
          void label;
          const d = value - targetValue;
          if (Math.abs(d) < THRESH) {
            snapX = d;
            vGuide = {
              pos: value,
              from: Math.min(oy, y),
              to: Math.max(oy + oh, y + dh),
            };
          }
        }
        const hCandidates: Array<[string, number, number]> = [
          ["top", oy, y],
          ["middle", oCy, cy],
          ["bottom", oy + oh, y + dh],
        ];
        for (const [label, value, targetValue] of hCandidates) {
          void label;
          const d = value - targetValue;
          if (Math.abs(d) < THRESH) {
            snapY = d;
            hGuide = {
              pos: value,
              from: Math.min(ox, x),
              to: Math.max(ox + ow, x + dw),
            };
          }
        }
      }

      if (snapX !== null || snapY !== null) {
        const nx = snapX !== null ? x + snapX : x;
        const ny = snapY !== null ? y + snapY : y;
        setFlowNodes((nds) => nds.map((n) => (n.id === dragged.id ? { ...n, position: { x: nx, y: ny } } : n)));
      }
      setGuides({ v: vGuide, h: hGuide });
    },
    []
  );

  const onNodeDragStop = React.useCallback(() => {
    setGuides({ v: null, h: null });
  }, []);

  /* ---------------- selection ops ---------------- */

  const selectedNodes = React.useCallback(() => flowNodesRef.current.filter((n) => n.selected), []);

  const duplicateSelected = React.useCallback(() => {
    const items = selectedNodes();
    if (items.length === 0) {
      toast("error", "Select nodes to duplicate");
      return;
    }
    const map = new Map<string, string>();
    const added: Array<{ name: string; pos: { x: number; y: number } }> = [];
    for (const item of items) {
      const id = engine.addNode(item.data.kind, item.data.label);
      if (!id) continue;
      map.set(item.id, id);
      engine.updateNode(id, {
        attributes: item.data.attributes,
        methods: item.data.methods.map((m) => ({ ...m, isAsync: false })),
        stereotype: item.data.stereotype,
        isAbstract: item.data.isAbstract,
        isInterface: item.data.isInterface,
      });
      added.push({ name: id, pos: { x: item.position.x + 40, y: item.position.y + 40 } });
    }
    for (const a of added) savedRef.current[a.name] = a.pos;
    const edges = flowEdges.filter((edge) => map.has(edge.source) && map.has(edge.target));
    for (const edge of edges) {
      const s = map.get(edge.source);
      const t = map.get(edge.target);
      if (!s || !t) continue;
      const data = (edge.data ?? {}) as { relationType?: string; label?: string };
      engine.addRelationship(s, t, (data.relationType ?? "association") as UmlRelationType, {
        label: data.label ?? null,
      });
    }
    savePositions(diagramId, { ...savedRef.current });
    toast("success", `Duplicated ${items.length} node${items.length > 1 ? "s" : ""}`);
  }, [engine, flowEdges, selectedNodes, diagramId]);

  const copySelected = React.useCallback(() => {
    const items = selectedNodes();
    if (items.length === 0) {
      toast("error", "Select nodes to copy");
      return;
    }
    const ids = new Set(items.map((n) => n.id));
    const edges = flowEdges
      .filter((e) => ids.has(e.source) && ids.has(e.target))
      .map((e) => {
        const data = (e.data ?? {}) as { relationType?: string; label?: string };
        return { source: e.source, target: e.target, type: data.relationType ?? "association", label: data.label };
      });
    clipboard = {
      nodes: items.map((n) => ({
        name: n.data.label,
        kind: n.data.kind,
        stereotype: n.data.stereotype,
        isAbstract: n.data.isAbstract,
        isInterface: n.data.isInterface,
        attributes: n.data.attributes,
        methods: n.data.methods,
        position: { ...n.position },
      })),
      edges,
    };
    toast("success", `Copied ${items.length} node${items.length > 1 ? "s" : ""}`);
  }, [flowEdges, selectedNodes]);

  const pasteClipboard = React.useCallback(
    (offset: { x: number; y: number } = { x: 40, y: 40 }) => {
      if (!clipboard || clipboard.nodes.length === 0) {
        toast("error", "Nothing to paste");
        return;
      }
      const map = new Map<string, string>();
      const positions: Record<string, { x: number; y: number }> = { ...savedRef.current };
      for (const item of clipboard.nodes) {
        const id = engine.addNode(item.kind, item.name);
        if (!id) continue;
        map.set(item.name, id);
        engine.updateNode(id, {
          attributes: item.attributes,
          methods: item.methods.map((m) => ({ ...m, isAsync: false })),
          stereotype: item.stereotype,
          isAbstract: item.isAbstract,
          isInterface: item.isInterface,
        });
        positions[id] = { x: item.position.x + offset.x, y: item.position.y + offset.y };
      }
      savedRef.current = positions;
      for (const edge of clipboard.edges) {
        const s = map.get(edge.source);
        const t = map.get(edge.target);
        if (!s || !t) continue;
        engine.addRelationship(s, t, (edge.type ?? "association") as UmlRelationType, {
          label: edge.label ?? null,
        });
      }
      savePositions(diagramId, positions);
    },
    [engine, diagramId]
  );

  const cutSelected = React.useCallback(() => {
    const items = selectedNodes();
    if (items.length === 0) {
      toast("error", "Select nodes to cut");
      return;
    }
    copySelected();
    const edgeIds = new Set(flowEdges.filter((e) => items.some((n) => n.id === e.source || n.id === e.target)).map((e) => e.id));
    for (const edge of flowEdges) if (edgeIds.has(edge.id)) engine.removeRelationship(edge.id);
    for (const item of items) engine.removeNode(item.id);
  }, [copySelected, engine, flowEdges, selectedNodes]);

  const selectAll = React.useCallback(() => {
    setFlowNodes((nds) => nds.map((n) => ({ ...n, selected: true })));
  }, []);

  const nudge = React.useCallback(
    (dx: number, dy: number) => {
      commitPositions((nds) =>
        nds.map((n) => (n.selected ? { ...n, position: { x: n.position.x + dx, y: n.position.y + dy } } : n))
      );
    },
    [commitPositions]
  );

  /* ---------------- arrange ops ---------------- */

  const align = React.useCallback(
    (axis: "left" | "center" | "right" | "top" | "middle" | "bottom") => {
      const sel = selectedNodes();
      if (sel.length === 0) {
        toast("error", "Select nodes to align");
        return;
      }
      const sizes = sel.map((n) => ({ n, size: nodeSize(n) }));
      const left = Math.min(...sizes.map((s) => s.n.position.x));
      const top = Math.min(...sizes.map((s) => s.n.position.y));
      const right = Math.max(...sizes.map((s) => s.n.position.x + s.size.w));
      const bottom = Math.max(...sizes.map((s) => s.n.position.y + s.size.h));
      const cx = (left + right) / 2;
      const cy = (top + bottom) / 2;
      commitPositions((nds) =>
        nds.map((n) => {
          if (!n.selected) return n;
          const size = nodeSize(n);
          let x = n.position.x;
          let y = n.position.y;
          if (axis === "left") x = left;
          if (axis === "center") x = cx - size.w / 2;
          if (axis === "right") x = right - size.w;
          if (axis === "top") y = top;
          if (axis === "middle") y = cy - size.h / 2;
          if (axis === "bottom") y = bottom - size.h;
          return { ...n, position: { x, y } };
        })
      );
    },
    [commitPositions, selectedNodes]
  );

  const distribute = React.useCallback(
    (axis: "horizontal" | "vertical") => {
      const sel = selectedNodes();
      if (sel.length < 3) {
        toast("error", "Select at least 3 nodes to distribute");
        return;
      }
      const sizes = sel.map((n) => ({ n, size: nodeSize(n) }));
      if (axis === "horizontal") {
        sizes.sort((a, b) => a.n.position.x - b.n.position.x);
        const first = sizes[0];
        const last = sizes[sizes.length - 1];
        const span = last.n.position.x + last.size.w - first.n.position.x;
        const inner = sizes.slice(1, -1);
        const totalW = inner.reduce((acc, s) => acc + s.size.w, 0);
        const gap = (span - totalW) / (inner.length + 1);
        const targets = new Map<string, number>();
        let cursor = first.n.position.x + first.size.w;
        for (const s of inner) {
          targets.set(s.n.id, cursor + gap);
          cursor += gap + s.size.w;
        }
        commitPositions((nds) => nds.map((n) => (targets.has(n.id) ? { ...n, position: { x: targets.get(n.id) as number, y: n.position.y } } : n)));
      } else {
        sizes.sort((a, b) => a.n.position.y - b.n.position.y);
        const first = sizes[0];
        const last = sizes[sizes.length - 1];
        const span = last.n.position.y + last.size.h - first.n.position.y;
        const inner = sizes.slice(1, -1);
        const totalH = inner.reduce((acc, s) => acc + s.size.h, 0);
        const gap = (span - totalH) / (inner.length + 1);
        const targets = new Map<string, number>();
        let cursor = first.n.position.y + first.size.h;
        for (const s of inner) {
          targets.set(s.n.id, cursor + gap);
          cursor += gap + s.size.h;
        }
        commitPositions((nds) => nds.map((n) => (targets.has(n.id) ? { ...n, position: { x: n.position.x, y: targets.get(n.id) as number } } : n)));
      }
    },
    [commitPositions, selectedNodes]
  );

  const autoLayout = React.useCallback(() => {
    const sizes = new Map(
      flowNodesRef.current.map((n) => {
        const size = nodeSize(n);
        return [n.id, { id: n.id, width: size.w, height: size.h }];
      })
    );
    const result = computeLayeredLayout(flowNodesRef.current, flowEdges, sizes);
    commitPositions((nds) => nds.map((n) => result.nodes.find((r) => r.id === n.id)?.position ? { ...n, position: (result.nodes.find((r) => r.id === n.id) as { id: string; position: { x: number; y: number } }).position } : n));
    window.setTimeout(() => {
      void fitView({ padding: 0.2, duration: 500 });
    }, 80);
  }, [commitPositions, fitView, flowEdges]);

  /* ---------------- window events ---------------- */

  React.useEffect(() => {
    const zoomInListener = (): void => void zoomIn({ duration: 200 });
    const zoomOutListener = (): void => void zoomOut({ duration: 200 });
    const resetListener = (): void => void setViewport({ x: 0, y: 0, zoom: 1 });
    const fitListener = (): void => void fitView({ padding: 0.2, duration: 400 });
    const selectAllListener = (): void => selectAll();
    const duplicateListener = (): void => duplicateSelected();
    const copyListener = (): void => copySelected();
    const cutListener = (): void => cutSelected();
    const pasteListener = (): void => pasteClipboard();
    const nudgeListener = (e: Event): void => {
      const detail = (e as CustomEvent<{ dx: number; dy: number }>).detail;
      nudge(detail.dx, detail.dy);
    };
    const alignListener = (e: Event): void => {
      const detail = (e as CustomEvent<{ axis: "left" | "center" | "right" | "top" | "middle" | "bottom" }>).detail;
      align(detail.axis);
    };
    const distributeListener = (e: Event): void => {
      const detail = (e as CustomEvent<{ axis: "horizontal" | "vertical" }>).detail;
      distribute(detail.axis);
    };
    const autoLayoutListener = (): void => autoLayout();
    const deleteListener = (): void => {
      for (const edge of flowEdgesRef.current) {
        if (edge.selected) engine.removeRelationship(edge.id);
      }
      for (const node of flowNodesRef.current) {
        if (node.selected) engine.removeNode(node.id);
      }
    };

    window.addEventListener("archvision:zoom-in", zoomInListener);
    window.addEventListener("archvision:zoom-out", zoomOutListener);
    window.addEventListener("archvision:zoom-reset", resetListener);
    window.addEventListener("archvision:fit-view", fitListener);
    window.addEventListener("archvision:select-all", selectAllListener);
    window.addEventListener("archvision:duplicate-selected", duplicateListener);
    window.addEventListener("archvision:copy-selected", copyListener);
    window.addEventListener("archvision:cut-selected", cutListener);
    window.addEventListener("archvision:paste", pasteListener);
    window.addEventListener("archvision:nudge", nudgeListener);
    window.addEventListener("archvision:align", alignListener);
    window.addEventListener("archvision:distribute", distributeListener);
    window.addEventListener("archvision:auto-layout", autoLayoutListener);
    window.addEventListener("archvision:delete-selected", deleteListener);
    return () => {
      window.removeEventListener("archvision:zoom-in", zoomInListener);
      window.removeEventListener("archvision:zoom-out", zoomOutListener);
      window.removeEventListener("archvision:zoom-reset", resetListener);
      window.removeEventListener("archvision:fit-view", fitListener);
      window.removeEventListener("archvision:select-all", selectAllListener);
      window.removeEventListener("archvision:duplicate-selected", duplicateListener);
      window.removeEventListener("archvision:copy-selected", copyListener);
      window.removeEventListener("archvision:cut-selected", cutListener);
      window.removeEventListener("archvision:paste", pasteListener);
      window.removeEventListener("archvision:nudge", nudgeListener);
      window.removeEventListener("archvision:align", alignListener);
      window.removeEventListener("archvision:distribute", distributeListener);
      window.removeEventListener("archvision:auto-layout", autoLayoutListener);
      window.removeEventListener("archvision:delete-selected", deleteListener);
    };
  }, [zoomIn, zoomOut, setViewport, fitView, selectAll, duplicateSelected, copySelected, cutSelected, pasteClipboard, nudge, align, distribute, autoLayout, engine]);

  /* ---------------- drag & drop & context menu ---------------- */

  const onDragOver = React.useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = React.useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const raw = event.dataTransfer.getData("application/archvision-node");
      if (!raw) return;
      try {
        const { kind } = JSON.parse(raw) as { kind: Parameters<DiagramEngine["addNode"]>[0] };
        const id = engine.addNode(kind);
        if (id) {
          const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
          savedRef.current[id] = position;
        }
      } catch {
        /* malformed drop payload — ignore */
      }
    },
    [engine, screenToFlowPosition]
  );

  const onPaneContextMenu = React.useCallback(
    (event: React.MouseEvent | MouseEvent) => {
      event.preventDefault();
      const flow = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      setMenu({ x: event.clientX, y: event.clientY, flow, target: "pane" });
    },
    [screenToFlowPosition]
  );

  const addCommentAt = React.useCallback(
    (flow: XYPosition) => {
      addComment(diagramId, { author: "you", text: "", x: flow.x, y: flow.y });
    },
    [addComment, diagramId]
  );

  /* ---------------- render ---------------- */

  const viewport = getViewport();
  const anchoredComments = comments.filter((c) => c.x !== 0 || c.y !== 0);

  return (
    <React.Suspense
      fallback={
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          Preparing canvas…
        </div>
      }
    >
      <div className="relative h-full w-full">
        <ReactFlow
          nodes={flowNodes}
          edges={flowEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={NODE_TYPES}
          edgeTypes={EDGE_TYPES}
          fitView
          fitViewOptions={{ padding: 0.2, duration: 600 }}
          onSelectionChange={onSelectionChange}
          onConnect={onConnect}
          onNodesDelete={onNodesDelete}
          onEdgesDelete={onEdgesDelete}
          onDragOver={onDragOver}
          onDrop={onDrop}
          onPaneContextMenu={onPaneContextMenu}
          onNodeDrag={onNodeDrag}
          onNodeDragStop={onNodeDragStop}
          nodesConnectable
          nodesDraggable
          elementsSelectable
          selectionOnDrag
          panOnDrag={[1, 2]}
          panOnScroll
          zoomOnScroll
          deleteKeyCode={["Backspace", "Delete"]}
          proOptions={{ hideAttribution: true }}
          className="uml-flow h-full w-full"
        >
          <Background variant={BackgroundVariant.Dots} gap={24} size={1.6} color="rgba(15,23,42,0.10)" />
          <Controls showInteractive={false} position="bottom-left" />
          <MiniMap
            position="bottom-right"
            pannable
            zoomable
            nodeColor={(node) => {
              const data = (node as UMLFlowNode).data;
              if (data?.isInterface) return "#93C5FD";
              if (data?.isAbstract) return "#FDE68A";
              return "#DBEAFE";
            }}
          />
        </ReactFlow>

        {anchoredComments.length > 0 ? (
          <svg className="pointer-events-none absolute inset-0 z-30 h-full w-full">
            {anchoredComments.map((c) => {
              const sx = c.x * viewport.zoom + viewport.x;
              const sy = c.y * viewport.zoom + viewport.y;
              return (
                <g key={c.id} className="pointer-events-auto">
                  <circle
                    cx={sx}
                    cy={sy}
                    r={11}
                    fill="#F59E0B"
                    stroke="#fff"
                    strokeWidth={2}
                    className="cursor-pointer drop-shadow-sm"
                    onClick={() => {
                      focusComment(c.id);
                      setCommentsOpen(true);
                    }}
                  />
                  {c.text ? (
                    <circle cx={sx} cy={sy} r={3} fill="#fff" />
                  ) : (
                    <path d={`M ${sx - 3} ${sy + 4} l 2 -2 l 2 2 z`} fill="#fff" transform={`translate(0 0)`} />
                  )}
                </g>
              );
            })}
          </svg>
        ) : null}

        {guides.v || guides.h ? (
          <svg className="pointer-events-none absolute inset-0 z-40 h-full w-full" data-testid="smart-guides">
            {guides.v ? (
              <line
                x1={guides.v.pos * viewport.zoom + viewport.x}
                y1={guides.v.from * viewport.zoom + viewport.y}
                x2={guides.v.pos * viewport.zoom + viewport.x}
                y2={guides.v.to * viewport.zoom + viewport.y}
                stroke="#EC4899"
                strokeWidth={1}
                strokeDasharray="4 3"
              />
            ) : null}
            {guides.h ? (
              <line
                x1={guides.h.from * viewport.zoom + viewport.x}
                y1={guides.h.pos * viewport.zoom + viewport.y}
                x2={guides.h.to * viewport.zoom + viewport.x}
                y2={guides.h.pos * viewport.zoom + viewport.y}
                stroke="#EC4899"
                strokeWidth={1}
                strokeDasharray="4 3"
              />
            ) : null}
          </svg>
        ) : null}

        {menu ? (
          <div
            className="absolute z-50 w-48 rounded-xl border border-line bg-white py-1 shadow-panel-float"
            style={{ left: menu.x, top: menu.y }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] font-medium text-foreground hover:bg-surface"
              onClick={() => {
                addCommentAt(menu.flow);
                setMenu(null);
              }}
            >
              <MessageSquarePlus className="h-3.5 w-3.5 text-slate-400" /> Add comment here
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] font-medium text-foreground hover:bg-surface disabled:opacity-40"
              disabled={!clipboard}
              onClick={() => {
                pasteClipboard({ x: menu.flow.x, y: menu.flow.y });
                setMenu(null);
              }}
            >
              <Clipboard className="h-3.5 w-3.5 text-slate-400" /> Paste
            </button>
            <div className="my-1 h-px bg-line" />
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] font-medium text-foreground hover:bg-surface"
              onClick={() => {
                selectAll();
                setMenu(null);
              }}
            >
              <BoxSelect className="h-3.5 w-3.5 text-slate-400" /> Select all
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] font-medium text-foreground hover:bg-surface"
              onClick={() => {
                autoLayout();
                setMenu(null);
              }}
            >
              <LayoutGrid className="h-3.5 w-3.5 text-slate-400" /> Auto layout
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] font-medium text-foreground hover:bg-surface"
              onClick={() => {
                void fitView({ padding: 0.2, duration: 400 });
                setMenu(null);
              }}
            >
              <Maximize className="h-3.5 w-3.5 text-slate-400" /> Fit view
            </button>
          </div>
        ) : null}

        <StatusBar engine={engine} nodeCount={flowNodes.length} edgeCount={flowEdges.length} />

        <ConnectionTypeDialog
          open={pendingConnection !== null}
          sourceLabel={pendingConnection
            ? engine.architecture.nodes.find((n) => n.id === pendingConnection.source)?.name ?? pendingConnection.source
            : null}
          targetLabel={pendingConnection
            ? engine.architecture.nodes.find((n) => n.id === pendingConnection.target)?.name ?? pendingConnection.target
            : null}
          onCancel={() => setPendingConnection(null)}
          onPick={confirmConnection}
        />
      </div>
    </React.Suspense>
  );
}

export function Canvas(props: CanvasProps): React.ReactElement {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} />
    </ReactFlowProvider>
  );
}
