import type {
  Architecture,
  ArchitectureNode,
  ArchitectureRelationship,
  ValidationIssue,
} from "@/types/diagram";

/* ------------------------------------------------------------------ */
/* validateArchitecture — per-diagram-type semantic validation with    */
/* an explainable score. Rules produce issues with severity + a        */
/* machine-readable id, and the score breaks down into individual      */
/* penalties so the result is always explainable.                      */
/* ------------------------------------------------------------------ */

export interface ExplainableValidation {
  issues: ValidationIssue[];
  score: number;
  passed: string[];
  checks: Array<{ rule: string; ok: boolean }>;
  scoreBreakdown: Array<{ rule: string; label: string; penalty: number }>;
}

const CRITICAL = 12;
const WARNING = 6;
const INFO = 2;

function push(issues: ValidationIssue[], rule: string, severity: ValidationIssue["severity"], message: string, target: string | null = null): void {
  issues.push({ rule, severity, message, target });
}

const nodeName = (n: ArchitectureNode): string => n.name;

function isDependency(r: ArchitectureRelationship): boolean {
  return r.type === "dependency" || r.type === "call" || r.type === "flow";
}

/* ------------------------- UML semantic rules ------------------------- */

function umlRules(arch: Architecture, issues: ValidationIssue[]): void {
  if (arch.diagramType !== "CLASS") return;

  /* 1. Cardinality consistency: a naked relationship implies 1:1, but
   * "0..*" and "1..*" both referencing the same pair reduce to 0..1 */
  const pairs = new Map<string, ArchitectureRelationship[]>();
  for (const rel of arch.relationships) {
    const key = [rel.source, rel.target].sort().join("|");
    const list = pairs.get(key) ?? [];
    list.push(rel);
    pairs.set(key, list);
  }
  for (const [key, rels] of pairs) {
    if (rels.length < 2) continue;
    const set = new Set(rels.map((r) => r.type));
    if (set.size > 1) {
      const [a, b] = key.split("|");
      push(issues, "duplicate-relations", "warning", `Multiple relationships of different kinds exist between "${a}" and "${b}" — consider a single well-typed relation.`, a);
    }
  }

  /* 2. Controller → Database direct access without repository. */
  const repositories = new Set(arch.nodes.filter((n) => /repository$/i.test(n.name)).map(nodeName));
  if (repositories.size > 0) {
    for (const rel of arch.relationships.filter(isDependency)) {
      const source = arch.nodes.find((n) => n.name === rel.source);
      const target = arch.nodes.find((n) => n.name === rel.target);
      if (!source || !target) continue;
      if (/controller$/i.test(source.name) && /database|db$/i.test(target.name)) {
        push(issues, "controller-db", "warning", `${source.name} (controller) depends directly on database — route data access through a repository instead.`, source.name);
      }
    }
  }

  /* 3. Repository depending on presentation layer. */
  for (const rel of arch.relationships) {
    const source = arch.nodes.find((n) => n.name === rel.source);
    if (!source) continue;
    if (/repository$/i.test(source.name) && /controller$|view$/i.test(rel.target)) {
      push(issues, "layering", "warning", `Repository "${source.name}" depends on controller/UI "${rel.target}" — reverse dependency violates layering.`, source.name);
    }
  }

  /* 4. Cycle detection on dependency edges. */
  for (const cycle of detectCycles(arch, isDependency)) {
    push(issues, "cycle", "critical", `Dependency cycle: ${cycle.join(" -> ")}.`, cycle[0]);
  }
  /* Same for structural edges (composition/aggregation cycles). */
  for (const cycle of detectCycles(arch, (r) => r.type === "composition" || r.type === "aggregation")) {
    push(issues, "structural-cycle", "warning", `Structural cycle: ${cycle.join(" -> ")}.`, cycle[0]);
  }

  /* 5. Duplicate node names. */
  const counts = new Map<string, number>();
  for (const n of arch.nodes) counts.set(n.name, (counts.get(n.name) ?? 0) + 1);
  for (const [name, count] of counts) {
    if (count > 1) push(issues, "duplicate-names", "critical", `Duplicate name "${name}" appears ${count} times.`, name);
  }

  /* 6. Dangling references. */
  const names = new Set(arch.nodes.map(nodeName));
  for (const rel of arch.relationships) {
    if (!names.has(rel.source)) push(issues, "dangling-relation", "critical", `Relation from unknown node "${rel.source}".`, rel.source);
    if (!names.has(rel.target)) push(issues, "dangling-relation", "critical", `Relation to unknown node "${rel.target}".`, rel.target);
  }

  /* 7. Detached nodes. */
  const connected = new Set(arch.relationships.flatMap((r) => [r.source, r.target]));
  for (const n of arch.nodes) {
    if (!connected.has(n.name) && arch.relationships.length > 0) {
      push(issues, "detached-nodes", "warning", `Node "${n.name}" has no relationships.`, n.name);
    }
  }

  /* 8. Inheritance validity: an interface/abstract may be inherited,
   * but a concrete class should not inherit from another concrete
   * class when an interface alternative is present. */
  for (const rel of arch.relationships) {
    if (rel.type !== "inheritance") continue;
    const source = arch.nodes.find((n) => n.name === rel.source);
    const target = arch.nodes.find((n) => n.name === rel.target);
    if (source && target && source.name !== target.name) {
      if (source.isInterface && !target.isInterface) {
        push(issues, "interface-inheritance", "warning", `Interface "${source.name}" inherits from concrete class "${target.name}" — interfaces should not inherit from classes.`, source.name);
      }
    }
  }

  /* 9. Empty nodes. */
  for (const n of arch.nodes) {
    if (n.attributes.length === 0 && n.methods.length === 0 && n.notes.length === 0 && arch.diagramType === "CLASS" && n.kind !== "interface") {
      push(issues, "empty-nodes", "info", `Node "${n.name}" has no members.`, n.name);
    }
  }
}

