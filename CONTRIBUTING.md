# Contributing

Thanks for your interest in improving Recruit. This project is maintained on a
best-effort basis; contributions are welcome.

## Getting started

1. Fork and clone the repository.
2. Follow the setup steps in the [README](README.md) to get a local instance
   running against your own database and credentials.
3. Create a feature branch off `main`.

## Before opening a pull request

Run the same checks CI runs:

```bash
npm run typecheck
npm run lint
npm run test:unit
npm run build
```

Please also:

- Keep changes focused; one logical change per pull request.
- Match the surrounding code style. The codebase favors well-named identifiers
  over comments, and comments that explain *why* rather than *what*.
- Avoid em dashes in user-facing copy.
- Do not commit secrets. `.env` is gitignored; never add real credentials to
  tracked files, fixtures, or tests.
- Update `CHANGELOG.md` with a one-line entry for user-facing changes.

## Database changes

The Prisma schema in `prisma/schema.prisma` is the source of truth. When you
change it, generate a migration (`npx prisma migrate dev --name <change>`) and
commit the migration alongside the schema change.

## Reporting bugs

Open an issue with reproduction steps, expected vs. actual behavior, and
relevant environment details. For security-sensitive reports, follow
[SECURITY.md](SECURITY.md) instead of opening a public issue.
