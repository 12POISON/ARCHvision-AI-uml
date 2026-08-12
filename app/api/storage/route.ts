import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { repository, NotFoundError } from "@/lib/data/repository";
import { createStorageOps, isStorageOp, parseArgs } from "@/lib/data/storage-ops";
import { rateLimit } from "@/lib/rate-limit";

/**
 * POST /api/storage — thin dispatch layer between the client storage
 * facade and the Prisma repository. Used only when the app runs in
 * NEXT_PUBLIC_DATA_MODE=db.
 *
 * Body: { op: string, payload?: unknown }
 * Response: { ok: true, data } | { ok: false, error }
 *
 * Security: the authenticated `userId` is injected server-side for every
 * op — it is never taken from the request body. Ownership is enforced by
 * the repository queries themselves (see lib/data/repository.ts).
 */

const OPS = createStorageOps(repository);

export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const limited = rateLimit(`storage:${session.user.id}`, 120, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { ok: false, error: "Rate limit exceeded" },
      { status: 429, headers: { "Retry-After": String(limited.retryAfter) } }
    );
  }

  if (process.env.NEXT_PUBLIC_DATA_MODE !== "db") {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Storage API is disabled — set NEXT_PUBLIC_DATA_MODE=db and a live DATABASE_URL to enable PostgreSQL persistence.",
      },
      { status: 503 }
    );
  }

  let body: { op?: unknown; payload?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }
  try {
    if (!body || typeof body.op !== "string" || !isStorageOp(body.op)) {
      return NextResponse.json({ ok: false, error: "Unknown storage operation" }, { status: 400 });
    }

    const handler = OPS[body.op];
    const data = await handler(parseArgs(body.op, body.payload), session.user.id);
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 404 });
    }
    const message = error instanceof Error ? error.message : "Storage operation failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
