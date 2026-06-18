# Tasks: add-host-dashboard

## 1. Backend

- [x] 1.1 Add `findHostUpcoming(hostId)` to `BookingRepository` in `apps/api/src/repositories/booking.repository.ts`
- [x] 1.2 Add `listHostUpcoming(hostId)` to `BookingService` in `apps/api/src/services/booking.service.ts`
- [x] 1.3 Add `listHostUpcoming` handler to `BookingController` in `apps/api/src/controllers/booking.controller.ts`
- [x] 1.4 Add `GET /host-upcoming` route (requireAuth + requireRole("host")) in `apps/api/src/routes/bookings.ts`

## 2. Tests

- [x] 2.1 Integration tests in `apps/api/src/host-dashboard.test.ts`
  - Happy path: host sees upcoming confirmed bookings sorted by checkIn
  - Empty: host with no future bookings gets []
  - 403: guest user is rejected
