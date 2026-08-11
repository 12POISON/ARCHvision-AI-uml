import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { streamText } from "ai";
import { parseArchitectureDiagram } from "@/lib/architecture/parse";
import { validateArchitecture } from "@/lib/architecture/validate";
import { generateDocumentation, generateSummary } from "@/lib/architecture/docs";
import { generateSequenceMermaid } from "@/lib/architecture/sequence";
import { detectArchitectureFromText } from "@/lib/architecture/detect";
import { architectureToMermaid } from "@/lib/architecture/serialization";
import { applyChange, type ArchitectureChange } from "@/lib/architecture/transforms";
import type { Architecture } from "@/types/diagram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const requestSchema = z.object({
  message: z.string().min(1).max(8000),
  action: z.enum(["generate", "transform", "explain", "analyze", "chat", "why"]),
  mermaid: z.string().optional(),
  selectedNode: z.string().nullable().optional(),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() }))
    .max(20)
    .optional(),
});

type ValidRequest = z.infer<typeof requestSchema>;

interface SSEWriter {
  write: (event: string, data: string) => void;
  end: () => void;
}

const encoder = new TextEncoder();

function streamSse(producer: (writer: SSEWriter) => Promise<void>): Response {
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const writer: SSEWriter = {
        write: (event, data) => {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${data}\n\n`));
        },
        end: () => {
          try {
            controller.close();
          } catch {
            // already closed
          }
        },
      };
      try {
        await producer(writer);
      } catch (error) {
        writer.write("error", error instanceof Error ? error.message : "Unexpected error");
      } finally {
        writer.end();
      }
    },
  });
  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

function simulate(chunks: string[], writer: SSEWriter, delayMs = 26): Promise<void> {
  return new Promise((resolve) => {
    let index = 0;
    const tick = (): void => {
      if (index >= chunks.length) {
        resolve();
        return;
      }
      const chunk = chunks[index];
      index += 1;
      writer.write("delta", chunk);
      const pause = chunk.endsWith("}\n") || chunk.endsWith("```\n") ? 240 : delayMs + (index % 5) * 9;
      setTimeout(tick, pause);
    };
    tick();
  });
}

/* ---------------- offline (deterministic) implementations ---------------- */

function generateMock(prompt: string): string {
  const arch = detectArchitectureFromText(prompt);
  return architectureToMermaid(arch);
}

function explainMock(mermaid: string): string {
  const { architecture, error } = parseArchitectureDiagram(mermaid);
  if (error) {
    return `# Design Document\n\nUnable to parse the current diagram: ${error}. Verify the Mermaid syntax first.`;
  }
  return generateDocumentation(architecture);
}

function analyzeMock(mermaid: string): string {
  const { architecture, error } = parseArchitectureDiagram(mermaid);
  if (error) return `Could not parse the diagram for analysis: ${error}`;
  const validation = validateArchitecture(architecture);
  const lines: string[] = [`### Architecture Analysis (score ${validation.score}/100)`, ""];
  const criticals = validation.issues.filter((i) => i.severity === "critical");
  const warnings = validation.issues.filter((i) => i.severity === "warning");
  const infos = validation.issues.filter((i) => i.severity === "info");
  if (criticals.length > 0) {
    lines.push("**🔴 Critical issues**", ...criticals.map((i) => `- ${i.message}`), "");
  }
  if (warnings.length > 0) {
    lines.push("**🟠 Warnings**", ...warnings.map((i) => `- ${i.message}`), "");
  }
  if (infos.length > 0) {
    lines.push("**🔵 Info**", ...infos.map((i) => `- ${i.message}`), "");
  }
  if (validation.issues.length === 0) {
    lines.push("No issues found — the model is consistent.");
  }
  lines.push("", `**Score: ${validation.score}/100** — ${validation.passed.length} checks passed of ${validation.checks.length}.`);
  return lines.join("\n");
}

