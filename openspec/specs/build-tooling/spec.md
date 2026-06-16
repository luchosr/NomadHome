# build-tooling Specification

## Purpose

TBD - created by archiving change init-monorepo. Update Purpose after archive.

## Requirements

### Requirement: pnpm workspace with the canonical monorepo layout

The system SHALL be a pnpm workspace whose member packages match the layout defined in `project.md` §5: `apps/web`, `apps/api`, `packages/db`, `packages/shared`, `packages/ui`, and `packages/config`. Every member MUST declare a `name` and be resolvable by pnpm. The root `package.json` MUST pin Node.js `>= 20.19.0` via the `engines` field. A dedicated `apps/admin` app MUST NOT exist (admin lives behind role-guarded routes in `apps/web`, per `project.md` §5).

#### Scenario: Workspace lists all six members

- **WHEN** `pnpm -r list --depth -1` is run from the repo root
- **THEN** the output includes a package for each of `apps/web`, `apps/api`, `packages/db`, `packages/shared`, `packages/ui`, and `packages/config`
- **AND** no package corresponds to an `apps/admin` directory

#### Scenario: Node engine is pinned

- **WHEN** the root `package.json` `engines.node` field is read
- **THEN** it requires a version range satisfied by `20.19.0` and rejects versions below it

### Requirement: Turbo orchestrates the standard task pipelines

The system SHALL use Turbo to orchestrate the `lint`, `typecheck`, `test`, and `build` tasks across all workspace members. Running a task at the root MUST fan out to every member that defines that task, and the `build` task MUST declare its dependency on upstream package builds so shared packages build before the apps that consume them.

#### Scenario: Root build builds every app and package

- **WHEN** `pnpm build` is run from the repo root
- **THEN** Turbo runs the `build` task for every member that defines it
- **AND** `packages/shared`, `packages/ui`, and `packages/config` build before `apps/web` and `apps/api`
- **AND** the command exits zero

#### Scenario: Each standard task is invokable from the root

- **WHEN** any of `pnpm lint`, `pnpm typecheck`, `pnpm test`, or `pnpm build` is run from the repo root
- **THEN** the command resolves through Turbo to the corresponding member tasks and exits zero

### Requirement: Shared TypeScript configuration is strict

The system SHALL provide a shared base TypeScript configuration in `packages/config` that enables `strict` mode and `noUncheckedIndexedAccess`. Every app and package MUST extend this base config so the strictness is uniform and cannot drift per package.

#### Scenario: Base config enables strict flags

- **WHEN** the shared base `tsconfig` in `packages/config` is read
- **THEN** `compilerOptions.strict` is `true`
- **AND** `compilerOptions.noUncheckedIndexedAccess` is `true`

#### Scenario: Members extend the shared config

- **WHEN** the `tsconfig.json` of any app or package is read
- **THEN** it extends the shared base config from `packages/config`

### Requirement: Lint and format gate is zero-warning

The system SHALL provide shared ESLint and Prettier configuration in `packages/config` consumed by every member. The `pnpm lint` task MUST be configured to fail when any ESLint warning or error is produced (`--max-warnings 0` semantics), so warnings cannot accumulate.

#### Scenario: Lint fails on a warning

- **GIVEN** a source file in any member that violates an enabled ESLint rule at warning severity
- **WHEN** `pnpm lint` is run
- **THEN** the command exits non-zero

#### Scenario: Clean tree lints green

- **GIVEN** the scaffolded repository with no rule violations
- **WHEN** `pnpm lint` is run from the root
- **THEN** the command exits zero with no warnings reported

### Requirement: Conventional Commits enforced via commitlint

The system SHALL enforce Conventional Commits through commitlint wired to a Husky `commit-msg` hook. A commit message whose type is outside `feat|fix|chore|docs|test|refactor|perf|build|ci` MUST be rejected, and a well-formed message MUST be accepted.

#### Scenario: Non-conventional message is rejected

- **GIVEN** a staged change ready to commit
- **WHEN** a commit is attempted with the message `updated stuff`
- **THEN** the commit is rejected by the `commit-msg` hook

#### Scenario: Conventional message is accepted

