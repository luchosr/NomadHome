# booking — Delta for normalize-error-responses

## MODIFIED Requirements

### Requirement: Guest can create an instant booking

The system SHALL allow an authenticated guest to create a booking for a published listing whose full requested date range is available. On creation the system SHALL atomically insert a `Booking` record with status `PENDING_PAYMENT` and an `AvailabilityBlock` row with source `BOOKING_HOLD` in a single database transaction. Fee and rate values SHALL be snapshotted from the listing and the current `PlatformFeeConfig` row at creation time and SHALL be immutable thereafter.

The booking SHALL NOT be created if: the guest's email is not verified (`emailVerifiedAt` is `null`); the listing is not in `PUBLISHED` status; the guest is the same user as the host; `checkOut` is not strictly after `checkIn`; or any part of the requested date range overlaps an existing `AvailabilityBlock` for the same listing. The email-verification check SHALL be evaluated before any other precondition. Rejection for an unverified email SHALL return HTTP 403 with a stable machine-readable error code `EMAIL_NOT_VERIFIED` in the response body, in addition to a human-readable `message`. Rejection for a missing/unpublished listing SHALL return HTTP 404 with error code `LISTING_NOT_AVAILABLE` and a human-readable `message`. Rejection for an overlapping date range SHALL return HTTP 409 with error code `OVERLAP_CONFLICT`, the conflicting block details, and a human-readable `message`.

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
- **And** the response body includes a human-readable `message`
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
- **Then** the system responds `404 Not Found` with error code `LISTING_NOT_AVAILABLE`
- **And** the response body includes a human-readable `message`
- **And** no `Booking` record is created

#### Scenario: Guest submits a booking with invalid dates

- **Given** an authenticated guest
- **And** a published listing
- **When** the guest submits `POST /bookings` with `checkOut <= checkIn`
- **Then** the system responds `422 Unprocessable Entity` with a validation error
- **And** no `Booking` record is created
