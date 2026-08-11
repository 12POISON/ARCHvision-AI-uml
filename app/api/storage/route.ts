import { NextResponse } from "next/server";
import { repository } from "@/lib/data/repository";

/**
 * POST /api/storage — thin dispatch layer between the client storage
 * facade and the Prisma repository. Used only when the app runs in
 * NEXT_PUBLIC_DATA_MODE=db. Each op maps 1:1 to a repository method.
 *
 * Body: { op: string, payload?: unknown }
 * Response: { ok: true, data } | { ok: false, error }
 */

type Operation = keyof typeof repository;

const ALLOWED: Operation[] = [
  "listProjects",
  "listDiagrams",
  "getDiagram",
  "createProject",
  "createDiagram",
  "updateDiagram",
  "deleteDiagram",
  "recordPrompt",
  "listPromptHistory",
  "saveValidation",
  "getValidation",
  "listVersions",
  "saveVersion",
  "recordsChange",
  "listChanges",
  "reset",
];

interface StorageRequest {
  op: Operation;
  payload?: unknown;
}

export async function POST(request: Request): Promise<NextResponse> {
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

  try {
    const body = (await request.json()) as StorageRequest;
    if (!body || typeof body.op !== "string" || !ALLOWED.includes(body.op)) {
      return NextResponse.json({ ok: false, error: "Unknown storage operation" }, { status: 400 });
    }

    const handler = repository[body.op] as (...args: unknown[]) => Promise<unknown>;
    let args: unknown[];
    if (Array.isArray(body.payload)) {
      args = body.payload;
    } else if (body.op === "listDiagrams") {
      args = [body.payload ?? null];
    } else {
      args = body.payload === undefined || body.payload === null ? [] : [body.payload];
    }

    const data = await handler(...args);
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Storage operation failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}