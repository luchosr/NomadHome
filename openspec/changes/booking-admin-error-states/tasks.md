# Tasks: booking-admin-error-states

Order is TDD: QA red (section 1), Frontend green (section 2), E2E (section 3), docs (section 4). All paths are relative to the worktree root. No backend, `apps/api/`, `packages/db/` or `apps/web/src/api/` change.

New keys (added in task 2.1, asserted by red tests in 1.1): `booking.ui.processing_title` "Still processing", `booking.ui.processing_message` "We have not confirmed your payment yet. This can take a few minutes, so check My bookings shortly.", `booking.ui.not_found_title` "We could not find your booking", `booking.ui.not_found_message` "Open My bookings to see your reservations.". No new admin or dashboard strings (errors come from `getDisplayMessage`).

## 1. QA red (tests first; they fail until section 2)

- [x] 1.1 Update `apps/web/src/pages/BookingCopy.test.ts`: assert the four new `booking.ui` keys and values above; keep every existing literal unchanged; drop any assumption that the success page source has no branching copy. Commit `test(web): red copy guard for booking success states (NH-146)`.
- [x] 1.2 Update `apps/web/src/pages/BookingSuccessPage.test.tsx`: replace the "no booking id" and "timed-out path renders the same ember panel and copy" tests with the delta scenarios (timeout shows Still processing panel in a stone panel, no `.bg-ember`, no check tile, one `h1`, single `/bookings` link, no confirmation title; every poll rejected until timeout shows the same panel; missing id shows not-found panel and `mockGetById` and `mockSyncPayment` are never called); keep confirmed and waiting scenarios and the 2s/30s timings unchanged.
- [x] 1.3 Update `apps/web/src/pages/BookingFormPage.test.tsx` (lines asserting `2026-08-01` / `2026-08-04` as text): assert `formatDate` output for both dates, assert raw ISO strings are not shown, and assert the `POST /bookings` payload still carries the ISO values.
- [x] 1.4 Update `apps/web/src/pages/MyBookingsPage.test.tsx`: add scenarios for failed checkout (alert with `getDisplayMessage` text, no redirect), retry (error cleared on next click, button enabled after failure) and success (redirect, no error).
- [x] 1.5 Update `apps/web/src/pages/AdminUsersPage.test.tsx`: add scenarios for row button disabled while the request is in flight (second click sends no second request), failed disable/enable shows an alert and re-enables the button, error clears on next action, success refetches.
- [x] 1.6 Update `apps/web/src/pages/AdminListingsPage.test.tsx`: same four scenarios as 1.5 for listings.
- [x] 1.7 Run `pnpm --filter @nomadhome/web test` and confirm only the new/updated tests fail for the expected reasons; report failing names. No production code touched.

## 2. Frontend green

- [x] 2.1 Add the four new `booking.ui` keys to `packages/shared/src/strings/en.ts` following `packages/shared/src/strings/README.md`; keep existing keys unchanged. Run shared string tests and `BookingCopy.test.ts`.
- [x] 2.2 `apps/web/src/pages/BookingSuccessPage.tsx`: derive state `polling | confirmed | pending | missing`; confirmed only for `CONFIRMED`/`COMPLETED`; timeout or exhausted poll errors render the neutral Still processing panel (stone, 2px ink edge, `role="status"`, one `h1`, single `/bookings` link, no check tile, no ember); missing `bookingId` renders the neutral not-found panel and starts no polling and no sync; poll interval, timeout, `syncPayment` call and `authLoading` gating unchanged. Make 1.2 pass.
- [x] 2.3 `apps/web/src/pages/BookingFormPage.tsx`: render check-in and check-out via `formatDate` from `../lib/dates.js`; leave payloads ISO. Make 1.3 pass.
- [x] 2.4 `apps/web/src/pages/MyBookingsPage.tsx`: add `catch` to `handleCompletePayment`; store `getDisplayMessage(err)` in state, clear it at the start of each attempt, render with `ServerErrorAlert`; keep `finally` resetting `checkingOut`. Make 1.4 pass.
- [x] 2.5 `apps/web/src/pages/AdminUsersPage.tsx`: add `pendingId` and an error state; disable only the matching row button while pending; `catch` sets the `getDisplayMessage` error shown with `ServerErrorAlert`; clear error at action start and `pendingId` in `finally`; keep refetch on success. Make 1.5 pass.
- [x] 2.6 `apps/web/src/pages/AdminListingsPage.tsx`: same as 2.5 for listings. Make 1.6 pass.
- [x] 2.7 Verify and refactor: run `pnpm lint`, `pnpm typecheck`, `pnpm --filter @nomadhome/web test`, `pnpm --filter @nomadhome/shared test`, `pnpm build`; confirm `rg` finds no `packages/shared` change other than `strings/en.ts`, and no `console.log`.

## 3. E2E

- [ ] 3.1 Update `apps/web/e2e/booking-payment-identity.spec.ts` and `apps/web/e2e/us-4.1-booking.spec.ts` where they assume the success panel on timeout or missing id or raw ISO dates: success only after confirmed status; add a missing-`bookingId` case asserting the not-found panel and `/bookings` link. Check `apps/web/e2e/button-link-variants.spec.ts` for success-page assumptions and adjust only if broken.
- [ ] 3.2 Update `apps/web/e2e/us-8.1-admin-users.spec.ts` and `apps/web/e2e/us-8.2-admin-listings.spec.ts` (and `apps/web/e2e/admin-identity.spec.ts` only if broken) with a failed-action alert case via route interception, if the suite already stubs the admin API; otherwise note the gap. Run the affected Playwright specs headless.

## 4. Docs

- [ ] 4.1 Update `apps/web/DESIGN.md` booking and payment paragraphs (around lines 140 and 274) to mention the neutral Still processing and not-found panels beside the ember success panel; no token or colour change.
- [ ] 4.2 Run `openspec validate booking-admin-error-states --strict` and tick all tasks in this file.
