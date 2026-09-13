# Security policy

## Reporting

Please report vulnerabilities via a private GitHub Security Advisory on this
repo (Security tab → Advisories). Do not open public issues for them.

## Automated scanning

- **Dependabot** (`.github/dependabot.yml`): weekly npm + GitHub Actions
  updates, minor/patch grouped, max 5 open PRs.
- **CodeQL** (`.github/workflows/codeql.yml`): `javascript-typescript`,
  `security-extended` queries, on push/PR plus weekly schedule.
- **npm audit**: run before releases; `npm audit fix` for anything
  non-breaking.

## Known accepted risks (2026-09-13 audit)

These advisories can only be fixed by breaking major upgrades, so they are
tracked here instead of force-fixed:

| Finding | Fix required | Why deferred |
|---|---|---|
| Next.js advisories incl. 1 critical (DoS/RSC/cache issues) | `next@16` (React 19 migration) | Full framework major; needs its own migration + regression pass |
| Prisma 7 chain (`deepmerge-ts`, `mysql2`) | downgrade to `prisma@6` | Breaking config-format change the wrong direction |
| Sentry 8 chain (`rollup`, OpenTelemetry) | `@sentry/nextjs@10` | Drops Next 14 support; revisit with the Next 16 migration |

What _is_ done: `postcss` pinned to `^8.5.28` via an npm override (kills the
nested vulnerable copy Next 14 ships), `dompurify` override kept current,
CSP/HSTS/nosniff headers in `next.config.mjs`, per-route rate limiting,
ownership-scoped queries (no IDOR), and a kill switch + budgets on AI spend
(see `lib/ai/budget.ts`).
