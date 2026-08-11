import type { AnalysisMetric, AnalysisResult, UMLModel } from "@/types/diagram";
import { findCycles } from "@/lib/mermaid/validator";

export interface CouplingMetrics {
  afferent: Record<string, number>;
  efferent: Record<string, number>;
}

export function computeCoupling(model: UMLModel): CouplingMetrics {
  const afferent: Record<string, number> = {};
  const efferent: Record<string, number> = {};
  for (const cls of model.classes) {
    afferent[cls.id] = 0;
    efferent[cls.id] = 0;
  }
  for (const link of model.links) {
    efferent[link.from] = (efferent[link.from] ?? 0) + 1;
    afferent[link.to] = (afferent[link.to] ?? 0) + 1;
  }
  return { afferent, efferent };
}

export function detectMultipathInheritance(model: UMLModel): string[] {
  const issues: string[] = [];
  for (const cls of model.classes) {
    const superclasses = model.links.filter(
      (l) => l.to === cls.id && (l.type === "inheritance" || l.type === "implementation")
    );
    const concrete = superclasses.filter((l) => l.type === "inheritance");
    if (concrete.length > 1) {
      issues.push(
        `"${cls.name}" inherits from multiple concrete classes (${concrete.map((l) => l.from).join(", ")}).`
      );
    }
  }
  return issues;
}

export function computeAnalysis(model: UMLModel): AnalysisResult {
  const metrics: AnalysisMetric[] = [];
  const insights: string[] = [];
  const refactorings: string[] = [];
  const coupling = computeCoupling(model);

  const maxNode = Math.max(model.classes.length, 1);
  const connected = new Set(model.links.flatMap((l) => [l.from, l.to]));
  const isolationRatio = model.classes.filter((c) => !connected.has(c.id)).length / model.classes.length || 0;

  metrics.push({
    label: "Class coverage",
    value: (1 - isolationRatio) * 100,
    max: 100,
    severity: isolationRatio > 0.3 ? "warning" : "info",
    description: `${Math.round((1 - isolationRatio) * 100)}% of classes participate in at least one relationship.`,
  });

  const totalMethods = model.classes.reduce((sum, c) => sum + c.methods.length, 0);
  const avgMethods = totalMethods / maxNode;
  metrics.push({
    label: "Average methods / class",
    value: avgMethods,
    max: 10,
    severity: avgMethods > 7 ? "warning" : "info",
    description: "Design guideline: keep classes focused. >7 suggests possible god classes.",
  });

  const avgEfferent = Object.values(coupling.efferent).reduce((a, b) => a + b, 0) / maxNode;
  metrics.push({
    label: "Average coupling (fan-out)",
    value: avgEfferent,
    max: 6,
    severity: avgEfferent > 4 ? "warning" : "info",
    description: "Mean number of dependencies per class. High fan-out increases change ripple.",
  });

  const cycles = findCycles(model);
  metrics.push({
    label: "Cyclic dependencies",
    value: cycles.length,
    max: 3,
    severity: cycles.length > 0 ? "critical" : "info",
    description:
      cycles.length > 0
        ? `Detected ${cycles.length} cycle(s): ${cycles.slice(0, 2).map((c) => c.join(" → ")).join("; ")}`
        : "No circular dependencies found between classes.",
  });

  const godClasses = model.classes.filter((c) => c.methods.length > 9);
  metrics.push({
    label: "God classes",
    value: godClasses.length,
    max: 3,
    severity: godClasses.length > 0 ? "warning" : "info",
    description:
      godClasses.length > 0
        ? `Candidates: ${godClasses.map((c) => c.name).join(", ")}. Extract responsibilities via facade or delegation.`
        : "No class exceeds the 9-method threshold.",
  });

  for (const cycle of cycles) {
    insights.push(`Circular dependency detected: ${cycle.join(" → ")}. Introduce an interface or invert one dependency to break the cycle.`);
  }
  for (const cls of model.classes) {
    const eff = coupling.efferent[cls.id] ?? 0;
    if (eff > 4) {
      insights.push(`"${cls.name}" depends on ${eff} classes — consider extracting intermediaries to lower coupling.`);
      refactorings.push(`Extract interfaces from ${cls.name}'s collaborators and depend on abstractions.`);
    }
    const aff = coupling.afferent[cls.id] ?? 0;
    if (aff > 3) {
      insights.push(`"${cls.name}" is depended on by ${aff} classes — it is a key abstraction. Protect its API.`);
    }
  }
  if (metrics[0].severity === "critical") {
    refactorings.push("Merge or remove isolated classes, or document them as future extension points.");
  }
  const abstractCount = model.classes.filter((c) => c.isAbstract || c.isInterface).length;
  if (abstractCount === 0 && model.classes.length > 2) {
    insights.push("No interfaces or abstract classes found — abstraction layers are missing.");
    refactorings.push("Introduce interfaces behind concrete services to enable dependency inversion.");
  }

  return {
    metrics,
    insights,
    refactorings,
    generatedAt: new Date().toISOString(),
  };
}