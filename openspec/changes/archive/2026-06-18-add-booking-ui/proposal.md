# Proposal: add-booking-ui

## Why

Guests can now discover listings (NH-019) but have no way to book them. This ticket wires the booking loop from the listing detail page CTA through to Stripe Checkout and back (NH-020).

## What Changes

- `BookingFormPage` at `/listings/:id/book` — pre-filled check-in/check-out (carried via URL params from the search), final price summary, "Pay now" submit.
- On submit: calls `POST /bookings` to create the booking, then `POST /bookings/:id/checkout` to get a Stripe Checkout URL, then `window.location.href = url` to redirect.
- `BookingSuccessPage` at `/booking/success?bookingId=` — landing page after Stripe redirects back, shows confirmation.
- `BookingCancelPage` at `/booking/cancel?listingId=` — landing page when Stripe cancel is clicked, links back to the listing.
- "Book now" link on `ListingDetailPage` updated to carry city + dates as query params to the booking form.

## Impact

- **Capabilities affected**: `booking`
- **Breaking changes**: no
- **Migration required**: no
- **Out of scope**: booking cancellation UI (NH-021), Stripe webhook processing (already done in backend)

## Risks & Mitigations

| Risk                                                   | Likelihood | Mitigation                                                                                  |
| ------------------------------------------------------ | ---------- | ------------------------------------------------------------------------------------------- |
| Stripe redirect in test environment                    | Low        | Tests mock `bookingsApi` and `window.location` — no live Stripe calls in unit tests         |
| Price shown before booking drifts from confirmed price | Low        | Show nightly rate × nights from listing detail data; actual settled price comes from Stripe |

## Rollout

Big bang — no existing booking UI to replace.
