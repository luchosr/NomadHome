# listings — Delta for add-listing-crud

## MODIFIED Requirements

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
