# reviews Specification

## Purpose

One guest review per completed booking (1–5 stars + free text), aggregated per listing for display on the listing detail page. Owns the `Review` aggregate; the `Review.bookingId` UNIQUE constraint enforces the one-review-per-booking invariant (`docs/data-model.md` §7.6). Host-to-guest reviews are Post-MVP per `openspec/project.md` §3.1.

## Requirements
### Requirement: Guest can review a completed booking

The system SHALL allow an authenticated guest who owns a booking with status `confirmed` and check-out date in the past to submit a review for the booked listing. The review MUST consist of a rating from 1 to 5 (integer) and optional free text. The system MUST allow at most one review per booking.

Host-to-guest reviews are out of scope for MVP.

#### Scenario: Guest submits a review after check-out

- **GIVEN** an authenticated guest who owns a booking with status `confirmed` and check-out date strictly in the past
- **WHEN** the guest submits a review with rating `R ∈ [1, 5]` and optional text
- **THEN** the review is persisted and linked to the booking and to the listing
- **AND** the review is visible on the listing's detail page

#### Scenario: Second review on the same booking is rejected

- **GIVEN** an authenticated guest with an existing review on a booking
- **WHEN** the guest submits another review for the same booking
- **THEN** the operation is rejected
- **AND** the existing review is left unchanged

#### Scenario: Review is rejected before check-out

- **GIVEN** an authenticated guest with a `confirmed` booking whose check-out date is in the future or equal to today
- **WHEN** the guest attempts to submit a review
- **THEN** the operation is rejected

#### Scenario: Review is rejected for a non-owner

- **GIVEN** an authenticated user who is not the guest associated with a given booking
- **WHEN** the user attempts to submit a review for that booking
- **THEN** the operation is rejected with HTTP 403

### Requirement: Listing detail aggregates reviews

The system SHALL display all reviews for a listing on its detail page, including each review's rating and text. The listing detail SHALL also expose the average rating and the count of reviews.

#### Scenario: Listing detail shows aggregate rating

- **GIVEN** a listing with one or more reviews
- **WHEN** any user requests the listing detail
- **THEN** the response includes the list of reviews
- **AND** the response includes the count of reviews and their arithmetic mean rating

