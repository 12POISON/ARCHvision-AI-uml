"use client";

import type {
  Diagram,
  DiagramDraft,
  DiagramType,
  PromptHistoryEntry,
  Project,
  ValidationIssue,
  ValidationResult,
} from "@/types/diagram";
import type { DiagramVersion } from "@/lib/architecture/versions";
import { generateId } from "@/lib/utils";
import { mermaidForType } from "@/types/diagram";
import { toast } from "@/components/ui/toast";

/**
 * Storage facade — async, mode-aware.
 *
 *   NEXT_PUBLIC_DATA_MODE=db   -> PostgreSQL via the REST API (production)
 *   otherwise (default)        -> localStorage (zero-infra demo)
 *
 * Every method returns a Promise so the same client code path works in
 * both modes. Local mode is the default and keeps working without a DB.
 * In db mode, a runtime health check runs at module init: if the database
 * is unreachable, the session transparently falls back to localStorage
 * (see checkDbHealth below).
 *
 * REST endpoints (all JSON, error shape { ok:false, error }):
 *   GET    /api/projects
 *   POST   /api/projects
 *   GET    /api/diagrams?projectId=
 *   GET    /api/projects/:projectId/diagrams
 *   POST   /api/projects/:projectId/diagrams
 *   GET|PATCH|DELETE /api/diagrams/:diagramId
 *   GET|POST /api/diagrams/:diagramId/prompts
 *   GET|POST /api/diagrams/:diagramId/validation
 *   GET|POST /api/diagrams/:diagramId/versions
 *   GET|POST /api/diagrams/:diagramId/changes
 *
 * Create calls send an Idempotency-Key so a retried request (e.g. after
 * the 5s DB timeout) can never duplicate a diagram or version server-side.
 */

const STORAGE_KEY = "archvision-store-v1";
const DB_MODE = process.env.NEXT_PUBLIC_DATA_MODE === "db";

/** Bounds every DB call made through the facade — a slow or hanging
 *  database must never block the UI. Reads additionally fall back to
 *  localStorage (`readWithFallback`), writes surface the error. */
const DB_CALL_TIMEOUT_MS = 5000;

interface PersistedState {
  projects: Project[];
  diagrams: Diagram[];
  promptHistory: PromptHistoryEntry[];
  validationReports: Array<{ diagramId: string; issues: ValidationIssue[]; score: number; createdAt: string }>;
  versions: Record<string, DiagramVersion[]>;
  changeLog: Array<{ diagramId: string; at: string; summary: string }>;
}

const EMPTY: PersistedState = { projects: [], diagrams: [], promptHistory: [], validationReports: [], versions: {}, changeLog: [] };

function load(): PersistedState {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const state = JSON.parse(raw) as PersistedState;
    if (!state.versions) state.versions = {};
    if (!state.changeLog) state.changeLog = [];
    return state;
  } catch {
    return EMPTY;
  }
}

