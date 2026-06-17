# Tasks: add-search

## 1. Shared

- [ ] 1.1 Add `SearchQuerySchema` (Zod) in `packages/shared/src/schemas/search.ts` — validates `city` (non-empty string), `checkIn` (z.string().date()), `checkOut` (z.string().date(), refinement: `checkOut > checkIn`), optional `type` (enum PROPERTY | WORKSPACE), optional `amenities` (comma-separated string, split into string[]), optional `minPrice` (int ≥ 0, cents), optional `maxPrice` (int ≥ 0, cents), optional `capacity` (int ≥ 1), `page` (int ≥ 1, default 1), `pageSize` (int ∈ [1, 100], default 20); export inferred `SearchQuery` type
- [ ] 1.2 Add `SearchResultItemSchema` (Zod) in `packages/shared/src/schemas/search.ts` — fields: `id`, `title`, `type`, `city`, `country`, `nightlyRateCents`, `currency`, `totalCents`, `primaryPhotoUrl` (string | null); export inferred `SearchResultItem` type
- [ ] 1.3 Add `SearchResponseSchema` (Zod) in `packages/shared/src/schemas/search.ts` — `{ data: SearchResultItem[], pagination: { total, page, pageSize, hasMore } }`; export inferred `SearchResponse` type
- [ ] 1.4 Add search strings in `packages/shared/src/strings/en.ts`: `search.error.invalid_dates`, `search.error.end_before_start`, `search.error.invalid_page`, `search.error.invalid_page_size`
- [ ] 1.5 Export all new schemas, types, and strings from `packages/shared/src/index.ts`

## 2. Backend

- [ ] 2.1 Add `SearchRepository` in `apps/api/src/repositories/search.repository.ts` — single method `search(params: SearchQuery): Promise<{ rows: SearchResultItem[]; total: number }>`:
  - Filter `Listing.status = PUBLISHED` and `Listing.city = city` (case-insensitive)
  - Exclude listings with any `AvailabilityBlock` where `startDate < checkOut AND endDate > checkIn` (half-open interval)
  - Apply optional filters: `type`, `minPrice` (nightlyRateCents ≥ minPrice), `maxPrice` (nightlyRateCents ≤ maxPrice), `capacity` (≥ capacity), `amenities` (AND — listing must have all requested amenity codes via subquery/join)
  - Sort: `createdAt DESC, id ASC`
  - Compute `totalCents = nightlyRateCents × nights` (nights = calendar days between checkIn and checkOut)
  - Resolve `primaryPhotoUrl` from `ListingPhoto` with lowest `position` (null if none)
  - Apply offset pagination: `skip = (page - 1) * pageSize`, `take = pageSize`
  - Return both page rows and total count (use `$transaction([findMany, count])`)
- [ ] 2.2 Add `SearchService` in `apps/api/src/services/search.service.ts` — delegates directly to `SearchRepository.search`; wraps result in `SearchResponse` envelope with `hasMore = page * pageSize < total`
- [ ] 2.3 Add `SearchController` in `apps/api/src/controllers/search.controller.ts` — parses + validates query string with `SearchQuerySchema` (returns 400 on validation failure with structured Zod error); calls `SearchService.search`; returns 200 with `SearchResponse`
- [ ] 2.4 Add route file `apps/api/src/routes/search.ts` — mounts `GET /` on a router; **no auth middleware**
- [ ] 2.5 Register the search router in `apps/api/src/app.ts` at path `/search`

## 3. Tests

- [ ] 3.1 Add `apps/api/src/search.test.ts` — DB-backed integration tests covering all spec scenarios:
  - Happy path: city + date range returns only published, available listings with correct fields (title, type, city, country, nightlyRateCents, currency, totalCents, primaryPhotoUrl)
  - Availability exclusion: listing with overlapping AvailabilityBlock is absent from results
  - Status exclusion: DRAFT and DISABLED listings are excluded
  - Filter — type: only listings matching requested type returned
  - Filter — amenities (AND): listing must have all requested codes; partial match excluded
  - Filter — minPrice / maxPrice: listings outside range excluded
  - Filter — capacity: listings below minimum excluded
  - Filters combined: only listings satisfying all applied filters returned
  - Pagination — first page: correct data slice, `hasMore = true`, echoed page/pageSize
  - Pagination — default params: page 1, pageSize 20 when omitted
  - Pagination — last page: `hasMore = false`
  - Pagination — two consecutive pages: union is disjoint and complete
  - Pagination — invalid page (page=0): HTTP 400, `page` identified in error
  - Pagination — invalid pageSize (pageSize=200): HTTP 400, `pageSize` identified in error
  - Sort — createdAt DESC: newest listing appears first
  - Sort — tiebreaker: A.id < B.id → A before B when createdAt equal
  - Sort — ?sort param ignored: response is the same with and without `?sort=nightlyRate`
  - No auth required: unauthenticated request succeeds (200)

## 4. Verify

- [ ] 4.1 `pnpm lint && pnpm typecheck && pnpm test && pnpm build` — all green
- [ ] 4.2 `openspec validate add-search --strict` and `node scripts/check-mvp-scope.mjs` pass
