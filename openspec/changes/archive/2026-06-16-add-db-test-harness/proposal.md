# Proposal: add-db-test-harness

## Why

The next wave of tickets (identity, listings, booking, …) all persist data, but
there is no database anywhere in the pipeline: CI's test step runs with no
Postgres, there is no shared Prisma client for apps to import, and no way for
integration tests to run against a real schema. Building any persistence feature
first requires this foundation. Standing it up once unblocks every capability
ticket and keeps their scope focused on domain logic instead of re-deriving test
plumbing.

## What

- A shared Prisma client singleton exported from `packages/db`, plus a
  `resetDatabase()` test helper that truncates all application tables (so it keeps
  working as future tickets add models).
- CI gains a Postgres service container, a `DATABASE_URL`, and a step that
  generates the client and applies migrations (`prisma migrate deploy`) before
  the test step. Today this is a no-op; it applies real migrations as they land.
- A `docker-compose.yml` for a local Postgres matching `.env.example`, with a
  short README note so developers get a one-command database.
- A harness integration test that connects and runs a trivial query, gated to
  run only when `DATABASE_URL` is set — so CI exercises it while local
  `pnpm test` stays green without a database.

## Impact

- **Capabilities affected**: `build-tooling` (CI + test infrastructure).
- **Breaking changes**: no.
- **Migration required**: no domain models are added by this change.
- **Out of scope**: any domain models / migrations / seed data (those belong to
  capability tickets), and migration-reset automation beyond the truncate helper.

## Risks & Mitigations

| Risk                                                     | Likelihood | Mitigation                                                                                      |
| -------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------- |
| Integration tests fail locally for devs without Postgres | Medium     | Tests are gated with `skipIf(!DATABASE_URL)`; documented docker-compose gives a one-command DB. |
| CI flakiness from DB not being ready                     | Low        | Postgres service uses a health check before steps run.                                          |
| `resetDatabase()` truncates unexpected tables            | Low        | It targets only `public` schema user tables and excludes Prisma's migration table.              |

## Rollout

Big bang — infrastructure only, no runtime feature change. Verified by CI (the
harness test runs against the service container).
