# Tasks: add-listing-crud

## 1. Database

- [x] 1.1 Add `Listing`, `Amenity`, `ListingAmenity` models + `ListingType` / `ListingStatus` enums to `packages/db/prisma/schema.prisma` (per `docs/data-model.md` §3.6–3.9) + the relation on `User`
- [x] 1.2 Generate the migration
- [x] 1.3 Seed a starter amenity set in `packages/db/prisma/seed.ts`

## 2. Shared

- [x] 2.1 Add `CreateListingSchema` / `UpdateListingSchema` (Zod: title, description, type, city, country, addressLine, capacity ≥1, nightlyRateCents >0, currency default USD, `amenityCodes` ≥1) + inferred types
- [x] 2.2 Add listings `t()` strings
- [x] 2.3 Vitest: schema accepts valid input and rejects each violation

## 3. Backend

- [x] 3.1 Add `ListingRepository` (create with amenities, find by id, update with amenities, list by host, validate amenity codes)
- [x] 3.2 Add `ListingService` (create draft owned by host; update own; list own; ownership 403)
- [x] 3.3 Add listing controller + `POST /listings`, `GET /listings/mine`, `GET /listings/:id`, `PATCH /listings/:id` behind `requireAuth` + `requireRole("host")`; mount `/listings` in `app.ts`
- [x] 3.4 Vitest integration tests (DB-backed): create draft (status, owner, amenities), missing-field → 400, unknown amenity → 422, non-owner edit → 403, non-host → 403, list-own returns only own

## 4. Verify

- [x] 4.1 `pnpm lint && pnpm typecheck && pnpm test && pnpm build` — all green; integration tests run against a local Postgres
- [x] 4.2 `openspec validate add-listing-crud --strict` and `node scripts/check-mvp-scope.mjs` pass
