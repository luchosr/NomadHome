## Context

The repository currently holds only `openspec/`, `docs/`, `scripts/`, and an empty `packages/shared` — there is no buildable code, no root `package.json`, and no pnpm workspace. The tech stack is locked by `project.md` §4 and the layout is fixed by §5, so this design is not about _choosing_ the stack but about _assembling_ it correctly: how the packages relate, how strictness and quality gates are enforced once and inherited everywhere, and how the existing `scripts/check-mvp-scope.mjs` gets wired in now that a `package.json` will exist (§3.4 explicitly deferred this to "a later change once `package.json` exists").

This is a cross-cutting change touching every future module's foundation, introducing many external dependencies, so a design doc is warranted.

## Goals / Non-Goals

**Goals:**

- Stand up a pnpm + Turbo workspace matching `project.md` §5 exactly.
- Enforce the §7 quality gates from the first commit: zero-warning lint, strict TypeScript, Vitest, Husky + commitlint + lint-staged, CI.
- Make strictness and lint/format config inheritable from a single `packages/config` so individual packages cannot drift.
- Wire `scripts/check-mvp-scope.mjs` into both pre-commit and CI.
- Ship `apps/web` and `apps/api` as buildable, runnable _empty shells_ — proof the toolchain works end-to-end without any domain code.

**Non-Goals:**

- Any domain behavior (auth, listings, search, booking, payments, reviews, host-tooling, admin). Those are separate `add-*` tickets.
- Resolving any `[OPEN]` capability decision (token TTL, fees, cancellation tiers, photo storage) — untouched here.
- Prisma domain models or migrations beyond an empty datasource/generator scaffold.
- Production deployment, Docker, secrets management, and hosting — deferred to a later DevOps change.
- Playwright E2E wiring — added with the first real user flow; this change establishes Vitest only.

## Decisions

**D1 — Turbo over Nx.** `project.md` §4 names Turbo as the default and requires an ADR only to choose Nx. The user confirmed Turbo. Turbo's lighter footprint and `package.json`-script-based task model fit an MVP-sized monorepo; no Nx plugin/generator machinery is needed. _Alternative considered:_ Nx — rejected as heavier than the MVP warrants.

**D2 — Single source of config in `packages/config`.** Shared base `tsconfig`, ESLint flat config, Prettier, and Tailwind preset live in `packages/config`; every app/package extends them. This makes the "strict everywhere, zero-warning everywhere" invariant structural rather than per-package discipline. _Alternative:_ duplicate config per package — rejected (drift risk).

**D3 — Turbo `build` task declares `dependsOn: ["^build"]`.** Shared packages (`shared`, `ui`, `config`) must build before the apps consume them. This is encoded in `turbo.json` pipeline topology rather than relying on invocation order.

**D4 — `t()` helper lands here, owned by `platform`.** `packages/shared` hosts the `t(key)` helper + English dictionary with reserved `common`/`error`/`validation` domains. The _runtime behavior_ of `t()` (key format, missing-key marker, backend reuse) is specified by the `platform` capability and `decide-i18n-key-format`; this change only creates the package and a conformant initial implementation, it does not re-specify that behavior. This is why `platform` is **not** listed as a modified capability — we satisfy its existing requirements, we don't change them.

**D5 — MVP-scope guard wired into pre-commit and CI now.** `scripts/check-mvp-scope.mjs` already exists and was explicitly deferred by §3.4 until `package.json` existed. It runs in the Husky `pre-commit` hook (blocks local commits) and as a CI step (blocks merges). It is a Node script with no dependencies, so it runs before/independent of `pnpm install` concerns.

**D6 — Empty-shell apps as a toolchain smoke test.** `apps/api` exposes only a health endpoint; `apps/web` renders only a placeholder. Their value is proving install → lint → typecheck → test → build → run works across the whole graph before any feature ticket starts.

**D7 — Lint zero-warning via `--max-warnings 0`.** The `lint` script in each member (and thus through Turbo) treats any warning as a failure, matching §7's "zero warnings on `pnpm lint`".

## Risks / Trade-offs

