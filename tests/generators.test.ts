import { test } from "node:test";
import assert from "node:assert/strict";
import { generateSequenceMermaid } from "../lib/architecture/sequence.ts";
import { generateDocumentation, generateSummary } from "../lib/architecture/docs.ts";
import { createEmptyArchitecture, createNode, createRelationship } from "../lib/architecture/model.ts";
import type { Architecture } from "../types/diagram.ts";

function layered(): Architecture {
  const arch = createEmptyArchitecture("CLASS", "Auth Domain");
  const client = createNode("Client", "actor");
  const controller = createNode("AuthController", "controller");
  const service = createNode("AuthService", "service");
  const repo = createNode("UserRepository", "repository");
  const db = createNode("UserTable", "table");
  arch.nodes.push(client, controller, service, repo, db);
  arch.relationships.push(
    createRelationship("Client", "AuthController", "dependency", { label: "POST /login" }),
    createRelationship("AuthController", "AuthService", "call", { label: "authenticate" }),
    createRelationship("AuthService", "UserRepository", "call", { label: "findByEmail" }),
    createRelationship("UserRepository", "UserTable", "call", { label: "SELECT" })
  );
  return arch;
}

test("sequence diagram follows controller->service->repository->db chain", () => {
  const code = generateSequenceMermaid(layered());
  assert.match(code, /sequenceDiagram/);
  assert.match(code, /Client/);
  assert.match(code, /AuthController/);
  assert.match(code, /AuthService/);
  assert.match(code, /UserRepository/);
  assert.match(code, /AuthController->>AuthService: authenticate/);
  assert.ok(!code.includes("undefined"));
});

test("sequence generation is deterministic", () => {
  assert.equal(generateSequenceMermaid(layered()), generateSequenceMermaid(layered()));
});

test("docs include inventory and relationship sections", () => {
  const docs = generateDocumentation(layered());
  assert.match(docs, /Design Document/);
  assert.match(docs, /Node Inventory/);
  assert.match(docs, /Relationships/);
  assert.match(docs, /AuthController/);
  assert.match(docs, /Quality score/);
});

test("generateSummary is one-liner with counts", () => {
  const summary = generateSummary(layered());
  assert.match(summary, /5 nodes/);
  assert.match(summary, /4 relationships/);
});

test("empty architecture produces graceful docs", () => {
  const docs = generateDocumentation(createEmptyArchitecture("ER", "Empty"));
  assert.match(docs, /Empty model/);
});