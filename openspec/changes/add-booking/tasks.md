# Tasks: add-booking

## 1. Database

- [ ] 1.1 Add `BookingStatus` enum (`PENDING_PAYMENT`, `CONFIRMED`, `CANCELLED`, `COMPLETED`) to `packages/db/prisma/schema.prisma`
- [ ] 1.2 Add `RefundRequestStatus` enum (`PENDING_ADMIN`, `PROCESSED`) to `packages/db/prisma/schema.prisma`
- [ ] 1.3 Add `PlatformFeeConfig` model to `packages/db/prisma/schema.prisma` (`id`, `guestServiceFeeBps`, `hostCommissionBps`, `effectiveFrom`, fields per `docs/data-model.md §3.12`)
- [ ] 1.4 Add `Booking` model to `packages/db/prisma/schema.prisma` with all snapshot columns and `status BookingStatus @default(PENDING_PAYMENT)` (per `docs/data-model.md §3.11`); add indexes `(guestId, status)`, `(hostId, status, checkIn)`, `(listingId, status)`
- [ ] 1.5 Add `RefundRequest` model to `packages/db/prisma/schema.prisma` (`id`, `bookingId` UNIQUE FK → `Booking.id`, `amountCents`, `currency`, `status RefundRequestStatus @default(PENDING_ADMIN)`, `reason`, `requestedAt`, `processedAt`, `notes`) per `docs/data-model.md §3.14`
- [ ] 1.6 Add `@relation` to `AvailabilityBlock.bookingId` pointing to `Booking.id` (nullable FK; previously a bare `String?`); add back-relation field `availabilityBlock AvailabilityBlock?` on `Booking`
- [ ] 1.7 Add back-relations to `Booking` on `Listing` (`bookings Booking[]`) and `User` (`guestBookings Booking[]`, `hostBookings Booking[]`) in the schema
- [ ] 1.8 Generate migration: `pnpm --filter @nomadhome/db db:migrate:dev --name add-booking-models`
- [ ] 1.9 Verify the generated migration SQL includes the FK constraint on `AvailabilityBlock.bookingId` (it should be a `ALTER TABLE "AvailabilityBlock" ADD CONSTRAINT ... FOREIGN KEY ("bookingId") REFERENCES "Booking"("id")`)
- [ ] 1.10 Seed `PlatformFeeConfig` initial row in `packages/db/src/seed.ts`: `{ guestServiceFeeBps: 1500, hostCommissionBps: 300, effectiveFrom: new Date(), createdBy: "system" }` — note these are placeholder values; finalized in NH-014

## 2. Shared

- [ ] 2.1 Create `packages/shared/src/schemas/booking.ts` with:
  - `CreateBookingSchema`: `{ listingId: z.string().uuid(), checkIn: z.string().date(), checkOut: z.string().date() }` plus `.refine(checkOut > checkIn)`
  - `CancelBookingSchema`: `{ reason: z.string().max(500).optional() }`
  - `BookingResponseSchema`: full booking shape matching `docs/data-model.md §3.11` (all snapshot fields, status, stripe fields as optional)
  - `BookingListResponseSchema`: `{ data: BookingResponseSchema[], total: z.number(), page: z.number(), limit: z.number() }`
- [ ] 2.2 Add booking-related strings to `packages/shared/src/strings/en.ts`:
  - `booking.error.selfBookingNotAllowed`
  - `booking.error.listingNotAvailable`
  - `booking.error.overlapConflict`
  - `booking.error.bookingNotFound`
  - `booking.error.bookingNotCancellable`
  - `booking.error.checkinAlreadyPassed`
  - `booking.email.hostCancellationSubject`
  - `booking.email.hostCancellationBody`
- [ ] 2.3 Export all new schemas and types from `packages/shared/src/index.ts`

## 3. Backend

- [ ] 3.1 Create `apps/api/src/services/email.service.ts`:
  - Class `EmailService` wrapping Resend SDK
  - Method `sendHostCancellationNotice({ hostEmail, hostName, guestName, listingTitle, checkIn, checkOut, bookingId }): Promise<void>`
  - Reads `RESEND_API_KEY` from env; throws `EmailServiceError` if key is missing (allowing the test harness to inject a mock)
- [ ] 3.2 Create `apps/api/src/repositories/booking.repository.ts`:
  - `createWithHold({ listingId, guestId, hostId, checkIn, checkOut, nights, nightlyRateCents, subtotalCents, guestServiceFeeBps, guestServiceFeeCents, hostCommissionBps, hostCommissionCents, currency, totalChargedCents, payoutCents }): Promise<Booking>` — executes `prisma.$transaction([createBooking, createHold])`
  - `findByIdAndGuest(id: string, guestId: string): Promise<Booking | null>`
  - `findAllByGuest(guestId: string, page: number, limit: number): Promise<{ data: Booking[]; total: number }>`
  - `cancelWithRefund(bookingId: string, reason?: string): Promise<{ booking: Booking; refundRequest: RefundRequest }>` — `prisma.$transaction`: update Booking to CANCELLED + cancelledAt, delete BOOKING_HOLD AvailabilityBlock, create RefundRequest(PENDING_ADMIN)
