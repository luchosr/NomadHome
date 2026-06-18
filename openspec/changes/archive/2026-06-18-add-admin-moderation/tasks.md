# Tasks: add-admin-moderation

## 1. Database

- [x] 1.1 Add `BookingFlag` model and `BookingFlagReason` enum to `packages/db/prisma/schema.prisma`
- [x] 1.2 Add back-relation `Booking.flags BookingFlag[]`
- [x] 1.3 Create migration `packages/db/prisma/migrations/20260618120000_add_booking_flag/migration.sql`

## 2. Backend

- [x] 2.1 Add `AdminRepository` in `apps/api/src/repositories/admin.repository.ts`
- [x] 2.2 Add `AdminService` in `apps/api/src/services/admin.service.ts`
- [x] 2.3 Add `AdminModerationController` in `apps/api/src/controllers/admin-moderation.controller.ts`
- [x] 2.4 Wire 4 PATCH routes into `apps/api/src/routes/admin.ts`

## 3. Tests

- [x] 3.1 Integration tests in `apps/api/src/admin-moderation.test.ts`
  - disable user: 200, listings disabled, bookings flagged
  - enable user: 200, disabledAt cleared
  - disable listing: 200, status DISABLED
  - enable listing: 200, status PUBLISHED
  - 403 for non-admin on each action
