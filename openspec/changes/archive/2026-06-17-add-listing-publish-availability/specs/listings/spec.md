# listings — Delta for add-listing-publish-availability

## MODIFIED Requirements

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

## ADDED Requirements

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
