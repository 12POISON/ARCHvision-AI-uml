import { withApiHandler } from "@/lib/http/with-api-handler";
import { streamSse } from "@/lib/http/sse";
import { RateLimitedError } from "@/lib/http/api-error";
import { hashUserId } from "@/lib/http/logger";
import { checkAiBudget } from "@/lib/ai/budget";
import { aiAssistService, currentModelId } from "@/lib/services";
import { AiChatRequestSchema, type AiChatRequest } from "@/lib/validation/schemas/ai.schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * POST /api/ai/chat — streaming AI assistant (SSE).
 *
 * The service decides online vs. offline: without a provider key it
 * streams the deterministic local engine and emits the `meta` fallback
 * marker first; the wire format (event/delta/error/done) is unchanged
 * from the pre-refactor route. Pre-stream failures (auth, rate limit,
 * invalid body) come back as regular JSON errors; stream-time failures
 * are emitted as SSE `error` events — exactly the old contract.
 */
export const POST = withApiHandler(
  async (ctx) => {
    const input = await ctx.body<AiChatRequest>();
    // Cost control BEFORE any provider SDK is touched: over-budget users get
    // a clear 429 with a reset time, never a silent failure.
    const budget = checkAiBudget(ctx.user!.id);
    if (!budget.ok) {
      const retryAfter = Math.max(1, Math.ceil((budget.resetAt.getTime() - Date.now()) / 1000));
      throw new RateLimitedError(
        retryAfter,
        `Daily AI budget exceeded (${budget.limit} requests/day). Resets at ${budget.resetAt.toISOString()}`
      );
    }
    return streamSse(
      async (writer) => {
        const mode = await aiAssistService.streamChat(input, {
          write: (event, data) => writer.write(event, data),
          done: () => {
            // The documented contract ends with an explicit `done` frame
            // BEFORE closing so clients can finish deterministically.
            writer.write("done", "ok");
            writer.end();
          },
        });
        ctx.log.info("ai.request", {
          route: "ai.chat",
          model: currentModelId(),
          mode,
          inputChars: JSON.stringify(input).length,
          userId: hashUserId(ctx.user!.id),
        });
      },
      { signal: ctx.request.signal }
    );
  },
  {
    auth: "required",
    rateLimit: { key: "chat", limit: 30, windowMs: 60_000 },
    bodySchema: AiChatRequestSchema,
    stream: true,
    name: "ai.chat",
  }
);