# reviews Specification

## Purpose

One guest review per completed booking (1–5 stars + free text), aggregated per listing for display on the listing detail page. Owns the `Review` aggregate; the `Review.bookingId` UNIQUE constraint enforces the one-review-per-booking invariant (`docs/data-model.md` §7.6). Host-to-guest reviews are Post-MVP per `openspec/project.md` §3.1.

## Requirements

### Requirement: Guest can review a completed booking

The system SHALL allow an authenticated guest who owns a booking with status `CONFIRMED` and `checkOut` strictly in the past (`checkOut < today`) to submit a review via `POST /bookings/:id/review`. The review MUST consist of a `rating` integer in [1, 5] and an optional `text` string (max 2000 characters). The system MUST allow at most one review per booking, enforced by a `Review.bookingId UNIQUE` constraint at the database level.

On successful creation the system SHALL atomically update `Listing.averageRating` (arithmetic mean of all rating values for that listing, rounded to 2 decimal places) and `Listing.reviewCount` within the same database transaction.

Rejection for a booking that doesn't exist or isn't owned by the requesting guest SHALL return HTTP 404 with error code `BOOKING_NOT_FOUND` and a human-readable `message`.

Host-to-guest reviews are out of scope for MVP.

#### Scenario: Guest submits a review after check-out

- **Given** an authenticated guest who owns a booking with status `CONFIRMED`
- **And** `checkOut` is strictly in the past (`checkOut < today`)
- **When** the guest submits `POST /bookings/:id/review` with `{ rating: R, text: "..." }` where `R ∈ [1, 5]`
- **Then** the system responds `201 Created` with the review record
- **And** the review is linked to the booking and to the listing
- **And** `Listing.averageRating` and `Listing.reviewCount` are updated to reflect the new review

#### Scenario: Second review on the same booking is rejected

- **Given** an authenticated guest with an existing review on a booking
- **When** the guest submits `POST /bookings/:id/review` a second time
- **Then** the system responds `409 Conflict` with error code `REVIEW_ALREADY_EXISTS`
- **And** the existing review is unchanged

#### Scenario: Review is rejected when check-out has not passed

- **Given** an authenticated guest who owns a `CONFIRMED` booking
- **And** `checkOut` is today or in the future
- **When** the guest submits `POST /bookings/:id/review`
- **Then** the system responds `422 Unprocessable Entity` with error code `CHECKOUT_NOT_PASSED`
- **And** no review is created

#### Scenario: Review is rejected for a booking not owned by the guest

- **Given** an authenticated guest
- **And** a booking owned by a different guest
- **When** the guest submits `POST /bookings/:id/review`
- **Then** the system responds `404 Not Found` with error code `BOOKING_NOT_FOUND`
- **And** the response body includes a human-readable `message`
- **And** no review is created

#### Scenario: Review is rejected for a non-CONFIRMED booking

- **Given** an authenticated guest who owns a booking with status `PENDING_PAYMENT` or `CANCELLED`
- **When** the guest submits `POST /bookings/:id/review`
- **Then** the system responds `422 Unprocessable Entity` with error code `BOOKING_NOT_CONFIRMED`
- **And** no review is created

#### Scenario: Review is rejected when rating is out of range

- **Given** an authenticated guest with a reviewable booking
- **When** the guest submits `POST /bookings/:id/review` with `rating` outside [1, 5]
- **Then** the system responds `422 Unprocessable Entity` with a validation error
- **And** no review is created

### Requirement: Listing detail aggregates reviews

The system SHALL expose all reviews for a listing via `GET /listings/:id/reviews` (public, no authentication required). The response SHALL include a paginated list of reviews and the listing-level aggregate: `averageRating` and `reviewCount` as stored on the `Listing` record.

#### Scenario: Listing reviews endpoint returns reviews and aggregate

- **Given** a listing with one or more reviews
- **When** any client submits `GET /listings/:id/reviews`
- **Then** the system responds `200 OK` with `{ reviews: [...], averageRating, reviewCount }`
- **And** each review includes `id`, `guestId`, `rating`, `text`, and `createdAt`

#### Scenario: Listing with no reviews returns empty list and zero aggregate

- **Given** a listing with no reviews
- **When** any client submits `GET /listings/:id/reviews`
- **Then** the system responds `200 OK` with `{ reviews: [], averageRating: null, reviewCount: 0 }`