function detectCycles(arch: Architecture, edgeFilter: (r: ArchitectureRelationship) => boolean): string[][] {
  const graph = new Map<string, string[]>();
  for (const rel of arch.relationships) {
    if (!edgeFilter(rel)) continue;
    const list = graph.get(rel.source) ?? [];
    list.push(rel.target);
    graph.set(rel.source, list);
  }
  const cycles: string[][] = [];
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const stack: string[] = [];
  const dfs = (node: string): void => {
    if (visiting.has(node)) {
      const start = stack.indexOf(node);
      if (start >= 0) cycles.push(stack.slice(start).concat(node));
      return;
    }
    if (visited.has(node)) return;
    visiting.add(node);
    stack.push(node);
    for (const next of graph.get(node) ?? []) dfs(next);
    stack.pop();
    visiting.delete(node);
    visited.add(node);
  };
  for (const node of graph.keys()) dfs(node);
  return cycles;
}

/* --------------------------- ER rules --------------------------- */

function erRules(arch: Architecture, issues: ValidationIssue[]): void {
  if (arch.diagramType !== "ER") return;

  const tables = arch.nodes.filter((n) => n.kind === "table");

  /* 1. Every table needs a primary key. */
  for (const table of tables) {
    if (!table.attributes.some((a) => a.isPrimaryKey)) {
      push(issues, "er-no-pk", "warning", `Table "${table.name}" has no primary key.`, table.name);
    }
  }

  /* 2. No orphan tables. */
  const connected = new Set(arch.relationships.flatMap((r) => [r.source, r.target]));
  for (const table of tables) {
    if (!connected.has(table.name) && arch.relationships.length > 0) {
      push(issues, "er-detached", "info", `Table "${table.name}" is not connected to any other table.`, table.name);
    }
  }

  /* 3. FK columns reference existing tables. */
  for (const rel of arch.relationships) {
    const target = arch.nodes.find((n) => n.name === rel.target);
    const source = arch.nodes.find((n) => n.name === rel.source);
    if (!target || target.implicit) {
      push(issues, "er-missing-target", "critical", `Relationship targets missing table "${rel.target}".`, rel.target);
    }
    if (!source || source.implicit) {
      push(issues, "er-missing-source", "critical", `Relationship originates from missing table "${rel.source}".`, rel.source);
    }
  }

  /* 4. FK column actually present in the source table. */
  for (const rel of arch.relationships) {
    const source = arch.nodes.find((n) => n.name === rel.source);
    if (!source || !rel.foreignKeyColumn) continue;
    const col = source.attributes.find((a) => a.name.toLowerCase() === rel.foreignKeyColumn!.toLowerCase());
    if (!col) {
      push(issues, "er-fk-column", "warning", `Relationship ${rel.source} -> ${rel.target} declares FK "${rel.foreignKeyColumn}" but the column does not exist in ${rel.source}.`, rel.source);
    }
  }

  /* 5. 1:1 relationships should have a UNIQUE FK. */
  for (const rel of arch.relationships) {
    if (rel.targetMultiplicity === "0..1" || rel.targetMultiplicity === "1") {
      const source = arch.nodes.find((n) => n.name === rel.source);
      const col = rel.foreignKeyColumn ? source?.attributes.find((a) => a.name === rel.foreignKeyColumn) : null;
      if (col && !col.isUnique && (rel.sourceMultiplicity === "1" || rel.sourceMultiplicity === "0..1")) {
        push(issues, "er-unique-fk", "warning", `1:1 relation ${rel.source} -> ${rel.target} should use a UNIQUE FK on "${col.name}".`, rel.source);
      }
    }
  }

  /* 6. Risky many-to-many without join table hint. */
  for (const rel of arch.relationships) {
    if (rel.sourceMultiplicity === "0..*" && rel.targetMultiplicity === "0..*") {
      push(issues, "er-m2m", "info", `Many-to-many between ${rel.source} and ${rel.target} — consider a join table.`, rel.source);
    }
  }

  /* 7. Contradictory multiplicity vs unique constraints. */
  for (const rel of arch.relationships) {
    if (rel.targetMultiplicity === "1") {
      const source = arch.nodes.find((n) => n.name === rel.source);
      const col = source?.attributes.find((a) => a.name === rel.foreignKeyColumn);
      if (col && col.isNullable) {
        push(issues, "er-nullable-fk", "warning", `FK "${col.name}" is nullable but the relationship requires a target (1).`, rel.source);
      }
    }
  }
}

