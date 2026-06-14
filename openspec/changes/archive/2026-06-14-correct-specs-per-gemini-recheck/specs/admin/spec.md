## MODIFIED Requirements

### Requirement: Admin can disable a user

The system SHALL allow an authenticated admin to disable any user account. A disabled user MUST NOT be able to log in. Any listings owned by a disabled host MUST be transitioned to `Listing.status = DISABLED` (per `docs/data-model.md` §7.4 invariant 4), hiding them from guest-facing search and making them unbookable. Existing confirmed bookings tied to the disabled user (as guest or host) MUST be flagged for admin review.

Disabling MUST be reversible by an admin (re-enable). On re-enable, the user's login access is restored. Listings whose status was transitioned to `DISABLED` by the user-disable cascade SHALL revert to `Listing.status = DRAFT` — NOT to their pre-disable status, and NOT to `PUBLISHED`. The host MUST manually re-publish each listing before it appears in guest-facing search again. This matches `docs/data-model.md` §3.6 invariant ("re-enabling reverts to `DRAFT`, not `PUBLISHED`") and forces a manual safety check before previously-disabled content goes live.

#### Scenario: Admin disables a host with active listings and bookings

- **GIVEN** an authenticated admin
- **AND** a target user with role `host` who owns one or more `published` listings and has at least one `confirmed` future booking against those listings
- **WHEN** the admin disables the user
- **THEN** the target user can no longer obtain new access tokens via login
- **AND** each of the target user's listings is transitioned to `Listing.status = DISABLED`
- **AND** none of the target user's listings appear in guest-facing search
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
- **AND** each of the target user's listings is transitioned to `Listing.status = DISABLED` and no longer appears in guest-facing search
- **AND** each affected booking on the target user's listings is flagged with reason `HOST_DISABLED`
- **AND** each affected booking where the target user is the guest is flagged with reason `GUEST_DISABLED`
- **AND** both sets of `BookingFlag` rows and the listing-status transitions occur in the same database transaction as the user-disable and refresh-token revocation (per `docs/data-model.md` §7.4 invariant 4)

#### Scenario: Admin re-enables a previously disabled user

- **GIVEN** a user previously disabled by an admin who owned one or more listings at the time of disable (now in status `DISABLED`)
- **WHEN** the admin re-enables the user
- **THEN** the user can log in again
- **AND** each listing whose status was transitioned to `DISABLED` by the original user-disable cascade reverts to `Listing.status = DRAFT`
- **AND** those listings do NOT appear in guest-facing search until the host manually re-publishes them
- **AND** listings that were already in `DRAFT` at the time of disable remain in `DRAFT` (the cascade transitioned only the non-DRAFT listings)
- **AND** `BookingFlag` rows produced by the original disable cascade are NOT auto-resolved by re-enable — the admin must explicitly resolve them (`BookingFlag.resolvedAt` set)
