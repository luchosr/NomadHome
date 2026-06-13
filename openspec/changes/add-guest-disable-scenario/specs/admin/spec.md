## MODIFIED Requirements

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

#### Scenario: Admin disables a guest with active bookings

- **GIVEN** an authenticated admin
- **AND** a target user whose roles are `guest` only (no host listings)
- **AND** the target user has one or more `confirmed` future bookings as the guest
- **WHEN** the admin disables the user
- **THEN** the target user can no longer obtain new access tokens via login
- **AND** each affected confirmed booking is flagged for admin review with reason `GUEST_DISABLED`
- **AND** the bookings remain in status `confirmed` (the admin decides whether to cancel and refund out-of-band, consistent with US-4.2 and US-5.3)
- **AND** no `HOST_DISABLED` rows are created because the target user owns no listings

#### Scenario: Admin disables a user who is both a host and a guest

- **GIVEN** an authenticated admin
- **AND** a target user with both `host` and `guest` roles who owns one or more `published` listings with at least one `confirmed` future booking AND has one or more `confirmed` future bookings as the guest on other listings
- **WHEN** the admin disables the user in a single transaction
- **THEN** the target user can no longer obtain new access tokens via login
- **AND** the target user's listings no longer appear in guest-facing search and cannot be booked
- **AND** each affected booking on the target user's listings is flagged with reason `HOST_DISABLED`
- **AND** each affected booking where the target user is the guest is flagged with reason `GUEST_DISABLED`
- **AND** both sets of `BookingFlag` rows are created in the same database transaction as the user-disable, refresh-token revocation, and listing-status updates (per `docs/data-model.md` §7.4 invariant 4)

#### Scenario: Admin re-enables a previously disabled user

- **GIVEN** a user previously disabled by an admin
- **WHEN** the admin re-enables the user
- **THEN** the user can log in again
- **AND** any listings the user still owns that are in status `published` are again returned by guest-facing search
