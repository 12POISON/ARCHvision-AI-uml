"use client";

import * as React from "react";
import { Lock, Share2, Users } from "lucide-react";
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription } from "@/components/ui/modal";

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  diagramName: string;
}

export function ShareModal({ open, onOpenChange, diagramName }: ShareModalProps): React.ReactElement {
  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent>
        <ModalHeader>
          <ModalTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            Share “{diagramName}”
          </ModalTitle>
          <ModalDescription>
            Sharing is coming soon. Diagrams are private to your account — no one else can view or
            edit them, and no one has access yet.
          </ModalDescription>
        </ModalHeader>

        <div className="rounded-xl border border-dashed border-slate-300 bg-surface/50 p-6 text-center">
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <Users className="h-5 w-5" />
          </span>
          <p className="mt-3 text-[13px] font-bold text-foreground">No one else has access yet</p>
          <p className="mx-auto mt-1 max-w-xs text-[12.5px] leading-relaxed text-muted-foreground">
            This diagram is private to your account. Real sharing — invite links, permissions and
            team workspaces — is on the roadmap.
          </p>
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-xl border border-line bg-surface/50 px-4 py-3">
          <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
          <p className="text-[12.5px] text-muted-foreground">
            Share links and invite emails aren&apos;t available yet — this preview grants access to no one.
          </p>
        </div>
      </ModalContent>
    </Modal>
  );
}
