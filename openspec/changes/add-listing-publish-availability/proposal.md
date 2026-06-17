# Proposal: add-listing-publish-availability

## Why

Hosts can create draft listings with photos (NH-009, NH-010) but cannot publish them
or control availability. This change completes the `listings` capability for MVP:
hosts can publish a draft, take it back to draft, and block date ranges so guests
cannot book them. It is the final prerequisite before guest-facing search (NH-012)
can show real, bookable inventory.

Ticket: NH-011.

## What Changes

- `PATCH /listings/:id/publish` — transitions an owned `draft` listing to `published`.
  Gate: ≥1 `ListingPhoto` must exist. Returns 422 if the gate fails.
- `PATCH /listings/:id/unpublish` — transitions an owned `published` listing back to
  `draft`. No gate; always allowed for the owner.
- `POST /listings/:id/availability` — creates a `HOST_BLOCK` for `[startDate, endDate)`.
  Returns 409 `OVERLAP_CONFLICT` with a structured body if the range overlaps any
  existing `AvailabilityBlock` (enforced at the DB level by a `EXCLUDE USING gist`
  constraint).
- `DELETE /listings/:id/availability/:blockId` — removes an owned `HOST_BLOCK`.
- `GET /listings/:id/availability` — lists all `AvailabilityBlock` rows for a listing
  ordered by `startDate`.
- `AvailabilityBlock` Prisma model + `AvailabilityBlockSource` enum + migration that
  enables `btree_gist` and adds the EXCLUDE constraint.

## Impact

- **Capabilities affected**: `listings`.
- **Breaking changes**: none — new endpoints and a new table only.
- **Migration required**: yes — `AvailabilityBlock` table + EXCLUDE constraint.
- **Out of scope**: `BOOKING_HOLD` and `ADMIN_BLOCK` insertion (those are booking and
  admin tickets); guest-facing search; `bookingId` FK relation to `Booking` (added
  when the `Booking` model exists).

## Risks & Mitigations

| Risk                                                                    | Likelihood | Mitigation                                                                                                                          |
| ----------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `btree_gist` extension not available on managed Postgres                | Low        | It ships with all standard Postgres distributions. CI uses postgres:16 which includes it.                                           |
| EXCLUDE constraint vs. Prisma migration                                 | Medium     | EXCLUDE is unsupported by Prisma schema — added as raw SQL in the migration file after `prisma migrate dev` generates the base DDL. |
| Conflict query races between EXCLUDE rejection and the follow-up SELECT | Very Low   | Acceptable for MVP; the EXCLUDE ensures no bad row was written — the follow-up SELECT is best-effort for the error body.            |

## Rollout

Big bang — no feature flag. DB-backed integration tests in CI.
