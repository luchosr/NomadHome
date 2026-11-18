# Step 5: unit test verification (booking-payment-identity, NH-124)

Date: 2026-11-18. Branch `feature/NH-124-booking-payment-identity`, HEAD `fc29792`.
Env for API/DB suites: `DATABASE_URL=postgresql://nomadhome:nomadhome@localhost:5432/nomadhome_test`,
`JWT_SECRET=0123456789abcdef0123456789abcdef`. The `nomadhome` dev database was never used and no database was started.

## 5.1 Commands and totals

| Command                                                                                                                         | Result                                                                                                                                |
| ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm install --frozen-lockfile`                                                                                                | up to date                                                                                                                            |
| `pnpm exec turbo run test --force` (uncached)                                                                                   | 8/8 tasks successful. shared 5 files / 34 tests; ui 8 / 70; db 1 / 2; web 38 / 299; api 20 / 144. Total 72 files, 549 tests, 0 failed |
| `pnpm lint`                                                                                                                     | 8/8 tasks successful (eslint `--max-warnings 0`)                                                                                      |
| `pnpm typecheck`                                                                                                                | 8/8 tasks successful                                                                                                                  |
| `pnpm build`                                                                                                                    | 5/5 tasks successful                                                                                                                  |
| `pnpm --filter @nomadhome/web coverage`                                                                                         | 38 files / 299 tests; the eight changed source files 100% lines (EmptyState and Modal have an uncovered branch each)                  |
| `diff-cover coverage/lcov.info --compare-branch=origin/main --fail-under=80` (lcov from web with the `apps/web/` prefix, as CI) | exit 0. 334 changed lines, 1 missing (`BookingFormPage.tsx:168`), 99%                                                                 |

Targeted files (all in the 299): BookingFormPage 26, MyBookingsPage 16, ReviewModal 13, BookingSuccessPage 12, CancelBookingModal 9,
BookingCancelPage 6, Modal 4, BookingCopy 4, EmptyState 3.

## 4.1/4.2 Existing tests and other users of the changed pieces

- Other users of `Modal` and `EmptyState` found with `rg`: `HostUpcomingPage` (2 tests), `HostListingsPage` (6 tests) and
  `MyBookingsPage`; all pass unmodified. No test was edited in this verification pass; nothing was weakened.
- Nothing under `packages/ui` changed, so every other `Badge` and `Card` user is untouched.
- The single-match text queries (`/cancel/`, "Cancelled") resolve to one node (covered by the extended MyBookingsPage tests).

## 5.2 Database state: not applicable (justification check)

`git diff origin/main --stat -- apps/web/src/api apps/api packages/shared packages/db packages/ui` is empty. The change is frontend only and
no database step ran. The justification holds.
