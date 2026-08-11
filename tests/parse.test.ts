import { test } from "node:test";
import assert from "node:assert/strict";
import { parseArchitectureDiagram, parseERColumns } from "../lib/architecture/parse.ts";
import { modelToMermaid } from "../lib/mermaid/parser.ts";
import { architectureToLegacy } from "../lib/architecture/model.ts";

test("ER diagram: tables, PK/FK columns and crow's-foot cardinality", () => {
  const code = `erDiagram
    CUSTOMER {
        int id PK
        string name
        string email UK
    }
    ORDER {
        int id PK
        int customer_id FK
        datetime placed_at
    }
    CUSTOMER ||--o{ ORDER : places`;

  const { architecture, error } = parseArchitectureDiagram(code);
  assert.equal(error, null);
  assert.equal(architecture.diagramType, "ER");
  assert.equal(architecture.nodes.length, 2);

  const customer = architecture.nodes.find((n) => n.name === "CUSTOMER");
  assert.ok(customer);
  assert.equal(customer.kind, "table");
  const id = customer.attributes.find((a) => a.name === "id");
  assert.ok(id?.isPrimaryKey);
  const email = customer.attributes.find((a) => a.name === "email");
  assert.ok(email?.isUnique);

  const rel = architecture.relationships[0];
  assert.equal(rel.source, "CUSTOMER");
  assert.equal(rel.target, "ORDER");
  assert.equal(rel.sourceMultiplicity, "1");
  assert.equal(rel.targetMultiplicity, "0..*");
  assert.equal(rel.foreignKeyColumn, "id");

  const order = architecture.nodes.find((n) => n.name === "ORDER");
  const fk = order?.attributes.find((a) => a.name === "id");
  assert.ok(fk?.isForeignKey, "FK column should be marked on the source table");
});

test("parseERColumns recognizes PK/FK/UK", () => {
  const columns = parseERColumns("id int PK, user_id int FK, email string UK, name string");
  assert.equal(columns.length, 4);
  assert.equal(columns[0].isPrimaryKey, true);
  assert.equal(columns[1].isForeignKey, true);
  assert.equal(columns[2].isUnique, true);
  assert.equal(columns[3].isNullable, true);
});

test("sequence diagram: participants and call/return typing", () => {
  const code = `sequenceDiagram
    participant Client
    Client->>AuthController: login()
    AuthController->>AuthService: authenticate()
    AuthService-->>AuthController: session
    AuthController-->>Client: 200 OK`;

  const { architecture, error } = parseArchitectureDiagram(code);
  assert.equal(error, null);
  assert.equal(architecture.diagramType, "SEQUENCE");
  assert.equal(architecture.nodes.length, 3);
  assert.equal(architecture.relationships.length, 4);
  const calls = architecture.relationships.filter((r) => r.type === "call");
  const returns = architecture.relationships.filter((r) => r.type === "return");
  assert.equal(calls.length, 2);
  assert.equal(returns.length, 2);
  const controller = architecture.nodes.find((n) => n.name === "AuthController");
  assert.equal(controller?.kind, "controller");
});

test("class diagram round-trips through canonical model", () => {
  const code = `classDiagram
    class User {
        +String name
        +login() : Session
    }
    class Session
    User --> Session : has`;
  const { architecture, error } = parseArchitectureDiagram(code);
  assert.equal(error, null);
  assert.equal(architecture.diagramType, "CLASS");
  assert.equal(architecture.nodes.length, 2);
  assert.equal(architecture.relationships[0].label, "has");
});

test("class diagram: quoted multiplicities with labels are not dropped", () => {
  const code = `classDiagram
    class User
    class Profile
    class Session
    User "1" --> "0..1" Profile : owns
    User "1" --> "0..*" Session : has`;
  const { architecture, error } = parseArchitectureDiagram(code);
  assert.equal(error, null);
  assert.equal(architecture.relationships.length, 2, "both multiplicity-bearing edges must parse");

  const owns = architecture.relationships.find((r) => r.label === "owns");
  assert.ok(owns, "edge with target-side multiplicity must survive parsing");
  assert.equal(owns.source, "User");
  assert.equal(owns.target, "Profile");
  assert.equal(owns.sourceMultiplicity, "1");
  assert.equal(owns.targetMultiplicity, "0..1");

  const has = architecture.relationships.find((r) => r.label === "has");
  assert.ok(has);
  assert.equal(has.targetMultiplicity, "0..*");
});

test("class diagram: multiplicity shape round-trips through modelToMermaid", () => {
  const code = `classDiagram
    User
    User "1" --> "0..*" Session : has`;
  const { architecture } = parseArchitectureDiagram(code);
  const { architecture: reparsed } = parseArchitectureDiagram(modelToMermaid(architectureToLegacy(architecture)));
  assert.equal(reparsed.relationships.length, 1);
  assert.equal(reparsed.relationships[0].sourceMultiplicity, "1");
  assert.equal(reparsed.relationships[0].targetMultiplicity, "0..*");
  assert.equal(reparsed.relationships[0].label, "has");
});