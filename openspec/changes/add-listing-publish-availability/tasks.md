# Tasks: add-listing-publish-availability

## 1. Database

- [ ] 1.1 Add `AvailabilityBlockSource` enum and `AvailabilityBlock` model to `packages/db/prisma/schema.prisma`; add `availabilityBlocks AvailabilityBlock[]` relation to `Listing`
- [ ] 1.2 Generate base migration (`prisma migrate dev --name add_availability_block`)
- [ ] 1.3 Append raw SQL to the migration file: enable `btree_gist` extension and add `EXCLUDE USING gist` constraint on `(listingId, daterange(startDate, endDate, '[)'))` per `docs/data-model.md §3.10`

## 2. Shared schemas

- [ ] 2.1 Add `BlockDateRangeSchema` in `packages/shared/src/schemas/listing.ts`: `{ startDate: z.string().date(), endDate: z.string().date() }` with refinement `endDate > startDate`
- [ ] 2.2 Add availability and publish strings in `packages/shared/src/strings/en.ts`
- [ ] 2.3 Export new schema + types from `packages/shared/src/index.ts`

## 3. Backend — publish/unpublish

- [ ] 3.1 Add `publish(hostId, listingId)` and `unpublish(hostId, listingId)` to `ListingService` in `apps/api/src/services/listing.service.ts`; `publish` checks ownership, counts photos, updates status; `unpublish` checks ownership, updates status
- [ ] 3.2 Add `photoCount(listingId)` to `ListingRepository` in `apps/api/src/repositories/listing.repository.ts`
- [ ] 3.3 Add `publish` and `unpublish` controller methods to `ListingController`
- [ ] 3.4 Add `PATCH /:id/publish` and `PATCH /:id/unpublish` routes to `apps/api/src/routes/listings.ts`

## 4. Backend — availability

- [ ] 4.1 Add `AvailabilityRepository` in `apps/api/src/repositories/availability.repository.ts`: `createHostBlock`, `findConflicting` (raw `$queryRaw` for overlap), `listByListing`, `deleteBlock`
- [ ] 4.2 Add `AvailabilityService` in `apps/api/src/services/availability.service.ts`: ownership check via `ListingRepository.findById`; catches Prisma `23P01` (exclusion violation), queries conflicting block, throws `OverlapConflictError` with payload
- [ ] 4.3 Add `AvailabilityController` in `apps/api/src/controllers/availability.controller.ts`: maps `OverlapConflictError` → 409, ownership errors → 403
- [ ] 4.4 Add `apps/api/src/routes/availability.ts` router; mount on `/listings` in `apps/api/src/app.ts`

## 5. Tests

- [ ] 5.1 Add `apps/api/src/listing-publish.test.ts`: publish happy path (200), publish rejected without photo (422), unpublish (200), non-owner 403
- [ ] 5.2 Add `apps/api/src/listing-availability.test.ts`: block happy path (201), HOST_BLOCK overlap (409 with correct body), BOOKING_HOLD overlap (409 with bookingId), delete block (204), list blocks ordered, non-owner 403

## 6. Docs

- [ ] 6.1 No new open decisions introduced by this change
