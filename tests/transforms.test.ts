import { test } from "node:test";
import assert from "node:assert/strict";
import {
  applyChange,
  applyChanges,
  analyzeImpact,
  parseCommand,
  describeChange,
} from "../lib/architecture/transforms.ts";
import type { Architecture } from "../types/diagram.ts";
import { createEmptyArchitecture, createNode, createRelationship } from "../lib/architecture/model.ts";

function fixture(): Architecture {
  const arch = createEmptyArchitecture("CLASS", "Test");
  const user = createNode("User");
  user.attributes.push({ name: "id", type: "int", visibility: "public", isStatic: false, isDerived: false });
  const order = createNode("Order");
  arch.nodes.push(user, order);
  arch.relationships.push(createRelationship("User", "Order", "association", { label: "places" }));
  return arch;
}

test("applyChange: addNode creates and connects", () => {
  const next = applyChange(fixture(), { kind: "addNode", name: "Payment", connectTo: "Order" });
  assert.equal(next.nodes.length, 3);
  assert.ok(next.nodes.some((n) => n.name === "Payment"));
  assert.ok(next.relationships.some((r) => r.source === "Order" && r.target === "Payment"));
});

test("applyChange: renameNode updates relationships too", () => {
  const next = applyChange(fixture(), { kind: "renameNode", from: "User", to: "Account" });
  assert.ok(next.nodes.some((n) => n.name === "Account"));
  assert.ok(!next.nodes.some((n) => n.name === "User"));
  assert.ok(next.relationships.some((r) => r.source === "Account" && r.target === "Order"));
});

test("applyChange is immutable — original untouched", () => {
  const original = fixture();
  applyChange(original, { kind: "removeNode", name: "User" });
  assert.equal(original.nodes.length, 2, "original architecture not mutated");
});

test("applyChange: removeNode cascades relationships", () => {
  const next = applyChange(fixture(), { kind: "removeNode", name: "User" });
  assert.equal(next.nodes.length, 1);
  assert.equal(next.relationships.length, 0);
});

test("analyzeImpact reports touched nodes and relations", () => {
  const impact = analyzeImpact(fixture(), { kind: "renameNode", from: "User", to: "Account" });
  assert.deepEqual(impact.nodesChanged, ["User"]);
  assert.deepEqual(impact.relationshipsChanged, ["User → Order"]);
  assert.equal(impact.destructive, false);
});

test("applyChange: setMultiplicity updates cardinality", () => {
  const next = applyChange(fixture(), { kind: "setMultiplicity", source: "User", target: "Order", multiplicity: "0..*" });
  const rel = next.relationships.find((r) => r.source === "User");
  assert.equal(rel?.targetMultiplicity, "0..*");
});

test("applyChanges chains multiple changes", () => {
  const next = applyChanges(fixture(), [
    { kind: "addNode", name: "Payment" },
    { kind: "addRelationship", source: "Order", target: "Payment", type: "dependency" },
  ]);
  assert.equal(next.nodes.length, 3);
  assert.equal(next.relationships.length, 2);
});

test("parseCommand recognizes common NL commands", () => {
  const arch = fixture();
  const add = parseCommand("add class Invoice", arch, null);
  assert.ok(add?.change);
  assert.equal(add.change.kind, "addNode");

  const rename = parseCommand("rename User to Account", arch, null);
  assert.ok(rename?.change);
  assert.equal(rename.change.kind, "renameNode");

  const relate = parseCommand("connect Order with Payment", arch, null);
  assert.ok(relate?.change);
  assert.equal(relate.change.kind, "addRelationship");
});

test("describeChange is human readable", () => {
  assert.equal(describeChange({ kind: "addMethod", node: "User", method: "login" }), "Add method User.login()");
});