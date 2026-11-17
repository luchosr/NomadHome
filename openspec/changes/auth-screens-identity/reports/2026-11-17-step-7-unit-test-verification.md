# Step 7: unit test verification (NH-125, auth-screens-identity)

Worktree `nomadhome-worktrees/NH-125`, branch `feature/NH-125-auth-screens-identity`, HEAD `72309f5`.
Env for the run: `DATABASE_URL=postgresql://nomadhome:nomadhome@localhost:5432/nomadhome_test`,
`JWT_SECRET=0123456789abcdef0123456789abcdef` (the `become-host` API test needs a >= 32 char secret;
known pre-existing fragility). No database was started and the `nomadhome` dev database was not touched.

## 6.x review of existing tests

- `FormField`, `ServerErrorAlert`, `LoginPage`, `RegisterPage`, `VerifyEmailPage`, `BecomeHostPage`
  tests and the e2e specs `auth.spec.ts`, `us-1.1-registration.spec.ts`, `us-1.3-become-host.spec.ts`
  were reviewed. `git diff origin/main` on the three page test files has zero removed lines (additions
  only), so no existing assertion was edited or weakened and none was stale.
- Text queries still resolve to one node with title and subtitle sharing the band (all green).
- `BecomeHostPage.test.tsx` passes unchanged (3 tests); its three `findByRole("alert")` assertions
  match exactly one element.
- `BecomeHostPage` visual diff (design.md D8; screenshots `become-host-errors-1440.png` and `-360.png`):
  field labels are now bold ink; field errors now carry the 4px danger left rule with bold 14px danger
  text and are linked through `aria-describedby`; the form-level error (when shown) uses the solid danger
  edge, tint fill and filled marker tile. Unchanged: page title and subtitle, spacing, inputs, the
  black submit, and the terms checkbox with its `text-xs` danger message (follow-up in design.md).
  Layout and widths are identical and nothing overflows at 360 px.

## 7.1 commands and totals (turbo, cache bypassed with `pnpm test -- --force`)

| Command                                                                          | Result                                                                                                |
| -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `pnpm --filter @nomadhome/web exec vitest run src/pages/BecomeHostPage.test.tsx` | 1 file, 3 tests passed                                                                                |
| `pnpm test`                                                                      | shared 34, db 2, ui 70, web 214 (35 files), api 144 (20 files): 464 tests passed, 0 failed; 8/8 tasks |
| `pnpm lint`                                                                      | 8/8 tasks successful, eslint `--max-warnings 0` clean                                                 |
| `pnpm typecheck`                                                                 | 8/8 tasks successful                                                                                  |
| `pnpm build`                                                                     | 5/5 tasks successful                                                                                  |

Web changed-file tests in the run: `AuthShell` 6, `FormField` 6, `ServerErrorAlert` 6, `AuthIdentityContent` 5,
`LoginPage` 15, `VerifyEmailPage` 9 (all green).

Diff coverage as CI runs it (`pnpm --filter @nomadhome/web coverage`, lcov prefixed with `apps/web/`,
`diff-cover` 10.0.0 `--compare-branch=origin/main --fail-under=80`): **100%** (202 changed lines, 0 missing;
AuthShell, FormField, ServerErrorAlert, LoginPage, RegisterPage, VerifyEmailPage each 100%).

## 7.2 database state: not applicable, justification check

`git diff origin/main --stat -- apps/api packages/db packages/shared/src/schemas apps/web/src/api` prints
nothing (0 lines). The full `git diff origin/main --stat` lists only `apps/web/**` and
`openspec/changes/auth-screens-identity/**`. No step starts a database. Justification holds.
