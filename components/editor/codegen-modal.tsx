"use client";

import * as React from "react";
import { Download, FileCode2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { CodeGenOptions, CodeLanguage, UMLModel } from "@/types/diagram";
import { generateCode, type GeneratedFile } from "@/lib/code-gen/engine";
import { downloadFile } from "@/lib/utils";

interface CodeGenModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  model: UMLModel;
}

const LANGUAGES: Array<{ id: CodeLanguage; label: string; hint: string }> = [
  { id: "typescript", label: "TypeScript", hint: ".ts modules" },
  { id: "java", label: "Java", hint: "one file per class" },
  { id: "python", label: "Python", hint: "dataclass / pydantic" },
  { id: "csharp", label: "C#", hint: ".NET 8 classes" },
];

export function CodeGenModal({ open, onOpenChange, model }: CodeGenModalProps): React.ReactElement {
  const [language, setLanguage] = React.useState<CodeLanguage>("typescript");
  const [options, setOptions] = React.useState<CodeGenOptions>({
    includeGettersSetters: true,
    useLombok: false,
    usePydantic: false,
    addDecorators: false,
  });
  const [files, setFiles] = React.useState<GeneratedFile[]>([]);
  const [generating, setGenerating] = React.useState(false);
  const [activeFile, setActiveFile] = React.useState(0);

  React.useEffect(() => {
    if (!open) return;
    setGenerating(true);
    const timer = setTimeout(() => {
      setFiles(generateCode(model, language, options));
      setActiveFile(0);
      setGenerating(false);
    }, 420);
    return () => clearTimeout(timer);
  }, [open, model, language, options]);

  const downloadAll = (): void => {
    if (files.length === 0) return;
    const bundle = files.map((f) => `// ===== ${f.path} =====\n${f.content}`).join("\n\n");
    downloadFile(bundle, "archvision-generated.zip.txt", "text/plain");
  };

  const downloadSingle = (file: GeneratedFile): void => {
    downloadFile(file.content, file.path, "text/plain");
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-3xl">
        <ModalHeader>
          <ModalTitle className="flex items-center gap-2">
            <FileCode2 className="h-5 w-5 text-primary" />
            Generate source code
          </ModalTitle>
          <ModalDescription>
            Forward-engineer {model.classes.length} classes into {language === "typescript" ? "TypeScript" : language === "java" ? "Java" : language === "python" ? "Python" : "C#"}.
          </ModalDescription>
        </ModalHeader>

        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.id}
                type="button"
                onClick={() => setLanguage(lang.id)}
                className={cn(
                  "rounded-pill border px-4 py-2 text-[12.5px] font-semibold transition-all duration-200",
                  language === lang.id
                    ? "border-primary bg-primary text-white shadow-btn-primary"
                    : "border-line bg-white text-muted hover:border-slate-300 hover:text-foreground"
                )}
                aria-pressed={language === lang.id}
              >
                {lang.label}
                <span className={cn("ml-1.5 text-[10.5px] font-normal", language === lang.id ? "text-blue-200" : "text-slate-400")}>
                  {lang.hint}
                </span>
              </button>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-line bg-surface px-4 py-3">
              <div>
                <p className="text-[13px] font-bold text-foreground">Getters & setters</p>
                <p className="text-[11.5px] text-muted-foreground">Accessors for all attributes</p>
              </div>
              <Switch
                checked={options.includeGettersSetters}
                onCheckedChange={(checked) => setOptions((o) => ({ ...o, includeGettersSetters: checked }))}
                aria-label="Include getters and setters"
              />
            </label>
            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-line bg-surface px-4 py-3">
              <div>
                <p className="text-[13px] font-bold text-foreground">
                  {language === "java" ? "Lombok annotations" : language === "python" ? "Pydantic models" : "Decorators"}
                </p>
                <p className="text-[11.5px] text-muted-foreground">
                  {language === "java" ? "@Data boilerplate reduction" : language === "python" ? "BaseModel + typing" : "Class decorators"}
                </p>
              </div>
              <Switch
                checked={language === "java" ? options.useLombok : language === "python" ? options.usePydantic : options.addDecorators}
                onCheckedChange={(checked) =>
                  setOptions((o) => ({
                    ...o,
                    useLombok: language === "java" ? checked : o.useLombok,
                    usePydantic: language === "python" ? checked : o.usePydantic,
                    addDecorators: language === "typescript" ? checked : o.addDecorators,
                  }))
                }
                aria-label="Enable framework-specific codegen"
              />
            </label>
          </div>

          <div className="overflow-hidden rounded-2xl border border-line bg-slate-950">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2">
              <div className="flex items-center gap-1 overflow-x-auto">
                {files.map((file, index) => (
                  <button
                    key={file.path}
                    type="button"
                    onClick={() => setActiveFile(index)}
                    className={cn(
                      "whitespace-nowrap rounded-lg px-3 py-1.5 font-mono text-[11px] transition-colors",
                      index === activeFile ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200"
                    )}
                  >
                    {file.path}
                  </button>
                ))}
              </div>
              {activeFile < files.length ? (
                <button
                  type="button"
                  onClick={() => downloadSingle(files[activeFile])}
                  className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold text-blue-300 transition-colors hover:bg-slate-800"
                >
                  <Download className="h-3 w-3" /> File
                </button>
              ) : null}
            </div>
            <div className="max-h-[280px] overflow-auto">
              {generating ? (
                <div className="flex h-40 items-center justify-center gap-3 text-slate-400">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-[12.5px]">Generating {language}…</span>
                </div>
              ) : files[activeFile] ? (
                <pre className="p-4 font-mono text-[12px] leading-[1.8] text-slate-200">
                  {files[activeFile].content}
                </pre>
              ) : null}
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <p className="text-[11.5px] text-muted-foreground">
              {files.length} {files.length === 1 ? "file" : "files"} generated · custom templates via Handlebars
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={downloadAll}>
                <Download className="h-4 w-4" />
                Download all
              </Button>
              <Button onClick={() => onOpenChange(false)}>Done</Button>
            </div>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}