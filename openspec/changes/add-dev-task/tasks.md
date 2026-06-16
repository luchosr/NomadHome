# Tasks: add-dev-task

## 1. Turbo dev pipeline

- [x] 1.1 Add a `dev` task to `turbo.json` with `persistent: true`, `cache: false`, `dependsOn: ["^build"]`
- [x] 1.2 Add root `package.json` scripts: `"dev": "turbo run dev"`, `"dev:api"`, `"dev:web"` (filtered)

## 2. Verification

- [x] 2.1 From a clean state (remove workspace `dist/`), run `pnpm dev:api`; confirm `@nomadhome/shared` builds first and the API health endpoint returns a healthy status, then stop the server
- [x] 2.2 Confirm `turbo.json` and root `package.json` match the spec scenario (persistent, cache:false, `^build`, `turbo run dev`)
- [x] 2.3 Run `pnpm lint && pnpm typecheck && pnpm test && pnpm build` — all green (no regression)
- [x] 2.4 Run `openspec validate add-dev-task --strict` and `node scripts/check-mvp-scope.mjs` — both pass

## 3. Docs

- [x] 3.1 Note the `pnpm dev` / `pnpm dev --filter=<app>` workflow in the repo README (or apps/api README) so the one-command flow is discoverable
