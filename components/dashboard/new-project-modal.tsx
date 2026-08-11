"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FolderPlus, Globe, Loader2, Lock, Users } from "lucide-react";
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { storage } from "@/lib/data/storage";
import { toast } from "@/components/ui/toast";

interface NewProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const VISIBILITY_OPTIONS = [
  {
    value: "private",
    label: "Private",
    description: "Only you and invited members can view",
    icon: <Lock className="h-3.5 w-3.5" />,
  },
  {
    value: "team",
    label: "Team",
    description: "Visible to everyone in your workspace",
    icon: <Users className="h-3.5 w-3.5" />,
  },
  {
    value: "public",
    label: "Public",
    description: "Anyone with the link can view",
    icon: <Globe className="h-3.5 w-3.5" />,
  },
] as const;

export function NewProjectModal({ open, onOpenChange }: NewProjectModalProps): React.ReactElement {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [visibility, setVisibility] = React.useState<(typeof VISIBILITY_OPTIONS)[number]["value"]>("private");
  const [creating, setCreating] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setName("");
      setDescription("");
      setVisibility("private");
    }
  }, [open]);

  const createProject = async (): Promise<void> => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      await storage.createProject({ name: name.trim(), description: description.trim() || undefined });
      toast("success", `Project "${name.trim()}" created`);
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      toast("error", err instanceof Error ? `Failed to create project: ${err.message}` : "Failed to create project");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-md">
        <ModalHeader>
          <ModalTitle>Create a project</ModalTitle>
          <ModalDescription>
            Projects (workspaces) group related diagrams, members and shared settings.
          </ModalDescription>
        </ModalHeader>

        <div className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="np-name">Project name</Label>
            <Input
              id="np-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Payments Platform"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="np-desc">Description</Label>
            <Textarea
              id="np-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this workspace about?"
              rows={3}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Visibility</Label>
            <div className="grid grid-cols-3 gap-2">
              {VISIBILITY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setVisibility(option.value)}
                  aria-pressed={visibility === option.value}
                  className={cn(
                    "flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all duration-200",
                    visibility === option.value
                      ? "border-primary/50 bg-primary/5 ring-1 ring-primary/30"
                      : "border-line hover:border-slate-300"
                  )}
                >
                  <span className={cn("flex items-center gap-1.5 text-[12.5px] font-bold", visibility === option.value ? "text-primary" : "text-foreground")}>
                    {option.icon}
                    {option.label}
                  </span>
                  <span className="text-[10.5px] leading-snug text-muted-foreground">{option.description}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={() => void createProject()} disabled={!name.trim() || creating}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderPlus className="h-4 w-4" />}
              Create project
            </Button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}
