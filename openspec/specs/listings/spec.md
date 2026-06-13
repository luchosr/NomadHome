# listings Specification

## Purpose
TBD - created by archiving change bootstrap-capability-specs. Update Purpose after archive.
## Requirements
### Requirement: Host can create a listing in draft status

The system SHALL allow an authenticated user with the `host` role to create a listing. A listing MUST have a title, description, type (`property` or `workspace`), city, capacity, nightly rate, at least one photo, and at least one amenity. Newly created listings SHALL be in `draft` status and visible only to their owner until published.

#### Scenario: Host submits a complete listing

- **GIVEN** an authenticated user with role `host`
- **AND** valid values for title, description, type, city, capacity, nightly rate, at least one photo, and at least one amenity
- **WHEN** the host submits the listing creation form
- **THEN** the listing is created with status `draft` and owner set to the host
- **AND** the listing is not returned by guest-facing search
- **AND** the listing is visible in the host's own dashboard

#### Scenario: Listing creation is rejected for missing required fields

- **GIVEN** an authenticated host
- **AND** a submission missing one or more of: title, description, type, city, capacity, nightly rate, ≥1 photo, ≥1 amenity
- **WHEN** the host submits the form
- **THEN** the system returns a validation error identifying the missing field(s)
- **AND** no listing is created

### Requirement: Host can publish and unpublish a listing

The system SHALL allow a host to transition an owned `draft` listing to `published`, making it searchable, and SHALL allow them to revert a `published` listing back to `draft` at any time, removing it from search.

#### Scenario: Host publishes a draft listing that meets minimum requirements

- **GIVEN** a host who owns a listing with status `draft` and all required fields present
- **WHEN** the host publishes it
- **THEN** the listing status becomes `published`
- **AND** the listing is returned by guest-facing search for dates with availability

#### Scenario: Host reverts a published listing to draft

- **GIVEN** a host who owns a listing with status `published`
- **WHEN** the host reverts it
- **THEN** the listing status becomes `draft`
- **AND** the listing is no longer returned by guest-facing search
- **AND** existing confirmed bookings on the listing remain visible to the host and to their guests

### Requirement: Host manages listing availability

The system SHALL allow a host to block date ranges on an owned listing so that those ranges are unavailable for booking. Blocked ranges MUST NOT be bookable by guests and MUST NOT appear as bookable in search results.

The system MUST NOT allow a host to block a date range that overlaps any existing `AvailabilityBlock` on the same listing — regardless of the existing block's `source` (`HOST_BLOCK`, `BOOKING_HOLD`, or `ADMIN_BLOCK`). The DB-level EXCLUDE constraint (`docs/data-model.md` §3.10) guarantees this even under concurrent writes. On overlap, the API SHALL respond with HTTP `409 OVERLAP_CONFLICT` and a structured body matching the response shape defined in `docs/data-model.md` §3.10 — the existing block is left unchanged.

#### Scenario: Host blocks an unbooked date range

- **GIVEN** a host who owns a published listing with no existing bookings or holds in the range `[D1, D2)`
- **WHEN** the host blocks the range `[D1, D2)`
- **THEN** the range is marked unavailable
- **AND** subsequent guest searches that include any date in `[D1, D2)` do not return this listing as bookable for that range

#### Scenario: Host attempts to block a range overlapping a BOOKING_HOLD

- **GIVEN** a host who owns a listing with an `AvailabilityBlock` row of `source = BOOKING_HOLD` covering `[D1, D2)` (whose backing `Booking.status` is `PENDING_PAYMENT` or `CONFIRMED`)
- **WHEN** the host attempts to block any range overlapping `[D1, D2)`
- **THEN** the system returns HTTP `409 OVERLAP_CONFLICT`
- **AND** the response body matches the shape defined in `docs/data-model.md` §3.10, populated with:
   - `conflict.source = "BOOKING_HOLD"`
   - `conflict.blockId` = the existing `AvailabilityBlock.id`
   - `conflict.bookingId` = the backing `Booking.id` so the host can identify and contact the affected guest
   - `conflict.startDate` and `conflict.endDate` echoing the existing block's range
- **AND** the existing `AvailabilityBlock` and its backing `Booking` are left unchanged
- **AND** no new `HOST_BLOCK` row is inserted

#### Scenario: Host attempts to block a range overlapping their own existing HOST_BLOCK

- **GIVEN** a host who owns a listing with an existing `AvailabilityBlock` row of `source = HOST_BLOCK` covering `[D1, D2)`
- **WHEN** the host attempts to block any range overlapping `[D1, D2)`
- **THEN** the system returns HTTP `409 OVERLAP_CONFLICT`
- **AND** the response body matches the shape defined in `docs/data-model.md` §3.10, populated with:
   - `conflict.source = "HOST_BLOCK"`
   - `conflict.blockId` = the existing `AvailabilityBlock.id`
   - `conflict.startDate` and `conflict.endDate` echoing the existing block's range
- **AND** `conflict.bookingId` is **absent** from the response body (the `HOST_BLOCK` row has no associated booking, per `docs/data-model.md` §3.10 column note: `bookingId` is nullable and is NOT NULL only when `source = BOOKING_HOLD`)
- **AND** the existing `HOST_BLOCK` row is left unchanged
- **AND** no new `HOST_BLOCK` row is inserted

### Requirement: Listing ownership is enforced

The system SHALL ensure that only the host who owns a listing (or an admin) can edit, publish, unpublish, or block availability on that listing.

#### Scenario: Non-owner host attempts to edit another host's listing

- **GIVEN** an authenticated host A and a listing owned by host B
- **WHEN** host A attempts to edit, publish, unpublish, or modify availability for the listing
- **THEN** the system returns HTTP 403
- **AND** the listing is not modified

