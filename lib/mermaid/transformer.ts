import dagre from "dagre";
import {
  type Edge,
  type Node,
  Position,
} from "@xyflow/react";
import type { UMLAttribute, UMLClass, UMLLink, UMLMethod, UMLModel, ViewMode, ArchitectureNodeKind } from "@/types/diagram";
import { RELATION_SPECS } from "@/types/diagram";
import { inferNodeKind } from "@/lib/architecture/model";

export interface UMLNodeData {
  label: string;
  stereotype: string | null;
  /** C4 container id — kept on node data so canvas round-trips preserve it. */
  parentId: string | null;
  isAbstract: boolean;
  isInterface: boolean;
  kind: ArchitectureNodeKind;
  attributes: UMLAttribute[];
  methods: UMLMethod[];
  viewMode: ViewMode;
}

export type UMLNodeDataWithMeta = UMLNodeData & Record<string, unknown>;

export type UMLFlowNode = Node<UMLNodeDataWithMeta, "uml" | "actor-node" | "database-node">;
export type UMLFlowEdge = Edge;

export const NODE_TYPE = "uml";

function hideMember<T extends { visibility: string; name: string }>(member: T, viewMode: ViewMode): boolean {
  return viewMode === "EXECUTIVE" && member.visibility === "private";
}

export function applyViewMode(model: UMLModel, viewMode: ViewMode): UMLModel {
  if (viewMode === "ENGINEERING") return model;
  return {
    ...model,
    classes: model.classes.map((cls) => ({
      ...cls,
      attributes: cls.attributes.filter((a) => !hideMember(a, viewMode)),
      methods: cls.methods.filter((m) => !hideMember(m, viewMode)),
    })),
  };
}

function nodeTypeFor(cls: UMLClass): "uml" | "actor-node" | "database-node" {
  if (cls.stereotype === "actor" || inferNodeKind(cls.name, cls.stereotype) === "actor") return "actor-node";
  const kind = inferNodeKind(cls.name, cls.stereotype);
  if (kind === "database" || kind === "table") return "database-node";
  return "uml";
}

function buildNode(cls: UMLClass, position: { x: number; y: number }, viewMode: ViewMode): UMLFlowNode {
  const kind = inferNodeKind(cls.name, cls.stereotype);
  return {
    id: cls.id,
    type: nodeTypeFor(cls),
    position,
    data: {
      label: cls.name,
      stereotype: cls.stereotype,
      parentId: cls.parentId ?? null,
      isAbstract: cls.isAbstract,
      isInterface: cls.isInterface,
      kind,
      attributes: cls.attributes.filter((a) => !hideMember(a, viewMode)),
      methods: cls.methods.filter((m) => !hideMember(m, viewMode)),
      viewMode,
    },
  };
}

export function layoutModel(model: UMLModel, viewMode: ViewMode, direction: "LR" | "TB" = "LR"): { nodes: UMLFlowNode[]; edges: UMLFlowEdge[] } {
  const graph = new dagre.graphlib.Graph();
  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph({ rankdir: direction, nodesep: 48, ranksep: 96, marginx: 24, marginy: 24 });

  const width = 232;
  for (const cls of model.classes) {
    const visibleAttrs = cls.attributes.filter((a) => !hideMember(a, viewMode));
    const visibleMethods = cls.methods.filter((m) => !hideMember(m, viewMode));
    const rows = visibleAttrs.length + visibleMethods.length;
    const height = Math.max(72, 64 + rows * 21);
    graph.setNode(cls.id, { width, height });
  }
  for (const link of model.links) {
    graph.setEdge(link.from, link.to);
  }

  dagre.layout(graph);

  const index = new Map<string, number>();
  model.links.forEach((link) => {
    index.set(link.id, index.size);
  });

  const nodes: UMLFlowNode[] = model.classes.map((cls) => {
    const pos = graph.node(cls.id) as { x: number; y: number } | undefined;
    const height = graph.node(cls.id).height as number | undefined;
    return buildNode(
      cls,
      { x: (pos?.x ?? 0) - width / 2, y: (pos?.y ?? 0) - (height ?? 72) / 2 },
      viewMode
    );
  });

  const edges: UMLFlowEdge[] = model.links.map((link) => ({
    id: link.id,
    source: link.from,
    target: link.to,
    type: "uml-edge",
    sourceHandle: "right-source",
    targetHandle: "left-target",
    selectable: true,
    label: link.label ?? undefined,
    data: { relationType: link.type, fromMultiplicity: link.fromMultiplicity, toMultiplicity: link.toMultiplicity },
    style: { stroke: "#94A3B8" },
  }));

  void index;
  return { nodes, edges };
}

export function flowToModel(nodes: UMLFlowNode[], edges: UMLFlowEdge[], fallback: UMLModel): UMLModel {
  const classes: UMLClass[] = nodes.map((node) => ({
    id: node.id,
    name: node.data.label,
    stereotype: node.data.stereotype,
    parentId: node.data.parentId ?? null,
    attributes: node.data.attributes,
    methods: node.data.methods,
    isAbstract: node.data.isAbstract,
    isInterface: node.data.isInterface,
  }));

  const known = new Set(classes.map((c) => c.id));
  const links: UMLLink[] = edges
    .filter((e) => known.has(e.source) && known.has(e.target))
    .map((edge) => {
      const data = edge.data as { relationType?: UMLLink["type"] } | undefined;
      return {
        id: edge.id,
        from: edge.source,
        to: edge.target,
        type: data?.relationType ?? "association",
        label: typeof edge.label === "string" && edge.label ? edge.label : null,
        fromMultiplicity: null,
        toMultiplicity: null,
      };
    });

  if (classes.length === 0) return fallback;
  return { title: fallback.title, diagramType: fallback.diagramType, classes, links };
}

export function relationMarker(edge: UMLLink): string {
  return RELATION_SPECS[edge.type].marker;
}

export const NODE_SIZES = { width: 232 };
export { Position };
