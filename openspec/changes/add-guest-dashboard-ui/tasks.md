# Tasks: add-guest-dashboard-ui

## 1. Backend — include listing title in bookings/me

- [x] 1.1 Update `findByGuest` in `BookingRepository` to include `listing: { select: { title: true } }`
- [x] 1.2 Update `listForGuest` return type in `BookingService` to reflect the new shape
- [x] 1.3 Add/update integration test asserting `listing.title` appears in `GET /bookings/me` response

## 2. Shared strings

- [x] 2.1 Add `booking.dashboard.*` keys for dashboard labels, status badges, cancel/review actions

## 3. Frontend — API clients

- [x] 3.1 Add `bookingsApi.listMine()`, `bookingsApi.cancel()`, and `bookingsApi.review()` to `apps/web/src/api/bookings.ts`

## 4. Frontend — components and pages

- [x] 4.1 `MyBookingsPage` (`/bookings`) — paginated list of bookings with status badge + action buttons
- [x] 4.2 `CancelBookingModal` — confirmation dialog with optional reason field; calls cancel API
- [x] 4.3 `ReviewModal` — 1-5 star picker + optional text textarea; calls review API

## 5. Tests

- [x] 5.1 Backend integration test for `GET /bookings/me` including `listing.title`
- [x] 5.2 `MyBookingsPage.test.tsx` — renders list, shows cancel button for CONFIRMED, shows review button for COMPLETED
- [x] 5.3 `CancelBookingModal.test.tsx` — confirms cancel call on submit
- [x] 5.4 `ReviewModal.test.tsx` — renders stars, calls review API on submit
