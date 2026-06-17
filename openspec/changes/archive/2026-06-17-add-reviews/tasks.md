# Tasks: add-reviews

## 1. Database

- [ ] 1.1 Add `Review` model to `packages/db/prisma/schema.prisma` (`id`, `bookingId @unique`, `listingId`, `guestId`, `rating Int`, `text String?`, `createdAt`; FK to Booking, Listing, User)
- [ ] 1.2 Create migration SQL and apply via `prisma migrate resolve --applied`

## 2. Shared schemas

- [ ] 2.1 Add `CreateReviewSchema` in `packages/shared/src/schemas/review.ts` (`rating` int 1–5, `text` optional string max 2000)
- [ ] 2.2 Add review error strings to `packages/shared/src/strings/en.ts`
- [ ] 2.3 Export from `packages/shared/src/index.ts`

## 3. Backend

- [ ] 3.1 Add `ReviewRepository` in `apps/api/src/repositories/review.repository.ts` (`create` with atomic listing aggregate update, `findByListing`)
- [ ] 3.2 Add `ReviewService` in `apps/api/src/services/review.service.ts` (validates ownership, CONFIRMED status, checkOut past, delegates to repo)
- [ ] 3.3 Add `ReviewController` in `apps/api/src/controllers/review.controller.ts`
- [ ] 3.4 Add `POST /bookings/:id/review` to `apps/api/src/routes/bookings.ts`
- [ ] 3.5 Add `GET /listings/:id/reviews` to `apps/api/src/routes/listings.ts`
- [ ] 3.6 Wire any new routers in `apps/api/src/app.ts` if needed

## 4. Tests

- [ ] 4.1 Integration tests for `POST /bookings/:id/review` (happy path, duplicate 409, checkout not passed 422, wrong owner 404, non-confirmed 422, invalid rating 422)
- [ ] 4.2 Integration tests for `GET /listings/:id/reviews` (with reviews, empty listing)
