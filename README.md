# Recruit

[![CI](https://github.com/billynaveed/recruit/actions/workflows/ci.yml/badge.svg)](https://github.com/billynaveed/recruit/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

An AI-assisted recruitment and candidate-assessment platform. Hiring teams
create roles, invite candidates via tokenized magic links, and review a
structured six-stage application. Written behavioral answers are scored against
a per-role rubric using Anthropic's Claude API, then synthesized into a
role-fit read for human reviewers. It is not a hire/no-hire engine — it
surfaces structured signal to support an interview decision.

> Originally built as an internal tool and released under the MIT license. You
> will need to supply your own configuration (database, Google OAuth client,
> Anthropic API key) and customize the branding and legal copy for your
> organization.

## Features

- **Roles and questions** — create jobs, store the job description, and manage a
  role-specific question set.
- **Invites** — single tokenized magic-link invites and reusable bulk links,
  plus bulk CSV import.
- **Six-stage candidate flow** — welcome, CV upload, role questions, standard
  questions, behavioral (STAR) assessment, and review/submit, all with
  autosave and resume.
- **AI scoring** — STAR responses are scored against the role rubric via the
  Claude API; dimension scores are synthesized into a role-fit read.
- **Reviewer workflow** — assign, submit, and withdraw reviews with a pending
  queue and badge.
- **Audit log** — every administrative action is recorded.
- **Engagement signals, analytics, and an in-app help walkthrough.**
- **Ops** — `/healthz` check, structured pino logging, nightly DB backups, and
  optional Sentry error monitoring.

## Stack

- [Next.js 15](https://nextjs.org/) App Router, React 19, TypeScript
- [Prisma 7](https://www.prisma.io/) (driver-adapter pattern) on PostgreSQL
- [iron-session](https://github.com/vvo/iron-session) cookie auth + Google Sign-In
- Tailwind CSS v4, shadcn-style components
- [pino](https://getpino.io/) structured logging
- [Anthropic Claude API](https://docs.anthropic.com/) for rubric scoring
- pm2 for process management (one example deployment model)

## Prerequisites

- Node.js 22+
- PostgreSQL 14+
- A Google OAuth client ID (for admin sign-in)
- An Anthropic API key (for AI scoring)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Then edit `.env`. The key variables:

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `SESSION_SECRET` | yes | Random string, minimum 32 characters (`openssl rand -base64 32`) |
| `ADMIN_HOSTED_DOMAIN` | yes | Google Workspace domain allowed to sign in (e.g. `acme.com`) |
| `GOOGLE_CLIENT_ID` | yes | Google OAuth client ID for sign-in |
| `ANTHROPIC_API_KEY` | yes | Enables AI rubric scoring |
| `NEXT_PUBLIC_BASE_URL` | recommended | Public origin used to build candidate links |
| `NEXT_PUBLIC_APP_NAME` / `NEXT_PUBLIC_ORG_NAME` / `NEXT_PUBLIC_CONTACT_EMAIL` | no | Branding and legal-copy customization |
| `ADMIN_EMAILS` | no | Comma-separated seed emails for the reviewer picker |

Admin access is restricted to Google accounts on `ADMIN_HOSTED_DOMAIN`. The
sign-in route verifies Google's hosted-domain (`hd`) claim before issuing a
session, so only members of that Workspace can reach the admin area.

### 3. Set up the database

```bash
npm run db:generate          # generate the Prisma client
npx prisma migrate deploy    # apply tracked migrations
# or, for quick local iteration: npm run db:push
```

Optional seed data for local development:

```bash
npm run db:seed
```

### 4. Run

```bash
npm run dev
```

The app runs at `http://localhost:3000`. The root redirects to `/admin`, which
redirects to `/login` when there is no session.

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | TypeScript type check |
| `npm run test:unit` | Run unit tests |
| `npm run db:generate` | Regenerate the Prisma client |
| `npm run db:push` | Push the schema to the database (dev) |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:seed` | Seed development data |

## Project layout

- `app/admin/*` — admin shell, dashboard, role detail, candidate detail, reviews, help
- `app/apply/[token]/*` — candidate-facing flow (stages 1–6)
- `actions/*` — server actions (auth, jobs, candidates, reviews, apply)
- `lib/scoring/*` — STAR scoring, dimension synthesis, role-fit reads
- `components/*` — admin and candidate UI components
- `prisma/schema.prisma` — data model (single source of truth)
- `tests/e2e/*` — Playwright end-to-end suites
- `scripts/*` — deploy, backup, and ops helpers

## Testing

Unit tests run with `npm run test:unit`. End-to-end suites use Playwright
(Python) and expect a running app plus a database. Configure credentials and
target URL via env: `BASE_URL`, `ADMIN_E2E_EMAIL`, `ADMIN_E2E_PASSWORD`.

## Deployment

`scripts/setup-deploy.sh` bootstraps one example deployment model: a GitHub
Actions self-hosted runner that, on each push to `main`, runs
`scripts/deploy.sh` (`git pull && npm ci && prisma migrate deploy && next build
&& pm2 reload`) with a `/healthz` gate. Both scripts read their paths and names
from the environment, so adapt or replace them to suit your infrastructure. See
`scripts/RESTORE.md` and `scripts/UPTIME.md` for backup and uptime guidance.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) and our
[Code of Conduct](CODE_OF_CONDUCT.md). Security issues: see
[SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE)