function transformMock(message: string, mermaid: string, selectedNode: string | null): string | null {
  const lower = message.toLowerCase();

  // convert to sequence
  if (/(?:convert|turn|transform|make).*sequence/i.test(lower)) {
    const { architecture, error } = parseArchitectureDiagram(mermaid);
    if (error) return null;
    return generateSequenceMermaid(architecture);
  }

  const { architecture } = parseArchitectureDiagram(mermaid);

  // rename
  const renameMatch = /rename\s+([A-Za-z_][A-Za-z0-9]*)\s+to\s+([A-Za-z_][A-Za-z0-9]*)/i.exec(message);
  if (renameMatch) {
    const from = findName(architecture, renameMatch[1]);
    if (from) {
      const changed = applySingleChange({ kind: "renameNode", from, to: renameMatch[2] }, architecture);
      if (changed) return architectureToMermaid(changed);
    }
  }

  // add class
  const addMatch = /(?:add|create|introduce)\s+(?:a\s+)?(?:new\s+)?(?:class\s+|entity\s+)?([A-Za-z_][A-Za-z0-9]*)/i.exec(message);
  if (addMatch && !hasNode(architecture, addMatch[1])) {
    const changed = applySingleChange({
      kind: "addNode",
      name: addMatch[1],
      connectTo: selectedNode && hasNode(architecture, selectedNode) ? selectedNode : null,
    }, architecture);
    if (changed) return architectureToMermaid(changed);
  }

  // make X inherit from Y
  const inheritMatch = /(?:make|let|change)\s+([A-Za-z_][A-Za-z0-9]*)\s+(?:inherit|extend)\s+(?:from\s+)?([A-Za-z_][A-Za-z0-9]*)/i.exec(message);
  if (inheritMatch) {
    const child = findName(architecture, inheritMatch[1]) ?? inheritMatch[1];
    const parent = findName(architecture, inheritMatch[2]) ?? inheritMatch[2];
    if (hasNode(architecture, child) && hasNode(architecture, parent)) {
      const changed = applySingleChange({ kind: "addRelationship", source: child, target: parent, type: "inheritance" }, architecture);
      if (changed) return architectureToMermaid(changed);
    }
  }

  // add method
  const methodMatch = /(?:add|give)\s+([A-Za-z_][A-Za-z0-9]*)\s+(?:a\s+)?(?:method|operation)\s+([a-z][A-Za-z0-9]*)/i.exec(message);
  if (methodMatch) {
    const target = findName(architecture, methodMatch[1]);
    if (target) {
      const changed = applySingleChange({ kind: "addMethod", node: target, method: methodMatch[2], returnType: "void" }, architecture);
      if (changed) return architectureToMermaid(changed);
    }
  }

  return null;
}

function hasNode(arch: { nodes: Array<{ name: string }> }, name: string): boolean {
  return arch.nodes.some((n) => n.name === name);
}

function findName(arch: { nodes: Array<{ name: string }> }, needle: string): string | null {
  const lower = needle.toLowerCase();
  return (
    arch.nodes.find((n) => n.name.toLowerCase() === lower)?.name ??
    arch.nodes.find((n) => n.name.toLowerCase().includes(lower) || lower.includes(n.name.toLowerCase()))?.name ??
    null
  );
}

function applySingleChange(change: ArchitectureChange, arch: Architecture): Architecture | null {
  if (arch.nodes.length === 0 && change.kind === "addRelationship") return null;
  return applyChange(arch, change);
}

function whyMock(mermaid: string, selectedNode: string | null): string {
  const { architecture, error } = parseArchitectureDiagram(mermaid);
  if (error) return `I couldn't parse the diagram: ${error}`;
  const lines: string[] = [];
  const target = selectedNode;
  if (target) {
    const node = architecture.nodes.find((n) => n.id === target || n.name === target);
    if (node) {
      lines.push(`**${node.name} (${node.kind})** plays the role of *${roleDescription(node.kind)}*.`);
      const incoming = architecture.relationships.filter((r) => r.target === node.name);
      const outgoing = architecture.relationships.filter((r) => r.source === node.name);
      if (incoming.length > 0) {
        lines.push("- **Depended on by:** " + incoming.map((r) => `${r.source} (${r.type})`).join(", "));
      }
      if (outgoing.length > 0) {
        lines.push("- **Depends on:** " + outgoing.map((r) => `${r.target} (${r.type})`).join(", "));
      }
      if (node.attributes.length > 0) lines.push(`- **Attributes:** ${node.attributes.map((a) => a.name).join(", ")}`);
      if (node.methods.length > 0) lines.push(`- **Methods:** ${node.methods.map((m) => m.name).join(", ")}`);
    } else {
      lines.push(`Hmm — I couldn't find a node named "${target}".`);
    }
  } else {
    const summary = generateSummary(architecture);
    lines.push(`${summary}`);
    const criticals = validateArchitecture(architecture).issues.filter((i) => i.severity === "critical");
    if (criticals.length > 0) {
      lines.push("-", "**Most urgent issue:** " + criticals[0].message);
    } else {
      lines.push("No critical issues — the model is consistent. Select a node to ask about it specifically.");
    }
  }
  return lines.join("\n");
}

