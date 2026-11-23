# Proposal: booking-admin-error-states

## Why

NH-146 (GitHub issue #146, group 2: errors and states) lists four frontend defects where the UI lies or goes silent:

1. `BookingSuccessPage` shows the green "Booking confirmed!" view on poll timeout, on a swallowed transient error, and when `bookingId` is missing. A guest whose payment is not yet confirmed (or who landed on the URL by hand) is told the booking is confirmed.
2. `MyBookingsPage.handleCompletePayment` has `try/finally` and no `catch`; a failed checkout call produces no feedback.
3. `BookingFormPage` renders raw ISO `checkIn`/`checkOut` strings instead of formatted dates.
4. `AdminUsersPage` and `AdminListingsPage` disable/enable actions have no pending state and no error handling; double clicks are possible and failures are invisible.

All four are fixable in `apps/web` with existing building blocks (`getDisplayMessage`, `ServerErrorAlert`, `formatDate`, existing `checkingOut` pending state). No backend change.

## What

- **Success page**: show the confirmed view only when the booking status is `CONFIRMED` or `COMPLETED`. Otherwise show a distinct "still processing" state with a link to My bookings. Define the missing-`bookingId` behavior (see design.md).
- **My Bookings**: a failed "Complete payment" shows a visible error (same pattern as `CancelBookingModal`), and the user can retry.
- **Booking form**: stay summary renders check-in/check-out via `formatDate`.
- **Admin users and listings**: per-row pending state (`pendingId`) disables the row's action button while a request is in flight; a failed disable/enable shows a visible error.
- New user-facing strings go in `packages/shared/src/strings/en.ts` and are read via `t()`.

## Impact

- **Capabilities affected**:
  - `booking`: MODIFIED "Booking success page" (adds pending/missing-id scenarios; confirmed only when confirmed); MODIFIED "Booking form page" (formatted dates scenario); ADDED requirement for My Bookings "Complete payment" error feedback (no existing requirement mentions it in `openspec/specs`; confirmed by search).
  - `platform`: MODIFIED "Booking success page is a sign panel". It currently states that the no-`bookingId` and timed-out paths render the success copy, and that the "state logic MUST NOT change". Both clauses conflict with this change and must be amended in the delta.
  - `admin`: ADDED requirement for admin users/listings pages (pending and error feedback on disable/enable). Existing admin requirements describe only API behavior; no UI-behavior requirement exists for these actions.
- **Breaking changes**: no. Polling interval (2s), timeout (30s) and payment sync call are unchanged; only what is rendered after them changes.
- **Migration required**: no.
- **Out of scope**: star aria-labels, gallery alts, layout/table issues, DateRangePicker styling, StatusTag/StatePanel refactors, become-host aria-describedby, e2e Enter/Space moderation, any other item in #146, backend changes, changing poll/timeout timings.

## Risks & Mitigations

| Risk                                                                                            | Likelihood | Mitigation                                                                                                                             |
| ----------------------------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Platform spec "state logic MUST NOT change" is violated by the fix                              | Certain    | Amend that requirement in the delta; keep poll/sync/timeout timings untouched and state precisely what changes (final rendering only). |
| Existing tests (`BookingCopy.test.ts`, success page tests) assert success copy on timeout/no id | Medium     | QA red phase updates them from the delta scenarios.                                                                                    |
| Guest paid but webhook is slow, sees "processing" instead of success                            | Medium     | Processing state links to My bookings, where status updates; copy says payment is being confirmed, not failed.                         |
| Two admins/rows acting concurrently, or stale list after error                                  | Low        | Per-row `pendingId` only blocks that row; list refetch on success is unchanged.                                                        |
| New strings drift from `strings/README.md` conventions                                          | Low        | Follow README key naming; covered by existing strings tests.                                                                           |

## Rollout

Big bang in a single PR (frontend only, no flags, no migration). Revert is a plain git revert.
