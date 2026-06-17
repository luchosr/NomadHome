# Proposal: add-reviews

## Why

The end-to-end booking loop (search → book → pay → stay → **review**) is missing its final step. Without reviews, guests have no trust signal when choosing a listing, and hosts have no incentive to maintain quality. This ticket closes that gap by allowing a guest to submit one review per completed booking and exposing the aggregate rating on the listing.

Ticket: NH-015 | User story: US-6.1

## What

- **`POST /bookings/:id/review`** — authenticated guest submits a review (rating 1–5 + optional text) for a booking they own that has status `CONFIRMED` and `checkOut < today`. Enforces one-review-per-booking via `Review.bookingId @unique`.
- **`GET /listings/:id/reviews`** — public endpoint that returns all reviews for a listing plus the aggregate (average rating, count).
- On review creation, `Listing.averageRating` and `Listing.reviewCount` are updated atomically in the same transaction.

## Impact

- **Capabilities affected**: `reviews`
- **Breaking changes**: none — additive only
- **Migration required**: yes — adds `Review` table
- **Out of scope**: host-to-guest reviews (post-MVP), photo reviews, structured rubric (post-MVP)

## Risks & Mitigations

| Risk                                     | Likelihood | Mitigation                                                    |
| ---------------------------------------- | ---------- | ------------------------------------------------------------- |
| Guest reviews a booking before check-out | Low        | Service validates `checkOut < today` before accepting         |
| Duplicate review on same booking         | Low        | `Review.bookingId @unique` at DB level → 409 on conflict      |
| Average rating drifts from reality       | Low        | Recomputed from all reviews in the same transaction as insert |

## Rollout

Big bang — additive endpoints only. No feature flag needed.
