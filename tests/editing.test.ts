import { test } from "node:test";
import assert from "node:assert/strict";
import { createEmptyArchitecture } from "@/lib/architecture/model";
import { architectureToMermaid } from "@/lib/architecture/serialization";
import { parseArchitectureDiagram } from "@/lib/architecture/parse";
import { DEFAULT_CLASS_MERMAID } from "@/types/diagram";
import {
  addArchitectureNode,
  addArchitectureRelationship,
  parseMethodParameters,
  removeArchitectureNode,
  removeArchitectureRelationship,
  updateArchitectureNode,
  updateArchitectureRelationship,
} from "@/lib/architecture/editing";

function classArchitecture() {
  const { architecture } = parseArchitectureDiagram(DEFAULT_CLASS_MERMAID);
  return architecture;
}

test("editing: addArchitectureNode creates kind-aware node with unique name", () => {
  const arch = createEmptyArchitecture("CLASS");
  let result = addArchitectureNode(arch, "interface");
  assert.equal(result.node.name, "NewInterface");
  assert.equal(result.node.isInterface, true);
  assert.equal(result.node.stereotype, "interface");

  result = addArchitectureNode(result.arch, "interface");
  assert.equal(result.node.name, "NewInterface2");
  assert.equal(result.arch.nodes.length, 2);
});

test("editing: updateArchitectureNode rename cascades through relationships", () => {
  const arch = classArchitecture();
  const rel = arch.relationships.find((r) => r.source === "User");
  assert.ok(rel);
  const { arch: next } = updateArchitectureNode(arch, "User", { name: "Account" });
  assert.equal(next.nodes.some((n) => n.name === "Account"), true);
  assert.equal(next.nodes.some((n) => n.name === "User"), false);
  assert.ok(next.relationships.every((r) => r.source !== "User" && r.target !== "User"));
  assert.equal(next.relationships.find((r) => r.id === rel.id)?.source, "Account");
});

test("editing: removeArchitectureNode cascades relationship removal", () => {
  const arch = classArchitecture();
  const relCount = arch.relationships.length;
  const connected = arch.relationships.filter((r) => r.source === "AuthService" || r.target === "AuthService").length;
  const next = removeArchitectureNode(arch, "AuthService");
  assert.equal(next.nodes.find((n) => n.name === "AuthService"), undefined);
  assert.equal(next.relationships.length, relCount - connected);
});

test("editing: addArchitectureRelationship defaults and round-trips through Mermaid", () => {
  const arch = classArchitecture();
  const { arch: next } = addArchitectureRelationship(arch, "User", "Session", "composition", {
    label: "owns collection",
    targetMultiplicity: "0..*",
  });
  const added = next.relationships.find((r) => r.source === "User" && r.target === "Session" && r.type === "composition");
  assert.ok(added);
  assert.equal(added?.label, "owns collection");
  assert.equal(added?.targetMultiplicity, "0..*");

  const reparsed = parseArchitectureDiagram(architectureToMermaid(next)).architecture;
  const matched = reparsed.relationships.find(
    (r) => r.source === "User" && r.target === "Session" && r.type === "composition"
  );
  assert.ok(matched, "relationship survives architectureToMermaid → parse round-trip");
  assert.equal(matched?.label, "owns collection");
  assert.equal(matched?.targetMultiplicity, "0..*");
});

test("editing: updateArchitectureRelationship patches type, label and multiplicities", () => {
  const arch = classArchitecture();
  const rel = arch.relationships[0];
  const next = updateArchitectureRelationship(arch, rel.id, {
    type: "dependency",
    label: "depends-on",
    sourceMultiplicity: "0..*",
    targetMultiplicity: "1",
  });
  const updated = next.relationships.find((r) => r.id === rel.id);
  assert.ok(updated);
  assert.equal(updated?.type, "dependency");
  assert.equal(updated?.label, "depends-on");
  assert.equal(updated?.sourceMultiplicity, "0..*");
  assert.equal(updated?.targetMultiplicity, "1");
});

test("editing: removeArchitectureRelationship removes only the targeted relationship", () => {
  const arch = classArchitecture();
  const rel = arch.relationships[0];
  const next = removeArchitectureRelationship(arch, rel.id);
  assert.equal(next.relationships.length, arch.relationships.length - 1);
  assert.equal(next.relationships.some((r) => r.id === rel.id), false);
});

test("editing: parseMethodParameters handles types, voids and whitespace", () => {
  assert.deepEqual(parseMethodParameters("a: string, b: number, flag"), [
    { name: "a", type: "string" },
    { name: "b", type: "number" },
    { name: "flag", type: "void" },
  ]);
  assert.deepEqual(parseMethodParameters(""), []);
  assert.deepEqual(parseMethodParameters(",  ,"), []);
});

test("editing: full edit session survives canonical round-trip without data loss", () => {
  let arch = classArchitecture();
  const { arch: a1, node } = addArchitectureNode(arch, "repository", "BillingRepository");
  arch = a1;
  const { arch: a2, relationship } = addArchitectureRelationship(arch, "AuthController", node.name, "dependency", {
    label: "uses-billing",
  });
  arch = a2;
  arch = updateArchitectureNode(arch, node.id, { name: "LedgerRepository" }).arch;
  arch = updateArchitectureRelationship(arch, relationship.id, { targetMultiplicity: "0..1" });

  const code = architectureToMermaid(arch);
  const reparsed = parseArchitectureDiagram(code).architecture;
  assert.ok(reparsed.nodes.find((n) => n.name === "LedgerRepository"));
  const rel = reparsed.relationships.find((r) => r.source === "AuthController" && r.target === "LedgerRepository");
  assert.ok(rel, "edited relationship present after round-trip");
  assert.equal(rel?.label, "uses-billing");
  assert.equal(rel?.targetMultiplicity, "0..1");
  assert.equal(reparsed.nodes.length, 7);
});