## Why

Running an app in dev mode (e.g. `pnpm --filter @nomadhome/api dev`) fails on a fresh checkout with `ERR_MODULE_NOT_FOUND` for `@nomadhome/shared/dist/strings/en.js`. Workspace library packages are consumed through their compiled `dist/` output (git-ignored), but `tsx`/Vite only compile the app's own code — not sibling packages. So `@nomadhome/shared` must be built first, and there is no one-command dev workflow that guarantees it. Contributors have to remember to run `pnpm build` before any dev server starts. This is a sharp DX edge introduced by `init-monorepo` and surfaced immediately after it merged.

## What Changes

- Add a `dev` task to `turbo.json`: `persistent: true`, `cache: false`, `dependsOn: ["^build"]` so a package's workspace dependencies are built before its dev server starts.
- Add root scripts: `"dev": "turbo run dev"`, plus per-app `"dev:api"` / `"dev:web"` that run `turbo run dev` filtered to one app.
- Result:
  - `pnpm dev` builds `shared`/`ui`/`config`, then boots the `apps/web` and `apps/api` dev servers together.
  - `pnpm dev:api` builds only the API's deps (`shared`), then runs just the backend — no more "remember to build shared." (`pnpm dev --filter=...` can't be used here: pnpm treats `--filter` as its own flag and would bypass Turbo's `^build` ordering, which is the original broken path.)
- No new dependencies; `apps/api` and `apps/web` already expose `dev` scripts.

## Capabilities

### New Capabilities

<!-- None. -->

### Modified Capabilities

- `build-tooling`: adds a requirement for a one-command Turbo `dev` workflow that builds workspace dependencies before starting persistent dev servers. Extends the existing task-orchestration behavior; does not change any existing requirement.

## Impact

- **Files**: `turbo.json` (new `dev` task), root `package.json` (new `dev` script).
- **No breaking changes, no new dependencies, no data/migration impact.**
- **Out of scope**: changing how library packages are consumed (dist vs. source) — the Turbo `^build` dependency is sufficient and keeps the published `exports` contract intact. Pointing `exports` at source for a dev condition is a possible future optimization, not needed here.
