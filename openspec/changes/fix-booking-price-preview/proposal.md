# Proposal: fix-booking-price-preview

## Why

GitHub issue #92: the "Confirm your booking" page (`/listings/:id/book`) shows a total computed as `listing.nightlyRateCents * nights` only — no service fee. The guest sees e.g. €315.00, clicks "Pay now," and only then discovers on Stripe Checkout that the real charge is €362.25 (+€47.25 service fee). `BookingService.create` (`apps/api/src/services/booking.service.ts:106-126`) computes the authoritative fee-inclusive total, but that only happens at the moment "Pay now" is clicked (when the booking row is created) — nothing surfaces it to the guest beforehand.

The existing "Booking form page" requirement (`openspec/specs/booking/spec.md:185-187`) already says the page should show "nightly rate, total," but doesn't specify that "total" must be the amount actually charged (fee-inclusive) — the implementation took the narrower reading. This is a trust/consistency bug: the price the guest agrees to must match the price Stripe charges, with no surprises.

## What

- Add a read-only pricing preview so the frontend can show the real, itemized total *before* a booking is created (today, pricing is only computed as a side effect of `POST /bookings`, which already commits a booking hold).
- New endpoint: `GET /bookings/quote?listingId=&checkIn=&checkOut=` (authenticated; guest role; deliberately NOT gated on email verification — previewing a price isn't the action that requires a verified email, creating the booking still is). Returns `{ nights, nightlyRateCents, subtotalCents, guestServiceFeeBps, guestServiceFeeCents, totalChargedCents, currency }`.
- Extract the pricing math (subtotal → service fee → total) out of `BookingService.create` into one shared pure function, used by both `create()` and the new quote path, so there is exactly one place that computes money and it cannot drift between preview and charge.
- Update `BookingFormPage.tsx` to fetch the quote on load (alongside the existing listing fetch) and render an itemized breakdown: nightly rate × nights (subtotal), a "Service fee" line, then the fee-inclusive total — replacing today's base-only total. "Pay now" still creates the booking and redirects to Stripe exactly as before.

## Impact

- **Capabilities affected**: `booking` (new read endpoint + modified "Booking form page" requirement).
- **Breaking changes**: No. New endpoint, existing `POST /bookings` and checkout flow unchanged. Guests will now see a higher displayed total than before (the correct one) — intentional, that's the fix.
- **Migration required**: No.
- **Out of scope**: Changing the actual pricing formula, fee percentages, or currency handling. Any UI for showing a price breakdown on the listing detail page (search/browse) — this proposal only covers the booking confirmation page, where the discrepancy was reported.

## Risks & Mitigations

| Risk | Likelihood | Mitigation |
| --- | --- | --- |
| Quote and actual booking-creation charge drift apart if the shared pricing function isn't truly reused by both paths. | Low | Delta spec + tasks require both `create()` and the quote handler to call the same extracted function; QA test asserts a quote's `totalChargedCents` matches the subsequently created booking's `totalChargedCents` for the same inputs. |
| Fee config changes between the guest viewing the quote and clicking "Pay now" (rare, admin-driven). | Low | Out of scope for this fix — `POST /bookings` remains the authoritative charge; a stale quote is a pre-existing, acceptable window already implicit in any quote-then-commit flow. Not addressed here. |

## Rollout

Big bang, no flag — this is a bug fix restoring price-consistency guest trust, not new user-facing functionality.
