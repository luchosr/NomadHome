# booking — Delta for add-booking

> **Base spec**: `openspec/specs/booking/spec.md`
> **Change**: NH-013 — implements booking creation, cancellation, and retrieval. Resolves the `[OPEN]` cancellation-policy decision.

---

## ADDED Requirements

### Requirement: Guest can create an instant booking

The system SHALL allow an authenticated guest to create a booking for a published listing whose full requested date range is available. On creation the system SHALL atomically insert a `Booking` record with status `PENDING_PAYMENT` and an `AvailabilityBlock` row with source `BOOKING_HOLD` in a single database transaction. Fee and rate values SHALL be snapshotted from the listing and the current `PlatformFeeConfig` row at creation time and SHALL be immutable thereafter.

The booking SHALL NOT be created if: the listing is not in `PUBLISHED` status; the guest is the same user as the host; `checkOut` is not strictly after `checkIn`; or any part of the requested date range overlaps an existing `AvailabilityBlock` for the same listing.

#### Scenario: Guest creates a booking for an available published listing

- **Given** an authenticated guest (email verified)
- **And** a listing with status `PUBLISHED` owned by a different user
- **And** no existing `AvailabilityBlock` overlapping `[checkIn, checkOut)` for that listing
- **When** the guest submits `POST /bookings` with `{ listingId, checkIn, checkOut }`
- **Then** the system responds `201 Created` with a booking record
- **And** the booking has status `PENDING_PAYMENT`
- **And** `booking.nights` equals the calendar-day count between `checkIn` and `checkOut`
- **And** `booking.subtotalCents` equals `nightlyRateCents * nights`
- **And** `booking.guestServiceFeeCents` equals `floor(subtotalCents * guestServiceFeeBps / 10000)`
- **And** `booking.totalChargedCents` equals `subtotalCents + guestServiceFeeCents`
- **And** `booking.payoutCents` equals `subtotalCents - hostCommissionCents`
- **And** an `AvailabilityBlock` with `source = BOOKING_HOLD` and `bookingId = booking.id` exists for the listing on `[checkIn, checkOut)`

#### Scenario: Booking attempt overlaps an existing block (race condition or host block)

- **Given** an authenticated guest
- **And** a published listing that already has an `AvailabilityBlock` covering some or all of `[checkIn, checkOut)`
- **When** the guest submits `POST /bookings` with the overlapping date range
- **Then** the system responds `409 Conflict` with error code `OVERLAP_CONFLICT`
- **And** the response body includes the conflicting block's `blockId`, `source`, `startDate`, `endDate`, and `bookingId` (when `source = BOOKING_HOLD`)
- **And** no `Booking` record is created

#### Scenario: Guest attempts to book their own listing

- **Given** an authenticated user who is also the host of a listing
- **When** that user submits `POST /bookings` with their own `listingId`
- **Then** the system responds `422 Unprocessable Entity` with error code `SELF_BOOKING_NOT_ALLOWED`
- **And** no `Booking` record is created

#### Scenario: Guest attempts to book an unpublished listing

- **Given** an authenticated guest
- **And** a listing whose status is `DRAFT` or `DISABLED`
- **When** the guest submits `POST /bookings` referencing that listing
- **Then** the system responds `404 Not Found`
- **And** no `Booking` record is created

#### Scenario: Guest submits a booking with invalid dates

- **Given** an authenticated guest
- **And** a published listing
- **When** the guest submits `POST /bookings` with `checkOut <= checkIn`
- **Then** the system responds `422 Unprocessable Entity` with a validation error
- **And** no `Booking` record is created

---

### Requirement: Guest can retrieve a booking

The system SHALL allow a guest to retrieve a single booking they own by ID, and to list all their bookings paginated by most-recent-first.

#### Scenario: Guest retrieves their own booking by ID

- **Given** an authenticated guest who owns a booking
- **When** the guest submits `GET /bookings/:id`
- **Then** the system responds `200 OK` with the full booking record (all snapshotted fee fields included)

#### Scenario: Guest cannot retrieve another guest's booking

- **Given** an authenticated guest
- **And** a booking owned by a different guest
- **When** the first guest submits `GET /bookings/:id` referencing the other guest's booking
- **Then** the system responds `404 Not Found`

