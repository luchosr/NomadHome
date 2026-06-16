## ADDED Requirements

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
