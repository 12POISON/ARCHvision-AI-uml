# Contributing to ArchVision AI

## Run locally

```bash
npm install
npm run dev          # http://localhost:3000 — sign in with "Demo access"
```

For DB-backed mode: set `DATABASE_URL` + `NEXT_PUBLIC_DATA_MODE=db`, then
`npm run db:migrate` (or `npm run db:seed` for demo data).

## Verify before every commit

```bash
npm run typecheck && npm run lint && npm run test
```

All three must pass. `npm run test` runs 134 unit/integration tests via
`node --test` (custom TS alias loader in `tests/alias-loader.mjs`).

DB integration tests (`tests/idor.integration.test.ts`,
`tests/routes.db.integration.test.ts`) use `{ skip: !HAS_DB }`: they run
whenever `DATABASE_URL` is set and reachable, and skip cleanly otherwise.
CI spins up Postgres, so they always run there — never delete a skip
without providing a DB.

End-to-end (`npm run test:e2e`, Playwright + Chromium) covers the real
product loop — demo sign-in → project → AI-described diagram → canvas →
SVG export. It needs a reachable `DATABASE_URL` (demo sign-in persists
the demo user via the Prisma adapter) and runs the dev server itself.
CI runs it as a separate `e2e` job; locally: `npm run db:migrate` first,
then `npm run test:e2e`.

## Branches

`feat/<slug>`, `fix/<slug>`, `chore/<slug>`, `docs/<slug>`, `test/<slug>`
off `main`. Open a PR; `main` stays green (CI runs typecheck + lint + tests).

## Commits — Conventional Commits, one change per commit

- `feat:` new user-facing capability
- `fix:` bug fix
- `test:` tests only
- `docs:` docs only
- `chore:` tooling, deps, config
- `refactor:` behavior-preserving restructure

Small, real commits with descriptive messages. Do not squash distinct
changes together; do not rewrite published history.
