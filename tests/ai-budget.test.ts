import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  __resetAiBudgetsForTests,
  aiProviderEnabled,
  checkAiBudget,
  dailyBudgetLimit,
} from "@/lib/ai/budget";

beforeEach(() => {
  __resetAiBudgetsForTests();
});

test("kill switch: AI_PROVIDER_DISABLED=true disables providers", () => {
  assert.equal(aiProviderEnabled({ env: {} }), true);
  assert.equal(aiProviderEnabled({ env: { AI_PROVIDER_DISABLED: "true" } }), false);
  assert.equal(aiProviderEnabled({ env: { AI_PROVIDER_DISABLED: "false" } }), true);
  assert.equal(aiProviderEnabled({ env: { AI_PROVIDER_DISABLED: "" } }), true);
});

test("budget limit parsing: unset/zero/garbage means unlimited", () => {
  assert.equal(dailyBudgetLimit({}), 0);
  assert.equal(dailyBudgetLimit({ AI_DAILY_REQUEST_BUDGET: "" }), 0);
  assert.equal(dailyBudgetLimit({ AI_DAILY_REQUEST_BUDGET: "0" }), 0);
  assert.equal(dailyBudgetLimit({ AI_DAILY_REQUEST_BUDGET: "-5" }), 0);
  assert.equal(dailyBudgetLimit({ AI_DAILY_REQUEST_BUDGET: "abc" }), 0);
  assert.equal(dailyBudgetLimit({ AI_DAILY_REQUEST_BUDGET: "50" }), 50);
});

test("unlimited budget never denies", () => {
  for (let i = 0; i < 5; i += 1) {
    const check = checkAiBudget("user-a", { env: {} });
    assert.equal(check.ok, true);
  }
});

test("budget counts per user per UTC day and denies with reset time", () => {
  const env = { AI_DAILY_REQUEST_BUDGET: "2" };
  const nowMs = Date.parse("2026-09-13T10:00:00Z");

  const first = checkAiBudget("user-a", { env, nowMs });
  assert.equal(first.ok, true);
  assert.equal(first.remaining, 1);
  assert.equal(first.limit, 2);

  const second = checkAiBudget("user-a", { env, nowMs });
  assert.equal(second.ok, true);
  assert.equal(second.remaining, 0);

  const third = checkAiBudget("user-a", { env, nowMs });
  assert.equal(third.ok, false);
  assert.equal(third.remaining, 0);
  assert.equal(third.resetAt.toISOString(), "2026-09-14T00:00:00.000Z");

  // Different user is unaffected.
  assert.equal(checkAiBudget("user-b", { env, nowMs }).ok, true);
});

test("budget resets at the next UTC day boundary", () => {
  const env = { AI_DAILY_REQUEST_BUDGET: "1" };
  const dayOne = Date.parse("2026-09-13T23:59:00Z");
  const dayTwo = Date.parse("2026-09-14T00:01:00Z");

  assert.equal(checkAiBudget("user-a", { env, nowMs: dayOne }).ok, true);
  assert.equal(checkAiBudget("user-a", { env, nowMs: dayOne }).ok, false);
  const fresh = checkAiBudget("user-a", { env, nowMs: dayTwo });
  assert.equal(fresh.ok, true);
  assert.equal(fresh.remaining, 0);
});