function persist(state: PersistedState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function seed(): PersistedState {
  const now = new Date().toISOString();
  const projectId = "project_demo_auth";
  const demoProject: Project = {
    id: projectId,
    name: "Auth Service",
    description: "User authentication & session management system",
    githubRepo: "acme/auth-service",
    githubBranch: "main",
    lastSyncedAt: null,
    syncing: false,
    diagramCount: 2,
    createdAt: now,
    updatedAt: now,
  };
  const diagrams: Diagram[] = ["CLASS", "SEQUENCE"].map((type, i) => ({
    id: `diagram_demo_${i}`,
    name: type === "CLASS" ? "Authentication Domain" : "Login Flow",
    type: type as DiagramType,
    projectId,
    mermaidCode: mermaidForType(type as DiagramType),
    viewMode: "ENGINEERING",
    isValid: true,
    validationScore: null,
    createdAt: now,
    updatedAt: now,
  }));
  return { projects: [demoProject], diagrams, promptHistory: [], validationReports: [], versions: {}, changeLog: [] };
}

function ensureSeeded(state: PersistedState): PersistedState {
  if (state.projects.length === 0 && state.diagrams.length === 0) {
    const seeded = seed();
    persist(seeded);
    return seeded;
  }
  return state;
}

/* ------------------------- DB mode: REST API ------------------------- */

function baseUrl(): string {
  return typeof window === "undefined" ? (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000") : "";
}

async function api<T>(path: string, init: RequestInit = {}, timeoutMs?: number): Promise<T> {
  const controller = new AbortController();
  const timer = timeoutMs ? setTimeout(() => controller.abort(), timeoutMs) : null;
  try {
    const res = await fetch(`${baseUrl()}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init.headers },
      signal: controller.signal,
    });
    const json = (await res.json().catch(() => null)) as {
      ok?: boolean;
      data?: unknown;
      error?: { code?: string; message?: string };
    } | null;
    if (!res.ok || !json?.ok) {
      throw new Error(json?.error?.message ?? `Request to ${path} failed (${res.status})`);
    }
    return json.data as T;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function idempotencyKey(): string {
  return `${generateId("idem")}`;
}

/* ----------------- DB health check: fall back to localStorage when the DB is unreachable ----------------- */

let dbAvailable = DB_MODE;
let dbHealthCheck: Promise<boolean> | null = null;

async function checkDbHealth(): Promise<boolean> {
  if (!DB_MODE) return false;
  if (dbHealthCheck) return dbHealthCheck;
  dbHealthCheck = (async () => {
    try {
      await api("/api/projects", { method: "GET" }, 3000);
      dbAvailable = true;
    } catch (error) {
      console.warn("[storage] Database unreachable — falling back to localStorage for this session.", error);
      dbAvailable = false;
      if (typeof window !== "undefined") {
        toast("info", "Working offline — diagrams saved locally");
      }
    }
    return dbAvailable;
  })();
  return dbHealthCheck;
}

if (typeof window !== "undefined") {
  void checkDbHealth();
}

/** DB-backed read with a bounded timeout and a localStorage fallback —
 *  the UI always gets data, even when the database is slow or down. */
async function readWithFallback<T>(path: string, local: () => T): Promise<T> {
  if (DB_MODE && (await checkDbHealth())) {
    try {
      return await api<T>(path, { method: "GET" }, DB_CALL_TIMEOUT_MS);
    } catch (error) {
      console.warn(`[storage] DB read "${path}" failed — falling back to local data.`, error);
      return local();
    }
  }
  return local();
}

/* ------------------------- local mode (localStorage) ------------------------- */

function localListProjects(): Project[] {
  return ensureSeeded(load()).projects;
}
function localListDiagrams(projectId: string | null): Diagram[] {
  const state = ensureSeeded(load());
  return projectId ? state.diagrams.filter((d) => d.projectId === projectId) : state.diagrams;
}
function localGetDiagram(id: string): Diagram | null {
  return ensureSeeded(load()).diagrams.find((d) => d.id === id) ?? null;
}
function localCreateProject(input: { name: string; description?: string }): Project {
  const state = ensureSeeded(load());
  const projectId = generateId("project");
  const project: Project = {
    id: projectId,
    name: input.name,
    description: input.description ?? null,
    githubRepo: null,
    githubBranch: "main",
    lastSyncedAt: null,
    syncing: false,
    diagramCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  state.projects.unshift(project);
  persist(state);
  return project;
}
function localCreateDiagram(draft: DiagramDraft, projectId: string, mermaidCode?: string): Diagram {
  const state = ensureSeeded(load());
  const diagramId = generateId("diagram");
  const diagram: Diagram = {
    id: diagramId,
    name: draft.name,
    type: draft.type,
    projectId,
    mermaidCode: mermaidCode ?? mermaidForType(draft.type),
    viewMode: "ENGINEERING",
    isValid: false,
    validationScore: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  state.diagrams.unshift(diagram);
  state.versions[diagramId] ??= [];
  state.versions[diagramId].push({
    version: 1,
    label: "Version 1",
    mermaidCode: diagram.mermaidCode,
    summary: "Initial snapshot",
    changes: ["Initial snapshot"],
    createdAt: new Date().toISOString(),
  });
  const project = state.projects.find((p) => p.id === projectId);
  if (project) {
    project.diagramCount = state.diagrams.filter((d) => d.projectId === projectId).length;
    project.updatedAt = new Date().toISOString();
  }
  persist(state);
  return diagram;
}
function localUpdateDiagram(id: string, patch: Partial<Pick<Diagram, "name" | "mermaidCode" | "viewMode" | "isValid" | "validationScore">>): Diagram | null {
  const state = ensureSeeded(load());
  const diagram = state.diagrams.find((d) => d.id === id);
  if (!diagram) return null;
  Object.assign(diagram, patch, { updatedAt: new Date().toISOString() });
  persist(state);
  return diagram;
}
function localDeleteDiagram(id: string): void {
  const state = ensureSeeded(load());
  state.diagrams = state.diagrams.filter((d) => d.id !== id);
  state.promptHistory = state.promptHistory.filter((p) => p.diagramId !== id);
  state.validationReports = state.validationReports.filter((r) => r.diagramId !== id);
  delete state.versions[id];
  persist(state);
}
function localRecordPrompt(entry: Omit<PromptHistoryEntry, "id" | "createdAt">): void {
  const state = ensureSeeded(load());
  state.promptHistory.unshift({
    ...entry,
    id: generateId("prompt"),
    createdAt: new Date().toISOString(),
  });
  persist(state);
}
function localListPromptHistory(diagramId: string): PromptHistoryEntry[] {
  return ensureSeeded(load())
    .promptHistory.filter((p) => p.diagramId === diagramId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 50);
}
function localSaveValidation(diagramId: string, result: ValidationResult): void {
  const state = ensureSeeded(load());
  state.validationReports.unshift({
    diagramId,
    issues: result.issues,
    score: result.score,
    createdAt: new Date().toISOString(),
  });
  const diagram = state.diagrams.find((d) => d.id === diagramId);
  if (diagram) {
    diagram.isValid = result.issues.every((i) => i.severity !== "critical");
    diagram.validationScore = result.score;
  }
  persist(state);
}
function localGetValidation(diagramId: string): Array<{ issues: ValidationIssue[]; score: number; createdAt: string }> | null {
  const state = ensureSeeded(load());
  const reports = state.validationReports.filter((r) => r.diagramId === diagramId);
  return reports.length > 0 ? reports : null;
}
function localListVersions(diagramId: string): DiagramVersion[] {
  return ensureSeeded(load()).versions[diagramId] ?? [];
}
function localSaveVersion(diagramId: string, version: DiagramVersion): void {
  const state = ensureSeeded(load());
  const list = state.versions[diagramId] ?? [];
  list.push(version);
  state.versions[diagramId] = list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  state.changeLog.push({ diagramId, at: version.createdAt, summary: version.summary });
  persist(state);
}
function localRecordsChange(diagramId: string, summary: string): void {
  const state = ensureSeeded(load());
  state.changeLog.push({ diagramId, at: new Date().toISOString(), summary });
  persist(state);
}
function localListChanges(diagramId: string, limit = 30): Array<{ at: string; summary: string }> {
  return ensureSeeded(load())
    .changeLog.filter((c) => c.diagramId === diagramId)
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, limit);
}

/* -------------------------------- facade -------------------------------- */

export const storage = {
  storageMode: (): "db" | "local" => (DB_MODE && dbAvailable ? "db" : "local"),

  async listProjects(): Promise<Project[]> {
    return readWithFallback("/api/projects", () => localListProjects());
  },
  async listDiagrams(projectId: string | null): Promise<Diagram[]> {
    const path = projectId ? `/api/diagrams?projectId=${encodeURIComponent(projectId)}` : "/api/diagrams";
    return readWithFallback(path, () => localListDiagrams(projectId));
  },
  async getDiagram(id: string): Promise<Diagram | null> {
    return readWithFallback(`/api/diagrams/${encodeURIComponent(id)}`, () => localGetDiagram(id));
  },
  async createProject(input: { name: string; description?: string }): Promise<Project> {
    if (DB_MODE && (await checkDbHealth())) {
      return api<Project>("/api/projects", {
        method: "POST",
        body: JSON.stringify(input),
      });
    }
    return localCreateProject(input);
  },
  async createDiagram(draft: DiagramDraft, projectId: string, mermaidCode?: string): Promise<Diagram> {
    if (DB_MODE && (await checkDbHealth())) {
      return api<Diagram>(`/api/projects/${encodeURIComponent(projectId)}/diagrams`, {
        method: "POST",
        headers: { "Idempotency-Key": idempotencyKey() },
        body: JSON.stringify({
          name: draft.name,
          type: draft.type,
          description: draft.description,
          ...(mermaidCode !== undefined ? { mermaidCode } : {}),
        }),
      });
    }
    return localCreateDiagram(draft, projectId, mermaidCode);
  },
  async updateDiagram(id: string, patch: Partial<Pick<Diagram, "name" | "mermaidCode" | "viewMode" | "isValid" | "validationScore">>): Promise<Diagram | null> {
    if (DB_MODE && (await checkDbHealth())) {
      return api<Diagram | null>(`/api/diagrams/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
    }
    return localUpdateDiagram(id, patch);
  },
  async deleteDiagram(id: string): Promise<void> {
    if (DB_MODE && (await checkDbHealth())) {
      await api<boolean>(`/api/diagrams/${encodeURIComponent(id)}`, { method: "DELETE" });
      return;
    }
    localDeleteDiagram(id);
  },
  async recordPrompt(entry: Omit<PromptHistoryEntry, "id" | "createdAt">): Promise<void> {
    if (DB_MODE && (await checkDbHealth())) {
      await api(`/api/diagrams/${encodeURIComponent(entry.diagramId)}/prompts`, {
        method: "POST",
        body: JSON.stringify({ prompt: entry.prompt, response: entry.response, actionType: entry.actionType }),
      });
      return;
    }
    localRecordPrompt(entry);
  },
  async listPromptHistory(diagramId: string): Promise<PromptHistoryEntry[]> {
    return readWithFallback(`/api/diagrams/${encodeURIComponent(diagramId)}/prompts`, () => localListPromptHistory(diagramId));
  },
  async saveValidation(diagramId: string, result: ValidationResult): Promise<void> {
    if (DB_MODE && (await checkDbHealth())) {
      await api(`/api/diagrams/${encodeURIComponent(diagramId)}/validation`, {
        method: "POST",
        body: JSON.stringify(result),
      });
      return;
    }
    localSaveValidation(diagramId, result);
  },
  async getValidation(diagramId: string): Promise<Array<{ issues: ValidationIssue[]; score: number; createdAt: string }> | null> {
    return readWithFallback(`/api/diagrams/${encodeURIComponent(diagramId)}/validation`, () => localGetValidation(diagramId));
  },
  async listVersions(diagramId: string): Promise<DiagramVersion[]> {
    return readWithFallback(`/api/diagrams/${encodeURIComponent(diagramId)}/versions`, () => localListVersions(diagramId));
  },
  async saveVersion(diagramId: string, version: DiagramVersion): Promise<void> {
    if (DB_MODE && (await checkDbHealth())) {
      await api(`/api/diagrams/${encodeURIComponent(diagramId)}/versions`, {
        method: "POST",
        headers: { "Idempotency-Key": idempotencyKey() },
        body: JSON.stringify({
          label: version.label,
          mermaidCode: version.mermaidCode,
          summary: version.summary,
          changes: version.changes,
        }),
      });
      return;
    }
    localSaveVersion(diagramId, version);
  },
  async recordsChange(diagramId: string, summary: string): Promise<void> {
    if (DB_MODE && (await checkDbHealth())) {
      await api(`/api/diagrams/${encodeURIComponent(diagramId)}/changes`, {
        method: "POST",
        body: JSON.stringify({ summary }),
      });
      return;
    }
    localRecordsChange(diagramId, summary);
  },
  async listChanges(diagramId: string, limit = 30): Promise<Array<{ at: string; summary: string }>> {
    return readWithFallback(`/api/diagrams/${encodeURIComponent(diagramId)}/changes?limit=${limit}`, () => localListChanges(diagramId, limit));
  },
};