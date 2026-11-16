# Step 8-10: unit tests, backend N/A proof and e2e verification

Change: `warm-palette-swap` (NH-129). Run on 2026-11-17 from the NH-129 worktree.

## Commands and results

| Command                                                                | Result                                                                           |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `pnpm lint`                                                            | 8 of 8 tasks successful, zero warnings                                           |
| `pnpm typecheck`                                                       | 8 of 8 tasks successful                                                          |
| `pnpm build`                                                           | 5 of 5 tasks successful                                                          |
| `pnpm test` (shared / db / ui / web / api)                             | 29 / 2 / 70 / 140 / 144 tests passed                                             |
| `pnpm test:e2e`                                                        | 49 passed (45 existing plus 4 new computed-style tests in `focus-hover.spec.ts`) |
| `node scripts/check-mvp-scope.mjs`                                     | clean                                                                            |
| `openspec validate warm-palette-swap --strict`                         | valid                                                                            |
| `rg -i "#FFC700\|#00704A\|#0A0A0A\|signal\|sign-green"` (source paths) | matches only negative-guard tests                                                |

API tests ran with `DATABASE_URL` pointing at the disposable `nomadhome_test`
database and a 32-character `JWT_SECRET`. The development database was not used.

## Database state (8.2): N/A

This change touches no backend, API, Prisma schema or data. The web and UI
packages do not access a database. No database snapshot was taken for this
change; the API test run above only exercised the unchanged backend.

## Endpoint testing (9.1): N/A

No endpoint is added or changed. Proof:

`git diff --stat origin/main -- apps/api packages/db packages/shared` prints
nothing (no changes in those paths).

## E2E and visual checks (10.x)

- Existing specs needed no selector changes beyond the colour assertions in
  `layout.spec.ts` (done in the red phase).
- Landing and search were walked at 1440 px and 360 px by the independent
  finish review (disposition `ship`) and by the focus/hover verification; see
  `2026-11-17-focus-hover-verification.md` and `screenshots/`.
- No horizontal overflow and no clipped text at either width.
