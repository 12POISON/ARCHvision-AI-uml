"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageSquare, MessageSquarePlus, Trash2, X } from "lucide-react";
import { currentUser, EMPTY_COMMENTS, useCommentsStore, type DiagramComment } from "@/lib/editor/comments";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CommentPanelProps {
  diagramId: string;
  open: boolean;
  onClose: () => void;
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

export function CommentPanel({ diagramId, open, onClose }: CommentPanelProps): React.ReactElement {
  const comments = useCommentsStore((s) => s.comments[diagramId] ?? EMPTY_COMMENTS);
  const focusedId = useCommentsStore((s) => s.focusedId);
  const [draft, setDraft] = React.useState("");
  const { addComment, updateText, removeComment, focusComment } = useCommentsStore();

  const submit = (): void => {
    const text = draft.trim();
    if (!text) return;
    addComment(diagramId, { author: currentUser(), text, x: 0, y: 0 });
    setDraft("");
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.aside
          initial={{ x: 320 }}
          animate={{ x: 0 }}
          exit={{ x: 320 }}
          transition={{ type: "tween", duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          className="flex w-80 shrink-0 flex-col border-l border-line bg-white"
        >
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="flex items-center gap-2 text-[13px] font-bold text-foreground">
              <MessageSquare className="h-4 w-4 text-primary" />
              Comments
              <span className="rounded-pill bg-primary/10 px-2 py-0.5 text-[10.5px] font-semibold text-primary">
                {comments.length}
              </span>
            </p>
            <button type="button" onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:bg-surface hover:text-foreground" aria-label="Close comments">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-auto p-4">
            {comments.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                <MessageSquarePlus className="h-8 w-8 text-slate-300" />
                <p className="text-[12.5px] font-semibold text-foreground">No comments yet</p>
                <p className="max-w-[220px] text-[11.5px] leading-relaxed text-muted-foreground">
                  Right-click anywhere on the canvas to drop a comment, or add one below.
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {comments.map((c) => (
                  <CommentRow
                    key={c.id}
                    comment={c}
                    focused={c.id === focusedId}
                    onFocus={() => focusComment(c.id)}
                    onBlur={() => focusComment(null)}
                    onChange={(text) => updateText(diagramId, c.id, text)}
                    onRemove={() => removeComment(diagramId, c.id)}
                  />
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-line p-3">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder="Add a comment… (Enter to send)"
              rows={2}
              className="w-full resize-none rounded-xl border border-line bg-surface/50 p-2.5 text-[12.5px] text-foreground outline-none transition-colors focus:border-primary/50 focus:bg-white"
            />
            <Button size="sm" className="mt-2 w-full" onClick={submit} disabled={!draft.trim()}>
              Comment
            </Button>
          </div>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}

function CommentRow({
  comment,
  focused,
  onFocus,
  onBlur,
  onChange,
  onRemove,
}: {
  comment: DiagramComment;
  focused: boolean;
  onFocus: () => void;
  onBlur: () => void;
  onChange: (text: string) => void;
  onRemove: () => void;
}): React.ReactElement {
  return (
    <li
      className={cn(
        "rounded-xl border p-3 transition-colors",
        focused ? "border-primary/50 bg-primary/5" : "border-line bg-white"
      )}
    >
      <div className="flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[9.5px] font-bold text-white">
          {comment.author.slice(0, 2).toUpperCase()}
        </span>
        <span className="text-[11.5px] font-bold text-foreground">{comment.author}</span>
        <span className="text-[10.5px] text-muted-foreground">{timeAgo(comment.createdAt)}</span>
        <button
          type="button"
          onClick={onRemove}
          className="ml-auto rounded p-1 text-slate-300 transition-colors hover:text-red-500"
          aria-label="Delete comment"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <textarea
        value={comment.text}
        onFocus={onFocus}
        onBlur={onBlur}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        className="mt-2 w-full resize-none rounded-lg bg-transparent text-[12.5px] leading-relaxed text-foreground outline-none"
      />
    </li>
  );
}
