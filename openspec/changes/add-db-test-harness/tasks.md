# Tasks: add-db-test-harness

## 1. Shared Prisma client

- [x] 1.1 Add `packages/db/src/index.ts` exporting a shared `prisma` client singleton and a `resetDatabase()` helper (truncates `public` application tables, excludes the Prisma migration table, tolerates zero tables)
- [x] 1.2 Wire `packages/db` package `main`/`types`/`exports` and a tsc `build`/`typecheck` alongside `prisma generate`

## 2. Local dev

- [x] 2.1 Add a root `docker-compose.yml` running Postgres matching `packages/db/.env.example`
- [x] 2.2 Document the one-command local DB + `DATABASE_URL` in the README

## 3. CI

- [x] 3.1 Add a `postgres:16` service (with health check) and `DATABASE_URL` to the CI quality job
- [x] 3.2 Add a step before `Test` that runs `prisma generate` and `prisma migrate deploy`

## 4. Tests

- [x] 4.1 Add a harness integration test in `packages/db` that connects and runs a trivial query, gated with `skipIf(!DATABASE_URL)`

## 5. Verify

- [x] 5.1 `pnpm lint && pnpm typecheck && pnpm test && pnpm build` — all green (integration test skipped locally without a DB; CI runs it against the Postgres service)
- [x] 5.2 `openspec validate add-db-test-harness --strict` and `node scripts/check-mvp-scope.mjs` pass
