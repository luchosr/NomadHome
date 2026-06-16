## Context

`init-monorepo` consumes workspace library packages (`@nomadhome/shared`, `@nomadhome/ui`) through their `exports` map, which points at compiled `dist/`. `tsx` (api) and Vite (web) compile only the app's own sources, not sibling packages, and `dist/` is git-ignored. So any dev server fails until `pnpm build` has run — which a contributor must remember. This was hit immediately after `init-monorepo` merged.

## Goals / Non-Goals

**Goals:**

- `pnpm dev` (and filtered variants) "just work" on a fresh checkout with no manual pre-build.
- Keep the published `exports` (dist) contract intact — it's what makes the packages consumable in production/CI.

**Non-Goals:**

- Switching library consumption from `dist` to source via a dev export condition. That's a heavier change with its own trade-offs (type-resolution, build parity) and isn't needed: Turbo's `^build` ordering solves the dev case cleanly.
- Adding watch/rebuild of library packages during dev. If shared changes mid-session, re-running `pnpm dev` rebuilds it; live library watch is a future optimization.

## Decisions

**D1 — Turbo `dev` task with `dependsOn: ["^build"]`, `persistent`, `cache: false`.** `^build` makes Turbo compile a package's upstream workspace deps before its dev server starts, so `dist/` always exists. `persistent: true` tells Turbo the task is long-running (it won't wait for it to "finish" and won't let other tasks depend on it). `cache: false` because a dev server has no cacheable output. _Alternative considered:_ a `predev` npm script per app that builds shared — rejected as duplicative and order-fragile across packages.

**D2 — `pnpm dev` for all apps; `dev:api`/`dev:web` for one.** `turbo run dev` starts every package's `dev` task (api + web). Per-app scripts (`dev:api`, `dev:web`) run `turbo run dev --filter=<app>` so Turbo still honors `^build` for that app's deps. Dedicated scripts are required because `pnpm dev --filter=<app>` would have pnpm interpret `--filter` as its own flag and run the app's `dev` script directly — bypassing Turbo and the `^build` ordering (the original broken path). _Alternative considered:_ `pnpm dev -- --filter=<app>` pass-through — rejected as non-obvious vs. a named script.

## Risks / Trade-offs

- **Stale library `dist` during a session** → If `@nomadhome/shared` is edited while `pnpm dev` runs, the app won't pick it up until `dev` is restarted (no library watch). Acceptable for MVP; documented as a non-goal.
- **Persistent-task ergonomics** → `turbo run dev` interleaves both servers' logs in one terminal. Fine for MVP; a dev can still run a single app via `--filter`.