/* --------------------------- shared / general --------------------------- */

function generalRules(arch: Architecture, issues: ValidationIssue[]): void {
  /* Naming conventions on class diagrams. */
  if (arch.diagramType === "CLASS") {
    for (const n of arch.nodes) {
      if (!/^[A-Z][A-Za-z0-9_]*$/.test(n.name)) {
        push(issues, "naming-conventions", "warning", `"${n.name}" should use PascalCase.`, n.name);
      }
    }
  }
}

/* --------------------------- entry point --------------------------- */

export function validateArchitecture(arch: Architecture): ExplainableValidation {
  const issues: ValidationIssue[] = [];
  umlRules(arch, issues);
  erRules(arch, issues);
  generalRules(arch, issues);

  const deduped: ValidationIssue[] = [];
  const seen = new Set<string>();
  for (const issue of issues) {
    const key = `${issue.rule}|${issue.message}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(issue);
  }

  const penaltiesBySeverity: Record<string, number> = { critical: CRITICAL, warning: WARNING, info: INFO };
  let penaltyTotal = 0;
  const scoreBreakdown: ExplainableValidation["scoreBreakdown"] = [];
  const foundRules = new Set<string>();
  for (const issue of deduped) {
    const p = penaltiesBySeverity[issue.severity];
    scoreBreakdown.push({ rule: issue.rule, label: issue.message, penalty: p });
    penaltyTotal += p;
    foundRules.add(issue.rule);
  }

  const score = Math.max(0, Math.min(100, Math.round(100 - penaltyTotal)));

  const allRules = ALL_RULE_IDS;
  const checks = allRules.map((rule) => ({ rule, ok: !foundRules.has(rule) }));
  const passed = allRules.filter((rule) => !foundRules.has(rule));

  return { issues: deduped, score, passed, checks, scoreBreakdown };
}

const ALL_RULE_IDS = [
  "duplicate-relations",
  "controller-db",
  "layering",
  "cycle",
  "structural-cycle",
  "duplicate-names",
  "dangling-relation",
  "detached-nodes",
  "interface-inheritance",
  "empty-nodes",
  "er-no-pk",
  "er-detached",
  "er-missing-target",
  "er-missing-source",
  "er-fk-column",
  "er-unique-fk",
  "er-m2m",
  "er-nullable-fk",
  "naming-conventions",
];