function roleDescription(kind: string): string {
  switch (kind) {
    case "controller":
      return "an HTTP boundary that routes requests into services";
    case "service":
      return "the business-logic layer orchestrating domain rules";
    case "repository":
      return "a data-access abstraction isolating persistence from services";
    case "database":
      return "a persistence store";
    case "table":
      return "a relational table (ER) entity";
    case "entity":
      return "a domain entity";
    case "interface":
      return "a contract consumed by other nodes";
    case "actor":
      return "an external participant in the interaction";
    default:
      return "a structural unit of the model";
  }
}

/* ---------------- route ---------------- */

export async function POST(request: Request): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request: " + (parsed.error.issues[0]?.message ?? "unknown") }, { status: 400 });
    }
    return await streamResponse(parsed.data);
  } catch (error) {
    // NEVER surface a 500 to the frontend — degrade to the local engine instead.
    console.error("[ai] unexpected route failure", error);
    return streamOffline({
      message: "Describe the system you want to model.",
      action: "generate",
      mermaid: undefined,
      selectedNode: null,
      history: [],
    });
  }
}

async function streamResponse(input: ValidRequest): Promise<Response> {
  const hasApiKey = Boolean(process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY);
  if (!hasApiKey) return streamOffline(input);
  return streamWithModel(input);
}

async function streamWithModel(input: ValidRequest): Promise<Response> {
  return streamSse(async (writer) => {
    const system =
      input.action === "transform"
        ? "You are ArchVision, a UML design assistant. Apply the user's requested change to the provided Mermaid diagram. Output ONLY the complete modified Mermaid code. Do not explain. Preserve all unchanged classes and relations verbatim. If the diagram is an erDiagram or sequenceDiagram, preserve its header and syntax."
        : input.action === "generate"
          ? "You are ArchVision, an expert UML modeler. Convert the user's description into a Mermaid diagram. Output ONLY valid Mermaid classDiagram code, never explanations. Use typed members and precise cardinality."
          : input.action === "explain"
            ? "You are an expert software architect. Produce a concise Markdown design document for the provided diagram: overview, node inventory table, relationships, design patterns, and data flow."
            : input.action === "analyze"
              ? "You are an architecture critic. In Markdown, evaluate the diagram for coupling, cohesion, god classes, missing abstraction layers, naming, cycles and data issues. Include severity ratings and concrete refactorings."
              : "You are ArchVision's design copilot inside a UML editor. Answer briefly (max 4 sentences) and reference the current diagram.";

    const messages = [
      ...(input.history ?? []).map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
      {
        role: "user" as const,
        content:
          input.action === "generate"
            ? input.message
            : `Current diagram:\n\`\`\`mermaid\n${input.mermaid ?? "(empty)"}\n\`\`\`\n\n${input.message}`,
      },
    ];

    const result = streamText({
      model: await getModel(),
      system,
      messages,
      temperature: input.action === "transform" ? 0.1 : 0.4,
    });

    const reader = result.textStream.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) writer.write("delta", value);
    }
    writer.write("done", "ok");
  });
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

async function streamOffline(input: ValidRequest): Promise<Response> {
  return streamSse(async (writer) => {
    writer.write(
      "meta",
      JSON.stringify({ fallback: true, message: "Offline mode — local extraction engine active" })
    );
    let content: string;
    const mermaid = input.mermaid ?? "";

    switch (input.action) {
      case "generate": {
        content = generateMock(input.message);
        break;
      }
      case "transform": {
        const transformed = transformMock(input.message, mermaid, input.selectedNode ?? null);
        if (!transformed) {
          writer.write("error", 'Could not interpret that change in offline mode. Try: "Make User inherit from Account", "Add class Payment", "Rename Order to Purchase", "Add method retry to Payment", "Convert to sequence diagram".');
          return;
        }
        content = transformed;
        break;
      }
      case "explain": {
        content = explainMock(mermaid);
        break;
      }
      case "analyze": {
        content = analyzeMock(mermaid);
        break;
      }
      case "why": {
        content = whyMock(mermaid, input.selectedNode ?? null);
        break;
      }
      case "chat":
      default: {
        if (!mermaid) {
          content = "I'm here to help you design. Try one of the suggested actions below, or paste a requirements description to generate a diagram.";
        } else {
          const { architecture, error } = parseArchitectureDiagram(mermaid);
          if (error) {
            content = `I hit a parsing error in the current diagram: ${error}. Fix the Mermaid syntax and try again.`;
          } else {
            content = `I can see **${architecture.nodes.length} nodes** and **${architecture.relationships.length} relationships** in *${architecture.title || "your diagram"}*. What would you like to change? Try one of the quick actions below.`;
          }
        }
      }
    }

    const chunks = content.match(/[\s\S]{1,36}/g) ?? [content];
    await simulate(chunks, writer);
    writer.write("done", "ok");
  });
}