#### Scenario: Guest lists their bookings

- **Given** an authenticated guest who has two or more bookings
- **When** the guest submits `GET /bookings/me?page=1&limit=20`
- **Then** the system responds `200 OK` with a paginated list of their bookings, ordered by `createdAt` descending
- **And** the response includes `data`, `total`, `page`, and `limit` fields

---

## MODIFIED Requirements

### Requirement: Guest can cancel a confirmed booking before check-in

The system SHALL allow a guest to cancel an owned booking whose status is `CONFIRMED` and whose `checkIn` date is strictly in the future (`checkIn > today`). Cancellation SHALL:

1. Atomically update `Booking.status` to `CANCELLED`, set `cancelledAt = now()`, and set `cancellationReason` if provided.
2. Atomically delete the `AvailabilityBlock` with `source = BOOKING_HOLD` for this booking within the same transaction, releasing the dates.
3. Atomically create a `RefundRequest` with `amountCents = Booking.totalChargedCents`, `currency = Booking.currency`, and `status = PENDING_ADMIN` within the same transaction.
4. After the transaction commits, send a cancellation notification email to the host via `EmailService`.

The entire database mutation (steps 1–3) MUST succeed or fail atomically. The email send (step 4) is best-effort: if it fails, the cancellation is still considered successful and the error is logged.

Cancellation SHALL be rejected if: the booking does not exist; the booking is not owned by the requesting guest; the booking status is not `CONFIRMED`; or `checkIn <= today`.

#### Scenario: Guest cancels a future confirmed booking

- **Given** an authenticated guest who owns a booking with status `CONFIRMED`
- **And** `checkIn` is strictly in the future (`checkIn > today`)
- **When** the guest submits `POST /bookings/:id/cancel`
- **Then** the system responds `200 OK` with the updated booking record
- **And** `booking.status` is `CANCELLED`
- **And** `booking.cancelledAt` is set
- **And** the `AvailabilityBlock (BOOKING_HOLD)` for this booking no longer exists
- **And** a `RefundRequest` exists with `bookingId = booking.id`, `amountCents = booking.totalChargedCents`, and `status = PENDING_ADMIN`
- **And** a cancellation email is dispatched to the host

#### Scenario: Guest cannot cancel a booking after check-in has passed

- **Given** a guest who owns a booking with status `CONFIRMED`
- **And** `checkIn` is today or in the past (`checkIn <= today`)
- **When** the guest submits `POST /bookings/:id/cancel`
- **Then** the system responds `422 Unprocessable Entity` with error code `CHECKIN_ALREADY_PASSED`
- **And** the booking remains `CONFIRMED`
- **And** no `RefundRequest` is created

#### Scenario: Guest cannot cancel a booking they do not own

- **Given** an authenticated guest
- **And** a confirmed booking owned by a different guest
- **When** the first guest submits `POST /bookings/:id/cancel`
- **Then** the system responds `404 Not Found`

#### Scenario: Guest cannot cancel a booking that is not in CONFIRMED status

- **Given** an authenticated guest who owns a booking with status `PENDING_PAYMENT` or `CANCELLED`
- **When** the guest submits `POST /bookings/:id/cancel`
- **Then** the system responds `422 Unprocessable Entity` with error code `BOOKING_NOT_CANCELLABLE`
- **And** no state changes occur

---

## Unchanged Requirements

The following requirements from the base spec are carried forward without modification:

- **Bookings cannot span multiple listings**: a single booking record corresponds to exactly one listing and one continuous date range; multi-listing carts and multi-leg trips are out of scope for MVP.
- **Booking creation atomicity** (cross-cutting invariant §7.1): `Booking (PENDING_PAYMENT)` + `AvailabilityBlock (BOOKING_HOLD)` in one transaction; either both succeed or both roll back.
- **Fee snapshot immutability** (cross-cutting invariant §7.2): snapshotted fee fields are never updated after booking creation.

> **Note**: The Stripe Checkout payment flow (session creation, webhook confirmation, `PENDING_PAYMENT → CONFIRMED` transition, guest confirmation email) is implemented in NH-014 (`add-payments`) and is therefore **not** in scope for this delta.
