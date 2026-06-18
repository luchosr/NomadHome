# admin — Delta for add-admin-moderation

## ADDED Requirements

### Requirement: disable-user

The system SHALL allow an admin to disable a user account, preventing login, hiding their listings, and flagging their upcoming confirmed bookings.

#### Scenario: admin disables a user

- **Given** I am authenticated as an admin
- **When** I send `PATCH /admin/users/:id/disable`
- **Then** the user's `disabledAt` is set, all their PUBLISHED/DRAFT listings are set to DISABLED, upcoming confirmed bookings where they are the guest receive a `GUEST_DISABLED` flag, and upcoming confirmed bookings where they are the host receive a `HOST_DISABLED` flag
- **And** I receive HTTP 200

#### Scenario: non-admin is rejected

- **Given** I am authenticated as a guest or host
- **When** I send `PATCH /admin/users/:id/disable`
- **Then** I receive HTTP 403

### Requirement: enable-user

The system SHALL allow an admin to re-enable a previously disabled user account.

#### Scenario: admin enables a user

- **Given** I am authenticated as an admin
- **When** I send `PATCH /admin/users/:id/enable`
- **Then** the user's `disabledAt` is cleared and I receive HTTP 200

### Requirement: disable-listing

The system SHALL allow an admin to disable a listing, removing it from search and preventing new bookings.

#### Scenario: admin disables a listing

- **Given** I am authenticated as an admin
- **When** I send `PATCH /admin/listings/:id/disable`
- **Then** the listing's `status` is set to `DISABLED` and `disabledAt` is set
- **And** I receive HTTP 200

### Requirement: enable-listing

The system SHALL allow an admin to re-enable a disabled listing.

#### Scenario: admin enables a listing

- **Given** I am authenticated as an admin
- **When** I send `PATCH /admin/listings/:id/enable`
- **Then** the listing's `status` is set to `PUBLISHED` and `disabledAt` is cleared
- **And** I receive HTTP 200
