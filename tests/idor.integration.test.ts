import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

/**
 * IDOR integration tests against a real database.
 *
 * Skips cleanly when DATABASE_URL is unset or unreachable (e.g. local dev
 * without a live Postgres). CI runs a Postgres service container and
 * applies migrations before the suite, so these tests run on every PR.
 *
 * User A creates a project + diagram; user B must not be able to read,
 * list, update, delete, or write child rows for them — and must get the
 * same "not found" signal as if the row never existed (no existence leak).
 */

const HAS_DB = Boolean(process.env.DATABASE_URL);
let dbOk = false;
let repo: typeof import("../lib/data/repository.ts")["repository"] | null = null;

const stamp = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const userA = `test_${stamp}_userA`;
const userB = `test_${stamp}_userB`;
let projectA = "";
let diagramA = "";

before(async () => {
  if (!HAS_DB) return;
  try {
    const dbMod = await import("../lib/db.ts");
    await dbMod.db.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch {
    dbOk = false;
    return;
  }
  const repository = await import("../lib/data/repository.ts");
  repo = repository.repository;

  await repository.ensureSeeded();
  // Create both users with unique ids to avoid collision with real data.
  for (const [id, name] of [
    [userA, "Test User A"],
    [userB, "Test User B"],
  ] as const) {
    const users = await import("../lib/db.ts");
    await users.db.user.upsert({
      where: { id },
      update: {},
      create: { id, name, email: `${id}@test.local` },
    });
  }

  const project = await repo.createProject({ name: "A's project", description: "secret" }, userA);
  projectA = project.id;
  const diagram = await repo.createDiagram(
    { name: "A's diagram", type: "CLASS", description: "confidential" },
    projectA,
    "classDiagram\n    class A",
    userA
  );
  diagramA = diagram.id;
});

after(async () => {
  if (!dbOk || !repo) return;
  try {
    const dbMod = await import("../lib/db.ts");
    await dbMod.db.project.deleteMany({ where: { userId: userA } });
    await dbMod.db.project.deleteMany({ where: { userId: userB } });
    await dbMod.db.user.deleteMany({ where: { id: { in: [userA, userB] } } });
  } catch {
    // Cleanup is best-effort.
  }
});

test("user B cannot read user A's diagram", { skip: !HAS_DB }, async (t) => {
  if (!dbOk || !repo || !diagramA) return t.skip("DATABASE_URL not reachable");
  const row = await repo.getDiagram(diagramA, userB);
  assert.equal(row, null);
});

test("user B cannot list user A's projects or diagrams", { skip: !HAS_DB }, async (t) => {
  if (!dbOk || !repo || !projectA || !diagramA) return t.skip("DATABASE_URL not reachable");
  const projects = await repo.listProjects(userB);
  assert.ok(!projects.some((p) => p.id === projectA), "B must not see A's project");
  const diagrams = await repo.listDiagrams(null, userB);
  assert.ok(!diagrams.some((d) => d.id === diagramA), "B must not see A's diagram");
});

test("user B cannot update user A's diagram", { skip: !HAS_DB }, async (t) => {
  if (!dbOk || !repo || !diagramA) return t.skip("DATABASE_URL not reachable");
  const updated = await repo.updateDiagram(diagramA, { name: "stolen" }, userB);
  assert.equal(updated, null);
  const still = await repo.getDiagram(diagramA, userA);
  assert.notEqual(still, null);
  assert.equal(still!.name, "A's diagram");
});

test("user B cannot delete user A's diagram", { skip: !HAS_DB }, async (t) => {
  if (!dbOk || !repo || !diagramA) return t.skip("DATABASE_URL not reachable");
  const deleted = await repo.deleteDiagram(diagramA, userB);
  assert.equal(deleted, false);
  const still = await repo.getDiagram(diagramA, userA);
  assert.notEqual(still, null);
});

test("user B cannot read or write child rows under user A's diagram", { skip: !HAS_DB }, async (t) => {
  if (!dbOk || !repo || !diagramA) return t.skip("DATABASE_URL not reachable");
  const { NotFoundError } = await import("../lib/data/repository.ts");

  await assert.rejects(
    repo.recordPrompt({ diagramId: diagramA, prompt: "p", response: "r", actionType: "generate" }, userB),
    NotFoundError
  );
  assert.deepEqual(await repo.listPromptHistory(diagramA, userB), []);
  assert.equal(await repo.getValidation(diagramA, userB), null);
  assert.deepEqual(await repo.listVersions(diagramA, userB), []);
  assert.deepEqual(await repo.listChanges(diagramA, 30, userB), []);
  await assert.rejects(repo.recordsChange(diagramA, "change", userB), NotFoundError);
});

test("user A can still manage their own diagram", { skip: !HAS_DB }, async (t) => {
  if (!dbOk || !repo || !projectA || !diagramA) return t.skip("DATABASE_URL not reachable");
  const updated = await repo.updateDiagram(diagramA, { name: "A's renamed diagram" }, userA);
  assert.notEqual(updated, null);
  assert.equal(updated!.name, "A's renamed diagram");
  assert.ok((await repo.listProjects(userA)).some((p) => p.id === projectA));
  assert.ok((await repo.listDiagrams(projectA, userA)).some((d) => d.id === diagramA));
});
