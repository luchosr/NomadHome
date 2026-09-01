# Tasks: fix-booking-price-preview

## 1. Backend

- [x] 1.1 In `apps/api/src/services/booking.service.ts`, extract the pricing calculation (`subtotalCents`, `guestServiceFeeCents`, `totalChargedCents`, `hostCommissionCents`, `payoutCents`) out of `create()` into one shared pure function (e.g. `computeBookingPricing(nightlyRateCents, nights, feeConfig)`). `create()` must call it — no duplicated math.
- [x] 1.2 Add `BookingService.quote(listingId, checkIn, checkOut)`: validates the listing exists and is `PUBLISHED` (throw `ListingNotAvailableError` otherwise, reusing the existing error → 404 mapping), fetches `feeConfig` via `this.bookings.latestFeeConfig()`, computes nights and calls the shared pricing function from 1.1. Does NOT check `emailVerifiedAt`. Does NOT write to the database.
- [x] 1.3 Add `GET /bookings/quote` route (`apps/api/src/routes/bookings.ts`) guarded only by `requireAuth` (no email-verification check), with `listingId`/`checkIn`/`checkOut` query params validated via Zod (reuse the existing date-validation pattern from `POST /bookings`).
- [x] 1.4 Add the controller handler mapping the service result to `200 { nights, nightlyRateCents, subtotalCents, guestServiceFeeBps, guestServiceFeeCents, totalChargedCents, currency }`, and mapping `ListingNotAvailableError` to `404`.

## 2. Frontend

- [ ] 2.1 Add `bookingsApi.quote(listingId, checkIn, checkOut)` in `apps/web/src/api/bookings.ts`.
- [ ] 2.2 In `BookingFormPage.tsx`, fetch the quote via `useQuery` alongside the existing listing fetch. Replace the current `nightlyRateCents * nights` total with the quote's `subtotalCents`/`guestServiceFeeCents`/`totalChargedCents`. Render subtotal, a "Service fee" line, and the fee-inclusive total. Handle the quote's loading state (e.g. disable "Pay now" until it resolves) and error state (reuse the existing generic error pattern).
- [ ] 2.3 Leave the `handlePayNow` submit flow (`POST /bookings` → `POST /bookings/:id/checkout` → redirect) unchanged — the quote is a preview only, not the source of truth at charge time.

## 3. Tests

- [x] 3.1 In `apps/api/src/booking.test.ts` (or a new `booking-quote.test.ts`), test: quote returns the correct breakdown for a valid listing/dates; quote succeeds for a guest with `emailVerified: false` (unlike `POST /bookings`); quote returns 404 for a nonexistent/unpublished listing; a quote's `totalChargedCents` matches the `totalChargedCents` of a booking subsequently created via `POST /bookings` with the same listing/dates (drift-proofing).
- [x] 3.2 In `apps/web/src/pages/BookingFormPage.test.tsx`, test that with a mocked quote response the page renders the subtotal, the "Service fee" line, and a total equal to `subtotalCents + guestServiceFeeCents` — not the old base-only total.

## 4. Docs & Ops

- [ ] 4.1 None. No new environment variables, no data migration.