- [ ] 3.3 Create `apps/api/src/services/booking.service.ts`:
  - Inject `BookingRepository`, `ListingRepository` (for listing lookup), `PrismaClient` (for PlatformFeeConfig read), `EmailService`
  - `createBooking(guestId, dto): Promise<Booking>` — validates listing is PUBLISHED, guestId ≠ hostId, dates valid; reads current `PlatformFeeConfig`; computes fee snapshot; calls `BookingRepository.createWithHold`; maps Postgres error `23P01` to `OverlapConflictError`
  - `cancelBooking(bookingId, guestId, reason?): Promise<Booking>` — validates booking exists + owned + CONFIRMED + checkIn > today; calls `BookingRepository.cancelWithRefund`; calls `EmailService.sendHostCancellationNotice` (best-effort, errors logged)
  - `getBooking(bookingId, guestId): Promise<Booking>` — calls `BookingRepository.findByIdAndGuest`; throws `NotFoundError` if null
  - `listMyBookings(guestId, page, limit): Promise<{ data: Booking[]; total: number }>`
- [ ] 3.4 Create `apps/api/src/controllers/booking.controller.ts`:
  - `createBooking`: validates request body with `CreateBookingSchema`; calls `BookingService.createBooking`; returns 201
  - `cancelBooking`: calls `BookingService.cancelBooking`; returns 200
  - `getBooking`: calls `BookingService.getBooking`; returns 200
  - `listMyBookings`: parses `page` / `limit` query params (defaults: page=1, limit=20, max limit=100); calls `BookingService.listMyBookings`; returns 200
  - Maps errors: `OverlapConflictError` → 409, `SelfBookingError` → 422, `NotFoundError` → 404, `ValidationError` → 422, `CheckinPassedError` → 422, `BookingNotCancellableError` → 422
- [ ] 3.5 Create `apps/api/src/routes/bookings.ts`:
  - `POST /` → `requireAuth` → `requireEmailVerified` → `bookingController.createBooking`
  - `GET /me` → `requireAuth` → `bookingController.listMyBookings`
  - `GET /:id` → `requireAuth` → `bookingController.getBooking`
  - `POST /:id/cancel` → `requireAuth` → `bookingController.cancelBooking`
- [ ] 3.6 Register bookings router in `apps/api/src/app.ts` at `/bookings`
- [ ] 3.7 Add `RESEND_API_KEY=` to `apps/api/.env.example`

## 4. Tests

- [ ] 4.1 Create `apps/api/src/booking.test.ts` with Vitest integration tests covering:
  - POST /bookings — happy path (201, booking + hold created, fees computed correctly)
  - POST /bookings — overlap conflict (409 OVERLAP_CONFLICT, conflicting block details in response)
  - POST /bookings — self-booking (422 SELF_BOOKING_NOT_ALLOWED)
  - POST /bookings — unpublished listing (404)
  - POST /bookings — invalid dates: checkOut <= checkIn (422 validation error)
  - POST /bookings/:id/cancel — happy path (200, CANCELLED, hold deleted, RefundRequest PENDING_ADMIN created, email stub called)
  - POST /bookings/:id/cancel — checkIn in the past (422 CHECKIN_ALREADY_PASSED)
  - POST /bookings/:id/cancel — not owned (404)
  - POST /bookings/:id/cancel — status is PENDING_PAYMENT (422 BOOKING_NOT_CANCELLABLE)
  - POST /bookings/:id/cancel — email send fails but cancellation still succeeds (tests best-effort email behavior)
  - GET /bookings/:id — own booking (200)
  - GET /bookings/:id — other guest's booking (404)
  - GET /bookings/me — returns paginated list ordered by createdAt DESC (200)
  - Concurrent overlapping requests: both call POST /bookings simultaneously; exactly one succeeds with 201 and the other receives 409

## 5. Verify

- [ ] 5.1 `pnpm lint` — zero warnings
- [ ] 5.2 `pnpm typecheck` — zero errors
- [ ] 5.3 `pnpm test --coverage` — all new tests green; coverage on changed lines ≥ 80%
- [ ] 5.4 `pnpm build` — all apps build without error
- [ ] 5.5 `openspec validate add-booking --strict` passes
- [ ] 5.6 `node scripts/check-mvp-scope.mjs` passes (no `never` matches)
