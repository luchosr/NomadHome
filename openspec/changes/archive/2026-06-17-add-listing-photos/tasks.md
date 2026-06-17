# Tasks: add-listing-photos

## 1. Database

- [ ] 1.1 Add `ListingPhoto` Prisma model in `packages/db/prisma/schema.prisma` with composite UNIQUE `(listingId, position)`
- [ ] 1.2 Generate and apply migration (`pnpm --filter @nomadhome/db db:migrate:dev -- --name add_listing_photos`)
- [ ] 1.3 Update `Listing` model comment to reference `ListingPhoto` relation

## 2. Shared schemas

- [ ] 2.1 Add `UploadUrlRequestSchema` (contentType: string) in `packages/shared/src/schemas/listing.ts`
- [ ] 2.2 Add `RegisterPhotoSchema` ({ key: string, position: int ≥ 0 }) in `packages/shared/src/schemas/listing.ts`
- [ ] 2.3 Add `UpdatePhotoPositionSchema` ({ position: int ≥ 0 }) in `packages/shared/src/schemas/listing.ts`
- [ ] 2.4 Add photo-related strings in `packages/shared/src/strings/en.ts`

## 3. Storage adapter

- [ ] 3.1 Add `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner` to `apps/api/package.json`
- [ ] 3.2 Add `StorageService` in `apps/api/src/services/storage.service.ts` with one method: `getPresignedUploadUrl(key, contentType, ttlSeconds): Promise<string>`; reads `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME` from `process.env`

## 4. Backend — photos

- [ ] 4.1 Add `ListingPhotoRepository` in `apps/api/src/repositories/listing-photo.repository.ts` (create, findById, findByListing ordered by position, updatePosition, delete)
- [ ] 4.2 Add `ListingPhotoService` in `apps/api/src/services/listing-photo.service.ts` — ownership checks via `ListingRepository.findById`, delegates to `ListingPhotoRepository`; injects `StorageService` for presigned URL
- [ ] 4.3 Add controller in `apps/api/src/controllers/listing-photo.controller.ts` — maps service errors to HTTP (403 → 403, not found → 404, position conflict → 409)
- [ ] 4.4 Add router in `apps/api/src/routes/listing-photos.ts` — all routes under `requireAuth + requireRole("host")`
- [ ] 4.5 Mount router in `apps/api/src/app.ts` at `/listings`

## 5. Tests

- [ ] 5.1 Add `apps/api/src/listing-photos.test.ts` with DB-backed integration tests; mock `StorageService.getPresignedUploadUrl` to return a fake URL
- [ ] 5.2 Tests cover: get presigned URL (mock), register photo (201), position conflict (409), list photos (ordered), update position, delete (204), non-owner 403

## 6. Docs & open decisions

- [ ] 6.1 Add `design.md` ADR closing the photo-storage open decision (R2, single provider, no `storageProvider` column)
- [ ] 6.2 Remove the `listings` photo-storage row from `openspec/project.md §8`
- [ ] 6.3 Update `docs/data-model.md §9` open-decision entry to resolved
- [ ] 6.4 Add `R2_*` vars to `.env.example` (root)
