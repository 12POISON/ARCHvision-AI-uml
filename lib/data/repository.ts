import "@/lib/db";
import { db } from "@/lib/db";
import type {
  Diagram as ClientDiagram,
  DiagramDraft,
  DiagramType,
  Project,
  PromptHistoryEntry,
  ValidationIssue,
  ValidationResult,
  ViewMode,
} from "@/types/diagram";
import type { DiagramVersion } from "@/lib/architecture/versions";
import { generateId } from "@/lib/utils";

/**
 * Prisma-backed persistence repository (PostgreSQL). Single source of
 * truth for production: projects, diagrams, versions, change log,
 * prompt history and validation reports. The client storage facade
 * proxies here via /api/storage when NEXT_PUBLIC_DATA_MODE=db.
 */

const DEMO_USER_ID = "demo-user";
const DEMO_PROJECT_ID = "project_demo_auth";

function toClientProject(row: {
  id: string;
  name: string;
  description: string | null;
  githubRepo: string | null;
  githubBranch: string;
  lastSyncedAt: Date | null;
  syncing: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count: { diagrams: number };
}): Project {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    githubRepo: row.githubRepo,
    githubBranch: row.githubBranch,
    lastSyncedAt: row.lastSyncedAt ? row.lastSyncedAt.toISOString() : null,
    syncing: row.syncing,
    diagramCount: row._count.diagrams,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toClientDiagram(row: {
  id: string;
  name: string;
  type: DiagramType;
  projectId: string;
  mermaidCode: string;
  viewMode: ViewMode;
  isValid: boolean;
  validationScore: number | null;
  createdAt: Date;
  updatedAt: Date;
}): ClientDiagram {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    projectId: row.projectId,
    mermaidCode: row.mermaidCode,
    viewMode: row.viewMode,
    isValid: row.isValid,
    validationScore: row.validationScore,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toClientVersion(row: {
  version: number;
  label: string;
  mermaidCode: string;
  summary: string;
  changes: unknown;
  createdAt: Date;
}): DiagramVersion {
  return {
    version: row.version,
    label: row.label,
    mermaidCode: row.mermaidCode,
    summary: row.summary,
    changes: Array.isArray(row.changes) ? (row.changes as string[]) : [],
    createdAt: row.createdAt.toISOString(),
  };
}

/** Ensure the demo owner user + demo project exist (mirror of local seed). */
export async function ensureSeeded(): Promise<void> {
  const user = await db.user.findUnique({ where: { id: DEMO_USER_ID } });
  if (!user) {
    await db.user.create({
      data: {
        id: DEMO_USER_ID,
        name: "Demo Explorer",
        email: "demo@archvision.ai",
      },
    });
  }

  const project = await db.project.findUnique({ where: { id: DEMO_PROJECT_ID } });
  if (project) {
    await backfillMissingVersions();
    return;
  }

  const now = new Date();
  const projectRow = await db.project.create({
    data: {
      id: DEMO_PROJECT_ID,
      name: "Auth Service",
      description: "User authentication & session management system",
      githubRepo: "acme/auth-service",
      githubBranch: "main",
      userId: DEMO_USER_ID,
      createdAt: now,
      updatedAt: now,
    },
  });

  const { mermaidForType } = await import("@/types/diagram");
  for (const type of ["CLASS", "SEQUENCE"] as const) {
    const diagramId = `diagram_demo_${type === "CLASS" ? 0 : 1}`;
    const code = mermaidForType(type);
    await db.diagram.create({
      data: {
        id: diagramId,
        name: type === "CLASS" ? "Authentication Domain" : "Login Flow",
        type,
        projectId: projectRow.id,
        mermaidCode: code,
        viewMode: "ENGINEERING",
        isValid: true,
        validationScore: null,
      },
    });
    await db.diagramVersion.create({
      data: {
        diagramId,
        version: 1,
        label: "Version 1",
        mermaidCode: code,
        summary: "Initial snapshot",
        changes: ["Initial snapshot"],
      },
    });
  }
}

/** Idempotent backfill: ensure every diagram has its initial version-1 snapshot. */
async function backfillMissingVersions(): Promise<void> {
  const diagrams = await db.diagram.findMany();
  for (const diagram of diagrams) {
    const count = await db.diagramVersion.count({ where: { diagramId: diagram.id } });
    if (count === 0) {
      await db.diagramVersion.create({
        data: {
          diagramId: diagram.id,
          version: 1,
          label: "Version 1",
          mermaidCode: diagram.mermaidCode,
          summary: "Initial snapshot",
          changes: ["Initial snapshot"],
        },
      });
    }
  }
}

export const repository = {
  async listProjects(): Promise<Project[]> {
    await ensureSeeded();
    const rows = await db.project.findMany({
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { diagrams: true } } },
    });
    return rows.map(toClientProject);
  },

  async listDiagrams(projectId: string | null = null): Promise<ClientDiagram[]> {
    await ensureSeeded();
    const rows = await db.diagram.findMany({
      where: projectId ? { projectId } : undefined,
      orderBy: { updatedAt: "desc" },
    });
    return rows.map(toClientDiagram);
  },

  async getDiagram(id: string): Promise<ClientDiagram | null> {
    await ensureSeeded();
    const row = await db.diagram.findUnique({ where: { id } });
    return row ? toClientDiagram(row) : null;
  },

  async createProject(input: { name: string; description?: string }): Promise<Project> {
    await ensureSeeded();
    const projectId = generateId("project");
    const row = await db.project.create({
      data: {
        id: projectId,
        name: input.name,
        description: input.description ?? null,
        githubRepo: null,
        githubBranch: "main",
        userId: DEMO_USER_ID,
      },
      include: { _count: { select: { diagrams: true } } },
    });
    return toClientProject(row);
  },

  async createDiagram(draft: DiagramDraft, projectId: string, mermaidCode?: string): Promise<ClientDiagram> {
    await ensureSeeded();
    const diagramId = generateId("diagram");
    const { mermaidForType } = await import("@/types/diagram");
    const code = mermaidCode ?? mermaidForType(draft.type);
    const row = await db.diagram.create({
      data: {
        id: diagramId,
        name: draft.name,
        type: draft.type,
        projectId,
        mermaidCode: code,
        viewMode: "ENGINEERING",
        isValid: false,
        validationScore: null,
      },
    });
    await db.diagramVersion.create({
      data: {
        diagramId,
        version: 1,
        label: "Version 1",
        mermaidCode: code,
        summary: "Initial snapshot",
        changes: ["Initial snapshot"],
      },
    });
    await db.project.update({ where: { id: projectId }, data: { updatedAt: new Date() } });
    return toClientDiagram(row);
  },

  async updateDiagram(
    id: string,
    patch: Partial<Pick<ClientDiagram, "name" | "mermaidCode" | "viewMode" | "isValid" | "validationScore">>
  ): Promise<ClientDiagram | null> {
    const row = await db.diagram.update({
      where: { id },
      data: { ...patch, updatedAt: new Date() },
    });
    return toClientDiagram(row);
  },

  async deleteDiagram(id: string): Promise<void> {
    await db.diagram.delete({ where: { id } });
  },

  async recordPrompt(entry: Omit<PromptHistoryEntry, "id" | "createdAt">): Promise<void> {
    await db.promptHistory.create({
      data: {
        diagramId: entry.diagramId,
        prompt: entry.prompt,
        response: entry.response,
        actionType: entry.actionType,
      },
    });
  },

  async listPromptHistory(diagramId: string): Promise<PromptHistoryEntry[]> {
    const rows = await db.promptHistory.findMany({
      where: { diagramId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return rows.map((row) => ({
      id: row.id,
      diagramId: row.diagramId,
      prompt: row.prompt,
      response: row.response,
      actionType: row.actionType as PromptHistoryEntry["actionType"],
      createdAt: row.createdAt.toISOString(),
    }));
  },

  async saveValidation(diagramId: string, result: ValidationResult): Promise<void> {
    await db.validationReport.create({
      data: {
        diagramId,
        issues: result.issues as unknown as object[],
        score: result.score,
      },
    });
    await db.diagram.update({
      where: { id: diagramId },
      data: {
        isValid: result.issues.every((i) => i.severity !== "critical"),
        validationScore: result.score,
        updatedAt: new Date(),
      },
    });
  },

  async getValidation(diagramId: string): Promise<Array<{ issues: ValidationIssue[]; score: number; createdAt: string }> | null> {
    const rows = await db.validationReport.findMany({
      where: { diagramId },
      orderBy: { createdAt: "desc" },
      take: 1,
    });
    if (rows.length === 0) return null;
    return rows.map((row) => ({
      issues: (row.issues as unknown as ValidationIssue[]) ?? [],
      score: row.score,
      createdAt: row.createdAt.toISOString(),
    }));
  },

  /* ---------------- version history ---------------- */

  async listVersions(diagramId: string): Promise<DiagramVersion[]> {
    const rows = await db.diagramVersion.findMany({
      where: { diagramId },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toClientVersion);
  },

  async saveVersion(diagramId: string, version: DiagramVersion): Promise<void> {
    await db.diagramVersion.create({
      data: {
        diagramId,
        version: version.version,
        label: version.label,
        mermaidCode: version.mermaidCode,
        summary: version.summary,
        changes: version.changes,
      },
    });
    await db.diagramChangeLog.create({
      data: { diagramId, summary: version.summary },
    });
  },

  async recordsChange(diagramId: string, summary: string): Promise<void> {
    await db.diagramChangeLog.create({ data: { diagramId, summary } });
  },

  async listChanges(diagramId: string, limit = 30): Promise<Array<{ at: string; summary: string }>> {
    const rows = await db.diagramChangeLog.findMany({
      where: { diagramId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return rows.map((row) => ({ at: row.createdAt.toISOString(), summary: row.summary }));
  },

  async reset(): Promise<void> {
    await db.diagram.deleteMany({});
    await db.project.deleteMany({});
    await db.user.deleteMany({});
    await db.validationReport.deleteMany({});
    await db.promptHistory.deleteMany({});
    await db.diagramVersion.deleteMany({});
    await db.diagramChangeLog.deleteMany({});
  },
};