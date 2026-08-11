"use client";

import * as React from "react";
import { Loader2, Mic, RefreshCw, Sparkles, Wand2 } from "lucide-react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
} from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/toast";
import { extractModelFromText } from "@/lib/ai/mock-engine";
import { modelToMermaid } from "@/lib/mermaid/parser";
import { MermaidRenderer } from "@/components/editor/mermaid-renderer";
import { cn } from "@/lib/utils";

interface AIGenerateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (code: string) => void;
}

const SUGGESTIONS = [
  "A system where User registers, logs in, and has an Order. Order has many OrderItems. PaymentService processes payments.",
  "A library system: Member searches for Book, borrows copies, Librarian manages inventory and handles fines.",
];

export function AIGenerateModal({ open, onOpenChange, onApply }: AIGenerateModalProps): React.ReactElement {
  const [prompt, setPrompt] = React.useState("");
  const [tab, setTab] = React.useState<"describe" | "code">("describe");
  const [code, setCode] = React.useState("");
  const [generating, setGenerating] = React.useState(false);
  const [variant, setVariant] = React.useState(0);
  const generationId = React.useRef(0);

  const generate = React.useCallback(
    (text: string, v: number) => {
      setGenerating(true);
      const myId = ++generationId.current;
      const model = extractModelFromText(text);
      let mermaid = modelToMermaid(model);
      if (v > 0 && /^classDiagram/i.test(mermaid)) {
        // Variant: alternate direction for a different-but-valid layout.
        mermaid = `classDiagram\n    direction ${v % 2 === 0 ? "RL" : "TB"}\n${mermaid
          .split("\n")
          .slice(1)
          .join("\n")}`;
      }
      window.setTimeout(() => {
        if (generationId.current !== myId) return;
        setCode(mermaid);
        setGenerating(false);
      }, 650);
    },
    []
  );

  const submit = React.useCallback(
    (text: string, v: number) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      setTab("code");
      generate(trimmed, v);
    },
    [generate]
  );

  const apply = React.useCallback(() => {
    if (!code.trim()) return;
    onApply(code);
    onOpenChange(false);
    toast("success", "Diagram generated and applied");
  }, [code, onApply, onOpenChange]);

  const onMic = React.useCallback(() => {
    toast("info", "Voice input is not available yet");
  }, []);

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-2xl">
        <ModalHeader>
          <ModalTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Generate diagram
          </ModalTitle>
          <ModalDescription>
            Describe your system in plain language — we turn it into an editable class diagram.
          </ModalDescription>
        </ModalHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as "describe" | "code")}>
          <TabsList>
            <TabsTrigger value="describe">Describe</TabsTrigger>
            <TabsTrigger value="code">Mermaid code</TabsTrigger>
          </TabsList>
          <TabsContent value="describe" className="mt-3">
            <div className="relative">
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. A system where Users have Orders, and each Order contains many OrderItems…"
                rows={6}
                className="pr-12"
              />
              <button
                type="button"
                onClick={onMic}
                className="absolute right-3 top-3 rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-primary"
                aria-label="Use voice input"
              >
                <Mic className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setPrompt(s);
                    submit(s, 0);
                  }}
                  className="rounded-pill border border-line bg-surface px-3 py-1 text-left text-[11.5px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  {s.slice(0, 60)}…
                </button>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between">
              <p className="text-[11.5px] text-muted-foreground">
                Tip: mention classes, attributes and how they relate for best results.
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={onMic} aria-label="Voice input">
                  <Mic className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" onClick={() => submit(prompt, variant)} disabled={!prompt.trim() || generating}>
                  {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
                  Generate
                </Button>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="code" className="mt-3">
            {generating ? (
              <div className="flex h-64 items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                Generating diagram…
              </div>
            ) : code ? (
              <div>
                <div className="flex items-center justify-between">
                  <p className="font-mono text-[11px] text-muted-foreground">Generated preview</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const next = variant + 1;
                      setVariant(next);
                      submit(prompt, next);
                    }}
                    disabled={generating}
                    className="gap-1.5 text-[11.5px]"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Regenerate
                  </Button>
                </div>
                <div className="mt-2 h-64 overflow-auto rounded-xl border border-line bg-white p-3">
                  <MermaidRenderer code={code} fit />
                </div>
                <div className={cn("mt-3 max-h-28 overflow-auto rounded-lg bg-slate-950 p-3 font-mono text-[11px] leading-relaxed text-slate-300")}>
                  {code}
                </div>
                <div className="mt-4 flex items-center justify-end gap-2">
                  <Button variant="outline" onClick={() => setTab("describe")}>
                    Edit prompt
                  </Button>
                  <Button onClick={apply} className="gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    Apply to canvas
                  </Button>
                </div>
              </div>
            ) : (
              <p className="py-16 text-center text-sm text-muted-foreground">
                Nothing generated yet — describe your system first.
              </p>
            )}
          </TabsContent>
        </Tabs>
      </ModalContent>
    </Modal>
  );
}
