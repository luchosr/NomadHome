# listings — Delta for add-listing-photos

## ADDED Requirements

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
