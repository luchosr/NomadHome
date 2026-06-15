# Tasks: init-monorepo

## 1. Workspace root

- [ ] 1.1 Create root `package.json` with `private: true`, `packageManager: pnpm@<pinned>`, and `engines.node` `>=20.19.0`
- [ ] 1.2 Add `pnpm-workspace.yaml` declaring `apps/*` and `packages/*` members
- [ ] 1.3 Add root `.npmrc` (strict engine-check) and root `.gitignore` (node_modules, dist, .turbo, .env*)
- [ ] 1.4 Add `turbo.json` with `lint`, `typecheck`, `test`, `build` pipelines; `build` declares `dependsOn: ["^build"]`
- [ ] 1.5 Add root scripts (`lint`, `typecheck`, `test`, `build`) delegating to Turbo
- [ ] 1.6 Run `pnpm install` and commit `pnpm-lock.yaml`; verify `pnpm -r list --depth -1` shows all six members

## 2. Shared config package (`packages/config`)

- [ ] 2.1 Scaffold `packages/config` package.json + build entry
- [ ] 2.2 Add shared base `tsconfig` with `strict: true` and `noUncheckedIndexedAccess: true`
- [ ] 2.3 Add shared ESLint flat config (`eslint.config.js`) with zero-warning intent
- [ ] 2.4 Add shared Prettier config and Tailwind preset
- [ ] 2.5 Verify each consuming member extends the shared `tsconfig`

## 3. Shared package (`packages/shared`)

- [ ] 3.1 Scaffold `packages/shared` package.json + TypeScript build extending shared config
- [ ] 3.2 Add the i18n-ready `t(key)` helper + English dictionary in `src/strings/en.ts` with reserved `common`/`error`/`validation` domains (behavior per `platform` spec + `decide-i18n-key-format`)
- [ ] 3.3 Add shared Zod/types entrypoint (`src/index.ts`) — empty barrel for now
- [ ] 3.4 Vitest: smoke test for `t()` key-format conformance and missing-key marker

## 4. Database package (`packages/db`)

- [ ] 4.1 Scaffold `packages/db` package.json with db script entrypoints (migrate/seed placeholders)
- [ ] 4.2 Initialize Prisma `schema.prisma` with PostgreSQL datasource + client generator and NO domain models
- [ ] 4.3 Add `.env.example` with `DATABASE_URL` placeholder; document local setup

## 5. UI package (`packages/ui`)

- [ ] 5.1 Scaffold `packages/ui` package.json extending shared config, Tailwind preset wired
- [ ] 5.2 Add shadcn/ui setup (`components.json`) and one trivial shared component to prove the pipeline
- [ ] 5.3 Vitest + Testing Library: render test for the trivial component

## 6. API app (`apps/api`)

- [ ] 6.1 Scaffold `apps/api` (Node + Express + TypeScript) extending shared config
- [ ] 6.2 Create layered folders: `controllers/`, `services/`, `repositories/` (empty, with README notes)
- [ ] 6.3 Add a health endpoint returning a success status
- [ ] 6.4 Wire build + dev scripts; verify the server starts and the health endpoint responds
- [ ] 6.5 Vitest: integration test hitting the health endpoint

## 7. Web app (`apps/web`)

- [ ] 7.1 Scaffold `apps/web` (React + Vite + TypeScript) extending shared config
- [ ] 7.2 Wire Tailwind + shared UI package, TanStack Query provider, Zustand store stub, React Router with placeholder role-guarded route shells (guest/host/admin)
- [ ] 7.3 Render a placeholder shell sourcing all visible text through the `t()` helper
- [ ] 7.4 Verify `pnpm --filter web build` produces a clean production build
- [ ] 7.5 Vitest + Testing Library: render test for the placeholder shell

## 8. Quality gates (Husky / commitlint / lint-staged)

- [ ] 8.1 Add Husky and initialize hooks directory
- [ ] 8.2 Add commitlint config (Conventional Commits) wired to a `commit-msg` hook
- [ ] 8.3 Add lint-staged config (Prettier + ESLint on staged files)
- [ ] 8.4 Add a `pre-commit` hook running lint-staged AND `node scripts/check-mvp-scope.mjs`
- [ ] 8.5 Verify a non-conventional commit message is rejected and a well-formed one passes
- [ ] 8.6 Verify a staged tasks.md with a denylisted term is blocked by the pre-commit hook

## 9. CI pipeline

- [ ] 9.1 Add `.github/workflows/ci.yml` running install `--frozen-lockfile` → lint → typecheck → test → build → `openspec validate --strict` → `node scripts/check-mvp-scope.mjs`
- [ ] 9.2 Set Node version in CI to match the pinned engine (≥ 20.19.0) and enable pnpm
- [ ] 9.3 Confirm the workflow fails when any step fails (verify ordering)

## 10. Verification

- [ ] 10.1 Run `pnpm lint && pnpm typecheck && pnpm test && pnpm build` at root — all green
- [ ] 10.2 Run `openspec validate init-monorepo --strict` — passes
- [ ] 10.3 Run `node scripts/check-mvp-scope.mjs` — exits zero
- [ ] 10.4 Update `design.md` with any decisions made during implementation
