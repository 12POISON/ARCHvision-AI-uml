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
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { RELATION_SPECS } from "@/types/diagram";
import type { DiagramEngine } from "@/hooks/useDiagram";
import type { UMLFlowEdge, UMLFlowNode } from "@/lib/mermaid/transformer";

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

function CanvasInner({ diagramId, engine }: CanvasProps): React.ReactElement {
  const { fitView, screenToFlowPosition } = useReactFlow();
  const [flowNodes, setFlowNodes] = React.useState<UMLFlowNode[]>(engine.nodes);
  const [flowEdges, setFlowEdges] = React.useState<UMLFlowEdge[]>(engine.edges);
  const [pendingConnection, setPendingConnection] = React.useState<Connection | null>(null);
  const savedRef = React.useRef(loadSavedPositions(diagramId));

  const signature = nodeSignature(engine.nodes, engine.edges);

  React.useEffect(() => {
    const saved = savedRef.current;
    const positions = new Map(engine.nodes.map((n) => [n.id, saved[n.id] ?? n.position]));
    setFlowNodes(
      engine.nodes.map((n) => ({ ...n, position: positions.get(n.id) ?? n.position, style: { ...n.style } }))
    );
    setFlowEdges(engine.edges);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      void fitView({ padding: 0.2, duration: 600 });
    }, 150);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const sourceLabel = pendingConnection
    ? engine.architecture.nodes.find((n) => n.id === pendingConnection.source)?.name ?? pendingConnection.source
    : null;
  const targetLabel = pendingConnection
    ? engine.architecture.nodes.find((n) => n.id === pendingConnection.target)?.name ?? pendingConnection.target
    : null;

  return (
    <React.Suspense
      fallback={
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          Preparing canvas…
        </div>
      }
    >
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
        nodesConnectable
        nodesDraggable
        elementsSelectable
        panOnDrag
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
      <ConnectionTypeDialog
        open={pendingConnection !== null}
        sourceLabel={sourceLabel}
        targetLabel={targetLabel}
        onCancel={() => setPendingConnection(null)}
        onPick={confirmConnection}
      />
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