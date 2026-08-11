"use client";

import { useEffect } from "react";
import { useEditorUI } from "@/hooks/useDiagram";
import type { DiagramEngine } from "@/hooks/useDiagram";
import { toast } from "@/components/ui/toast";

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const el = target;
  if (el.isContentEditable) return true;
  if (el.closest(".monaco-editor")) return true;
  const tag = el.tagName.toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select";
}

export function useEditorShortcuts(engine: DiagramEngine): void {
  const ui = useEditorUI();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (isEditableTarget(event.target)) return;
      const mod = event.ctrlKey || event.metaKey;
      const key = event.key.toLowerCase();

      if (mod && key === "z") {
        event.preventDefault();
        if (event.shiftKey) engine.redo();
        else engine.undo();
        return;
      }
      if (mod && key === "y") {
        event.preventDefault();
        engine.redo();
        return;
      }
      if (mod && key === "s") {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent("archvision:force-save"));
        return;
      }
      if (mod && key === "e") {
        event.preventDefault();
        ui.setCodePanelOpen(!ui.codePanelOpen);
        return;
      }
      if (mod && key === "j") {
        event.preventDefault();
        ui.setSidePanel(ui.sidePanel === "ai" ? null : "ai");
        return;
      }
      if (mod && key === "b") {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent("archvision:toggle-palette"));
        return;
      }
      if (mod && key === "a") {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent("archvision:select-all"));
        return;
      }
      if (mod && key === "d") {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent("archvision:duplicate-selected"));
        return;
      }
      if (mod && key === "c") {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent("archvision:copy-selected"));
        return;
      }
      if (mod && key === "v") {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent("archvision:paste"));
        return;
      }
      if (mod && key === "x") {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent("archvision:cut-selected"));
        return;
      }
      if (mod && key === "0") {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent("archvision:zoom-reset"));
        return;
      }
      if (mod && (key === "=" || key === "+")) {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent("archvision:zoom-in"));
        return;
      }
      if (mod && key === "-") {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent("archvision:zoom-out"));
        return;
      }
      if (mod && key === "f") {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent("archvision:fit-view"));
        return;
      }
      if (key === "?" && mod) {
        event.preventDefault();
        ui.setCheatSheetOpen(!ui.cheatSheetOpen);
        return;
      }
      if (key === "escape") {
        if (ui.cheatSheetOpen) ui.setCheatSheetOpen(false);
        if (ui.shareOpen) ui.setShareOpen(false);
        if (ui.aiGenerateOpen) ui.setAiGenerateOpen(false);
        if (ui.importOpen) ui.setImportOpen(false);
        return;
      }
      if (event.key === "?" && !mod) {
        // Chrome's quick-find; leave default.
        return;
      }
      if (["arrowup", "arrowdown", "arrowleft", "arrowright"].includes(event.key.toLowerCase())) {
        event.preventDefault();
        const step = event.shiftKey ? 30 : 10;
        const dx =
          key === "arrowleft" ? -step : key === "arrowright" ? step : 0;
        const dy =
          key === "arrowup" ? -step : key === "arrowdown" ? step : 0;
        window.dispatchEvent(
          new CustomEvent("archvision:nudge", {
            detail: { dx, dy },
          })
        );
      }
    };

    const onForceSave = (): void => {
      void storageFlush(engine);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("archvision:force-save", onForceSave);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("archvision:force-save", onForceSave);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine, ui]);
}

async function storageFlush(engine: DiagramEngine): Promise<void> {
  const { storage } = await import("@/lib/data/storage");
  try {
    await storage.updateDiagram(engine.diagramId, {
      mermaidCode: engine.mermaidCode,
      viewMode: engine.viewMode,
    });
    toast("success", "Saved");
  } catch {
    toast("error", "Save failed");
  }
}
