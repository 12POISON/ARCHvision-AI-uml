"use client";

import * as React from "react";
import { Check, Copy, Link2, Mail, Share2, Users } from "lucide-react";
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  diagramId: string;
  diagramName: string;
}

interface Collaborator {
  name: string;
  color: string;
  online: boolean;
}

const MOCK_COLLABORATORS: Collaborator[] = [
  { name: "Priya", color: "#6366F1", online: true },
  { name: "Dev", color: "#F59E0B", online: true },
  { name: "Sam", color: "#10B981", online: false },
];

export function ShareModal({ open, onOpenChange, diagramId, diagramName }: ShareModalProps): React.ReactElement {
  const [copied, setCopied] = React.useState(false);
  const [invite, setInvite] = React.useState("");
  const [invited, setInvited] = React.useState<string[]>([]);

  const shareUrl = React.useMemo(() => {
    if (typeof window === "undefined") return "";
    const base = window.location.origin + window.location.pathname;
    return `${base}?share=${diagramId}`;
  }, [diagramId]);

  const copyLink = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
      toast("success", "Share link copied");
    } catch {
      toast("error", "Could not copy link");
    }
  }, [shareUrl]);

  const sendInvite = React.useCallback(() => {
    const email = invite.trim();
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      toast("error", "Enter a valid email address");
      return;
    }
    setInvited((list) => [...list, email]);
    setInvite("");
    toast("success", `Invitation sent to ${email}`);
  }, [invite]);

  const all = [...MOCK_COLLABORATORS, ...invited.map((e) => ({ name: e, color: "#64748B", online: false }))];

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent>
        <ModalHeader>
          <ModalTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            Share “{diagramName}”
          </ModalTitle>
          <ModalDescription>Anyone with the link can view and edit this diagram.</ModalDescription>
        </ModalHeader>

        <div className="flex items-center gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2">
            <Link2 className="h-4 w-4 shrink-0 text-slate-400" />
            <span className="truncate font-mono text-[11.5px] text-muted-foreground">{shareUrl}</span>
          </div>
          <Button onClick={copyLink} className="gap-1.5" variant={copied ? "outline" : "primary"}>
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>

        <div className="mt-5">
          <p className="flex items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            Collaborators
          </p>
          <ul className="mt-2 space-y-1.5">
            {all.map((c) => (
              <li key={c.name} className="flex items-center gap-2.5 rounded-lg px-1.5 py-1">
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-full text-[10.5px] font-bold text-white"
                  style={{ backgroundColor: c.color }}
                >
                  {c.name.slice(0, 2).toUpperCase()}
                </span>
                <span className="text-[12.5px] font-semibold text-foreground">{c.name}</span>
                <span className="ml-auto flex items-center gap-1 text-[11px] text-muted-foreground">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${c.online ? "bg-emerald-500" : "bg-slate-300"}`}
                  />
                  {c.online ? "online" : "offline"}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <input
            value={invite}
            onChange={(e) => setInvite(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") sendInvite();
            }}
            placeholder="email@company.com"
            className="min-w-0 flex-1 rounded-xl border border-line bg-white px-3 py-2 text-[12.5px] text-foreground outline-none transition-colors focus:border-primary/50"
          />
          <Button variant="outline" onClick={sendInvite} className="gap-1.5">
            <Mail className="h-3.5 w-3.5" />
            Invite
          </Button>
        </div>

        <p className="mt-3 text-[11px] text-muted-foreground">
          Real-time collaboration is simulated in this preview build.
        </p>
      </ModalContent>
    </Modal>
  );
}
