# Step 5: unit test verification (button-link-variants, NH-138)

Date: 2026-11-19. Branch `feature/NH-138-button-link`. `@nomadhome/shared` and `@nomadhome/ui` were built before every web check.

## Review finding and fix

| Item              | Detail                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Finding           | `BookingFormPage` back link concatenated `buttonVariants({ variant: "tertiary" })` with `px-2 underline hover:no-underline` as plain strings. The variant base carries `no-underline`, so both `no-underline` and `underline` were present and the link was never underlined at rest (spec and design D6 violation).                                                                                                                                                                                                                                |
| Red               | Commit `test(web): assert booking form back link underline (NH-138)`: unit assertion that the merged class string has no `no-underline` and no `hover:underline` (failed: `no-underline` present), plus an e2e assertion on computed `text-decoration-line` (`underline` at rest, `none` on hover) at 1440 and 360 (both failed: received `none` at rest).                                                                                                                                                                                          |
| Fix               | Commit `fix(web): keep the booking form back link underlined (NH-138)`: the back link uses `cn(buttonVariants({ variant: "tertiary" }), "px-2 underline hover:no-underline")`. Every other call site that appends classes to `buttonVariants` (ListingDetail, HostListings, BookingSuccess, BookingCancel, VerifyEmail) also uses `cn`, so extensions are merged by tailwind-merge.                                                                                                                                                                 |
| Helper adjustment | `apps/web/src/test/buttonLink.ts` `expectButtonLink` gained an optional fourth argument `overridden`: variant classes that an extension deliberately overrides are asserted absent instead of present. Only the back link uses it (`no-underline`, `hover:underline`, `px-0`). Justification: tailwind-merge correctly drops those three classes, and the old helper required every raw variant class, which encoded the bug. No other call site needed a helper change (their extensions are `w-full`, `sm:w-auto`, `mt-6`, which do not collide). |

## Commands and results

| Command                                                                                    | Result                                                                                   |
| ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| `pnpm lint` (eslint `--max-warnings 0`)                                                    | pass, zero warnings                                                                      |
| `pnpm typecheck`                                                                           | pass                                                                                     |
| `pnpm --filter @nomadhome/shared build`, `pnpm --filter @nomadhome/ui build`, `pnpm build` | pass                                                                                     |
| `pnpm coverage` (all workspaces; api with `DATABASE_URL` set to `nomadhome_test` only)     | db 2/2, shared 34/34, ui 96/96, web 481/481 (48 files), api 144/144 (20 files): all pass |
| `openspec validate button-link-variants --strict`                                          | valid                                                                                    |
| `openspec validate --specs --strict`                                                       | 12 passed, 0 failed                                                                      |
| `node scripts/check-mvp-scope.mjs`                                                         | clean                                                                                    |

## Diff coverage

`diff-cover` of `apps/web` and `packages/ui` lcov (paths prefixed with the package directory) against `origin/main`: **100%** (64 changed instrumented lines, 0 missing).

## Audit

`rg -n "FLAT_SECONDARY|FLAT_CARD_CLASS|![box-shadow:none]|ring-1" apps packages openspec/specs`: remaining hits are only the negative assertions in `buttonLinkAudit.test.ts`, `AdminUsersPage.test.tsx`, `AdminListingsPage.test.tsx`, `test/buttonLink.ts`, and three historical mentions in `openspec/specs/platform/spec.md`, which the archive sync rewrites (not edited here by design).

## Database state: not applicable

Scope is `packages/ui` and `apps/web`. `git diff origin/main --stat -- apps/web/src/api apps/api packages/shared packages/db` is empty. The api suite ran against `nomadhome_test` only because the workspace `coverage` script runs it; no other database was touched.
