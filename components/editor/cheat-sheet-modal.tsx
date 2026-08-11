"use client";

import * as React from "react";
import { Keyboard } from "lucide-react";
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription } from "@/components/ui/modal";

interface CheatSheetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Shortcut {
  keys: string[];
  action: string;
  group: string;
}

const SHORTCUTS: Shortcut[] = [
  { keys: ["Ctrl", "Z"], action: "Undo", group: "Editing" },
  { keys: ["Ctrl", "Shift", "Z"], action: "Redo", group: "Editing" },
  { keys: ["Ctrl", "D"], action: "Duplicate selected", group: "Editing" },
  { keys: ["Ctrl", "A"], action: "Select all", group: "Editing" },
  { keys: ["Del", "Backspace"], action: "Delete selected", group: "Editing" },
  { keys: ["Ctrl", "C"], action: "Copy selected", group: "Editing" },
  { keys: ["Ctrl", "V"], action: "Paste", group: "Editing" },
  { keys: ["Ctrl", "X"], action: "Cut selected", group: "Editing" },
  { keys: ["↑ ↓ ← →"], action: "Nudge selection", group: "Editing" },
  { keys: ["Shift", "↑ ↓ ← →"], action: "Nudge selection (fast)", group: "Editing" },
  { keys: ["Ctrl", "S"], action: "Save now", group: "Diagram" },
  { keys: ["Ctrl", "0"], action: "Reset zoom", group: "View" },
  { keys: ["Ctrl", "+"], action: "Zoom in", group: "View" },
  { keys: ["Ctrl", "-"], action: "Zoom out", group: "View" },
  { keys: ["Ctrl", "F"], action: "Fit diagram to screen", group: "View" },
  { keys: ["Ctrl", "E"], action: "Toggle code panel", group: "View" },
  { keys: ["Ctrl", "J"], action: "Toggle AI assistant", group: "View" },
  { keys: ["Ctrl", "B"], action: "Toggle shape palette", group: "View" },
  { keys: ["Ctrl", "?"], action: "Show this cheat sheet", group: "View" },
  { keys: ["Esc"], action: "Close dialog / clear selection", group: "View" },
];

const GROUPS = ["Editing", "Diagram", "View"];

export function CheatSheetModal({ open, onOpenChange }: CheatSheetModalProps): React.ReactElement {
  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent>
        <ModalHeader>
          <ModalTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-primary" />
            Keyboard shortcuts
          </ModalTitle>
          <ModalDescription>Master the canvas with these keybindings.</ModalDescription>
        </ModalHeader>

        <div className="max-h-[60vh] space-y-5 overflow-auto pr-1">
          {GROUPS.map((group) => (
            <div key={group}>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{group}</p>
              <ul className="mt-2 space-y-1">
                {SHORTCUTS.filter((s) => s.group === group).map((s) => (
                  <li key={s.action} className="flex items-center justify-between py-1">
                    <span className="text-[12.5px] text-foreground">{s.action}</span>
                    <span className="flex items-center gap-1">
                      {s.keys.map((k) => (
                        <kbd
                          key={k}
                          className="rounded-md border border-line bg-surface px-1.5 py-0.5 font-mono text-[10.5px] font-semibold text-slate-600 shadow-sm"
                        >
                          {k}
                        </kbd>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </ModalContent>
    </Modal>
  );
}
