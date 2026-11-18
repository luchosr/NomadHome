# Step 5: unit test verification (host-identity, NH-122)

Date: 2026-11-18. Branch `feature/NH-122-host-identity`, HEAD `fd46983` (plus the verification commits).
Env for API/DB suites: `DATABASE_URL=postgresql://nomadhome:nomadhome@localhost:5432/nomadhome_test`,
`JWT_SECRET=0123456789abcdef0123456789abcdef`. The `nomadhome` dev database was never used and no database was started.

## 5.1 Commands and totals

| Command                                                                                                                    | Result                                                                                                                                |
| -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm install --frozen-lockfile`                                                                                           | up to date                                                                                                                            |
| `pnpm exec turbo run test --force` (uncached)                                                                              | 8/8 tasks successful. shared 5 files / 34 tests; ui 8 / 70; db 1 / 2; web 45 / 413; api 20 / 144. Total 79 files, 663 tests, 0 failed |
| `pnpm lint`                                                                                                                | 8/8 tasks successful (eslint `--max-warnings 0`)                                                                                      |
| `pnpm typecheck`                                                                                                           | 8/8 tasks successful                                                                                                                  |
| `pnpm build`                                                                                                               | 5/5 tasks successful                                                                                                                  |
| `pnpm --filter @nomadhome/web coverage`                                                                                    | 45 files / 413 tests; all twelve changed source files 100% diff coverage                                                              |
| `diff-cover coverage/lcov.info --compare-branch=origin/main --fail-under=80` (web lcov with the `apps/web/` prefix, as CI) | exit 0. 464 changed lines, 0 missing, 100%                                                                                            |

diff-cover 10.x was installed into a venv under `/private/tmp/claude-501/pw-nh122/venv`. Only the web lcov was merged: no other package has a
changed source line.

Targeted files (all in the 413): HostListingsPage 20, HostUpcomingPage 21, CreateListingPage 13, EditListingPage 19, BecomeHostPage 10,
ListingDetailsForm 8, ListingPhotosCard 8, ListingAvailabilityCard 8, AmenityCheckboxGrid 5, ListingStatusTag 5, listingFormStyles 5,
HostCopy 8.

## 4.1/4.2 Existing tests and other users of the changed pieces

- Other consumers of `EmptyState`, `Modal`, `Badge` and `Card` found with `rg`: `MyBookingsPage`, `SearchResults`, `SearchPage`, `ListingCard`, `AdminUsersPage`,
  `AdminListingsPage` (3 tests), `CancelBookingModal`, `ReviewModal`, `EmptyState` and `Modal` own tests. All pass unmodified in the 413.
- Nothing under `packages/ui`, `Modal.tsx` or `EmptyState.tsx` changed, so every other `Badge`, `Card`, `Modal` and `EmptyState` user is untouched.
- The only existing test or spec edited by the implementation is `apps/web/e2e/us-7.1-host-dashboard.spec.ts` (5 lines: text queries filter to
  the visible match because the bookings page now renders both a table and a card list; task 3.9). No assertion was weakened.
- `us-1.3`, `us-2.1`, `us-2.2` (strict `getByText("Draft")` and `getByText("Published")`), `us-2.3`, `focus-hover` and `layout` specs pass unedited
  (see the step 7 report).

## 5.2 Database state: not applicable (justification check)

`git diff origin/main --stat -- apps/api packages apps/web/src/api apps/web/src/components/Modal.tsx apps/web/src/components/EmptyState.tsx`
is empty. The change is frontend only and no database step ran. The justification holds.

## Copy guard

`HostCopy.test.ts` (8 tests) is green: no `t()` key or string value changed for `host.*`, `identity.become_host.*`,
`booking.dashboard.status_*` or `error.generic.unexpected`.
