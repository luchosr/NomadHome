# Step 5: unit test verification (admin-identity, NH-123)

Date: 2026-11-18. Branch `feature/NH-123-admin-identity`, HEAD `e8f9ff6` (plus the verification commits).
Env for API/DB suites: `DATABASE_URL=postgresql://nomadhome:nomadhome@localhost:5432/nomadhome_test`,
`JWT_SECRET=0123456789abcdef0123456789abcdef`. The `nomadhome` dev database was never used and no database was started by this change.

## 5.1 Commands and totals

| Command                                                                                                                    | Result                                                                                                                                |
| -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm install --frozen-lockfile`                                                                                           | up to date                                                                                                                            |
| `pnpm exec turbo run test --force` (uncached)                                                                              | 8/8 tasks successful. shared 5 files / 34 tests; ui 8 / 70; db 1 / 2; web 46 / 461; api 20 / 144. Total 80 files, 711 tests, 0 failed |
| `pnpm lint`                                                                                                                | 8/8 tasks successful (eslint `--max-warnings 0`)                                                                                      |
| `pnpm typecheck`                                                                                                           | 8/8 tasks successful                                                                                                                  |
| `pnpm build`                                                                                                               | 5/5 tasks successful                                                                                                                  |
| `pnpm --filter @nomadhome/web exec vitest run --coverage`                                                                  | 46 files / 461 tests green                                                                                                            |
| `diff-cover coverage/lcov.info --compare-branch=origin/main --fail-under=80` (web lcov with the `apps/web/` prefix, as CI) | exit 0. 242 changed lines, 0 missing, 100% (`AdminUsersPage.tsx` 100%, `AdminListingsPage.tsx` 100%)                                  |

diff-cover 10.x ran from the venv at `/private/tmp/claude-501/pw-nh122/venv`. Only the web lcov was used: no other package has a changed
source line (test files, specs and docs are not in lcov).

Targeted files (all inside the 461): AdminUsersPage 24, AdminListingsPage 24, AdminCopy 6, ListingStatusTag 5, ListingCard 10,
SearchPage 11, HostListingsPage 20, HostUpcomingPage 21, Layout 10 (131 tests, 9 files, run on their own as well).

## 4.1/4.2 Existing tests and other users of the changed pieces

- Files changed vs `origin/main` among tests and specs: `AdminUsersPage.test.tsx` and `AdminListingsPage.test.tsx` (extended, plus the declared
  scoping of the duplicate-DOM queries), the new `AdminCopy.test.ts`, the new `e2e/admin-identity.spec.ts`, and the declared scoping edits
  to `e2e/us-8.1-admin-users.spec.ts` (5 lines) and `e2e/us-8.2-admin-listings.spec.ts` (7 lines). No other test or spec was modified.
- Other consumers of `Badge`, `ListingStatusTag` and `Card` (`ListingCard`, `SearchPage`, `HostListingsPage`, `HostUpcomingPage`,
  `Layout`, `ListingStatusTag` own test, plus the `packages/ui` suite) pass unmodified.
- `focus-hover.spec.ts` and `layout.spec.ts` pass unedited (see the step 7 report).
- No admin page imports `Badge` any more (checked by `rg` and by a unit assertion). Nothing under `packages/ui` changed.

## 5.2 Database state: not applicable (justification check)

`git diff origin/main --stat -- apps/api packages apps/web/src/api apps/web/src/components` is empty (0 lines). The change is frontend only,
`ListingStatusTag.tsx` is reused and not edited, and no database step ran. The justification holds.

## Copy guard

`AdminCopy.test.ts` (6 tests) is green: no `t()` key or string value changed for `admin.users.*`, `admin.listings.*`,
`host.listings.status_*` or `error.generic.unexpected`, and every key these screens read exists.
