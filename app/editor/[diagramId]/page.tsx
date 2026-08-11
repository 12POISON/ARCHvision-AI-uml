import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { EditorShell } from "@/components/editor/editor-shell";

export const metadata: Metadata = {
  title: "Diagram editor",
};

export default async function EditorPage({ params }: { params: { diagramId: string } }): Promise<React.ReactElement> {
  await auth();

  return <EditorShell diagramId={params.diagramId} />;
}