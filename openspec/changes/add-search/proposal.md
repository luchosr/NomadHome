# Proposal: add-search

## Why

Listings are published (`add-listing-publish-availability`) but guests have no way
to discover them. This change adds the guest-facing search endpoint — the
bridge between published inventory and the booking funnel. Without search, no
guest can reach a listing, which means no booking and no payment: the core
MVP loop is broken.

Ticket: NH-012.

## What

- A public `GET /search` endpoint — no authentication required.
- Required query parameters: `city`, `checkIn`, `checkOut` (YYYY-MM-DD).
- Optional filters: `type` (PROPERTY | WORKSPACE), `amenities` (comma-separated
  codes, AND semantics), `minPrice` (cents), `maxPrice` (cents), `capacity`
  (integer minimum).
- Pagination via `page` (≥ 1, default 1) and `pageSize` (∈ [1, 100], default
  20). Out-of-range values return HTTP 400.
- Response envelope: `{ data: SearchResultItem[], pagination: { total, page, pageSize, hasMore } }`.
- Each `SearchResultItem` exposes: `id`, `title`, `type`, `city`, `country`,
  `nightlyRateCents`, `currency`, `totalCents` (nightlyRateCents × nights),
  `primaryPhotoUrl` (photo with lowest `position`, null if none).
- Exclusions: listings where `status ≠ PUBLISHED` or where any
  `AvailabilityBlock` overlaps `[checkIn, checkOut)` using half-open interval
  semantics (`block.startDate < checkOut AND block.endDate > checkIn`).
- Sort: `Listing.createdAt DESC`, `Listing.id ASC` tiebreaker — deterministic
  for offset pagination.
- No new Prisma model. Read-only over existing `Listing`, `ListingPhoto`,
  `ListingAmenity`, and `AvailabilityBlock` tables.

## Impact

- **Capabilities affected**: `search`.
- **Breaking changes**: no — first implementation of the capability.
- **Migration required**: no — read-only; no new schema.
- **Out of scope**: geo/radius search, map view, saved searches, `?sort`
  parameter (ignored per spec), any filter not listed above.

## Risks & Mitigations

| Risk                                                                | Likelihood           | Mitigation                                                                                                                                                                                                |
| ------------------------------------------------------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Availability overlap query is slow on large datasets                | Low (MVP scale)      | Raw SQL with half-open interval filter on indexed `listingId`; add a composite index on `AvailabilityBlock(listingId, startDate, endDate)` via migration-free advisory note (no schema change needed now) |
| Invalid date strings produce bad DB queries                         | Low                  | Zod schema enforces `z.string().date()` and `checkOut > checkIn` before any DB call                                                                                                                       |
| Pagination inconsistency under concurrent listing inserts           | Very low (MVP scale) | Deterministic `createdAt DESC, id ASC` sort makes offset pages stable                                                                                                                                     |
| `amenities` filter with unknown codes silently returns zero results | Low                  | Documented behaviour: unknown amenity codes produce an empty result set; no 400                                                                                                                           |

## Rollout

Big bang — no feature flag. Public endpoint verified by DB-backed integration
tests (locally and in CI). No auth middleware on this route.
