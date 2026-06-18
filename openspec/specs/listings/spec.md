# listings Specification

## Purpose

Host-owned bookable inventory — properties for co-living stays and workspaces for desks/meeting rooms. Covers the listing lifecycle (`draft` → `published` → `disabled`), photos, amenities, nightly rate, and host-managed availability (with `AvailabilityBlock` overlap-conflict semantics defined in `docs/data-model.md` §3.10). Owns the `Listing`, `ListingPhoto`, `ListingAmenity`, `Amenity`, and `AvailabilityBlock` aggregates.

## Requirements

### Requirement: Host can create a listing in draft status

The system SHALL allow an authenticated user with the `host` role to create a listing. A listing MUST have a title, description, type (`property` or `workspace`), city, capacity, nightly rate, and at least one amenity. A photo is NOT required to create a draft; the ≥1-photo requirement is a publish-time gate (see "Host can publish and unpublish a listing" and `docs/data-model.md` §3.6). Newly created listings SHALL be in `draft` status and visible only to their owner until published. The system SHALL allow a host to edit the fields of a listing they own.

#### Scenario: Host submits a complete listing

- **GIVEN** an authenticated user with role `host`
- **AND** valid values for title, description, type, city, capacity, nightly rate, and at least one amenity
- **WHEN** the host submits the listing creation form
- **THEN** the listing is created with status `draft` and owner set to the host
- **AND** the listing is not returned by guest-facing search
- **AND** the listing is visible in the host's own dashboard

#### Scenario: Listing creation is rejected for missing required fields

- **GIVEN** an authenticated host
- **AND** a submission missing one or more of: title, description, type, city, capacity, nightly rate, ≥1 amenity
- **WHEN** the host submits the form
- **THEN** the system returns a validation error identifying the missing field(s)
- **AND** no listing is created

#### Scenario: Listing creation is rejected for an unknown amenity

- **GIVEN** an authenticated host
- **AND** a submission referencing an amenity code that does not exist
- **WHEN** the host submits the form
- **THEN** the system returns a validation error
- **AND** no listing is created

#### Scenario: A non-host cannot create a listing

- **GIVEN** an authenticated user without the `host` role
- **WHEN** the user submits the listing creation form
- **THEN** the system returns HTTP 403
- **AND** no listing is created

### Requirement: Host can publish and unpublish a listing

The system SHALL allow a host to transition an owned `draft` listing to `published`,
making it searchable. The listing MUST have at least one `ListingPhoto` to be
published; if the photo gate fails the system returns HTTP 422. The system SHALL allow
a host to revert a `published` listing back to `draft` at any time, removing it from
search. Existing confirmed bookings are unaffected by unpublishing.

#### Scenario: Host publishes a draft listing that meets minimum requirements

- **GIVEN** a host who owns a listing with status `draft`
- **AND** the listing has at least one `ListingPhoto`
- **WHEN** the host calls `PATCH /listings/:id/publish`
- **THEN** the listing status becomes `published`
- **AND** the response is HTTP 200 with the updated listing

#### Scenario: Publish is rejected when the listing has no photos

- **GIVEN** a host who owns a listing with status `draft` and zero `ListingPhoto` records
- **WHEN** the host calls `PATCH /listings/:id/publish`
- **THEN** the system returns HTTP 422
- **AND** the listing status remains `draft`

#### Scenario: Host reverts a published listing to draft

- **GIVEN** a host who owns a listing with status `published`
- **WHEN** the host calls `PATCH /listings/:id/unpublish`
- **THEN** the listing status becomes `draft`
- **AND** the response is HTTP 200 with the updated listing
- **AND** existing confirmed bookings on the listing remain visible to the host and guests

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

### Requirement: Host can upload photos to an owned listing

The system SHALL allow an authenticated host to attach photos to a listing they own
via a signed-upload flow. The system SHALL issue a short-lived presigned PUT URL for
direct client-to-storage upload; the client SHALL then register the resulting object
key with the API to create a `ListingPhoto` record. Photo bytes MUST NOT pass through
the API server.

A listing MAY have zero photos while in `draft` status. The ≥1-photo requirement is
enforced only at publish time (see "Host can publish and unpublish a listing").

Each photo has a `position` (non-negative integer). No two photos on the same listing
MAY share the same `position`; the DB enforces this with a composite UNIQUE constraint.

#### Scenario: Host obtains a presigned upload URL

- **GIVEN** an authenticated user with role `host`
- **AND** a listing owned by that host (any status)
- **WHEN** the host calls `POST /listings/:id/photos/upload-url` with a valid content-type
- **THEN** the system returns HTTP 200 with `{ uploadUrl, key }` where `uploadUrl` is a presigned R2 PUT URL valid for 5 minutes
- **AND** no `ListingPhoto` record is created at this point

#### Scenario: Host registers an uploaded photo

- **GIVEN** an authenticated host who obtained a presigned upload URL and uploaded a file to storage
- **WHEN** the host calls `POST /listings/:id/photos` with `{ key, position }`
- **THEN** the system creates a `ListingPhoto` record with `url` derived from `R2_PUBLIC_URL + "/" + key` and the given `position`
- **AND** the response contains the created photo with HTTP 201

#### Scenario: Registration is rejected when position is already taken

- **GIVEN** an authenticated host
- **AND** a listing that already has a photo at `position` P
- **WHEN** the host registers a new photo also at `position` P
- **THEN** the system returns HTTP 409
- **AND** no duplicate `ListingPhoto` record is created

