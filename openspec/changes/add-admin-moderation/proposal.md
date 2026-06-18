# Proposal: add-admin-moderation

## Why

Admins need to remove bad actors and unsafe listings from the marketplace. US-8.1/8.2/8.3 complete the admin surface required for MVP: disable/enable users, disable/enable listings, and cascade booking flags when a user is disabled.

## What Changes

- `PATCH /admin/users/:id/disable` — sets `User.disabledAt`, hides all their PUBLISHED/DRAFT listings (→ DISABLED), flags upcoming confirmed guest bookings (GUEST_DISABLED) and host bookings (HOST_DISABLED)
- `PATCH /admin/users/:id/enable` — clears `User.disabledAt`; listings remain disabled (admin re-enables separately)
- `PATCH /admin/listings/:id/disable` — sets `Listing.status = DISABLED` and `disabledAt`
- `PATCH /admin/listings/:id/enable` — sets `Listing.status = PUBLISHED` and clears `disabledAt`
- New `BookingFlag` model to record booking-level admin flags

## Impact

- **Capabilities affected**: `admin`
- **Breaking changes**: no
- **Migration required**: yes — add `BookingFlag` table and `BookingFlagReason` enum
- **Out of scope**: refund automation for flagged bookings, re-enabling host listings automatically, email notifications to affected hosts/guests

## Risks & Mitigations

| Risk                                                          | Likelihood            | Mitigation                                                  |
| ------------------------------------------------------------- | --------------------- | ----------------------------------------------------------- |
| Disabling a user with many bookings causes a slow transaction | Low (MVP pilot scale) | Single transaction is fine; add batching post-MVP if needed |

## Rollout

All endpoints require `admin` role. No feature flag needed.
