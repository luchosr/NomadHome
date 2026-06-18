# Tasks: add-booking-ui

## 1. Shared strings

- [x] 1.1 Add `booking.ui.*` string keys to `packages/shared/src/strings/en.ts`

## 2. Frontend — API client

- [x] 2.1 Add `bookingsApi` in `apps/web/src/api/bookings.ts` — `create(input)` and `checkout(id)`

## 3. Frontend — pages

- [x] 3.1 `BookingFormPage` (`/listings/:id/book`) — date summary + nightly rate total + "Pay now" button; reads checkIn/checkOut from URL search params; calls create then checkout then redirects
- [x] 3.2 `BookingSuccessPage` (`/booking/success`) — confirmation + link to My Bookings
- [x] 3.3 `BookingCancelPage` (`/booking/cancel`) — cancel message + link back to listing
- [x] 3.4 Update `ListingDetailPage` "Book now" link to carry `?checkIn=&checkOut=` params (requires SearchPage to pass them through)
- [x] 3.5 Update `router.tsx` — add three new routes (all `ProtectedRoute`-wrapped except success/cancel which are public)

## 4. Tests

- [x] 4.1 `BookingFormPage.test.tsx` — renders summary, calls create+checkout on submit, shows error on overlap
- [x] 4.2 `BookingSuccessPage.test.tsx` — renders confirmation
- [x] 4.3 `BookingCancelPage.test.tsx` — renders cancel message + listing link
