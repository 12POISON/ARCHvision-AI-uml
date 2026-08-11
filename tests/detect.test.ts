import { test } from "node:test";
import assert from "node:assert/strict";
import { detectArchitectureFromText, extractEntities, splitSentences } from "../lib/architecture/detect.ts";

test("detects entities from capitalized nouns", () => {
  const arch = detectArchitectureFromText(
    "A User has many Orders. An Order contains OrderItems. A Payment belongs to an Order."
  );
  const names = arch.nodes.map((n) => n.name);
  assert.ok(names.includes("User"));
  assert.ok(names.includes("Order"));
  assert.ok(names.includes("OrderItem"));
  assert.ok(names.includes("Payment"));
});

test("extracts relationships with verbs and cardinality", () => {
  const arch = detectArchitectureFromText(
    "A User has many Orders. A Payment belongs to an Order."
  );
  const has = arch.relationships.find((r) => r.source === "User" && r.target === "Order");
  assert.ok(has, "User->Order relationship exists");
  assert.equal(has.targetMultiplicity, "0..*");
  const belongs = arch.relationships.find((r) => r.source === "Payment" && r.target === "Order");
  assert.ok(belongs);
  assert.equal(belongs.type, "aggregation");
});

test("inheritance and implementation verbs", () => {
  const arch = detectArchitectureFromText(
    "Admin inherits from User. PaymentService implements PaymentProvider."
  );
  const inherit = arch.relationships.find((r) => r.source === "Admin" && r.type === "inheritance");
  assert.ok(inherit);
  assert.equal(inherit.target, "User");
  const implementsN = arch.relationships.find((r) => r.source === "PaymentService" && r.target === "PaymentProvider");
  assert.ok(implementsN);
  assert.equal(implementsN.type, "implementation");
});

test("noun phrases like 'Sessions for User' produce associations", () => {
  const arch = detectArchitectureFromText("Sessions for User are created at login.");
  const rel = arch.relationships.find((r) => r.source === "Session" && r.target === "User");
  assert.ok(rel);
  assert.equal(rel.foreignKeyColumn, null);
});

test("extractEntities filters English stop words", () => {
  const entities = extractEntities("The user can see the Orders page");
  assert.ok(entities.includes("Order"));
  assert.ok(!entities.includes("The"));
});

test("splitSentences handles newline and period splitting", () => {
  const sentences = splitSentences("A has B.\nC has D. E has F.");
  assert.equal(sentences.length, 3);
});