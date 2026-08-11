import { test } from "node:test";
import assert from "node:assert/strict";
import { parseERDiagram } from "../lib/architecture/parse.ts";
import { validateArchitecture } from "../lib/architecture/validate.ts";
import { parseMermaidClassDiagram } from "../lib/mermaid/parser.ts";
import { legacyToArchitecture } from "../lib/architecture/model.ts";

const ER_FIXTURE = `erDiagram
    CUSTOMER {
        int id PK
        string name
    }
    ORDER {
        int id PK
        string status
    }
    PRODUCT {
        string sku
        decimal title
    }
    CUSTOMER ||--o{ ORDER : places
    ORDER }o--o{ PRODUCT : contains`;

test("ER: PRODUCT has no PK so er-no-pk fires", () => {
  const validation = validateArchitecture(parseERDiagram(ER_FIXTURE));
  assert.ok(validation.issues.some((i) => i.rule === "er-no-pk"));
});

test("ER: many-to-many flagged as info", () => {
  const validation = validateArchitecture(parseERDiagram(ER_FIXTURE));
  assert.ok(validation.issues.some((i) => i.rule === "er-m2m" && i.severity === "info"));
});

test("ER: relationship to a missing table is critical", () => {
  const bad = `erDiagram
    USERS {
        int id PK
    }
    USERS ||--o{ BANNED_LIST : flags`;
  const validation = validateArchitecture(parseERDiagram(bad));
  const missing = validation.issues.find((i) => i.rule === "er-missing-target");
  assert.ok(missing);
  assert.equal(missing.severity, "critical");
});

test("UML: dependency cycle detected as critical", () => {
  const model = parseMermaidClassDiagram(`classDiagram
    A ..> B : calls
    B ..> C : calls
    C ..> A : calls`);
  const validation = validateArchitecture(legacyToArchitecture(model));
  assert.ok(validation.issues.some((i) => i.rule === "cycle" && i.severity === "critical"));
});

test("UML: controller depends directly on database flagged when repository exists", () => {
  const model = parseMermaidClassDiagram(`classDiagram
    class AuthController
    class AuthRepository
    class PostgresDB
    AuthController ..> PostgresDB : writes`);
  const validation = validateArchitecture(legacyToArchitecture(model));
  assert.ok(validation.issues.some((i) => i.rule === "controller-db"));
});

test("score breakdown and passed counts are consistent", () => {
  const model = parseMermaidClassDiagram(`classDiagram
    class User {
        +String name
    }
    class Session
    User --> Session : creates`);
  const validation = validateArchitecture(legacyToArchitecture(model));
  assert.equal(typeof validation.score, "number");
  assert.ok(Array.isArray(validation.scoreBreakdown));
  assert.ok(Array.isArray(validation.passed));
  assert.equal(
    validation.checks.length,
    validation.passed.length + validation.scoreBreakdown.length,
    "every rule is either passed or broken out"
  );
});