# Proposal: add-host-dashboard-ui

## Why

Hosts have no UI to manage their listings or see upcoming bookings. This ticket adds the minimal host dashboard: listing CRUD, photo management, availability blocking, and the upcoming bookings view (NH-022).

## What Changes

- **`HostListingsPage`** (`/host/listings`): lists the host's own listings with status badges; "New listing" button.
- **`CreateListingPage`** (`/host/listings/new`): form (title, type, city, country, address, capacity, nightly rate, amenities checkboxes).
- **`EditListingPage`** (`/host/listings/:id/edit`): same form pre-filled; publish/unpublish toggle; photo management section (upload, reorder, delete); availability block section (add/remove date ranges).
- **`HostUpcomingPage`** (`/host/upcoming`): read-only table of upcoming CONFIRMED bookings (listing title, guest email, check-in, check-out).
- Nav "Host Dashboard" link (already in Layout) updated to point to `/host/listings`.

## Impact

- **Capabilities affected**: `listings`
- **Breaking changes**: no
- **Migration required**: no
- **Out of scope**: real photo upload to S3 (the API generates a pre-signed upload URL — for MVP we wire the upload-URL call and show the key; actual S3 upload requires a browser `fetch PUT` to the signed URL)

## Risks & Mitigations

| Risk                                       | Likelihood | Mitigation                                                                                                  |
| ------------------------------------------ | ---------- | ----------------------------------------------------------------------------------------------------------- |
| Photo upload complexity (signed URL + PUT) | Medium     | Implement the full flow: get signed URL → PUT file to S3 URL → register photo key; mock the S3 PUT in tests |
| Amenity codes are opaque strings           | Low        | Hardcode the MVP amenity list from the DB seed as checkboxes                                                |

## Rollout

Big bang — no existing host dashboard to replace.
