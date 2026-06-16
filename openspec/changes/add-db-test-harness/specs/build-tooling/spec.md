# build-tooling — Delta for add-db-test-harness

## ADDED Requirements

### Requirement: Shared Prisma client and database reset helper

The system SHALL expose a single shared Prisma client instance from
`packages/db` that every app and package imports rather than constructing its
own. The package SHALL also export a `resetDatabase()` helper for tests that
empties all application tables in the `public` schema while preserving the schema
itself and Prisma's internal migration history table. The helper MUST tolerate a
schema with zero application tables so it works before any domain models exist.

#### Scenario: Apps import one shared client

- **WHEN** application code imports the Prisma client from `@nomadhome/db`
- **THEN** it receives a single shared `PrismaClient` instance
- **AND** no app constructs its own `PrismaClient`

#### Scenario: Reset helper clears application data

- **GIVEN** a database reachable via `DATABASE_URL`
- **WHEN** `resetDatabase()` is called
- **THEN** every application table in the `public` schema is emptied
- **AND** the Prisma migration history table is not dropped
- **AND** the call succeeds even when no application tables exist yet

### Requirement: CI runs tests against a Postgres service

The system SHALL run the CI test step against a real PostgreSQL service. The CI
quality job MUST provision a Postgres service, expose a `DATABASE_URL` to the job,
and generate the Prisma client and apply pending migrations
(`prisma migrate deploy`) before the test step runs. Database-backed integration
tests MUST run when `DATABASE_URL` is set and MUST be skipped (not failed) when it
is absent, so local runs without a database stay green.

#### Scenario: CI applies migrations before testing

- **WHEN** the CI quality job runs
- **THEN** a Postgres service is available and `DATABASE_URL` is set for the job
- **AND** the Prisma client is generated and `prisma migrate deploy` runs before the test step

#### Scenario: Integration tests are skipped without a database

- **GIVEN** an environment where `DATABASE_URL` is not set
- **WHEN** `pnpm test` runs
- **THEN** database-backed integration tests are skipped rather than failing
- **AND** the overall test run can still pass
