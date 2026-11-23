# Design: booking-admin-error-states

## Decision 1: Success page states

Current: `waiting = bookingId && !confirmed && !timedOut`; every other path falls through to the confirmed view.

New state model, derived from one `status` value: `"polling" | "confirmed" | "pending" | "missing"`.

| Situation                                                               | Rendered                                                                                                                                                             |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bookingId` present, polling in progress                                | Existing waiting panel (unchanged)                                                                                                                                   |
| Status `CONFIRMED` or `COMPLETED`                                       | Existing confirmed sign panel                                                                                                                                        |
| Timeout reached without confirmation (including when all polls errored) | "Still processing" panel: payment received/being confirmed, check My bookings shortly; link to `/bookings`. Not green, no check tile, no `h1` claiming confirmation. |
| `bookingId` missing                                                     | Not a success. Proposed: neutral "We could not find your booking" panel with link to `/bookings` (no polling, no sync call).                                         |

Rationale: transient errors are already retried until the deadline, so an error only matters at timeout, where it falls into the processing state. No separate error state is needed; the processing copy is truthful in both cases (unknown, not failed).

Alternative for missing id: redirect to `/bookings`. Rejected as default because silent redirects hide why the guest landed there; a short panel costs one string. Open for user decision.

Polling interval, timeout, `syncPayment` call and `authLoading` gating do not change.

## Decision 2: Error feedback pattern

Reuse `getDisplayMessage` (`src/api/client`) and `ServerErrorAlert`, as `CancelBookingModal` does, for My Bookings complete-payment and admin actions. No new abstraction; StatePanel/StatusTag refactors are out of scope.

## Decision 3: Admin pending state

Single `pendingId: string | null` per page (one in-flight action at a time per page), disabling only the matching row's button, cleared in `finally`. Error cleared at the start of the next action. Concurrent actions on different rows are intentionally not supported to keep state minimal.

## Decision 4: Strings

Add keys under the existing `booking.ui` and `admin` groups in `packages/shared/src/strings/en.ts`, following `strings/README.md`.
