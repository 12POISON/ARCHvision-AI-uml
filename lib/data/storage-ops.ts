import type { DiagramDraft, ValidationResult } from "@/types/diagram";
import type { DiagramVersion } from "@/lib/architecture/versions";

/**
 * Storage op dispatch — pure, dependency-injected, unit-testable.
 * The route (app/api/storage/route.ts) wires this to the real repository
 * and always passes the authenticated `session.user.id` as `userId`.
 * Ownership enforcement lives in the repository queries, not here.
 */

export interface StorageRepo {
  listProjects(userId: string): Promise<unknown>;
  listDiagrams(projectId: string | null, userId: string): Promise<unknown>;
  getDiagram(id: string, userId: string): Promise<unknown>;
  createProject(input: { name: string; description?: string }, userId: string): Promise<unknown>;
  createDiagram(draft: DiagramDraft, projectId: string, mermaidCode: string | undefined, userId: string): Promise<unknown>;
  updateDiagram(
    id: string,
    patch: Partial<{ name: string; mermaidCode: string; viewMode: string; isValid: boolean; validationScore: number | null }>,
    userId: string
  ): Promise<unknown>;
  deleteDiagram(id: string, userId: string): Promise<unknown>;
  recordPrompt(entry: { diagramId: string; prompt: string; response: string; actionType: string }, userId: string): Promise<unknown>;
  listPromptHistory(diagramId: string, userId: string): Promise<unknown>;
  saveValidation(diagramId: string, result: ValidationResult, userId: string): Promise<unknown>;
  getValidation(diagramId: string, userId: string): Promise<unknown>;
  listVersions(diagramId: string, userId: string): Promise<unknown>;
  saveVersion(diagramId: string, version: DiagramVersion, userId: string): Promise<unknown>;
  recordsChange(diagramId: string, summary: string, userId: string): Promise<unknown>;
  listChanges(diagramId: string, limit: number | undefined, userId: string): Promise<unknown>;
}

export type StorageOp = keyof StorageRepo;

export type OpArgs = unknown[];

/** Ops deliberately NOT exposed: `reset` was removed — see the audit report. */
export const OP_NAMES: readonly StorageOp[] = [
  "listProjects",
  "listDiagrams",
  "getDiagram",
  "createProject",
  "createDiagram",
  "updateDiagram",
  "deleteDiagram",
  "recordPrompt",
  "listPromptHistory",
  "saveValidation",
  "getValidation",
  "listVersions",
  "saveVersion",
  "recordsChange",
  "listChanges",
];

export function createStorageOps(repo: StorageRepo): Record<StorageOp, (args: OpArgs, userId: string) => Promise<unknown>> {
  return {
    listProjects: (_args, userId) => repo.listProjects(userId),
    listDiagrams: ([projectId], userId) => repo.listDiagrams((projectId as string | null) ?? null, userId),
    getDiagram: ([id], userId) => repo.getDiagram(id as string, userId),
    createProject: ([input], userId) => repo.createProject(input as { name: string; description?: string }, userId),
    createDiagram: ([draft, projectId, mermaidCode], userId) =>
      repo.createDiagram(draft as DiagramDraft, projectId as string, mermaidCode as string | undefined, userId),
    updateDiagram: ([id, patch], userId) =>
      repo.updateDiagram(
        id as string,
        patch as Parameters<StorageRepo["updateDiagram"]>[1],
        userId
      ),
    deleteDiagram: ([id], userId) => repo.deleteDiagram(id as string, userId),
    recordPrompt: ([entry], userId) =>
      repo.recordPrompt(entry as Parameters<StorageRepo["recordPrompt"]>[0], userId),
    listPromptHistory: ([diagramId], userId) => repo.listPromptHistory(diagramId as string, userId),
    saveValidation: ([diagramId, result], userId) =>
      repo.saveValidation(diagramId as string, result as ValidationResult, userId),
    getValidation: ([diagramId], userId) => repo.getValidation(diagramId as string, userId),
    listVersions: ([diagramId], userId) => repo.listVersions(diagramId as string, userId),
    saveVersion: ([diagramId, version], userId) =>
      repo.saveVersion(diagramId as string, version as DiagramVersion, userId),
    recordsChange: ([diagramId, summary], userId) => repo.recordsChange(diagramId as string, summary as string, userId),
    listChanges: ([diagramId, limit], userId) =>
      repo.listChanges(diagramId as string, limit as number | undefined, userId),
  };
}

export function parseArgs(op: StorageOp, payload: unknown): OpArgs {
  if (Array.isArray(payload)) return payload;
  if (op === "listDiagrams") return [payload ?? null];
  return payload === undefined || payload === null ? [] : [payload];
}

export function isStorageOp(op: string): op is StorageOp {
  return (OP_NAMES as readonly string[]).includes(op);
}
