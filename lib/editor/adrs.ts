"use client";

import { create } from "zustand";
import type { AdrRecord, AdrStatus } from "@/lib/architecture/adr";

/**
 * ADR store — per-diagram decision records persisted to localStorage
 * (same zero-infra contract as comments). Records are client-side until a
 * server-backed workspace lands; export produces portable markdown.
 */

const STORAGE_KEY = "archvision:adrs";

export interface NewAdrInput {
  title: string;
  status: AdrStatus;
  context: string;
  decision: string;
  consequences: string;
  linkedNodes?: string[];
}

interface AdrsState {
  adrs: Record<string, AdrRecord[]>;
  add: (diagramId: string, input: NewAdrInput) => AdrRecord;
  update: (diagramId: string, id: string, patch: Partial<Omit<AdrRecord, "id" | "number">>) => void;
  remove: (diagramId: string, id: string) => void;
  toggleNodeLink: (diagramId: string, id: string, nodeName: string) => void;
}

function load(): Record<string, AdrRecord[]> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, AdrRecord[]>;
    // Backfill every diagram bucket — old blobs must not crash the writers.
    const safe: Record<string, AdrRecord[]> = {};
    for (const [key, value] of Object.entries(parsed)) {
      safe[key] = Array.isArray(value) ? value : [];
    }
    return safe;
  } catch {
    return {};
  }
}

function save(adrs: Record<string, AdrRecord[]>): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(adrs));
  } catch {
    // storage unavailable — records stay in memory only
  }
}

function nextNumber(records: AdrRecord[]): number {
  return records.reduce((max, adr) => Math.max(max, adr.number), 0) + 1;
}

export const useAdrsStore = create<AdrsState>((set, get) => ({
  adrs: load(),

  add: (diagramId, input) => {
    const records = get().adrs[diagramId] ?? [];
    const record: AdrRecord = {
      id: `adr_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      number: nextNumber(records),
      title: input.title.trim() || "Untitled decision",
      status: input.status,
      context: input.context,
      decision: input.decision,
      consequences: input.consequences,
      date: new Date().toISOString(),
      linkedNodes: [...(input.linkedNodes ?? [])],
    };
    const next = { ...get().adrs, [diagramId]: [record, ...records] };
    save(next);
    set({ adrs: next });
    return record;
  },

  update: (diagramId, id, patch) => {
    const records = get().adrs[diagramId] ?? [];
    const next = {
      ...get().adrs,
      [diagramId]: records.map((adr) => (adr.id === id ? { ...adr, ...patch } : adr)),
    };
    save(next);
    set({ adrs: next });
  },

  remove: (diagramId, id) => {
    const records = get().adrs[diagramId] ?? [];
    const next = { ...get().adrs, [diagramId]: records.filter((adr) => adr.id !== id) };
    save(next);
    set({ adrs: next });
  },

  toggleNodeLink: (diagramId, id, nodeName) => {
    const records = get().adrs[diagramId] ?? [];
    const next = {
      ...get().adrs,
      [diagramId]: records.map((adr) =>
        adr.id === id
          ? {
              ...adr,
              linkedNodes: adr.linkedNodes.includes(nodeName)
                ? adr.linkedNodes.filter((n) => n !== nodeName)
                : [...adr.linkedNodes, nodeName],
            }
          : adr
      ),
    };
    save(next);
    set({ adrs: next });
  },
}));

/** All ADRs of one diagram, display order. */
export function adrsForDiagram(adrs: Record<string, AdrRecord[]>, diagramId: string): AdrRecord[] {
  return [...(adrs[diagramId] ?? [])].sort((a, b) => b.number - a.number);
}

/** ADRs bound to a specific node name. */
export function adrsForNode(adrs: Record<string, AdrRecord[]>, diagramId: string, nodeName: string): AdrRecord[] {
  return adrsForDiagram(adrs, diagramId).filter((adr) => adr.linkedNodes.includes(nodeName));
}