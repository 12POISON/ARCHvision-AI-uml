import { test } from "node:test";
import assert from "node:assert/strict";
import { createStorageOps, parseArgs, OP_NAMES, isStorageOp } from "../lib/data/storage-ops.ts";
import type { StorageRepo } from "../lib/data/storage-ops.ts";

/**
 * Contract tests for the storage op dispatch layer:
 * 1. Every op forwards the authenticated `userId` (server-injected) as the
 *    final argument — it can never come from the request payload.
 * 2. The destructive `reset` op does not exist in the API surface.
 * 3. Payload shapes map to the expected repository signatures.
 */

interface Call {
  op: string;
  args: unknown[];
  userId: string;
}

function makeFakeRepo(): StorageRepo & { calls: Call[] } {
  const calls: Call[] = [];
  const record = (op: string) => (...args: unknown[]) => {
    const userId = args[args.length - 1] as string;
    calls.push({ op, args, userId });
    return Promise.resolve(`result:${op}`);
  };
  return {
    calls,
    listProjects: record("listProjects"),
    listDiagrams: record("listDiagrams"),
    getDiagram: record("getDiagram"),
    createProject: record("createProject"),
    createDiagram: record("createDiagram"),
    updateDiagram: record("updateDiagram"),
    deleteDiagram: record("deleteDiagram"),
    recordPrompt: record("recordPrompt"),
    listPromptHistory: record("listPromptHistory"),
    saveValidation: record("saveValidation"),
    getValidation: record("getValidation"),
    listVersions: record("listVersions"),
    saveVersion: record("saveVersion"),
    recordsChange: record("recordsChange"),
    listChanges: record("listChanges"),
  };
}

const SESSION_USER = "session-user-123";

test("every op receives the session userId as its final argument", async () => {
  const repo = makeFakeRepo();
  const ops = createStorageOps(repo);

  const cases: Array<[string, unknown[]]> = [
    ["listProjects", []],
    ["listDiagrams", [null]],
    ["getDiagram", ["diagram_x"]],
    ["createProject", [{ name: "P", description: "d" }]],
    ["createDiagram", [{ name: "D", type: "CLASS" }, "project_x", undefined]],
    ["updateDiagram", ["diagram_x", { name: "Renamed" }]],
    ["deleteDiagram", ["diagram_x"]],
    ["recordPrompt", [{ diagramId: "diagram_x", prompt: "p", response: "r", actionType: "generate" }]],
    ["listPromptHistory", ["diagram_x"]],
    ["saveValidation", ["diagram_x", { issues: [], score: 100 }]],
    ["getValidation", ["diagram_x"]],
    ["listVersions", ["diagram_x"]],
    ["saveVersion", ["diagram_x", { version: 1, label: "v1", mermaidCode: "x", summary: "s", changes: [], createdAt: "now" }]],
    ["recordsChange", ["diagram_x", "summary"]],
    ["listChanges", ["diagram_x", 30]],
  ];

  for (const [op, args] of cases) {
    await ops[op as keyof typeof ops](args, SESSION_USER);
  }

  assert.equal(repo.calls.length, cases.length);
  for (const call of repo.calls) {
    assert.equal(call.userId, SESSION_USER, `${call.op} must use the injected session userId`);
  }
});

test("payload cannot spoof the userId — the userId argument always wins", async () => {
  const repo = makeFakeRepo();
  const ops = createStorageOps(repo);

  // Attacker includes a "userId" field in the payload; it must be ignored
  // by the dispatch layer — the identity argument comes only from the session.
  await ops.createProject([{ name: "evil", description: null, userId: "attacker" }], SESSION_USER);
  assert.equal(repo.calls[0]!.userId, SESSION_USER);
  assert.equal(repo.calls[0]!.args[0] === undefined, false);
  const input = repo.calls[0]!.args[0] as { name: string };
  assert.equal(input.name, "evil");
});

test("reset is not part of the exposed API surface", () => {
  assert.ok(!OP_NAMES.includes("reset" as never));
  assert.ok(!isStorageOp("reset"));
  assert.ok(!isStorageOp("createAdmin"));
  assert.ok(isStorageOp("listProjects"));
});

test("parseArgs maps payload shapes to positional arguments", () => {
  assert.deepEqual(parseArgs("listProjects", null), []);
  assert.deepEqual(parseArgs("listDiagrams", null), [null]);
  assert.deepEqual(parseArgs("listDiagrams", "project_x"), ["project_x"]);
  assert.deepEqual(parseArgs("getDiagram", "diagram_x"), ["diagram_x"]);
  assert.deepEqual(parseArgs("createDiagram", ["draft", "project_x", "code"]), ["draft", "project_x", "code"]);
  assert.deepEqual(parseArgs("listChanges", ["diagram_x", 30]), ["diagram_x", 30]);
  assert.deepEqual(parseArgs("updateDiagram", ["diagram_x", { name: "N" }]), ["diagram_x", { name: "N" }]);
});
