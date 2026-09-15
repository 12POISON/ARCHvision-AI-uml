/**
 * Copyright (c) 2026 BJVR. All rights reserved.
 * Proprietary — no use, copying, or distribution without permission. See LICENSE.
 *
 * AI cost controls (Phase 3) — provider kill switch + per-user daily budget.
 *
 * Both are enforced in the AI routes BEFORE any provider SDK is touched:
 *   - `AI_PROVIDER_DISABLED=true` → the service treats providers as absent
 *     (features keep working on the free offline engine; zero provider spend)
 *   - `AI_DAILY_REQUEST_BUDGET=N` → each authenticated user gets N
 *     chat+describe calls per UTC day; over budget → 429 with Retry-After
 *
 * The budget store is in-memory (same trade-off as the in-memory rate
 * limiter: per-process, resets on deploy). Good enough at this scale;
 * graduate to Postgres when multi-instance billing actually matters.
 */

export function aiProviderEnabled(now: { env?: Record<string, string | undefined> } = {}): boolean {
  const env = now.env ?? process.env;
  return env.AI_PROVIDER_DISABLED !== "true";
}

export function dailyBudgetLimit(env: Record<string, string | undefined> = process.env): number {
  const raw = env.AI_DAILY_REQUEST_BUDGET;
  if (!raw) return 0; // 0 / empty = unlimited
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

interface Bucket {
  day: string;
  count: number;
}

const buckets = new Map<string, Bucket>();

function utcDay(nowMs: number): string {
  return new Date(nowMs).toISOString().slice(0, 10);
}

export interface BudgetCheck {
  ok: boolean;
  /** Requests remaining in the current UTC day (0 when denied). */
  remaining: number;
  /** When the counter resets (start of next UTC day). */
  resetAt: Date;
  limit: number;
}

function resetAtFor(nowMs: number): Date {
  return new Date(Date.parse(`${utcDay(nowMs)}T00:00:00Z`) + 24 * 60 * 60 * 1000);
}

/** Test seam — resets all in-memory budget state. */
export function __resetAiBudgetsForTests(): void {
  buckets.clear();
}

export function checkAiBudget(
  userId: string,
  opts: { env?: Record<string, string | undefined>; nowMs?: number } = {}
): BudgetCheck {
  const env = opts.env ?? process.env;
  const nowMs = opts.nowMs ?? Date.now();
  const limit = dailyBudgetLimit(env);
  const resetAt = resetAtFor(nowMs);
  if (limit <= 0) {
    return { ok: true, remaining: Number.MAX_SAFE_INTEGER, resetAt, limit };
  }
  const key = `${utcDay(nowMs)}:${userId}`;
  // Opportunistic cleanup: yesterday-or-older buckets can never be hit again.
  if (buckets.size > 10_000) {
    const today = utcDay(nowMs);
    for (const [k, bucket] of buckets) {
      if (bucket.day < today) buckets.delete(k);
    }
  }
  const bucket = buckets.get(key) ?? { day: utcDay(nowMs), count: 0 };
  if (bucket.count >= limit) {
    return { ok: false, remaining: 0, resetAt, limit };
  }
  bucket.count += 1;
  buckets.set(key, bucket);
  return { ok: true, remaining: limit - bucket.count, resetAt, limit };
}