#### Scenario: Non-owner cannot upload or register photos

- **GIVEN** an authenticated host B
- **AND** a listing owned by host A
- **WHEN** host B calls any photo endpoint for that listing
- **THEN** the system returns HTTP 403
- **AND** no photo record is created or modified

### Requirement: Host can manage photos on an owned listing

The system SHALL allow a host to list, reorder, and delete photos on a listing they
own. Deleting a photo removes the `ListingPhoto` record; the object in storage is NOT
deleted by the API (object lifecycle is managed at the storage layer).

#### Scenario: Host lists photos ordered by position

- **GIVEN** an authenticated host who owns a listing with N photos
- **WHEN** the host calls `GET /listings/:id/photos`
- **THEN** the system returns an array of N photo objects ordered ascending by `position`

#### Scenario: Host changes a photo's position

- **GIVEN** an authenticated host who owns a listing
- **AND** a `ListingPhoto` with id P1 at `position` 0
- **WHEN** the host calls `PATCH /listings/:id/photos/P1/position` with `{ position: 2 }`
- **THEN** the `ListingPhoto` record is updated to `position` 2
- **AND** the response contains the updated photo with HTTP 200

#### Scenario: Host deletes a photo

- **GIVEN** an authenticated host who owns a listing with a photo P1
- **WHEN** the host calls `DELETE /listings/:id/photos/P1`
- **THEN** the `ListingPhoto` record is removed
- **AND** the response is HTTP 204
- **AND** the object in R2 storage is NOT deleted by this call

### Requirement: Host can block and unblock date ranges on an owned listing

The system SHALL allow a host to create a `HOST_BLOCK` covering a half-open date range
`[startDate, endDate)` on a listing they own. The system MUST enforce that no two
`AvailabilityBlock` rows on the same listing overlap, using a Postgres `EXCLUDE USING
gist` constraint. On overlap the API SHALL return HTTP `409 OVERLAP_CONFLICT` with a
structured body identifying the conflicting block. The system SHALL allow a host to
delete a `HOST_BLOCK` they own.

#### Scenario: Host blocks an available date range

- **GIVEN** a host who owns a listing with no existing `AvailabilityBlock` rows in `[D1, D2)`
- **WHEN** the host calls `POST /listings/:id/availability` with `{ startDate: D1, endDate: D2 }`
- **THEN** an `AvailabilityBlock` row with `source = HOST_BLOCK` is created
- **AND** the response is HTTP 201 with the created block

#### Scenario: Block is rejected when it overlaps an existing HOST_BLOCK

- **GIVEN** a host who owns a listing with an existing `AvailabilityBlock` of `source = HOST_BLOCK` covering `[D1, D2)`
- **WHEN** the host calls `POST /listings/:id/availability` with any range overlapping `[D1, D2)`
- **THEN** the system returns HTTP 409
- **AND** the response body is `{ error: "OVERLAP_CONFLICT", conflict: { blockId, source: "HOST_BLOCK", startDate, endDate } }`
- **AND** no new `AvailabilityBlock` row is inserted

#### Scenario: Block is rejected when it overlaps a BOOKING_HOLD

- **GIVEN** a host who owns a listing with an existing `AvailabilityBlock` of `source = BOOKING_HOLD` covering `[D1, D2)` and `bookingId` B1
- **WHEN** the host calls `POST /listings/:id/availability` with any range overlapping `[D1, D2)`
- **THEN** the system returns HTTP 409
- **AND** the response body is `{ error: "OVERLAP_CONFLICT", conflict: { blockId, source: "BOOKING_HOLD", startDate, endDate, bookingId: B1 } }`
- **AND** no new `AvailabilityBlock` row is inserted

#### Scenario: Host removes an owned HOST_BLOCK

- **GIVEN** a host who owns a listing with a `HOST_BLOCK` block B1
- **WHEN** the host calls `DELETE /listings/:id/availability/B1`
- **THEN** the `AvailabilityBlock` row is deleted
- **AND** the response is HTTP 204

#### Scenario: Host lists availability blocks for an owned listing

- **GIVEN** a host who owns a listing with N `AvailabilityBlock` rows
- **WHEN** the host calls `GET /listings/:id/availability`
- **THEN** the system returns an array of N blocks ordered ascending by `startDate`

#### Scenario: Non-owner cannot create or delete availability blocks

- **GIVEN** an authenticated host B and a listing owned by host A
- **WHEN** host B calls `POST /listings/:id/availability` or `DELETE /listings/:id/availability/:blockId`
- **THEN** the system returns HTTP 403
- **AND** no `AvailabilityBlock` is created or modified

### Requirement: Listing detail page UI

The web app SHALL provide a `/listings/:id` page where any visitor can view the full detail of a published listing: title, type, location, description, amenities, photo gallery, nightly rate, star rating, and guest reviews. An authenticated guest sees a "Book now" CTA; unauthenticated visitors see a "Log in to book" prompt.

#### Scenario: guest views listing detail

- **Given** a published listing with at least one photo and some reviews
- **When** an authenticated guest visits `/listings/:id`
- **Then** the page shows all listing fields plus a "Book now" button

#### Scenario: visitor views listing detail (not logged in)

- **Given** a published listing exists
- **When** an unauthenticated visitor visits `/listings/:id`
- **Then** the page shows listing detail and a "Log in to book" link instead of the CTA

#### Scenario: listing not found

- **Given** the listing ID does not exist or is not published
- **When** any visitor navigates to `/listings/:id`
- **Then** the page shows a 404 not-found message
