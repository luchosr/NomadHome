# Proposal: add-listing-crud

## Why

Hosts exist (`add-host-onboarding`) but have no inventory to manage. This change
adds the first slice of the `listings` capability: creating and editing draft
listings with amenities. It is the foundation the photos slice, the publish/
availability slice, and guest-facing search all build on.

## What

- `Listing`, `Amenity`, and `ListingAmenity` models + migration, with a seeded
  starter amenity set.
- Host-only listing CRUD: create a draft (owner = host), edit an owned draft,
  list own listings, fetch an owned listing. Ownership is enforced (403 for a
  non-owner; 403 for a non-host).
- A shared `CreateListingSchema` / `UpdateListingSchema` (Zod) — the single
  source of truth for the request shape.

## Impact

- **Capabilities affected**: `listings`.
- **Spec refinement**: the "Host can create a listing in draft status"
  requirement is modified to make ≥1 photo a **publish-time** gate rather than a
  creation requirement — matching `docs/data-model.md` §3.6 and a draft-first UX.
- **Breaking changes**: no.
- **Migration required**: yes — `Listing`, `Amenity`, `ListingAmenity`.
- **Out of scope**: photos + storage backend (next slice; resolves the
  photo-storage `[OPEN]`), publish/unpublish + availability blocking, guest-facing
  search, geo/lat-long population.

## Risks & Mitigations

| Risk                                            | Likelihood | Mitigation                                                                       |
| ----------------------------------------------- | ---------- | -------------------------------------------------------------------------------- |
| Amenity codes drift between seed and validation | Low        | Submitted amenity codes are validated against the `Amenity` table at write time. |
| A non-owner edits a listing                     | Low        | Every mutating route checks `listing.hostId === req.user.id` and 403s otherwise. |

## Rollout

Big bang — no feature flag. Verified by DB-backed integration tests (locally and
in CI).
