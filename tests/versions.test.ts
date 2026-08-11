import { test } from "node:test";
import assert from "node:assert/strict";
import { diffArchitectures, createVersion, describeDiff } from "../lib/architecture/versions.ts";
import { createEmptyArchitecture, createNode, createRelationship } from "../lib/architecture/model.ts";
import type { Architecture } from "../types/diagram.ts";

function v1(): Architecture {
  const arch = createEmptyArchitecture("CLASS", "App");
  const a = createNode("AuthController");
  const b = createNode("AuthService");
  arch.nodes.push(a, b);
  arch.relationships.push(createRelationship("AuthController", "AuthService", "dependency"));
  return arch;
}

test("diffArchitectures reports additions and removals", () => {
  const before = v1();
  const after = v1();
  after.nodes.push(createNode("ProfileService"));
  const diff = diffArchitectures(before, after);
  assert.deepEqual(diff.addedNodes, ["ProfileService"]);
  assert.deepEqual(diff.removedNodes, []);
});

test("describeDiff generates human-readable lines", () => {
  const diff = { addedNodes: ["X"], removedNodes: ["Y"], addedRelations: ["dep:X->Z"], removedRelations: [] };
  const lines = describeDiff(diff);
  assert.ok(lines.some((l) => l.includes("Added node X")));
  assert.ok(lines.some((l) => l.includes("Removed node Y")));
});

test("createVersion increments and records changes", () => {
  const prev = null;
  const before = v1();
  const after = v1();
  const version = createVersion(prev, "classDiagram...", before, after, "Change 1");
  assert.equal(version.version, 1);
  assert.ok(version.changes.some((c) => c.includes("No structural changes")));
});