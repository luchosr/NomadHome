# Proposal: add-booking

## Why

NomadHome's core value loop is: discover a listing → book it → pay → stay → review. Tickets NH-005 through NH-012 delivered identity, listings, availability, and search. NH-013 closes the loop on the **booking side**: a guest can create an instant booking, the dates are atomically held against concurrent guests, and either party can inspect or cancel the reservation.

Stripe Checkout integration (session creation and webhook confirmation) is intentionally scoped to NH-014 so this ticket stays focused on the booking data model, availability hold logic, and cancellation flow. Guests land in `PENDING_PAYMENT` after NH-013 and transition to `CONFIRMED` after NH-014.

## What

- **Database**: Add `Booking`, `PlatformFeeConfig`, `RefundRequest` models plus `BookingStatus` and `RefundRequestStatus` enums. Add a proper FK from `AvailabilityBlock.bookingId` to `Booking.id` (previously a bare `String?` without a relation).
- **Seed**: Insert the initial `PlatformFeeConfig` row with placeholder fee values (guest service fee 15%, host commission 3%); finalized in NH-014.
- **POST /bookings**: Authenticated guest creates a booking against a published listing with full availability. Computes and snapshots fees. Atomically creates `Booking (PENDING_PAYMENT)` + `AvailabilityBlock (BOOKING_HOLD)`. Returns 409 if dates overlap an existing block.
- **POST /bookings/:id/cancel**: Guest cancels their own `CONFIRMED` booking before check-in. Atomically updates status to `CANCELLED`, removes the `BOOKING_HOLD`, and creates a `RefundRequest (PENDING_ADMIN, full amount)`. Sends a cancellation email to the host via `EmailService` (Resend).
- **GET /bookings/:id**: Guest retrieves their own booking record.
- **GET /bookings/me**: Guest lists all their bookings, paginated, most recent first.
- **EmailService**: Thin Resend wrapper with a `sendHostCancellationNotice` method; stubbed in tests.
- **Shared schemas**: `CreateBookingSchema`, `CancelBookingSchema`, `BookingResponseSchema` exported from `packages/shared`.

## Impact

- **Capabilities affected**: `booking` (primary), `listings` (AvailabilityBlock FK migration)
- **Breaking changes**: No — the FK migration adds a real FK to an existing nullable column; existing `HOST_BLOCK` rows (bookingId = null) remain valid.
- **Migration required**: Yes — `add-booking-models` migration adds three new tables, two enums, and backfills the FK constraint on `AvailabilityBlock.bookingId`.
- **Out of scope**:
  - Stripe Checkout session creation (NH-014)
  - Stripe webhook handler / CONFIRMED transition (NH-014)
  - Guest confirmation email (NH-014)
  - Final fee percentages (NH-014; placeholder values seeded here)
  - Host booking dashboard (NH-017 / host-tooling)

## Risks & Mitigations

| Risk                                                                                                | Likelihood | Mitigation                                                                                                                                                |
| --------------------------------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Race condition on overlapping bookings creates double holds                                         | Low        | Postgres EXCLUDE constraint on `AvailabilityBlock` fires at DB level (error 23P01); app layer maps to 409 `OVERLAP_CONFLICT`                              |
| Cancellation email delivery failure leaves booking cancelled with no host notice                    | Medium     | `EmailService` call is **outside** the DB transaction; if it throws, log the error but treat cancellation as successful. Admin can trigger manual notice. |
| FK migration on `AvailabilityBlock.bookingId` breaks existing rows with null bookingId (HOST_BLOCK) | Very low   | FK is defined as optional (`bookingId String? @relation(...)`) — nulls are always valid in a nullable FK column in Postgres                               |
| Fee placeholder values mislead guests before NH-014 ships                                           | Very low   | No Stripe session is created in this ticket; guests cannot complete payment until NH-014                                                                  |

## Rollout

Big bang — single PR. No feature flag required. The booking endpoints are unreachable until auth middleware is satisfied (JWT), and payment completion is gated on NH-014 Stripe integration, so accidental early usage is not possible.
