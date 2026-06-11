## ADDED Requirements

### Requirement: Admin can disable a user

The system SHALL allow an authenticated admin to disable any user account. A disabled user MUST NOT be able to log in. Any listings owned by a disabled host MUST be hidden from guest-facing search and MUST NOT be bookable. Existing confirmed bookings tied to the disabled user (as guest or host) MUST be flagged for admin review.

Disabling MUST be reversible by an admin (re-enable), restoring login access and un-hiding still-active listings.

#### Scenario: Admin disables a host with active listings and bookings

- **GIVEN** an authenticated admin
- **AND** a target user with role `host` who owns one or more `published` listings and has at least one `confirmed` future booking against those listings
- **WHEN** the admin disables the user
- **THEN** the target user can no longer obtain new access tokens via login
- **AND** the target user's listings no longer appear in guest-facing search
- **AND** the target user's listings cannot be booked
- **AND** the affected confirmed bookings are flagged for admin review with reason `HOST_DISABLED`

#### Scenario: Admin re-enables a previously disabled user

- **GIVEN** a user previously disabled by an admin
- **WHEN** the admin re-enables the user
- **THEN** the user can log in again
- **AND** any listings the user still owns that are in status `published` are again returned by guest-facing search

### Requirement: Admin can disable a listing

The system SHALL allow an authenticated admin to disable any listing. A disabled listing MUST NOT appear in search results and MUST NOT be bookable. Existing confirmed bookings on a disabled listing MUST remain visible to the affected host and guest with a notice and MUST be flagged for admin review.

#### Scenario: Admin disables a listing with future confirmed bookings

- **GIVEN** an authenticated admin
- **AND** a target listing in status `published` with at least one `confirmed` future booking
- **WHEN** the admin disables the listing
- **THEN** the listing no longer appears in guest-facing search
- **AND** new booking attempts against the listing are rejected
- **AND** existing confirmed bookings remain visible to the host and the guest with a notice that the listing was disabled
- **AND** those bookings are flagged for admin review with reason `LISTING_DISABLED`

### Requirement: Admin actions require the admin role

The system SHALL ensure that every admin operation (disable user, re-enable user, disable listing, record payout, view payouts dashboard, view flagged bookings) is reachable only to authenticated users with the `admin` role.

#### Scenario: Non-admin user attempts an admin operation

- **GIVEN** an authenticated user without the `admin` role
- **WHEN** the user calls any admin endpoint
- **THEN** the system returns HTTP 403
- **AND** no state change occurs
