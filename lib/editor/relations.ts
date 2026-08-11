import type { ArchitectureRelationshipType } from "@/types/diagram";

/**
 * Creately-style relationship catalog for UML connectors.
 * marker values map to <marker> defs rendered in uml-edge.tsx.
 */
export interface RelationSpec {
  label: string;
  group: "class" | "use-case" | "sequence" | "state" | "er";
  marker: string;
  mermaid: string;
  dashed?: boolean;
  description: string;
}

export const RELATION_SPECS_EXTENDED: Record<ArchitectureRelationshipType, RelationSpec> = {
  association: { label: "Association", group: "class", marker: "arrow-open", mermaid: "-->", description: "Solid line, no arrowhead" },
  dependency: { label: "Dependency", group: "class", marker: "arrow-open", mermaid: "..>", dashed: true, description: "Dashed line, open arrow" },
  inheritance: { label: "Inheritance", group: "class", marker: "triangle-hollow", mermaid: "--|>", description: "Solid line, hollow triangle" },
  implementation: { label: "Realization", group: "class", marker: "triangle-hollow", mermaid: "..|>", dashed: true, description: "Dashed line, hollow triangle" },
  aggregation: { label: "Aggregation", group: "class", marker: "diamond-hollow", mermaid: "o--", description: "Solid line, hollow diamond" },
  composition: { label: "Composition", group: "class", marker: "diamond-filled", mermaid: "*--", description: "Solid line, filled diamond" },
  include: { label: "Include", group: "use-case", marker: "arrow-open", mermaid: "..>", dashed: true, description: "Dashed, <<include>>" },
  extend: { label: "Extend", group: "use-case", marker: "arrow-open", mermaid: "..>", dashed: true, description: "Dashed, <<extend>>" },
  message: { label: "Message", group: "sequence", marker: "arrow-open", mermaid: "->>", description: "Solid line, open arrow" },
  return: { label: "Return Message", group: "sequence", marker: "arrow-open", mermaid: "-->>", dashed: true, description: "Dashed line, open arrow" },
  async: { label: "Async Message", group: "sequence", marker: "arrow-stick", mermaid: "-x", description: "Solid line, stick arrowhead" },
  transition: { label: "Transition", group: "state", marker: "arrow-open", mermaid: "-->", description: "Solid line with guard label" },
  call: { label: "Call", group: "class", marker: "arrow-open", mermaid: "->", description: "Solid line, open arrow" },
  flow: { label: "Flow", group: "state", marker: "arrow-open", mermaid: "-->", description: "Directional flow" },
  reference: { label: "Reference (FK)", group: "er", marker: "arrow-open", mermaid: "..>", dashed: true, description: "Foreign-key reference" },
};

export const RELATION_GROUPS: Array<{ id: RelationSpec["group"]; label: string }> = [
  { id: "class", label: "Class Diagram" },
  { id: "use-case", label: "Use Case" },
  { id: "sequence", label: "Sequence" },
  { id: "state", label: "State & Activity" },
  { id: "er", label: "ER" },
];

export const RELATION_TYPE_ORDER: ArchitectureRelationshipType[] = [
  "association",
  "dependency",
  "inheritance",
  "implementation",
  "aggregation",
  "composition",
  "include",
  "extend",
  "message",
  "return",
  "async",
  "transition",
  "flow",
  "call",
  "reference",
];