- **WHEN** a commit is attempted with the message `feat(build-tooling): scaffold workspace`
- **THEN** commitlint validation passes

### Requirement: Pre-commit runs lint-staged and the MVP-scope guard

The system SHALL run a Husky `pre-commit` hook that (a) runs `lint-staged` to apply Prettier + ESLint to staged files, and (b) runs `node scripts/check-mvp-scope.mjs` so that a staged `tasks.md` containing a denylisted "Never" term blocks the commit, per `project.md` §3.4.

#### Scenario: A "Never" term in tasks.md blocks the commit

- **GIVEN** a staged `openspec/changes/<id>/tasks.md` containing a denylisted "Never" term
- **WHEN** a commit is attempted
- **THEN** the `pre-commit` hook runs `scripts/check-mvp-scope.mjs`, the script exits non-zero, and the commit is blocked

#### Scenario: lint-staged formats staged files

- **GIVEN** a staged source file with fixable formatting issues
- **WHEN** a commit is attempted
- **THEN** `lint-staged` runs Prettier/ESLint over the staged file before the commit completes

### Requirement: CI pipeline enforces the full quality gate

The system SHALL provide a GitHub Actions workflow at `.github/workflows/ci.yml` that, on pull requests, runs the quality gate in order: `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `openspec validate --all --strict`, and `node scripts/check-mvp-scope.mjs`. Any step failing MUST fail the workflow.

#### Scenario: Workflow defines the gate steps in order

- **WHEN** `.github/workflows/ci.yml` is read
- **THEN** it runs install with `--frozen-lockfile`, then lint, typecheck, test, build, `openspec validate --all --strict`, and the MVP-scope guard
- **AND** the steps are ordered so a failure in any step fails the job

### Requirement: Scaffolded apps and packages build and run clean

The system SHALL ship `apps/web` and `apps/api` as minimal shells that build and typecheck without errors and contain no domain behavior. `apps/api` MUST expose a health endpoint returning a success status; `apps/web` MUST render a placeholder shell. `packages/db` MUST contain a Prisma schema with a configured datasource and generator but no domain models.

#### Scenario: API health endpoint responds

- **GIVEN** the `apps/api` server is running
- **WHEN** a GET request is made to the health endpoint
- **THEN** the response indicates a healthy status

#### Scenario: Prisma schema has no domain models yet

- **WHEN** `packages/db` Prisma schema is read
- **THEN** it declares a datasource and a generator
- **AND** it declares no domain models (auth, listing, booking, payment, review)

### Requirement: One-command dev workflow builds dependencies first

The system SHALL provide a Turbo `dev` task and root `dev` scripts such that running `pnpm dev` builds each workspace package's dependencies before starting its dev server. The `dev` task MUST be `persistent` and non-cached, and MUST declare `dependsOn: ["^build"]` so library packages (`shared`, `ui`, `config`) are compiled to their `dist/` output before any consuming app's dev server starts. The root MUST also expose per-app scripts (`dev:api`, `dev:web`) that run `turbo run dev` filtered to a single app, each still building that app's dependencies first.

#### Scenario: dev task is configured persistent, uncached, and after builds

- **WHEN** `turbo.json` is read
- **THEN** the `dev` task declares `persistent: true`, `cache: false`, and `dependsOn: ["^build"]`
- **AND** the root `package.json` `dev` script runs `turbo run dev`
- **AND** `dev:api` and `dev:web` run `turbo run dev` filtered to the respective app

#### Scenario: Per-app dev builds deps then starts a single app

- **GIVEN** a checkout with no prior build (no `dist/` in workspace packages)
- **WHEN** `pnpm dev:api` is run
- **THEN** `@nomadhome/shared` is built first
- **AND** only the `apps/api` dev server starts
- **AND** a GET request to the API health endpoint returns a healthy status

#### Scenario: Root dev starts the app dev servers

- **GIVEN** a checkout with no prior build
- **WHEN** `pnpm dev` is run from the repo root
- **THEN** Turbo builds `shared`, `ui`, and `config` before starting any dev server
- **AND** the `apps/web` and `apps/api` dev servers both start without module-resolution errors

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
