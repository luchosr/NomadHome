# Proposal: add-guest-dashboard-ui

## Why

Guests can now book listings (NH-020) but have no way to view, cancel, or review their bookings. This ticket adds the guest-facing `/bookings` dashboard (NH-021).

## What Changes

- **Backend**: `GET /bookings/me` now includes listing title in each booking row (add `include: { listing: { select: { title: true } } }` to `findByGuest`).
- **`MyBookingsPage`** (`/bookings`, ProtectedRoute): lists the guest's bookings with listing title, dates, status badge, and per-booking actions.
  - CONFIRMED bookings before check-in → "Cancel" button.
  - COMPLETED bookings without a review → "Leave a review" button.
- **`CancelBookingModal`**: inline confirmation modal before calling `POST /bookings/:id/cancel`.
- **`ReviewModal`**: star-picker + optional text form that calls `POST /bookings/:id/review`.

## Impact

- **Capabilities affected**: `booking`, `reviews`
- **Breaking changes**: no — the `/bookings/me` response gains a `listing.title` field (additive)
- **Migration required**: no
- **Out of scope**: host dashboard (NH-022), booking detail page

## Risks & Mitigations

| Risk                                                    | Likelihood | Mitigation                                                                               |
| ------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------- |
| Review already submitted — "Leave a review" shown again | Low        | Track `hasReview` flag per booking in the listing detail; backend enforces the 409 guard |
| Cancel after check-in                                   | Low        | Backend enforces the guard; frontend shows `t("booking.error.checkin_passed")` inline    |

## Rollout

Big bang — no existing guest dashboard to replace.
