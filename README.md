# ArchVision AI ⚡ Automatic UML Diagram Generator

Transform **natural language, code repositories and database schemas** into production-ready UML
diagrams — then refine them with plain-English prompts, validate the architecture, and export
clean artifacts.

> **Zero-config mode:** the app runs fully offline with no API keys or database. Demo auth,
> localStorage persistence and ArchVision's local extraction engine power every feature. Add
> keys/DBs and the same code paths switch to GPT-4o / Claude and PostgreSQL.

---

## ✨ Features

| Area | Capability |
| --- | --- |
| **Diagram engine** | Bi-directional Mermaid ↔ ReactFlow canvas (drag, connect, minimap, dagre auto-layout) |
| **Code editor** | Monaco panel with Mermaid syntax highlighting & error squiggles, 300ms two-way sync |
| **View modes** | Executive (simplified) ⇄ Engineering (full detail) with per-diagram persistence |
| **AI copilot** | Streaming chat, node-targeted edits ("Make User inherit from Account"), architecture critic, design-doc generation |
| **Scope wizard** | Paste requirements → entity extraction preview → toggle scope → generate |
| **Validation** | 7-rule 100-point checklist: inheritance cycles, god classes, detached nodes, naming… |
| **Analysis** | Coupling (afferent/efferent), cycles (graph DFS), missing abstraction insights + refactorings |
| **GitHub & DB** | OAuth connect, webhook-driven sync, SQL reflection → Crow's Foot ER | 
| **Codegen** | TypeScript / Java / Python / C# with Lombok, Pydantic, decorators, getters/setters |
| **Export** | SVG, PNG (2x/4x), PDF, PlantUML, Mermaid, JSON — validation-gated |
| **Roadmap** | GitHub repo import, webhook-driven sync, SQL reflection → Crow's Foot ER |

> **Auth & sharing status:** email/password sign-up is not implemented. Accounts come from
> GitHub/Google OAuth (buttons appear once credentials are set) or the demo user. The demo
> provider is **automatically disabled in production** when real OAuth is configured. Share
> links are a preview UX — they grant no access; collaboration is a roadmap item.

## 🚀 Quick start

```bash
npm install
npm run dev
# open http://localhost:3000 — sign in with "Demo access"
```

## 🔑 Configuration

Copy `.env.example` → `.env`. The app **always works**; env vars upgrade the stack:

```env
# AI (either provider is enough; both → primary + fallback)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# OAuth (buttons appear automatically once set)
GITHUB_CLIENT_ID=...    GITHUB_CLIENT_SECRET=...
GOOGLE_CLIENT_ID=...    GOOGLE_CLIENT_SECRET=...

# Required in production — the app refuses to start without it (dev auto-generates)
NEXTAUTH_SECRET=$(openssl rand -base64 32)
```

## 🐳 Docker

```bash
docker compose up --build
# app on :3000, PostgreSQL 15 bundled
```

## 📜 Scripts

```bash
npm run dev          # local dev
npm run build        # production build (standalone output)
npm run start        # serve production build
npm run lint         # ESLint (next/core-web-vitals + react)
npm run typecheck    # tsc --noEmit (strict, zero `any`)
```

## 🗄️ Going to production — PostgreSQL

The app ships with a **two-mode storage layer** (`lib/data/storage.ts`):

| Mode | When | Persistence |
| --- | --- | --- |
| `local` (default) | `NEXT_PUBLIC_DATA_MODE` unset | localStorage (zero-infra demo) |
| `db` | `NEXT_PUBLIC_DATA_MODE=db` | PostgreSQL via Prisma → `/api/storage` |

Both modes share the same async storage API, so no feature code changes when you switch. The
Prisma repository (`lib/data/repository.ts`) is the server-side source of truth: projects,
diagrams, version history, change log, prompt history and validation reports.

```bash
# 1. Point PostgreSQL 15 at a host you control (or `docker compose up -d db`)
# 2. Set DATABASE_URL and NEXT_PUBLIC_DATA_MODE=db in .env, then BUILD:
npm run db:migrate        # applies migrations
npm run db:seed           # optional demo user + Auth Service project
npm run build && npm run start
```

> `NEXT_PUBLIC_*` values are inlined at **build time**, so set
> `NEXT_PUBLIC_DATA_MODE=db` before `npm run build`. In dev (`npm run dev`) it's
> read live from `.env`.

Production deploys run `npm run db:deploy` instead of `db:migrate`. Migrations live in
`prisma/migrations/`. Multi-tenancy is enforced server-side: the Prisma repository scopes every
query to the authenticated user (`lib/data/repository.ts`), and `/api/storage` injects the user
id from the session — payloads can never spoof ownership. API routes are protected with an
in-memory rate limiter (per-user, `lib/rate-limit.ts`) plus auth guards.

## 🔬 Where the intelligence lives

| Path | Purpose |
| --- | --- |
| `lib/mermaid/parser.ts` | `classDiagram` → typed `UMLModel` AST |
| `lib/mermaid/transformer.ts` | AST ↔ ReactFlow nodes/edges (dagre layout) |
| `lib/mermaid/validator.ts` | 7-rule validation + 100-point scoring |
| `lib/analysis/critic.ts` | coupling, cycles, god classes, insights |
| `lib/ai/mock-engine.ts` | offline extraction (entities/methods/attributes/relations) |
| `lib/ai/transforms.ts` | prompt → model transformation pipeline |
| `app/api/ai/chat/route.ts` | SSE streaming route (AI provider or offline engine) |

## ♿ Accessibility & performance

WCAG 2.1 AA: full keyboard nav, focus rings, ARIA labels, reduced-motion support. Performance:
lazy-loaded Monaco/Mermaid/ReactFlow, debounced sync (300ms), viewport-optimum canVas, 0-animation
priority safelist — see `next.config.mjs`.

---

Built with Next.js 14, TypeScript (strict), Tailwind, Framer Motion, ReactFlow, Mermaid, Monaco,
Zustand, React Query and the Vercel AI SDK.