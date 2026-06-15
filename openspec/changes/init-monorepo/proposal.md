## Why

Ten capability specs are written and validated, but no application code exists — there is no root `package.json`, no pnpm workspace, no `apps/`, and only an empty `packages/shared`. Nothing can be implemented, tested, or shipped until the monorepo skeleton and its quality gates exist. This change builds that foundation so every subsequent feature ticket lands in a workspace that already enforces the locked conventions (`project.md` §4, §7).

## What Changes

- Create the pnpm workspace and root tooling: `package.json`, `pnpm-workspace.yaml`, `turbo.json`, root `.gitignore`, `.npmrc` (Node ≥ 20.19.0 engine pin).
- Scaffold the full monorepo layout from `project.md` §5:
  - `apps/web` — React + Vite shell (TanStack Query, Zustand, React Router, Tailwind + shadcn/ui ready), role-guarded route placeholders, builds clean.
  - `apps/api` — Node.js + Express shell with a health endpoint, layered-architecture folders (controllers → services → repositories), builds clean.
  - `packages/db` — Prisma initialized (`schema.prisma` with datasource/generator only, no domain models), migration + seed entrypoints.
  - `packages/shared` — TypeScript build, the i18n-ready `t(key)` helper + English dictionary (`common`/`error`/`validation` reserved domains), shared Zod/types entrypoint.
  - `packages/ui` — shadcn/ui-based shared component package scaffold.
  - `packages/config` — shared ESLint, Prettier, TypeScript (strict, `noUncheckedIndexedAccess: true`), and Tailwind config consumed by the apps/packages.
- Wire the quality stack: ESLint + Prettier (zero-warning lint), Vitest config, Husky + lint-staged + commitlint (Conventional Commits), and Turbo pipelines for `lint`/`typecheck`/`test`/`build`.
- Wire `scripts/check-mvp-scope.mjs` into a Husky pre-commit hook and CI (deferred to this change by `project.md` §3.4, "once `package.json` exists").
- Add `.github/workflows/ci.yml` running install → lint → typecheck → test → build → `openspec validate --strict` → MVP-scope guard.
- **No domain behavior.** No auth, listings, booking, payments, etc. — only the empty shells that those future tickets will fill.

## Capabilities

### New Capabilities

- `build-tooling`: The engineering platform — monorepo workspace structure, pnpm + Turbo task orchestration, the enforced quality gates (lint/typecheck/test/build, Husky + commitlint + lint-staged), the CI pipeline, and the MVP-scope guard wiring. Defines the developer-facing invariants that keep every later change spec-compliant and green.

### Modified Capabilities

<!-- None. This change adds dev-time infrastructure only; it does not change the runtime requirements of any existing capability. The runtime `t()` helper and REST contract behaviors remain owned by `platform`; this change merely creates the package that will host them. -->

## Impact

- **New top-level dirs/files**: `apps/`, `packages/db`, `packages/ui`, `packages/config`, root `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `.github/workflows/ci.yml`, `.husky/`.
- **Dependencies introduced**: pnpm + Turbo, React/Vite/TanStack Query/Zustand/React Router/Tailwind/shadcn/ui, Express, Prisma, Zod, Vitest, ESLint/Prettier, Husky/commitlint/lint-staged. Versions pinned in lockfile.
- **Open decisions**: none of the §8 capability `[OPEN]` decisions (token TTL, fees, cancellation tiers, photo storage) are touched — those belong to the first ticket of each domain. The Turbo-vs-Nx choice is resolved here (Turbo, the `project.md` §4 default; no ADR needed).
- **Risk**: dependency/version churn at install time; mitigated by a committed `pnpm-lock.yaml` and `--frozen-lockfile` in CI.
- **No breaking changes, no data migration** (no schema models yet).
