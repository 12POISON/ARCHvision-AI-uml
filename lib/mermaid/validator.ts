import type { UMLModel, ValidationIssue, ValidationResult } from "@/types/diagram";

export interface ValidationRule {
  id: string;
  label: string;
  check: (model: UMLModel) => ValidationIssue[];
}

export function findCycles(model: UMLModel): string[][] {
  const graph = new Map<string, string[]>();
  for (const link of model.links) {
    const deps = graph.get(link.from) ?? [];
    deps.push(link.to);
    graph.set(link.from, deps);
  }

  const cycles: string[][] = [];
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const stack: string[] = [];

  const dfs = (node: string): void => {
    if (visiting.has(node)) {
      const cycleStart = stack.indexOf(node);
      if (cycleStart >= 0) {
        const cycle = stack.slice(cycleStart).concat(node);
        cycles.push(cycle);
      }
      return;
    }
    if (visited.has(node)) return;
    visiting.add(node);
    stack.push(node);
    for (const next of graph.get(node) ?? []) {
      dfs(next);
    }
    stack.pop();
    visiting.delete(node);
    visited.add(node);
  };

  for (const node of Array.from(graph.keys())) {
    if (!visited.has(node)) dfs(node);
  }
  return cycles;
}

function pascalCase(identifier: string): boolean {
  return /^[A-Z][A-Za-z0-9]*$/.test(identifier);
}

export function isGodClass(cls: { name: string; methods: unknown[] }): boolean {
  return cls.methods.length > 9;
}

export const VALIDATION_RULES: ValidationRule[] = [
  {
    id: "detached-nodes",
    label: "Detached classes (no relationships)",
    check: (model) => {
      const connected = new Set(model.links.flatMap((l) => [l.from, l.to]));
      return model.classes
        .filter((c) => !connected.has(c.id))
        .map((c) => ({
          severity: "warning" as const,
          message: `Class "${c.name}" has no relationships with any other class.`,
          rule: "detached-nodes",
          target: c.name,
        }));
    },
  },
  {
    id: "inheritance-cycles",
    label: "Inheritance cycles",
    check: (model) => {
      const cycleLinks = new Set<string>();
      for (const cycle of findCycles(model)) {
        if (model.links.some((l) => l.type === "inheritance" && cycle.includes(l.from) && cycle.includes(l.to))) {
          cycleLinks.add(cycle.join(" -> "));
        }
      }
      return Array.from(cycleLinks).map((cycle) => ({
        severity: "critical" as const,
        message: `Inheritance cycle detected: ${cycle}`,
        rule: "inheritance-cycles",
        target: null,
      }));
    },
  },
  {
    id: "god-class",
    label: "God class (too many methods)",
    check: (model) =>
      model.classes
        .filter(isGodClass)
        .map((c) => ({
          severity: "warning" as const,
          message: `Class "${c.name}" has ${c.methods.length} methods — consider splitting responsibilities.`,
          rule: "god-class",
          target: c.name,
        })),
  },
  {
    id: "untyped-members",
    label: "Members without types",
    check: (model) => {
      const issues: ValidationIssue[] = [];
      for (const cls of model.classes) {
        for (const attr of cls.attributes) {
          if (attr.type === "unknown") {
            issues.push({
              severity: "info",
              message: `Attribute "${cls.name}.${attr.name}" has no declared type.`,
              rule: "untyped-members",
              target: cls.name,
            });
          }
        }
        for (const method of cls.methods) {
          if (method.returnType === "unknown") {
            issues.push({
              severity: "info",
              message: `Method "${cls.name}.${method.name}()" has no return type.`,
              rule: "untyped-members",
              target: cls.name,
            });
          }
        }
      }
      return issues;
    },
  },
  {
    id: "naming-conventions",
    label: "Naming conventions (PascalCase classes)",
    check: (model) =>
      model.classes
        .filter((c) => /^[A-Za-z_][A-Za-z0-9_$]*$/.test(c.name))
        .filter((c) => !pascalCase(c.name))
        .map((c) => ({
          severity: "warning" as const,
          message: `Class "${c.name}" should use PascalCase.`,
          rule: "naming-conventions",
          target: c.name,
        })),
  },
  {
    id: "empty-classes",
    label: "Empty classes (no members)",
    check: (model) =>
      model.classes
        .filter((c) => c.attributes.length === 0 && c.methods.length === 0)
        .map((c) => ({
          severity: "info" as const,
          message: `Class "${c.name}" has no members.`,
          rule: "empty-classes",
          target: c.name,
        })),
  },
  {
    id: "duplicate-names",
    label: "Duplicate class names",
    check: (model) => {
      const seen = new Map<string, number>();
      for (const cls of model.classes) seen.set(cls.name, (seen.get(cls.name) ?? 0) + 1);
      return Array.from(seen.entries())
        .filter(([, count]) => count > 1)
        .map(([name]) => ({
          severity: "critical" as const,
          message: `Duplicate class name "${name}" appears multiple times.`,
          rule: "duplicate-names",
          target: name,
        }));
    },
  },
];

const PENALTIES: Record<string, number> = {
  critical: 12,
  warning: 6,
  info: 2,
};

export function validateModel(model: UMLModel): ValidationResult {
  const issues: ValidationIssue[] = [];
  for (const rule of VALIDATION_RULES) {
    issues.push(...rule.check(model));
  }
  const deduped = issues.filter(
    (issue, index, all) =>
      all.findIndex(
        (other) => other.rule === issue.rule && other.message === issue.message
      ) === index
  );
  const penalty = deduped.reduce((sum, issue) => sum + PENALTIES[issue.severity], 0);
  const score = Math.max(0, Math.min(100, Math.round(100 - penalty)));
  return { issues: deduped, score };
}