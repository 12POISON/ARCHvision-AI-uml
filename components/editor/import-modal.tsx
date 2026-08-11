"use client";

import * as React from "react";
import { FileUp, Loader2 } from "lucide-react";
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { detectImportFormat, importToMermaid, type ImportFormat } from "@/lib/architecture/importers";

interface ImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (code: string) => void;
}

const FORMAT_HINTS: Array<{ id: ImportFormat; label: string; hint: string }> = [
  { id: "json", label: "JSON", hint: "Array of row objects → flowchart" },
  { id: "csv", label: "CSV", hint: "Header + rows → flowchart" },
  { id: "sql", label: "SQL DDL", hint: "CREATE TABLE + FKs → ER diagram" },
  { id: "prisma", label: "Prisma", hint: "schema.prisma models → ER diagram" },
];

export function ImportModal({ open, onOpenChange, onApply }: ImportModalProps): React.ReactElement {
  const [content, setContent] = React.useState("");
  const [filename, setFilename] = React.useState("");
  const [detected, setDetected] = React.useState<ImportFormat | null>(null);
  const [converting, setConverting] = React.useState(false);

  const handleFile = React.useCallback(async (file: File) => {
    setFilename(file.name);
    setDetected(detectImportFormat(file.name));
    const text = await file.text();
    setContent(text);
  }, []);

  const convert = React.useCallback(() => {
    if (!filename || !content.trim()) {
      toast("error", "Pick a file or paste content first");
      return;
    }
    setConverting(true);
    window.setTimeout(() => {
      const result = importToMermaid(filename, content);
      setConverting(false);
      if (!result) {
        toast("error", "Could not parse this file — is it valid?");
        return;
      }
      onApply(result.code);
      toast("success", `Imported ${detected?.toUpperCase() ?? "file"} as a mermaid diagram`);
      onOpenChange(false);
      setContent("");
      setFilename("");
    }, 450);
  }, [filename, content, detected, onApply, onOpenChange]);

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent>
        <ModalHeader>
          <ModalTitle className="flex items-center gap-2">
            <FileUp className="h-5 w-5 text-primary" />
            Import diagram
          </ModalTitle>
          <ModalDescription>
            Bring data in from another format — we convert it to an editable mermaid diagram.
          </ModalDescription>
        </ModalHeader>

        <div className="grid grid-cols-4 gap-2">
          {FORMAT_HINTS.map((f) => (
            <div
              key={f.id}
              className="rounded-xl border border-line bg-surface p-2.5 text-center"
            >
              <p className="font-mono text-[11px] font-bold text-primary">{f.label}</p>
              <p className="mt-1 text-[10px] leading-tight text-muted-foreground">{f.hint}</p>
            </div>
          ))}
        </div>

        <label
          htmlFor="import-file"
          className="mt-4 flex cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-line bg-surface/50 py-8 transition-colors hover:border-primary/50"
        >
          <FileUp className="h-6 w-6 text-slate-400" />
          <p className="text-[12.5px] font-semibold text-foreground">
            {filename || "Click to choose a file"}
          </p>
          <p className="text-[11px] text-muted-foreground">.json · .csv · .sql · .prisma</p>
          <input
            id="import-file"
            type="file"
            accept=".json,.csv,.sql,.prisma"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />
        </label>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="…or paste file content here"
          rows={6}
          className="mt-3 w-full resize-none rounded-xl border border-line bg-white p-3 font-mono text-[12px] leading-relaxed text-foreground outline-none transition-colors focus:border-primary/50"
        />

        <div className="mt-4 flex items-center justify-end gap-2">
          {detected ? (
            <span className="mr-auto rounded-pill bg-primary/5 px-3 py-1 text-[11px] font-semibold text-primary">
              detected: {detected}
            </span>
          ) : null}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={convert} disabled={converting}>
            {converting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Convert &amp; import
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
