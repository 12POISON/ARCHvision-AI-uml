"use client";

import posthog from "posthog-js";

/**
 * Minimal product analytics (Phase 2). PostHog only initializes when
 * NEXT_PUBLIC_POSTHOG_KEY is set; otherwise every call is a no-op so local
 * dev and zero-config deploys never phone home.
 *
 * Tracked events (deliberately few — the ones that prove the product loop):
 *   diagram_created | diagram_exported | ai_chat_used | import_used
 */

let initialized = false;

function ensureInit(): boolean {
  if (initialized || typeof window === "undefined") return initialized;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return false;
  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com",
    capture_pageview: false,
    persistence: "localStorage",
  });
  initialized = true;
  return true;
}

export type AnalyticsEvent = "diagram_created" | "diagram_exported" | "ai_chat_used" | "import_used";

export function track(event: AnalyticsEvent, props?: Record<string, string | number | boolean>): void {
  try {
    if (!ensureInit()) return;
    posthog.capture(event, props);
  } catch {
    // Analytics must never break the product.
  }
}
