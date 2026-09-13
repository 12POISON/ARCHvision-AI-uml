# Deployment — Vercel (native target)

Takes ~10 minutes. No code changes needed: standard Next.js App Router,
`output: standalone` also works on Vercel, and `npm run build` regenerates
the Prisma client automatically.

## 1. Connect the repo

1. https://vercel.com/new → import `12POISON/ARCHvision-AI-uml`
2. Framework preset: Next.js (auto-detected). Leave build settings default:
   - Build command: `npm run build`
   - Output: (Vercel default)

## 2. Environment variables (Vercel → Project → Settings → Environment)

Launch config — works with zero provisioning:

| Variable | Value | Notes |
|---|---|---|
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` | **Required.** Never reuse the dev auto-generated one |
| `NEXT_PUBLIC_APP_URL` | `https://<your-app>.vercel.app` | Canonical URL for links/OG |
| `DATABASE_URL` | *(leave unset for launch)* | Without it the pooler client throws at import → see note below |
| `NEXT_PUBLIC_DATA_MODE` | *(leave unset for launch)* | Unset = localStorage/zero-config demo mode |

> If `DATABASE_URL` is unset, set `NEXT_PUBLIC_DATA_MODE` to anything
> **except** `db` (or leave it unset) so the app boots in zero-config mode
> instead of attempting Postgres connections.

When ready for persistence (Neon/Supabase/Railway free tier):

| Variable | Value |
|---|---|
| `DATABASE_URL` | pooled connection string |
| `DIRECT_URL` | direct connection string (migrations) |
| `NEXT_PUBLIC_DATA_MODE` | `db` |

Then run `npm run db:deploy` once against that database and redeploy.

AI providers (optional — without either key the app uses its offline engine):

| Variable | Value |
|---|---|
| `OPENAI_API_KEY` | `sk-…` |
| `ANTHROPIC_API_KEY` | `sk-ant-…` |
| `AI_PROVIDER_DISABLED` | `true` kills all provider calls without a redeploy (see `lib/ai/budget.ts`) |

OAuth (optional — without these, demo access is the only sign-in):

| Variable | Value |
|---|---|
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | github.com/settings/developers, callback `<app>/api/auth/callback/github` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google Cloud console, callback `<app>/api/auth/callback/google` |

Observability (Phase 2):

| Variable | Value |
|---|---|
| `SENTRY_DSN` | Sentry project DSN (also set `NEXT_PUBLIC_SENTRY_DSN` for browser errors) |
| `NEXT_PUBLIC_POSTHOG_KEY` / `NEXT_PUBLIC_POSTHOG_HOST` | PostHog project key + host |

## 3. First deploy

Deploy → open `/api/health` — expect `{"status":"ok","db":"down"}` in
zero-config mode (`db: "down"` is correct without a database).
Wire a free UptimeRobot check (5-min interval) against
`https://<your-app>.vercel.app/api/health`.

## 4. Put the URL in the README

Replace the `<!-- LIVE_DEMO_URL -->` placeholder at the top of
`README.md` with the Vercel URL. Above the fold, not in a table.
