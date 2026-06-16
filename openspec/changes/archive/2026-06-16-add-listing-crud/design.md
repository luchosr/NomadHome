# Design: add-listing-crud

## Photo gate moves to publish

The spec previously required ≥1 photo at creation, but the data-model §3.6
invariant gates photos at publish. A draft-first flow (create text → add photos →
publish) is the natural UX, so this change moves the ≥1-photo check to the publish
slice and keeps creation to text fields + ≥1 amenity. The create requirement is
modified accordingly.

## Amenities

`Amenity` is a small lookup keyed by `code` (e.g. `wifi`, `kitchen`,
`workspace_desk`), seeded by `seed.ts`. A listing references amenities through the
`ListingAmenity` join. Submitted `amenityCodes` are validated against the table at
write time; unknown codes are a 422. Setting amenities on edit replaces the set.

## Money & money fields

`nightlyRateCents` is an integer-cents amount (`> 0`); `currency` defaults to
`"USD"` (ISO 4217). No floats for money (data-model §1).

## Ownership

All listing routes require `host` (`requireAuth` + `requireRole("host")`).
Mutations and owned-reads additionally check `listing.hostId === req.user.id`,
returning 403 on mismatch. `lat`/`long` are left null in this slice (geocoding is
a search concern).

## Layering

`routes/listings.ts` → `controllers/listing.controller.ts` →
`services/listing.service.ts` → `repositories/listing.repository.ts`.
