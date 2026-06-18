# Tasks: add-search-ui

## 1. Backend — public listing detail endpoint

- [x] 1.1 Add `findPublished(id)` to `ListingRepository` — fetches listing with amenities + photos sorted by position, only if status is PUBLISHED
- [x] 1.2 Add `getPublic(id)` to `ListingService` — wraps repo call, throws `ListingNotFoundError` if null
- [x] 1.3 Add `getPublic` handler to `ListingController`
- [x] 1.4 Mount `GET /:id` on `reviewsRouter` (already public, mounted before `listingsRouter`)
- [x] 1.5 Add `GET /listings/:id` integration test (published → 200, not-published → 404)

## 2. Shared strings

- [x] 2.1 Add `search.*` and `listings.detail.*` string keys to `packages/shared/src/strings/en.ts`

## 3. Frontend — API client

- [x] 3.1 Add `searchApi.search(query)` in `apps/web/src/api/search.ts`
- [x] 3.2 Add `listingsApi.getDetail(id)` in `apps/web/src/api/listings.ts`

## 4. Frontend — components and pages

- [x] 4.1 `ListingCard` component — title, type badge, city, nightly rate, primary photo
- [x] 4.2 `SearchPage` (`/search`) — city + date form, results grid, empty state
- [x] 4.3 `ListingDetailPage` (`/listings/:id`) — photo gallery, amenities, rating, reviews, book CTA
- [x] 4.4 Update `router.tsx` — add `/search` and `/listings/:id` public routes

## 5. Tests

- [x] 5.1 `ListingCard.test.tsx` — renders card fields
- [x] 5.2 `SearchPage.test.tsx` — renders form, shows validation error, shows cards on results
- [x] 5.3 `ListingDetailPage.test.tsx` — renders detail fields, shows CTA for guest, shows login link for visitor
