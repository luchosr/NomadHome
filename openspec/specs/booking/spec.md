# booking Specification

## Purpose

Instant-booking reservations for guests against published listings. Covers atomic booking creation (Booking + `BOOKING_HOLD` row inserted together per `docs/data-model.md` §7.1), per-booking fee snapshotting, the single-listing-per-booking invariant, and guest-side cancellation before check-in. Owns the `Booking` aggregate; the `BOOKING_HOLD` row in `AvailabilityBlock` is managed jointly with the `listings` capability (lifecycle tied to booking status per `docs/data-model.md` §4).

## Requirements

### Requirement: Guest can instant-book a listing

The system SHALL allow an authenticated guest to book a `published` listing for a date range that has full availability. On successful payment the booking SHALL transition to status `confirmed`, the booked dates SHALL be marked unavailable on the listing, the guest service fee and host commission SHALL be snapshotted onto the booking record, and confirmation emails SHALL be dispatched to both the guest and the host.

The MVP supports instant booking only; there is no host approval step.

#### Scenario: Guest completes Stripe Checkout for an available listing

- **GIVEN** an authenticated guest
- **AND** a `published` listing with full availability for the requested range `[check_in, check_out)`
- **WHEN** the guest confirms the booking and completes Stripe Checkout successfully
- **THEN** a booking record is created with status `confirmed`
- **AND** the booked range is marked unavailable on the listing
- **AND** the booking record includes a snapshot of the guest service fee and the host commission that applied at booking time
- **AND** a confirmation email is dispatched to the guest
- **AND** a confirmation email is dispatched to the host

#### Scenario: Booking attempt loses race to another guest

- **GIVEN** two guests attempting to book the same listing for overlapping ranges concurrently
- **WHEN** one Stripe Checkout completes first and the second guest's checkout subsequently completes
- **THEN** at most one booking is in status `confirmed` for any overlapping date
- **AND** the losing guest's payment is either prevented or recorded as a `refund_pending_admin` outcome

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

### Requirement: Bookings cannot span multiple listings

The system SHALL ensure that a single booking record corresponds to exactly one listing and one continuous date range. Multi-listing carts and multi-leg trips are out of scope for MVP.

#### Scenario: API rejects a booking payload referencing multiple listings

- **GIVEN** a booking creation request referencing more than one listing identifier
- **WHEN** the request is submitted
- **THEN** the system returns a validation error
- **AND** no booking is created

> **\[OPEN]** Cancellation policy windows and refund tiers (e.g., full vs. partial vs. zero refund based on days-to-check-in) are not fixed by this baseline. The first booking-implementing ticket MUST resolve these before merging. See PRD §12.

### Requirement: Guest can create an instant booking

The system SHALL allow an authenticated guest to create a booking for a published listing whose full requested date range is available. On creation the system SHALL atomically insert a `Booking` record with status `PENDING_PAYMENT` and an `AvailabilityBlock` row with source `BOOKING_HOLD` in a single database transaction. Fee and rate values SHALL be snapshotted from the listing and the current `PlatformFeeConfig` row at creation time and SHALL be immutable thereafter.

The booking SHALL NOT be created if: the guest's email is not verified (`emailVerifiedAt` is `null`); the listing is not in `PUBLISHED` status; the guest is the same user as the host; `checkOut` is not strictly after `checkIn`; or any part of the requested date range overlaps an existing `AvailabilityBlock` for the same listing. The email-verification check SHALL be evaluated before any other precondition. Rejection for an unverified email SHALL return HTTP 403 with a stable machine-readable error code `EMAIL_NOT_VERIFIED` in the response body, in addition to a human-readable `message`.

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

#### Scenario: Guest with unverified email cannot create a booking

- **Given** an authenticated guest whose `emailVerifiedAt` is `null`
- **And** a listing with status `PUBLISHED` owned by a different user
- **When** the guest submits `POST /bookings` with `{ listingId, checkIn, checkOut }`
- **Then** the system responds `403 Forbidden`
- **And** the response body includes `error: "EMAIL_NOT_VERIFIED"`
- **And** the response body includes a human-readable `message`
- **And** no `Booking` record is created

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

### Requirement: Booking form page

The web app SHALL provide a `/listings/:id/book` page where an authenticated guest can review the stay summary (listing title, dates, nightly rate, total) and submit to initiate payment.

#### Scenario: guest submits booking form

- **Given** an authenticated guest is on `/listings/:id/book?checkIn=YYYY-MM-DD&checkOut=YYYY-MM-DD`
- **When** they click "Pay now"
- **Then** the app creates a booking via `POST /bookings`, then calls `POST /bookings/:id/checkout`, then redirects the browser to the Stripe Checkout URL

#### Scenario: unauthenticated visitor reaches booking form

- **Given** an unauthenticated visitor navigates to `/listings/:id/book`
- **When** the page loads
- **Then** they are redirected to `/login`

#### Scenario: booking creation fails (overlap)

- **Given** the selected dates are no longer available
- **When** the guest submits the form
- **Then** an inline error "These dates are no longer available." is shown and no Stripe redirect occurs

### Requirement: Booking success page

The web app SHALL provide a `/booking/success` page that confirms the booking after Stripe redirects back.

#### Scenario: guest lands on success page

- **Given** Stripe redirects to `/booking/success?bookingId=<id>`
- **When** the page loads
- **Then** the page shows a confirmation message and a link to "My Bookings"

### Requirement: Booking cancel page

The web app SHALL provide a `/booking/cancel` page shown when a guest abandons Stripe Checkout.

#### Scenario: guest abandons checkout

- **Given** Stripe redirects to `/booking/cancel?listingId=<id>`
- **When** the page loads
- **Then** the page shows a "Payment cancelled" message and a link back to the listing detail page

### Requirement: booking list response includes listing title

The `GET /bookings/me` response SHALL include `listing: { title: string }` on each booking row so the guest dashboard can display the property name without additional round-trips.

#### Scenario: listing title present in bookings list

- **Given** a guest has at least one booking
- **When** they call `GET /bookings/me`
- **Then** each item in `data` includes a `listing` object with a `title` string
