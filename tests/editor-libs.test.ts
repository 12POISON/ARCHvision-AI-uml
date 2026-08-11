import { test } from "node:test";
import assert from "node:assert/strict";
import { orthogonalPath, pathMidpoint } from "../lib/editor/orthogonal.ts";
import { computeLayeredLayout } from "../lib/editor/layout.ts";
import {
  importCsvToMermaid,
  importJsonToMermaid,
  importPrismaToMermaid,
  importSqlToMermaid,
  detectImportFormat,
} from "../lib/architecture/importers.ts";
import { TEMPLATES } from "../lib/architecture/templates.ts";

test("orthogonalPath: right->left uses a Z shape with rounded corners", () => {
  const d = orthogonalPath(
    { x: 0, y: 0 },
    { x: 200, y: 100 },
    "right",
    "left"
  );
  assert.match(d, /^M 0 0/);
  assert.match(d, /L 28 0/);
  assert.match(d, /Q/); // at least one rounded corner
  assert.match(d, /L 200 100$/);
});

test("orthogonalPath: top->bottom uses a vertical Z with a rounded corner", () => {
  const d = orthogonalPath(
    { x: 30, y: 0 },
    { x: 50, y: 200 },
    "top",
    "bottom"
  );
  assert.match(d, /^M 30 0/);
  assert.match(d, /Q/);
  assert.match(d, /L 50 200$/);
});

test("orthogonalPath: aligned top->bottom detours around the bodies", () => {
  const d = orthogonalPath(
    { x: 50, y: 0 },
    { x: 50, y: 200 },
    "top",
    "bottom"
  );
  assert.match(d, /^M 50 0/);
  assert.match(d, /Q/);
  assert.match(d, /L 50 200$/);
  // The path is never a straight vertical line through both nodes.
  assert.ok(!/L 50 -?\d+ L 50 \d+ L 50/.test(d));
});

test("pathMidpoint: lands on the middle segment", () => {
  const mid = pathMidpoint([
    { x: 0, y: 0 },
    { x: 0, y: 40 },
    { x: 100, y: 40 },
  ]);
  assert.equal(mid.x, 30);
  assert.equal(mid.y, 40);
});

test("computeLayeredLayout: orders nodes into layers by longest path", () => {
  const nodes = [
    { id: "A", position: { x: 0, y: 0 }, data: {} },
    { id: "B", position: { x: 0, y: 0 }, data: {} },
    { id: "C", position: { x: 0, y: 0 }, data: {} },
  ] as never[];
  const edges = [
    { id: "e1", source: "A", target: "B" },
    { id: "e2", source: "B", target: "C" },
  ] as never[];
  const sizes = new Map([
    ["A", { id: "A", width: 100, height: 50 }],
    ["B", { id: "B", width: 100, height: 50 }],
    ["C", { id: "C", width: 100, height: 50 }],
  ]);
  const result = computeLayeredLayout(nodes, edges, sizes);
  const byId = new Map(result.nodes.map((n) => [n.id, n.position]));
  // A first layer, B second, C third — x increases along the chain.
  assert.ok(byId.get("B")!.x > byId.get("A")!.x);
  assert.ok(byId.get("C")!.x > byId.get("B")!.x);
  // Different layers, so all positions are distinct.
  assert.notEqual(byId.get("A")!.x, byId.get("C")!.x);
});

test("computeLayeredLayout: cycles never hang (longest-path still assigns layers)", () => {
  const nodes = [
    { id: "X", position: { x: 0, y: 0 }, data: {} },
    { id: "Y", position: { x: 0, y: 0 }, data: {} },
  ] as never[];
  const edges = [
    { id: "e1", source: "X", target: "Y" },
    { id: "e2", source: "Y", target: "X" },
  ] as never[];
  const sizes = new Map([
    ["X", { id: "X", width: 100, height: 50 }],
    ["Y", { id: "Y", width: 100, height: 50 }],
  ]);
  const result = computeLayeredLayout(nodes, edges, sizes);
  assert.equal(result.nodes.length, 2);
});

test("importJsonToMermaid: array of objects becomes a flowchart", () => {
  const code = importJsonToMermaid(
    '[{"name":"alice","role":"admin"},{"name":"bob","role":"user"}]'
  );
  assert.ok(code);
  assert.match(code!, /flowchart LR/);
  assert.match(code!, /name: alice/);
});

test("importJsonToMermaid: invalid json returns null", () => {
  assert.equal(importJsonToMermaid("{nope"), null);
});

test("importCsvToMermaid: header + rows become labeled nodes", () => {
  const code = importCsvToMermaid("id,name\n1,alice\n2,bob");
  assert.ok(code);
  assert.match(code!, /flowchart LR/);
  assert.match(code!, /id: 1/);
});

test("importSqlToMermaid: CREATE TABLE becomes an ER diagram", () => {
  const sql = `CREATE TABLE users (
    id INT PRIMARY KEY,
    email VARCHAR(255)
  );
  CREATE TABLE orders (
    id INT PRIMARY KEY,
    user_id INT,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );`;
  const code = importSqlToMermaid(sql);
  assert.ok(code);
  assert.match(code!, /erDiagram/);
  assert.match(code!, /USERS \{/);
  assert.match(code!, /ORDERS \{/);
  assert.match(code!, /ORDERS \|\|--o\{ USERS/);
});

test("importPrismaToMermaid: models and relations", () => {
  const prisma = `model User {
    id        Int    @id
    posts     Post[]
  }
  model Post {
    id       Int   @id
    author   User  @relation("author")
  }`;
  const code = importPrismaToMermaid(prisma);
  assert.ok(code);
  assert.match(code!, /erDiagram/);
  assert.match(code!, /USER \{/);
  assert.match(code!, /POST \|\|--o\{ USER/);
});

test("detectImportFormat: extension mapping", () => {
  assert.equal(detectImportFormat("schema.prisma"), "prisma");
  assert.equal(detectImportFormat("data.json"), "json");
  assert.equal(detectImportFormat("rows.csv"), "csv");
  assert.equal(detectImportFormat("ddl.sql"), "sql");
  assert.equal(detectImportFormat("notes.txt"), null);
});

test("templates: all 9 templates build mermaid that starts with a known diagram type", () => {
  assert.equal(TEMPLATES.length, 9);
  const starters = new Set([
    "flowchart",
    "graph",
    "erDiagram",
    "classDiagram",
    "sequenceDiagram",
    "stateDiagram-v2",
    "mindmap",
    "timeline",
  ]);
  for (const t of TEMPLATES) {
    const code = t.build();
    assert.ok(starters.has(code.split(/\s/)[0]), `${t.id} has valid starter`);
  }
});
