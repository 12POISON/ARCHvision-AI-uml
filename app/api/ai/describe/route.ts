import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { generateText } from "ai";

/**
 * Online AI description provider.
 *
 * The client (lib/ai/describe.ts) treats this route as optional: any
 * failure (401/429/503/network) falls back to the deterministic local
 * description engine, which the UI labels as such. This route is
 * deliberately NOT streaming — descriptions are short.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const nodeSchema = z.object({
  name: z.string().min(1).max(200),
  kind: z.string().max(60),
  attributeCount: z.number().int().min(0),
  methodCount: z.number().int().min(0),
});

const relationshipSchema = z.object({
  source: z.string().min(1).max(200),
  target: z.string().min(1).max(200),
  type: z.string().max(40),
  label: z.string().max(300).nullable(),
});

const issueSchema = z.object({
  severity: z.string().max(20),
  message: z.string().max(500),
});

const requestSchema = z.object({
  title: z.string().max(300),
  diagramType: z.string().max(40),
  nodes: z.array(nodeSchema).max(300),
  relationships: z.array(relationshipSchema).max(600),
  issues: z.array(issueSchema).max(200),
  focus: z.string().max(200).optional(),
});

export async function POST(request: Request): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limited = rateLimit(`describe:${session.user.id}`, 20, 60_000);
    if (!limited.ok) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429, headers: { "Retry-After": String(limited.retryAfter) } }
      );
    }

    if (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "AI description unavailable — no provider key configured" },
        { status: 503 }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request: " + (parsed.error.issues[0]?.message ?? "unknown") },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const focus = data.focus;
    const nodeList = data.nodes
      .map((n) => `${n.name}${n.kind && n.kind !== "class" ? ` (${n.kind})` : ""} — ${n.attributeCount} attributes, ${n.methodCount} methods`)
      .join("\n");
    const relList = data.relationships
      .map((r) => `${r.source} ${r.type} ${r.target}${r.label ? ` : ${r.label}` : ""}`)
      .join("\n");
    const issueList = data.issues.map((i) => `[${i.severity}] ${i.message}`).join("\n");

    const system = focus
      ? "You are ArchVision, a UML design assistant. Describe ONLY the requested node of the provided model, in 2-4 concise sentences of Markdown. Base everything strictly on the provided model facts. Do not invent members or relationships."
      : "You are ArchVision, a UML design assistant. Produce a concise Markdown overview (3-6 sentences) of the provided model: responsibilities, layering, and notable design observations. Base everything strictly on the provided model facts. Do not invent members or relationships.";

    const prompt = [
      `Model: "${data.title}" (${data.diagramType} diagram)`,
      "",
      "Nodes:",
      nodeList || "(none)",
      "",
      "Relationships:",
      relList || "(none)",
      ...(issueList ? ["", "Validation findings:", issueList] : []),
      ...(focus ? [``, `Describe this node in particular: ${focus}`] : []),
    ].join("\n");

    const { text } = await generateText({
      model: await getModel(),
      system,
      prompt,
      temperature: 0.3,
    });

    const trimmed = text.trim();
    if (!trimmed) {
      return NextResponse.json({ error: "Empty description generated" }, { status: 502 });
    }
    return NextResponse.json({ text: trimmed });
  } catch (error) {
    // Never surface a 500 — the client falls back to the local engine.
    console.error("[ai/describe] unexpected route failure", error);
    return NextResponse.json({ error: "Description generation failed" }, { status: 502 });
  }
}

async function getModel() {
  if (process.env.OPENAI_API_KEY) {
    const { openai } = await getOpenAiModule();
    return openai("gpt-4o-mini");
  }
  const { anthropic } = await getAnthropicModule();
  return anthropic("claude-3-5-sonnet-latest");
}

let openaiModule: typeof import("@ai-sdk/openai") | null = null;
let anthropicModule: typeof import("@ai-sdk/anthropic") | null = null;

async function getOpenAiModule() {
  if (!openaiModule) openaiModule = await import("@ai-sdk/openai");
  return openaiModule;
}

async function getAnthropicModule() {
  if (!anthropicModule) anthropicModule = await import("@ai-sdk/anthropic");
  return anthropicModule;
}