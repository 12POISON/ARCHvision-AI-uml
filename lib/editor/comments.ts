"use client";

import { create } from "zustand";

export interface DiagramComment {
  id: string;
  diagramId: string;
  author: string;
  text: string;
  x: number;
  y: number;
  createdAt: number;
}

interface CommentsState {
  comments: Record<string, DiagramComment[]>;
  open: boolean;
  focusedId: string | null;
}

interface CommentsActions {
  addComment: (diagramId: string, comment: Omit<DiagramComment, "id" | "createdAt" | "diagramId">) => string;
  updateText: (diagramId: string, id: string, text: string) => void;
  removeComment: (diagramId: string, id: string) => void;
  setOpen: (open: boolean) => void;
  focusComment: (id: string | null) => void;
}

const STORAGE_KEY = "archvision:comments";
const CURRENT_USER = "you";

/** Stable empty array — safe to return from zustand selectors (referential stability). */
export const EMPTY_COMMENTS: DiagramComment[] = [];

function load(): Record<string, DiagramComment[]> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, DiagramComment[]>;
  } catch {
    return {};
  }
}

function save(comments: Record<string, DiagramComment[]>): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(comments));
  } catch {
    // storage unavailable — comments stay in memory only
  }
}

export const useCommentsStore = create<CommentsState & CommentsActions>((set, get) => ({
  comments: load(),
  open: false,
  focusedId: null,

  addComment: (diagramId, comment) => {
    const id = `c_${crypto.randomUUID().replace(/-/g, "")}`;
    const entry: DiagramComment = { ...comment, diagramId, id, createdAt: Date.now() };
    const next = {
      ...get().comments,
      [diagramId]: [...(get().comments[diagramId] ?? []), entry],
    };
    save(next);
    set({ comments: next, open: true, focusedId: id });
    return id;
  },

  updateText: (diagramId, id, text) => {
    const next = {
      ...get().comments,
      [diagramId]: (get().comments[diagramId] ?? []).map((c) => (c.id === id ? { ...c, text } : c)),
    };
    save(next);
    set({ comments: next });
  },

  removeComment: (diagramId, id) => {
    const next = {
      ...get().comments,
      [diagramId]: (get().comments[diagramId] ?? []).filter((c) => c.id !== id),
    };
    save(next);
    set({ comments: next, focusedId: get().focusedId === id ? null : get().focusedId });
  },

  setOpen: (open) => set({ open }),
  focusComment: (id) => set({ focusedId: id, open: id !== null }),
}));

export function useComments(diagramId: string): DiagramComment[] {
  return useCommentsStore((s) => s.comments[diagramId] ?? EMPTY_COMMENTS);
}

export function currentUser(): string {
  return CURRENT_USER;
}
