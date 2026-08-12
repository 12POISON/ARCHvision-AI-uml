/**
 * In-memory fixed-window rate limiter.
 *
 * Sufficient for single-instance deployments; the trade-off is documented:
 * this state is per-process, so multiple instances share no counter. Redis
 * (removed from docker-compose) would be the multi-instance upgrade path.
 */

const globalForRateLimit = globalThis as unknown as {
  __rateLimitBuckets?: Map<string, number[]>;
};

function buckets(): Map<string, number[]> {
  if (!globalForRateLimit.__rateLimitBuckets) {
    globalForRateLimit.__rateLimitBuckets = new Map<string, number[]>();
  }
  return globalForRateLimit.__rateLimitBuckets;
}

export interface RateLimitResult {
  ok: boolean;
  retryAfter: number;
}

/** Sliding window of timestamps; allows `limit` calls per `windowMs`. */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const map = buckets();
  const windowStart = now - windowMs;
  const hits = (map.get(key) ?? []).filter((t) => t > windowStart);

  if (hits.length >= limit) {
    map.set(key, hits);
    const oldest = hits[0] ?? now;
    const retryAfter = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    return { ok: false, retryAfter };
  }

  hits.push(now);
  map.set(key, hits);

  // Opportunistic cleanup of expired keys to avoid unbounded growth.
  if (map.size > 10_000) {
    for (const [k, ts] of map) {
      if (ts.length === 0 || ts[ts.length - 1]! <= windowStart) map.delete(k);
    }
  }
  return { ok: true, retryAfter: 0 };
}

/** Best-effort caller key: session user id, falling back to the client IP. */
export function callerKey(userId: string | undefined, request: Request): string {
  if (userId) return `user:${userId}`;
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";
  return `ip:${ip}`;
}
