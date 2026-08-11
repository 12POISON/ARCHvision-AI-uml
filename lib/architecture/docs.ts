import type {
  Architecture,
  ArchitectureNode,
  ArchitectureRelationship,
} from "@/types/diagram";
import { validateArchitecture } from "@/lib/architecture/validate";

/* ------------------------------------------------------------------ */
/* generateDocumentation — fully deterministic Markdown design doc     */
/* generated from the canonical model. The AI path may enrich this     */
/* but never replaces it: the doc must always reflect the model.       */
/* ------------------------------------------------------------------ */

function nodeRole(node: ArchitectureNode): string {
  switch (node.kind) {
    case "controller":
      return "HTTP boundary / request orchestration";
    case "service":
      return "business logic";
    case "repository":
      return "data access abstraction";
    case "database":
      return "persistence store";
    case "table":
      return "relational table";
    case "entity":
      return "domain entity";
    case "interface":
      return "contract";
    case "abstract":
      return "abstract base class";
    case "actor":
      return "external actor";
    case "api":
      return "API surface";
    default:
      return node.stereotype ? `stereotyped member (${node.stereotype})` : "class";
  }
}

function relationshipSentence(rel: ArchitectureRelationship, arch: Architecture): string {
  const source = arch.nodes.find((n) => n.name === rel.source)?.name ?? rel.source;
  const target = arch.nodes.find((n) => n.name === rel.target)?.name ?? rel.target;
  const parts = [source];
  switch (rel.type) {
    case "inheritance":
      parts.push("inherits from");
      break;
    case "implementation":
      parts.push("implements");
      break;
    case "composition":
      parts.push("owns (composition)");
      break;
    case "aggregation":
      parts.push("aggregates");
      break;
    case "dependency":
      parts.push("depends on");
      break;
    case "call":
      parts.push("calls");
      break;
    case "reference":
      parts.push("references (foreign key)");
      break;
    case "transition":
      parts.push("transitions to");
      break;
    default:
      parts.push("relates to");
  }
  parts.push(target);
  const card = [rel.sourceMultiplicity, rel.targetMultiplicity].filter((m) => m && m !== "1");
  if (card.length > 0) parts.push(`(cardinality: ${card.join(" ⟷ ")})`);
  return parts.join(" ");
}

export function generateDocumentation(arch: Architecture): string {
  const lines: string[] = [];
  const validation = validateArchitecture(arch);
  const issuesCritical = validation.issues.filter((i) => i.severity === "critical");
  const issuesWarning = validation.issues.filter((i) => i.severity === "warning");
  const issuesInfo = validation.issues.filter((i) => i.severity === "info");

  lines.push(`# ${arch.title} — Design Document`);
  lines.push("");
  lines.push(
    `> **Model:** ${arch.diagramType} diagram · **${arch.nodes.length}** nodes · **${arch.relationships.length}** relationships · **Quality score: ${validation.score}/100**`
  );
  lines.push("");

  lines.push("## Overview");
  lines.push("");
  if (arch.nodes.length === 0) {
    lines.push("_(Empty model — nothing to document yet.)_");
    lines.push("");
  } else {
    const byKind = new Map<string, ArchitectureNode[]>();
    for (const node of arch.nodes) {
      const list = byKind.get(node.kind) ?? [];
      list.push(node);
      byKind.set(node.kind, list);
    }
    for (const [kind, nodes] of byKind) {
      lines.push(`- **${nodes.length} ${kind}${nodes.length === 1 ? "" : "s"}** — ${nodeRole(nodes[0])}`);
    }
    lines.push("");
  }

  lines.push("## Node Inventory");
  lines.push("");
  lines.push("| Node | Kind | Members | Notes |");
  lines.push("|------|------|---------|------|");
  for (const node of arch.nodes) {
    const members = node.attributes.length + node.methods.length;
    const note = node.stereotype ? `«${node.stereotype}»` : node.notes.length > 0 ? node.notes[0] : "—";
    lines.push(`| ${node.name} | ${node.kind} | ${members} | ${note} |`);
  }
  lines.push("");

  if (arch.diagramType === "ER") {
    lines.push("## Tables & Columns");
    lines.push("");
    for (const node of arch.nodes) {
      lines.push(`### ${node.name}`);
      lines.push("");
      lines.push("| Column | Type | PK | FK | Unique | Nullable |");
      lines.push("|--------|------|----|----|--------|----------|");
      for (const attr of node.attributes) {
        lines.push(
          `| ${attr.name} | ${attr.type} | ${attr.isPrimaryKey ? "✔" : ""} | ${attr.isForeignKey ? "✔" : ""} | ${attr.isUnique ? "✔" : ""} | ${attr.isNullable ? "✔" : ""} |`
        );
      }
      lines.push("");
    }
  }

  lines.push("## Relationships");
  lines.push("");
  if (arch.relationships.length === 0) {
    lines.push("_(No relationships defined.)_");
  } else {
    for (const rel of arch.relationships) {
      lines.push(`- ${relationshipSentence(rel, arch)}`);
    }
  }
  lines.push("");

  if (validation.issues.length > 0) {
    lines.push("## Validation Findings");
    lines.push("");
    if (issuesCritical.length > 0) {
      lines.push("### 🔴 Critical");
      for (const issue of issuesCritical) lines.push(`- ${issue.message}`);
      lines.push("");
    }
    if (issuesWarning.length > 0) {
      lines.push("### 🟠 Warnings");
      for (const issue of issuesWarning) lines.push(`- ${issue.message}`);
      lines.push("");
    }
    if (issuesInfo.length > 0) {
      lines.push("### 🔵 Info");
      for (const issue of issuesInfo) lines.push(`- ${issue.message}`);
      lines.push("");
    }
  } else {
    lines.push("## Validation");
    lines.push("");
    lines.push("No validation issues found — the model is internally consistent.");
    lines.push("");
  }

  const checks = validation.checks.filter((c) => c.ok);
  if (checks.length > 0) {
    lines.push(`## Checks Passed (${checks.length})`);
    lines.push("");
    for (const check of checks) lines.push(`- ✔ ${check.rule}`);
    lines.push("");
  }

  lines.push("_Generated deterministically by ArchVision from the canonical model._");
  return lines.join("\n");
}

export function generateSummary(arch: Architecture): string {
  const stats: Record<string, number> = {};
  for (const node of arch.nodes) {
    stats[node.kind] = (stats[node.kind] ?? 0) + 1;
  }
  const kinds = Object.entries(stats)
    .map(([kind, count]) => `${count} ${kind}${count === 1 ? "" : "s"}`)
    .join(", ");
  return `${arch.title} — ${arch.nodes.length} node${arch.nodes.length === 1 ? "" : "s"} (${kinds}), ${arch.relationships.length} relationship${arch.relationships.length === 1 ? "" : "s"}.`;
}
