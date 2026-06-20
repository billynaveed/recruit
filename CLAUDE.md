# CLAUDE.md

Guidance for AI assistants (and humans) working in this repository.

## Recruit

An AI-assisted recruitment and candidate-assessment platform. See
[README.md](README.md) for setup and a feature overview.

## Stack

- Next.js 15 App Router, React 19, TypeScript
- Prisma 7 (driver adapter pattern, see `lib/prisma.ts`) on PostgreSQL
- iron-session cookie auth + Google Sign-In, restricted to `ADMIN_HOSTED_DOMAIN`
- Tailwind v4, shadcn-style components
- pino for logging
- pm2 for process management (see `ecosystem.config.js`)
- Sentry scaffolded but a no-op until a DSN is set

## Working style

- Trace real root causes, smallest correct fix
- Verify with actual browser flow (Playwright in `tests/e2e/`), not just build success
- Default to no comments in code; lean on well-named identifiers
- Don't write WHAT a function does — names already say that. Comment WHY for non-obvious constraints
- No em dashes in user-facing copy
- Append a one-line entry to `CHANGELOG.md` for user-facing changes
- Never commit secrets; configuration lives in `.env` (gitignored)

## Map of the code

- `app/admin/*` — admin shell, dashboard, job detail, candidate detail, reviews queue, help
- `app/apply/[token]/*` — candidate-facing flow (stages 1–6)
- `actions/*` — server actions (auth, jobs, candidates, reviews, apply)
- `lib/scoring/*` — STAR scoring, dimension synthesis, role-fit reads
- `lib/admin-domain.ts`, `lib/base-url.ts`, `lib/site-config.ts` — env-driven config
- `components/admin/*` — admin UI components
- `components/apply/*` — stage components for candidate flow
- `prisma/schema.prisma` — single source of truth; migrations under `prisma/migrations/`
- `tests/e2e/*` — Playwright suites
- `scripts/deploy.sh` + `.github/workflows/deploy.yml` — example single-box deploy

## Deploy and ops

`scripts/setup-deploy.sh` bootstraps one example deployment model: a GitHub
Actions self-hosted runner that, on each push to `main`, runs `scripts/deploy.sh`
(`git pull && npm ci && prisma generate && prisma migrate deploy && next build
&& pm2 reload`). A `/healthz` check gates the workflow. Adapt or replace this to
suit your infrastructure. Backup and uptime guidance lives in `scripts/RESTORE.md`
and `scripts/UPTIME.md`.