- **Dependency/version churn at first install** → Commit `pnpm-lock.yaml`; CI uses `--frozen-lockfile` so the graph is reproducible and drift surfaces as a failed install rather than silent upgrades.
- **shadcn/ui is a generator, not a runtime dep** → `packages/ui` is scaffolded with the shadcn setup (Tailwind preset, `components.json`) and one trivial component to prove the pipeline; component generation happens per-feature later. Avoids over-building a component library no ticket needs yet.
- **ESLint flat-config vs legacy `.eslintrc`** → Use flat config (`eslint.config.js`) as the current ESLint default; centralized in `packages/config` so the choice is made once.
- **Husky hooks not running in CI** → Intentional: hooks guard _local_ commits; CI re-runs the same checks as explicit steps so the gate holds even if a contributor bypasses hooks.
- **Turbo remote caching** → Not configured (no shared cache infra in MVP); local caching only. Revisit with the DevOps change.

## Migration Plan

Greenfield scaffold — no existing runtime to migrate and no data. The change is additive: new files and directories only. Rollback is `git revert` of the change branch; nothing downstream depends on it yet. The work proceeds inside a dedicated worktree/branch per `project.md` §6 and merges via PR with the full CI gate green.

## Open Questions

- None blocking. Playwright E2E harness, Dockerfiles, and deployment/secrets are deliberately deferred to a later DevOps change and are not open questions for this scaffold.

## Implementation Notes (decided during build)

- **Vitest 3, not 2.** Vitest 2.1 depends on Vite 5; with Vite 6 in `apps/web` this produced two Vite copies and a `PluginOption` type clash. Aligned the whole workspace on Vitest 3 (Vite 6 compatible) so a single Vite version resolves. (D1 unaffected — Turbo still the orchestrator.)
- **NodeNext + `.js` import specifiers for Node-consumed packages.** `packages/shared` and `apps/api` emit/run as Node ESM, so their relative imports carry explicit `.js` extensions and their tsconfigs override the base `Bundler` resolution to `NodeNext`. `packages/ui` and `apps/web` stay on `Bundler` (consumed by Vite). The base config keeps `Bundler` as the default.
- **`declaration: false` for apps.** `apps/api`/`apps/web` are not libraries; emitting `.d.ts` triggered TS2742 (Express `Router` type not portably nameable). Apps disable declaration emit; library packages (`shared`, `ui`) keep it.
- **`no-undef` disabled in shared ESLint config.** TypeScript already resolves identifiers; the core rule is redundant and would otherwise require per-package DOM/Node global lists. Lets every member re-export the one shared flat config unchanged.
- **`@types/node` added to `shared` and `db`.** The universal `t()` helper uses `console`; the seed script uses Node globals. Base `lib` is ES2022 only (no ambient `console`), so these two packages pin `types: ["node"]`.
- **`onlyBuiltDependencies` in `pnpm-workspace.yaml`.** pnpm 11 blocks post-install scripts by default; Prisma client generation and esbuild's native binary are explicitly allow-listed so `pnpm install --frozen-lockfile` works in CI.
- **Root `package.json` is `type: module`.** Lets the root `eslint.config.js`, `prettier.config.js`, and `commitlint.config.js` use ESM and re-export from `@nomadhome/config`.
- **CI command corrected to `openspec validate --all --strict`.** The bare `openspec validate --strict` is a no-op (requires a selector); the spec requirement + scenario were updated to match. Spec-vs-reality drift fixed in the spec per `project.md` §6 / CLAUDE.md context rule 7.
- **CI uses Node 22 + Corepack (not `pnpm/action-setup`).** pnpm 11.1.2 requires Node ≥ 22.13. `pnpm/action-setup`'s self-installer ignores the `setup-node` Node and runs on the runner's default (20.x), so it can't install pnpm 11. Corepack (bundled with Node 22) provides pnpm from the `packageManager` field and runs it on the `setup-node` Node. Node 22 still satisfies the project's `engines.node >= 20.19.0` app-runtime floor — the toolchain simply needs newer than the runtime. `cache: pnpm` was dropped (it requires pnpm before `setup-node`); store caching is a follow-up.
- **`packages/db/turbo.json`.** Prisma generates into `node_modules`, so the db `build` task declares empty `outputs` to silence Turbo's "no output files" warning.
