import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { EditorShell, type AiMode } from "@/components/editor/editor-shell";

export const metadata: Metadata = {
  title: "Diagram editor",
};

/** Mirrors hasApiKey/getModel in app/api/ai/chat/route.ts — request-time, not build-time. */
function resolveAiMode(): AiMode {
  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  return "offline";
}

export default async function EditorPage({ params }: { params: { diagramId: string } }): Promise<React.ReactElement> {
  await auth();

  return <EditorShell diagramId={params.diagramId} aiMode={resolveAiMode()} />;
}
